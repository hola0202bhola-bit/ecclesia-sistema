import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { Ajv2020 } from "ajv/dist/2020.js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createApp } from "../src/composition/app.js";
import { ServicioIdentidad } from "../src/modules/identidad/application/servicio.js";
import { PrismaRepositorioIdentidad } from "../src/modules/identidad/infrastructure/prisma-repositorio.js";
import { CredencialesBcrypt } from "../src/modules/identidad/infrastructure/credenciales.js";
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
const config = {
  secret: process.env.TEST_JWT_SECRET!,
  issuer: "ecclesia-personal",
  audience: "ecclesia-api",
  origin: "http://127.0.0.1:3000",
};
const password = "Prueba ficticia solo 2026!";
const api = JSON.parse(
  readFileSync("docs/api-referencia-revision03.json", "utf8"),
);
const ajv = new Ajv2020({ strict: false, validateFormats: false });
ajv.addSchema({ $id: "identidad", components: api.components });
function cumple(name: string, payload: unknown) {
  expect(
    ajv.validate({ $ref: `identidad#/components/schemas/${name}` }, payload),
    JSON.stringify(ajv.errors),
  ).toBe(true);
}
const repo = new PrismaRepositorioIdentidad(db);
const servicio = new ServicioIdentidad(repo, new CredencialesBcrypt(config));
let app: ReturnType<typeof createApp>;
let own: string;
const other = randomUUID();
let hash: string;
const login = (identificador = "coordinacion") =>
  request(app).post("/api/v1/auth/login").send({ identificador, password });
const alta = (datos: object, token?: string) =>
  request(app)
    .post("/api/v1/usuarios")
    .set("Authorization", `Bearer ${token ?? "invalido"}`)
    .send(datos);
beforeAll(async () => {
  hash = await bcrypt.hash(password, 12);
  const iglesia = await db.iglesia.findFirstOrThrow();
  own = randomUUID();
  await db.iglesia.create({
    data: { ...iglesia, id: own, cerradaDesde: null, version: 1 },
  });
  await db.iglesia.create({
    data: {
      ...iglesia,
      id: other,
      nombre: "Otra iglesia de prueba",
      cerradaDesde: null,
      version: 1,
    },
  });
});
beforeEach(async () => {
  await db.usuario.deleteMany();
  await db.usuario.createMany({
    data: [
      {
        identificador: "coordinacion",
        passwordHash: hash,
        rol: "COORDINACION",
      },
      {
        identificador: "administrador",
        passwordHash: hash,
        rol: "ADMIN_IGLESIA",
        iglesiaId: own,
      },
      {
        identificador: "tesorero",
        passwordHash: hash,
        rol: "TESORERO",
        iglesiaId: own,
      },
    ],
  });
  app = createApp(db, config, 2026);
});
afterAll(async () => {
  await db.usuario.deleteMany();
  await db.iglesia.deleteMany({ where: { id: { in: [own, other] } } });
  await db.$disconnect();
});
describe("identidad persistida y permisos reales", () => {
  it("autentica, consulta perfil y lista cuentas paginadas sin hashes ni contraseñas", async () => {
    const r = await login();
    expect(r.status).toBe(200);
    expect(r.body.expiresIn).toBe(3600);
    cumple("Token", r.body);
    const me = await request(app)
      .get("/api/v1/auth/me")
      .auth(r.body.accessToken, { type: "bearer" });
    expect(me.body.usuario.rol).toBe("COORDINACION");
    cumple("PerfilPersonal", me.body);
    const listado = await request(app)
      .get("/api/v1/usuarios?pageSize=1&page=2")
      .auth(r.body.accessToken, { type: "bearer" });
    expect(listado.status).toBe(200);
    expect(listado.body.meta.total).toBe(3);
    expect(listado.body.data).toHaveLength(1);
    cumple("CuentaPersonal", listado.body.data[0]);
    expect(JSON.stringify([r.body, me.body, listado.body])).not.toContain(
      "password",
    );
    expect(listado.headers["cache-control"]).toBe("no-store");
  });
  it.each(["desconocido", "coordinacion"])(
    "error genérico con identificador %s y contraseña incorrecta",
    async (identificador) => {
      const r = await request(app)
        .post("/api/v1/auth/login")
        .send({ identificador, password: "incorrecta" });
      expect(r.status).toBe(401);
      expect(r.body.code).toBe("CREDENCIALES_INVALIDAS");
    },
  );
  it("normaliza identificador, crea usuario con bcrypt y persiste una nueva sesión en otra instancia", async () => {
    const token = (await login()).body.accessToken;
    const r = await alta(
      {
        identificador: " NUEVO.USUARIO ",
        password,
        rol: "ADMIN_IGLESIA",
        iglesiaId: own,
      },
      token,
    );
    expect(r.status).toBe(201);
    expect(r.body.identificador).toBe("nuevo.usuario");
    const cuenta = await db.usuario.findUniqueOrThrow({
      where: { id: r.body.id },
    });
    expect(cuenta.passwordHash).toMatch(/^\$2[ab]\$12\$/);
    expect(await bcrypt.compare(password, cuenta.passwordHash)).toBe(true);
    const nuevo = await login("nuevo.usuario");
    expect(nuevo.status).toBe(200);
    const otraApp = createApp(db, config);
    expect(
      (
        await request(otraApp)
          .get("/api/v1/auth/me")
          .auth(nuevo.body.accessToken, { type: "bearer" })
      ).status,
    ).toBe(200);
  });
  it("impide altas duplicadas incluso concurrentes", async () => {
    const token = (await login()).body.accessToken;
    const data = { identificador: "duplicado", password, rol: "COORDINACION" };
    const rs = await Promise.all([alta(data, token), alta(data, token)]);
    expect(rs.map((r) => r.status).sort()).toEqual([201, 409]);
  });
  it.each(["administrador", "tesorero"])(
    "%s no administra usuarios",
    async (identificador) => {
      const token = (await login(identificador)).body.accessToken;
      expect(
        (
          await request(app)
            .get("/api/v1/usuarios")
            .auth(token, { type: "bearer" })
        ).status,
      ).toBe(403);
      expect(
        (
          await alta(
            { identificador: "usurpado", password, rol: "COORDINACION" },
            token,
          )
        ).status,
      ).toBe(403);
    },
  );
  it("administrador edita solo su iglesia y tesorero no adquiere ese permiso", async () => {
    const token = (await login("administrador")).body.accessToken;
    const antes = await db.iglesia.findUniqueOrThrow({ where: { id: own } });
    expect(
      (
        await request(app)
          .patch(`/api/v1/iglesias/${own}`)
          .auth(token, { type: "bearer" })
          .send({ version: antes.version, contacto: "Contacto ficticio" })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .patch(`/api/v1/iglesias/${other}`)
          .auth(token, { type: "bearer" })
          .send({ version: 1, contacto: "Intruso" })
      ).status,
    ).toBe(403);
    const tesorero = (await login("tesorero")).body.accessToken;
    expect(
      (
        await request(app)
          .patch(`/api/v1/iglesias/${own}`)
          .auth(tesorero, { type: "bearer" })
          .send({ version: antes.version + 1, contacto: "Intruso" })
      ).status,
    ).toBe(403);
    const coord = (await login()).body.accessToken;
    expect(
      (
        await request(app)
          .post("/api/v1/iglesias")
          .auth(coord, { type: "bearer" })
          .send({ nombre: "Sin campos" })
      ).status,
    ).toBe(422);
  });
  it.each([
    { identificador: "corto", password: "corta", rol: "COORDINACION" },
    {
      identificador: "unicode",
      password: "😀".repeat(19),
      rol: "COORDINACION",
    },
    { identificador: "sinambito", password, rol: "ADMIN_IGLESIA" },
    {
      identificador: "conambito",
      password,
      rol: "COORDINACION",
      iglesiaId: "20000000-0000-4000-8000-000000000010",
    },
    {
      identificador: "multiple",
      password,
      rol: "COORDINACION",
      roles: ["TESORERO"],
    },
    {
      identificador: "noexiste",
      password,
      rol: "ADMIN_IGLESIA",
      iglesiaId: "20000000-0000-4000-8000-000000000099",
    },
  ])("valida perfil de alta $identificador", async (datos) => {
    expect((await alta(datos, (await login()).body.accessToken)).status).toBe(
      422,
    );
  });
  it("rechaza alteraciones de firma, issuer, audiencia, expiración, subject y sesiones desconocidas", async () => {
    const token = (await login()).body.accessToken;
    const claims = jwt.decode(token) as jwt.JwtPayload;
    for (const cambio of [
      { exp: 1 },
      { iss: "otro" },
      { aud: "otra" },
      { sub: randomUUID() },
      { jti: randomUUID() },
      { jti: "invalido" },
      { exp: undefined },
    ]) {
      const payload = { ...claims, ...cambio };
      if (payload.exp === undefined) delete payload.exp;
      const invalido = jwt.sign(payload, config.secret);
      expect(
        (
          await request(app)
            .get("/api/v1/auth/me")
            .auth(invalido, { type: "bearer" })
        ).status,
      ).toBe(401);
    }
    expect(
      (
        await request(app)
          .get("/api/v1/auth/me")
          .auth(token + "x", { type: "bearer" })
      ).status,
    ).toBe(401);
    const externo = jwt.sign({ rol: "COORDINACION" }, config.secret, {
      subject: "externo",
      issuer: config.issuer,
      audience: config.audience,
      expiresIn: "1h",
    });
    expect(
      (
        await request(app)
          .get("/api/v1/auth/me")
          .auth(externo, { type: "bearer" })
      ).status,
    ).toBe(401);
  });
  it("rechaza sesión expirada en BD aunque el JWT siga vigente", async () => {
    const token = (await login()).body.accessToken;
    await db.sesion.updateMany({ data: { vence: new Date(0) } });
    expect(
      (
        await request(app)
          .get("/api/v1/auth/me")
          .auth(token, { type: "bearer" })
      ).status,
    ).toBe(401);
  });
  it("usuario inactivo no entra ni conserva sesiones previas", async () => {
    const token = (await login()).body.accessToken;
    await db.usuario.updateMany({ data: { activo: false } });
    expect((await login()).status).toBe(401);
    expect(
      (
        await request(app)
          .get("/api/v1/auth/me")
          .auth(token, { type: "bearer" })
      ).status,
    ).toBe(401);
  });
  it("usa permisos actuales de BD y descarta roles enviados por el cliente", async () => {
    const token = (await login()).body.accessToken;
    await db.usuario.updateMany({
      where: { identificador: "coordinacion" },
      data: { rol: "TESORERO", iglesiaId: own },
    });
    expect(
      (
        await request(app)
          .get("/api/v1/usuarios")
          .auth(token, { type: "bearer" })
          .set("X-Rol", "COORDINACION")
      ).status,
    ).toBe(403);
  });
  it("revoca únicamente la sesión cerrada y rechaza reutilización", async () => {
    const a = (await login()).body.accessToken;
    const b = (await login()).body.accessToken;
    expect(
      (
        await request(app)
          .post("/api/v1/auth/logout")
          .auth(a, { type: "bearer" })
      ).status,
    ).toBe(204);
    expect(
      (await request(app).get("/api/v1/auth/me").auth(a, { type: "bearer" }))
        .status,
    ).toBe(401);
    expect(
      (await request(app).get("/api/v1/auth/me").auth(b, { type: "bearer" }))
        .status,
    ).toBe(200);
    await servicio.salir(randomUUID());
  });
  it("requiere identidad para rutas privadas y valida paginación", async () => {
    for (const path of [
      "/api/v1/auth/me",
      "/api/v1/usuarios",
      "/personal",
      "/personal/usuarios",
    ])
      expect((await request(app).get(path)).status).toBe(401);
    expect(
      (
        await request(app)
          .get("/api/v1/usuarios?pageSize=101")
          .auth((await login()).body.accessToken, { type: "bearer" })
      ).status,
    ).toBe(422);
  });
  it("rechaza login con rol inyectado, contraseña excesiva y JSON malformado", async () => {
    for (const data of [
      { identificador: "coordinacion", password, rol: "COORDINACION" },
      { identificador: "coordinacion", password: "x".repeat(73) },
    ])
      expect(
        (await request(app).post("/api/v1/auth/login").send(data)).status,
      ).toBe(422);
    expect(
      (
        await request(app)
          .post("/api/v1/auth/login")
          .set("Content-Type", "application/json")
          .send("{")
      ).status,
    ).toBe(400);
  });
  it("limita intentos antes del hash", async () => {
    for (let i = 0; i < 10; i++)
      expect(
        (await request(app).post("/api/v1/auth/login").send({})).status,
      ).toBe(422);
    const r = await login();
    expect(r.status).toBe(429);
    expect(r.headers["retry-after"]).toBe("900");
  });
  it("aplica FK y restricción de ámbito también fuera de HTTP", async () => {
    await expect(
      db.usuario.create({
        data: { identificador: "ilegal", passwordHash: hash, rol: "TESORERO" },
      }),
    ).rejects.toThrow();
    await expect(
      db.usuario.create({
        data: {
          identificador: "ilegal",
          passwordHash: "texto",
          rol: "COORDINACION",
        },
      }),
    ).rejects.toThrow();
  });
  it("inicialización local crea una sola Coordinación, sin acceso HTTP y sin repetirla", async () => {
    await db.usuario.deleteMany();
    const datos = {
      identificador: "primera",
      password,
      rol: "COORDINACION" as const,
    };
    const rs = await Promise.allSettled([
      servicio.inicial(datos),
      servicio.inicial({ ...datos, identificador: "segunda" }),
    ]);
    expect(rs.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await db.usuario.count()).toBe(1);
    await expect(
      servicio.inicial({ ...datos, rol: "TESORERO", iglesiaId: own }),
    ).rejects.toThrow("Primera cuenta");
    expect(
      (await request(app).post("/api/v1/auth/bootstrap").send(datos)).status,
    ).toBe(404);
  });
});
describe("personal web y CSRF", () => {
  it("renderiza entrada y error genérico sin reflejar contraseña", async () => {
    expect((await request(app).get("/personal/login")).text).toContain(
      'type="password"',
    );
    const r = await request(app)
      .post("/personal/login")
      .set("Origin", config.origin)
      .type("form")
      .send({ identificador: "coordinacion", password: "incorrecta" });
    expect(r.status).toBe(401);
    expect(r.text).not.toContain("incorrecta");
  });
  it("inicia sesión, crea usuario, pagina y sale mediante formularios protegidos", async () => {
    const agente = request.agent(app);
    const r = await agente
      .post("/personal/login")
      .set("Origin", config.origin)
      .type("form")
      .send({ identificador: "coordinacion", password });
    expect(r.status).toBe(303);
    expect(String(r.headers["set-cookie"])).toMatch(/HttpOnly/);
    expect(String(r.headers["set-cookie"])).toMatch(/SameSite=Strict/);
    const panel = await agente.get("/personal");
    expect(panel.status).toBe(200);
    expect(panel.text).toContain("Gestionar usuarios");
    const me = await agente.get("/api/v1/auth/me");
    const csrf = me.body.csrfToken;
    expect((await agente.get("/personal/usuarios")).status).toBe(200);
    expect(
      (
        await agente
          .post("/personal/usuarios")
          .set("Origin", config.origin)
          .type("form")
          .send({
            _csrf: csrf,
            identificador: "desde.web",
            password,
            rol: "COORDINACION",
            iglesiaId: "",
          })
      ).status,
    ).toBe(303);
    expect((await agente.get("/personal/usuarios?pageSize=1")).text).toContain(
      "Siguiente",
    );
    expect(
      (await agente.get("/personal/usuarios?page=2&pageSize=1")).text,
    ).toContain("Anterior");
    expect(
      (
        await agente
          .post("/personal/logout")
          .set("Origin", config.origin)
          .type("form")
          .send({ _csrf: csrf })
      ).status,
    ).toBe(303);
    expect((await agente.get("/personal")).status).toBe(401);
  });
  it("rechaza CSRF ausente, incorrecto y Origin ajeno; acepta header correcto", async () => {
    const agente = request.agent(app);
    await agente
      .post("/personal/login")
      .set("Origin", config.origin)
      .type("form")
      .send({ identificador: "coordinacion", password });
    const csrf = (await agente.get("/api/v1/auth/me")).body.csrfToken;
    for (const [origin, token] of [
      [config.origin, ""],
      [config.origin, "x".repeat(64)],
      ["https://ajeno.test", csrf],
    ])
      expect(
        (
          await agente
            .post("/api/v1/auth/logout")
            .set("Origin", origin)
            .set("X-CSRF-Token", token)
            .send({})
        ).status,
      ).toBe(403);
    expect(
      (
        await agente
          .post("/api/v1/auth/logout")
          .set("Origin", config.origin)
          .set("X-CSRF-Token", csrf)
          .send({})
      ).status,
    ).toBe(204);
  });
  it("rechaza login de otro origen o formulario sin Origin", async () => {
    expect(
      (
        await request(app)
          .post("/api/v1/auth/login")
          .set("Origin", "https://ajeno.test")
          .send({ identificador: "coordinacion", password })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post("/personal/login")
          .type("form")
          .send({ identificador: "coordinacion", password })
      ).status,
    ).toBe(403);
  });
  it("cookies en origen HTTPS llevan Secure", async () => {
    const segura = createApp(db, {
      ...config,
      origin: "https://ecclesia.test",
    });
    const r = await request(segura)
      .post("/personal/login")
      .set("Origin", "https://ecclesia.test")
      .type("form")
      .send({ identificador: "coordinacion", password });
    expect(String(r.headers["set-cookie"])).toContain("Secure");
  });
  it("panel de administrador muestra solo su iglesia y no permite gestión de usuarios", async () => {
    const agente = request.agent(app);
    await agente
      .post("/personal/login")
      .set("Origin", config.origin)
      .type("form")
      .send({ identificador: "administrador", password });
    const panel = await agente.get("/personal");
    expect(panel.text).toContain(own);
    expect(panel.text).not.toContain("Gestionar usuarios");
    expect((await agente.get("/personal/usuarios")).status).toBe(403);
  });
});
