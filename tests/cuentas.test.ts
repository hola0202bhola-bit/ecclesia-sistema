import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { Client } from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createApp } from "../src/composition/app.js";
import { ServicioIdentidad } from "../src/modules/identidad/application/servicio.js";
import { PrismaRepositorioIdentidad } from "../src/modules/identidad/infrastructure/prisma-repositorio.js";
import { CredencialesBcrypt } from "../src/modules/identidad/infrastructure/credenciales.js";
import type { EdicionPerfil } from "../src/modules/identidad/domain/identidad.js";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
const config = {
  secret: process.env.TEST_JWT_SECRET!,
  issuer: "ecclesia-personal",
  audience: "ecclesia-api",
  origin: "https://cuentas.example.invalid",
};
const password = "Clave ficticia de prueba 2026!";
const repo = new PrismaRepositorioIdentidad(db);
const servicio = new ServicioIdentidad(repo, new CredencialesBcrypt(config));
const make = (surface: "all" | "front" | "admin" | "api" = "all") =>
  createApp(db, config, 2026, undefined, undefined, {
    surface,
    requireLogin: true,
    frontOrigin: "https://front.example.invalid",
    adminOrigin: "https://admin.example.invalid",
  });
let hash: string, iglesiaId: string;
let app: ReturnType<typeof createApp>;
beforeAll(async () => {
  hash = await bcrypt.hash(password, 12);
  iglesiaId = (await db.iglesia.findFirstOrThrow()).id;
});
beforeEach(async () => {
  await db.usuario.deleteMany();
  await db.limiteRegistro.deleteMany();
  await db.usuario.createMany({
    data: [
      { identificador: "visitante", rol: "VISITANTE", passwordHash: hash },
      { identificador: "otro.visitante", rol: "VISITANTE", passwordHash: hash },
      {
        identificador: "coordinacion",
        rol: "COORDINACION",
        passwordHash: hash,
      },
      {
        identificador: "administrador",
        rol: "ADMIN_IGLESIA",
        iglesiaId,
        passwordHash: hash,
      },
      {
        identificador: "tesorero",
        rol: "TESORERO",
        iglesiaId,
        passwordHash: hash,
      },
    ],
  });
  app = make();
});
afterAll(async () => {
  await db.usuario.deleteMany();
  await db.limiteRegistro.deleteMany();
  await db.$disconnect();
});
const login = (identificador = "visitante", target = app) =>
  request(target).post("/api/v1/auth/login").send({ identificador, password });
const registro = (datos: object, target = app) =>
  request(target).post("/api/v1/auth/registro").send(datos);
const cambios = {
  nombreVisible: "Mi nombre",
  presentacion: "Mi presentación",
  avatar: "paloma",
  version: 0,
};
const put = (token: string, datos: object = cambios, target = app) =>
  request(target)
    .put("/api/v1/cuenta/perfil")
    .auth(token, { type: "bearer" })
    .send(datos);
function csrf(html: string) {
  const match = html.match(/name="_csrf" value="([^"]+)"/);
  expect(match).not.toBeNull();
  return match![1];
}
async function loginWeb(identificador = "visitante", target = app) {
  const form = await request(target).get("/cuenta/login");
  const pre = form.headers["set-cookie"][0].split(";")[0];
  const result = await request(target)
    .post("/cuenta/login")
    .set("Origin", config.origin)
    .set("Cookie", pre)
    .type("form")
    .send({ identificador, password, _csrf: csrf(form.text) });
  expect(result.status).toBe(303);
  return result.headers["set-cookie"][0].split(";")[0];
}

describe("Ecclesia 1.1: registro y separación de permisos", () => {
  it("autorregistro siempre VISITANTE sin iglesia ni credenciales expuestas", async () => {
    const r = await registro({ identificador: " NUEVA.CUENTA ", password });
    expect(r.status).toBe(201);
    expect(r.body.rol).toBe("VISITANTE");
    expect(r.body.identificador).toBe("nueva.cuenta");
    expect(r.body.iglesiaId).toBeUndefined();
    expect(JSON.stringify(r.body)).not.toMatch(
      /password|Hash|accessToken|csrf/,
    );
    const row = await db.usuario.findUniqueOrThrow({
      where: { id: r.body.id },
    });
    expect(row.iglesiaId).toBeNull();
    expect(await bcrypt.compare(password, row.passwordHash)).toBe(true);
    expect(row.passwordHash).toMatch(/^\$2[ab]\$12\$/);
    expect(
      (await registro({ identificador: "NUEVA.CUENTA", password })).status,
    ).toBe(409);
    expect((await login("nueva.cuenta")).status).toBe(200);
  });
  it.each([
    { rol: "COORDINACION" },
    { rol: "ADMIN_IGLESIA" },
    { iglesiaId: randomUUID() },
    { activo: true },
    { id: randomUUID() },
  ])("autorregistro rechaza campos privilegiados %j", async (extra) => {
    expect(
      (await registro({ identificador: "inyectado", password, ...extra }))
        .status,
    ).toBe(422);
    expect(
      await db.usuario.count({ where: { identificador: "inyectado" } }),
    ).toBe(0);
  });
  it.each(["corta", "á".repeat(37), "x".repeat(73)])(
    "contraseña fuera de límites rechazada sin truncar: %s",
    async (clave) => {
      expect(
        (await registro({ identificador: "malaclave", password: clave }))
          .status,
      ).toBe(422);
    },
  );
  it("identificador concurrente normalizado deja una cuenta y un conflicto", async () => {
    const responses = await Promise.all([
      registro({ identificador: "concurrente", password }),
      registro({ identificador: " CONCURRENTE ", password }, make()),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(
      await db.usuario.count({ where: { identificador: "concurrente" } }),
    ).toBe(1);
  });
  it("registro tiene límite persistente entre procesos, X-Forwarded-For no lo elude", async () => {
    for (let n = 0; n < 5; n++)
      expect(
        (await registro({ identificador: "registro." + n, password }, make()))
          .status,
      ).toBe(201);
    const denied = await request(make())
      .post("/api/v1/auth/registro")
      .set("X-Forwarded-For", "1.2.3.4")
      .send({ identificador: "registro.extra", password });
    expect(denied.status).toBe(429);
    expect(denied.headers["retry-after"]).toBe("3600");
    const rows = await db.limiteRegistro.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].clave).toMatch(/^[a-f0-9]{64}$/);
    expect(rows[0].cantidad).toBe(6);
    await db.limiteRegistro.updateMany({ data: { ventana: 0n } });
    expect(
      (await registro({ identificador: "registro.nuevo", password })).status,
    ).toBe(201);
  });
  it("límite de registro concurrente permite cinco intentos y conserva rechazo", async () => {
    const responses = await Promise.all(
      Array.from({ length: 6 }, (_, n) =>
        registro({ identificador: "paralelo." + n, password }, make()),
      ),
    );
    expect(responses.filter((r) => r.status === 201)).toHaveLength(5);
    expect(responses.filter((r) => r.status === 429)).toHaveLength(1);
    expect((await db.limiteRegistro.findFirstOrThrow()).cantidad).toBe(6);
  });
  it("visitantes previos no bloquean inicialización segura de Coordinación", async () => {
    await db.usuario.deleteMany({ where: { rol: { not: "VISITANTE" } } });
    const result = await Promise.allSettled([
      servicio.inicial({
        identificador: "inicial.uno",
        password,
        rol: "COORDINACION",
      }),
      servicio.inicial({
        identificador: "inicial.dos",
        password,
        rol: "COORDINACION",
      }),
    ]);
    expect(result.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await db.usuario.count({ where: { rol: "COORDINACION" } })).toBe(1);
    expect(await db.usuario.count({ where: { rol: "VISITANTE" } })).toBe(2);
  });
  it("visitante autentica pero no entra al área administrativa ni crea sesión allí", async () => {
    const token = (await login()).body.accessToken;
    for (const path of [
      "/personal",
      "/personal/iglesias",
      "/personal/usuarios",
      "/personal/criterios",
      "/personal/catalogos/localidades",
      `/personal/agenda/${iglesiaId}`,
      `/personal/diezmos/${iglesiaId}`,
    ])
      expect(
        (await request(app).get(path).auth(token, { type: "bearer" })).status,
      ).toBe(403);
    const previous = await db.sesion.count();
    expect(
      (
        await request(make("admin"))
          .post("/personal/login")
          .set("Origin", config.origin)
          .type("form")
          .send({ identificador: "visitante", password })
      ).status,
    ).toBe(401);
    expect(await db.sesion.count()).toBe(previous);
    expect(
      (
        await request(app)
          .post("/api/v1/usuarios")
          .auth(token, { type: "bearer" })
          .send({ identificador: "usurpado", password, rol: "COORDINACION" })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .get(
            `/api/v1/iglesias/${iglesiaId}/reportes/diezmos?desde=2026-11-01&hasta=2026-11-30`,
          )
          .auth(token, { type: "bearer" })
      ).status,
    ).toBe(403);
  });
  it("front y API exigen login en directorio, catálogo y consultas antes públicas", async () => {
    const api = make("api"),
      front = make("front");
    for (const path of [
      "/api/v1/iglesias?estadoClave=21",
      "/api/v1/ranking-patrimonial",
      "/api/v1/catalogos/estados",
      `/api/v1/iglesias/${iglesiaId}/servicios`,
      `/api/v1/iglesias/${iglesiaId}/espacios`,
    ])
      expect((await request(api).get(path)).status).toBe(401);
    for (const path of [
      "/iglesias",
      `/iglesias/${iglesiaId}`,
      "/ranking-patrimonial",
      "/solicitudes",
    ])
      expect((await request(front).get(path)).headers.location).toBe(
        "/cuenta/login",
      );
    expect((await request(front).get("/assets/ecclesia.css")).status).toBe(200);
    expect((await request(api).get("/health/ready")).status).toBe(200);
    const token = (await login("visitante", api)).body.accessToken;
    expect(
      (
        await request(api)
          .get("/api/v1/iglesias?estadoClave=21")
          .auth(token, { type: "bearer" })
      ).status,
    ).toBe(200);
    expect(
      (await request(front).get("/iglesias").auth(token, { type: "bearer" }))
        .status,
    ).toBe(200);
  });
  it.each(["all", "front", "admin"] as const)(
    "navegación %s exige sesión vigente y distingue visitante de personal",
    async (surface) => {
      const target = make(surface);
      const path = surface === "admin" ? "/personal/login" : "/cuenta/login";
      for (const cookie of [
        undefined,
        "ecclesia_session=falsa",
        "otra_ecclesia_session=falsa",
      ]) {
        const req = request(target).get(path);
        if (cookie) req.set("Cookie", cookie);
        const page = await req;
        expect(page.status).toBe(200);
        expect(page.text).not.toContain(">Mi cuenta</a>");
        expect(page.text).not.toContain('class="nav-personal"');
      }
      for (const rol of [
        "visitante",
        "coordinacion",
        "administrador",
        "tesorero",
      ]) {
        const token = (await login(rol)).body.accessToken;
        const cookie = "ecclesia_session=" + token;
        const page = await request(target).get(path).set("Cookie", cookie);
        expect(page.text).toContain('href="/cuenta/perfil">Mi cuenta</a>');
        expect(page.text.includes('class="nav-personal"')).toBe(
          rol !== "visitante",
        );
        if (rol !== "visitante")
          expect(page.text).toContain(
            surface === "front"
              ? 'href="https://admin.example.invalid/personal/login"'
              : 'href="/personal"',
          );
        await db.sesion.deleteMany();
        const revoked = await request(target).get(path).set("Cookie", cookie);
        expect(revoked.text).not.toContain(">Mi cuenta</a>");
        expect(revoked.text).not.toContain('class="nav-personal"');
      }
    },
  );
  it("admin no expone autorregistro o login de visitantes", async () => {
    for (const path of ["/cuenta/registro", "/cuenta/login"])
      expect((await request(make("admin")).get(path)).status).toBe(404);
    expect(
      (await request(make("front")).post("/api/v1/auth/registro").send({}))
        .status,
    ).toBe(404);
  });
  it("cookies front HTTPS son host-only, logout revoca y sesión persiste entre instancias", async () => {
    const cookie = await loginWeb("visitante", make("front"));
    const page = await request(make("front"))
      .get("/cuenta/perfil")
      .set("Cookie", cookie);
    expect(page.status).toBe(200);
    const link = page.text.match(/class="nav-personal" href="([^"]+)"/);
    expect(link).toBeNull();
    const admin = make("admin");
    // Simula el salto de host: la cookie del front no acompaña a la petición.
    const destination = await request(admin).get("/personal/login");
    expect(destination.status).toBe(200);
    expect(destination.text).toContain('action="/personal/login"');
    expect((await request(admin).get("/personal")).status).toBe(401);
    // Incluso si alguien copia expresamente la cookie, VISITANTE sigue prohibido.
    expect(
      (await request(admin).get("/personal").set("Cookie", cookie)).status,
    ).toBe(403);
    const logout = await request(make("front"))
      .post("/cuenta/logout")
      .set("Origin", config.origin)
      .set("Cookie", cookie)
      .type("form")
      .send({ _csrf: csrf(page.text) });
    expect(logout.status).toBe(303);
    expect(
      (await request(make("front")).get("/iglesias").set("Cookie", cookie))
        .headers.location,
    ).toBe("/cuenta/login");
  });
  it("permisos usan rol actual y no los valores del JWT ni perfil", async () => {
    const token = (await login("administrador")).body.accessToken;
    await db.usuario.update({
      where: { identificador: "administrador" },
      data: { rol: "VISITANTE", iglesiaId: null },
    });
    expect(
      (await request(app).get("/personal").auth(token, { type: "bearer" }))
        .status,
    ).toBe(403);
    expect((await put(token)).status).toBe(200);
    await db.usuario.update({
      where: { identificador: "administrador" },
      data: { activo: false },
    });
    expect((await put(token, { ...cambios, version: 1 })).status).toBe(401);
  });
});

describe("perfil propio, concurrencia y privacidad", () => {
  it("perfil escapa HTML persistido y no aparece en fichas de iglesias", async () => {
    const token = (await login()).body.accessToken;
    const nombre = '<img src=x onerror="alert(1)">';
    const presentacion = "</textarea><script>alert(2)</script>";
    expect(
      (await put(token, { ...cambios, nombreVisible: nombre, presentacion }))
        .status,
    ).toBe(200);
    const page = await request(app)
      .get("/cuenta/perfil")
      .auth(token, { type: "bearer" });
    expect(page.status).toBe(200);
    expect(page.text).toContain("&lt;img");
    expect(page.text).toContain("&lt;/textarea&gt;&lt;script&gt;");
    expect(page.text).not.toContain(nombre);
    expect(page.text).not.toContain("<script>");
    expect(
      (
        await request(app)
          .get(`/iglesias/${iglesiaId}`)
          .auth(token, { type: "bearer" })
      ).text,
    ).not.toContain("alert(2)");
  });
  it("solicitudes autenticadas conservan su CSRF de seguimiento sin mezclarlo con sesión", async () => {
    const session = await loginWeb();
    const page = await request(app).get("/solicitudes").set("Cookie", session);
    expect(page.status).toBe(200);
    const nonceCookie = page.headers["set-cookie"][0].split(";")[0];
    const payload = {
      folio: "F".repeat(24),
      clave: "x".repeat(43),
      _csrf: csrf(page.text),
    };
    expect(
      (
        await request(app)
          .post("/solicitudes/seguimiento")
          .set("Cookie", [session, nonceCookie])
          .set("Origin", config.origin)
          .type("form")
          .send(payload)
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .post("/solicitudes/seguimiento")
          .set("Cookie", [session, nonceCookie])
          .set("Origin", config.origin)
          .type("form")
          .send({ ...payload, _csrf: "incorrecto" })
      ).status,
    ).toBe(403);
  });
  it("administrador y tesorero ven su iglesia asignada prominentemente", async () => {
    const iglesia = await db.iglesia.findUniqueOrThrow({
      where: { id: iglesiaId },
    });
    for (const identificador of ["administrador", "tesorero"]) {
      const token = (await login(identificador)).body.accessToken;
      for (const path of ["/cuenta/perfil", "/personal"]) {
        const page = await request(app)
          .get(path)
          .auth(token, { type: "bearer" });
        expect(page.status).toBe(200);
        expect(page.text).toContain("Tu iglesia asignada");
        expect(page.text).toContain(iglesia.nombre);
      }
    }
  });
  it.each(["visitante", "coordinacion", "administrador", "tesorero"])(
    "%s personaliza solo su cuenta y conserva rol/ámbito",
    async (identificador) => {
      const result = await login(identificador);
      const token = result.body.accessToken;
      const empty = await request(app)
        .get("/api/v1/cuenta/perfil")
        .auth(token, { type: "bearer" });
      expect(empty.status).toBe(200);
      expect(empty.body.version).toBe(0);
      const edited = await put(token, {
        ...cambios,
        nombreVisible: "  Nombre visible  ",
      });
      expect(edited.status).toBe(200);
      expect(edited.body.nombreVisible).toBe("Nombre visible");
      expect(edited.body.version).toBe(1);
      const me = await request(app)
        .get("/api/v1/auth/me")
        .auth(token, { type: "bearer" });
      expect(me.body.usuario).toEqual(result.body.usuario);
    },
  );
  it.each([
    { usuarioId: randomUUID() },
    { rol: "COORDINACION" },
    { iglesiaId: randomUUID() },
    { password: "otra clave" },
    { activo: true },
  ])("perfil rechaza campos adicionales %j", async (extra) => {
    expect(
      (await put((await login()).body.accessToken, { ...cambios, ...extra }))
        .status,
    ).toBe(422);
    expect(await db.perfilCuenta.count()).toBe(0);
  });
  it("coordinación y visitantes no pueden elegir el perfil de otra cuenta", async () => {
    const own = (await login()).body.accessToken,
      other = (await login("otro.visitante")).body.accessToken;
    await put(own);
    const otherProfile = await request(app)
      .get("/api/v1/cuenta/perfil")
      .auth(other, { type: "bearer" });
    expect(otherProfile.body.nombreVisible).toBeNull();
    expect(
      (
        await request(app)
          .get("/api/v1/cuenta/perfil/" + randomUUID())
          .auth((await login("coordinacion")).body.accessToken, {
            type: "bearer",
          })
      ).status,
    ).toBe(404);
  });
  it("primera edición concurrente y edición obsoleta no sobrescriben", async () => {
    const token = (await login()).body.accessToken;
    let result = await Promise.all([
      put(token),
      put(token, { ...cambios, nombreVisible: "Otra edición" }, make()),
    ]);
    expect(result.map((r) => r.status).sort()).toEqual([200, 409]);
    result = await Promise.all([
      put(token, { ...cambios, version: 1 }),
      put(token, { ...cambios, version: 1 }, make()),
    ]);
    expect(result.map((r) => r.status).sort()).toEqual([200, 409]);
    expect((await db.perfilCuenta.findFirstOrThrow()).version).toBe(2);
  });
  it("vaciar campos opcionales conserva cuenta y evita publicar datos personales", async () => {
    const token = (await login()).body.accessToken;
    await put(token);
    const result = await put(token, {
      nombreVisible: " ",
      presentacion: null,
      avatar: "rama",
      version: 1,
    });
    expect(result.status).toBe(200);
    expect(result.body.nombreVisible).toBeNull();
    expect(result.body.presentacion).toBeNull();
    const listado = await request(app)
      .get("/api/v1/usuarios")
      .auth((await login("coordinacion")).body.accessToken, { type: "bearer" });
    expect(JSON.stringify(listado.body)).not.toContain("presentacion");
  });
  it.each([
    { avatar: "https://remoto.invalid/foto.svg" },
    { avatar: "<script>" },
    { nombreVisible: "x".repeat(101) },
    { presentacion: "x".repeat(501) },
    { version: -1 },
    { version: 0.5 },
    { version: "0" },
  ])("perfil rechaza entrada inválida %j", async (extra) => {
    expect(
      (await put((await login()).body.accessToken, { ...cambios, ...extra }))
        .status,
    ).toBe(422);
  });
  it("CHECK, FK y rollback conservan perfil ante un fallo de persistencia", async () => {
    const result = await login();
    await put(result.body.accessToken);
    await expect(
      repo.guardarPerfil(result.body.usuario.id, {
        ...cambios,
        version: 1,
        avatar: "remoto",
      } as unknown as EdicionPerfil),
    ).rejects.toThrow();
    const profile = await repo.perfil(result.body.usuario.id);
    expect(profile.version).toBe(1);
    expect(profile.avatar).toBe("paloma");
    await expect(
      db.perfilCuenta.create({ data: { usuarioId: randomUUID() } }),
    ).rejects.toThrow();
    await expect(
      db.usuario.update({
        where: { identificador: "visitante" },
        data: { iglesiaId },
      }),
    ).rejects.toThrow();
  });
  it("EJS escapa nombre/presentación, permite editar y muestra iglesia asignada", async () => {
    const token = (await login()).body.accessToken;
    const tag = '</textarea><script>alert("x")</script>';
    await put(token, { ...cambios, nombreVisible: tag, presentacion: tag });
    const page = await request(app)
      .get("/cuenta/perfil")
      .auth(token, { type: "bearer" });
    expect(page.status).toBe(200);
    expect(page.text).not.toContain("<script>");
    expect(page.text).toContain("&lt;script&gt;");
    expect(page.headers["content-security-policy"]).toContain(
      "script-src 'none'",
    );
    const staff = (await login("administrador")).body.accessToken;
    for (const path of ["/cuenta/perfil", "/personal"]) {
      const p = await request(app).get(path).auth(staff, { type: "bearer" });
      expect(p.status).toBe(200);
      expect(p.text).toContain("Tu iglesia asignada");
      expect(p.text).toContain(iglesiaId);
    }
  });
  it("CSRF/Origin propio obligatorio en perfil, incluyendo token multibyte", async () => {
    const cookie = await loginWeb();
    const page = await request(app).get("/cuenta/perfil").set("Cookie", cookie);
    const token = csrf(page.text);
    for (const [origen, csrfToken] of [
      [config.origin, ""],
      ["https://ajeno.invalid", token],
      [config.origin, "á".repeat(token.length)],
    ]) {
      expect(
        (
          await request(app)
            .post("/cuenta/perfil")
            .set("Cookie", cookie)
            .set("Origin", origen)
            .type("form")
            .send({ ...cambios, _csrf: csrfToken })
        ).status,
      ).toBe(403);
    }
    expect(
      (
        await request(app)
          .post("/cuenta/perfil")
          .set("Cookie", cookie)
          .set("Origin", config.origin)
          .type("form")
          .send({ ...cambios, _csrf: token })
      ).status,
    ).toBe(303);
  });
  it("registro/login web exige nonce y Origin, sin reflejar contraseñas", async () => {
    const form = await request(app).get("/cuenta/registro");
    const cookie = form.headers["set-cookie"][0];
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).not.toContain("Domain=");
    const datos = {
      identificador: "registro.web",
      password,
      _csrf: csrf(form.text),
    };
    for (const extra of [
      { _csrf: "" },
      { _csrf: "á".repeat(datos._csrf.length) },
    ])
      expect(
        (
          await request(app)
            .post("/cuenta/registro")
            .set("Cookie", cookie.split(";")[0])
            .set("Origin", config.origin)
            .type("form")
            .send({ ...datos, ...extra })
        ).status,
      ).toBe(403);
    expect(
      (
        await request(app)
          .post("/cuenta/registro")
          .set("Cookie", cookie.split(";")[0])
          .set("Origin", "https://ajeno.invalid")
          .type("form")
          .send(datos)
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post("/cuenta/registro")
          .set("Cookie", cookie.split(";")[0])
          .set("Origin", config.origin)
          .type("form")
          .send(datos)
      ).status,
    ).toBe(303);
    const invalid = await request(app)
      .post("/cuenta/registro")
      .set("Cookie", cookie.split(";")[0])
      .set("Origin", config.origin)
      .type("form")
      .send({ ...datos, identificador: "??" });
    expect(invalid.status).toBe(422);
    expect(invalid.text).not.toContain(password);
    expect(
      (
        await request(app)
          .post("/api/v1/auth/registro")
          .set("Origin", "https://ajeno.invalid")
          .send(datos)
      ).status,
    ).toBe(403);
  });
  it("sesión externa histórica no permite editar perfiles sin cuenta persistida", async () => {
    const external = createApp(db, { ...config, allowExternal: true });
    const token = jwt.sign({ rol: "COORDINACION" }, config.secret, {
      subject: randomUUID(),
      issuer: config.issuer,
      audience: config.audience,
      expiresIn: 60,
    });
    expect(
      (
        await request(external)
          .get("/api/v1/cuenta/perfil")
          .auth(token, { type: "bearer" })
      ).status,
    ).toBe(401);
  });
  it("duodécima migración conserva cuentas/sesiones anteriores y añade visitante sin iglesia", async () => {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const id = randomUUID(),
      sid = randomUUID();
    try {
      await client.query(
        "CREATE SCHEMA cuentas_upgrade; SET search_path TO cuentas_upgrade",
      );
      const migrations = readdirSync("prisma/migrations")
        .filter((v) => /^\d/.test(v))
        .sort();
      expect(migrations).toHaveLength(14);
      for (const folder of migrations.slice(0, 11))
        await client.query(
          readFileSync(`prisma/migrations/${folder}/migration.sql`, "utf8"),
        );
      await client.query(
        'INSERT INTO "Usuario" (id,identificador,"passwordHash",rol) VALUES ($1,$2,$3,$4)',
        [id, "previo", hash, "COORDINACION"],
      );
      await client.query(
        'INSERT INTO "Sesion" (id,"usuarioId",csrf,vence) VALUES ($1,$2,$3,$4)',
        [sid, id, "x".repeat(64), new Date(Date.now() + 60000)],
      );
      await client.query("BEGIN");
      await client.query(
        readFileSync(
          `prisma/migrations/${migrations[11]}/migration.sql`,
          "utf8",
        ),
      );
      await client.query("COMMIT");
      expect(
        (
          await client.query(
            'SELECT "passwordHash" FROM "Usuario" WHERE id=$1',
            [id],
          )
        ).rows[0].passwordHash,
      ).toBe(hash);
      expect(
        (await client.query('SELECT id FROM "Sesion" WHERE id=$1', [sid]))
          .rowCount,
      ).toBe(1);
      await client.query(
        'INSERT INTO "Usuario" (id,identificador,"passwordHash",rol) VALUES ($1,$2,$3,$4)',
        [randomUUID(), "nuevo", hash, "VISITANTE"],
      );
      expect(
        (await client.query('SELECT count(*) AS n FROM "PerfilCuenta"')).rows[0]
          .n,
      ).toBe("0");
      // El FK coincide con Prisma. La API no admite editar usuarioId.
      await client.query(
        'INSERT INTO "PerfilCuenta" ("usuarioId") VALUES ($1)',
        [id],
      );
      const nuevoId = randomUUID();
      await client.query('UPDATE "Usuario" SET id=$1 WHERE id=$2', [
        nuevoId,
        id,
      ]);
      expect(
        (await client.query('SELECT "usuarioId" FROM "PerfilCuenta"')).rows[0]
          .usuarioId,
      ).toBe(nuevoId);
      expect(
        (
          await client.query('SELECT "usuarioId" FROM "Sesion" WHERE id=$1', [
            sid,
          ])
        ).rows[0].usuarioId,
      ).toBe(nuevoId);
    } finally {
      await client.query(
        "ROLLBACK; SET search_path TO public; DROP SCHEMA IF EXISTS cuentas_upgrade CASCADE",
      );
      await client.end();
    }
  });
});
