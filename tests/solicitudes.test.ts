import { Ajv2020 } from "ajv/dist/2020.js";
import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { Client } from "pg";
import { PrismaClient, type Iglesia } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createApp } from "../src/composition/app.js";
import {
  precioCentavos,
  precioDecimal,
  venceEn,
  transicion,
  vencida,
  type EstadoSolicitud,
} from "../src/modules/solicitudes/domain/solicitud.js";
import {
  ClavesSolicitud,
  hashClave,
  verificaClave,
} from "../src/modules/solicitudes/infrastructure/seguridad.js";
import { PrismaRepositorioSolicitudes } from "../src/modules/solicitudes/infrastructure/prisma-repositorio.js";
import { ServicioSolicitudes } from "../src/modules/solicitudes/application/servicio.js";
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
const config = {
  secret: process.env.TEST_JWT_SECRET!,
  issuer: "ecclesia-personal",
  audience: "ecclesia-api",
  origin: "http://127.0.0.1:3000",
};
const own = randomUUID(),
  other = randomUUID(),
  adminId = randomUUID();
const password = "Solicitud ficticia prueba!";
let inicial: Iglesia[],
  hash: string,
  ahora: Date,
  app: ReturnType<typeof createApp>,
  csrf: string,
  cookie: string;
let tokens: Record<string, string>;
const base = (i = own) => "/api/v1/iglesias/" + i;
const web = (i = own) => "/personal/solicitudes/" + i;
const datos = () => ({
  tipo: "NICHO",
  nombre: "Persona ficticia",
  contacto: "prueba@example.invalid",
  peticionId: randomUUID(),
});
async function limpiar() {
  await db.cambioSolicitud.deleteMany();
  await db.solicitudEspacio.deleteMany();
  await db.cambioEspacio.deleteMany();
  await db.ofertaFuneraria.deleteMany();
  await db.limiteSolicitud.deleteMany();
  await db.correccionDiezmo.deleteMany();
  await db.diezmo.deleteMany();
  await db.cambioAgenda.deleteMany();
  await db.celebracionMisa.deleteMany();
  await db.ocurrenciaMisa.deleteMany();
  await db.horarioMisa.deleteMany();
  await db.asignacionSacerdote.deleteMany();
  await db.sacerdote.deleteMany();
  await db.cambioOferta.deleteMany();
  await db.servicioOfrecido.deleteMany();
  await db.platica.deleteMany();
  await db.cambioPatrimonio.deleteMany();
  await db.objetoPatrimonial.deleteMany();
  await db.usuario.deleteMany();
  await db.iglesia.deleteMany();
}
beforeAll(async () => {
  inicial = await db.iglesia.findMany();
  hash = await bcrypt.hash(password, 12);
});
beforeEach(async () => {
  await limpiar();
  ahora = new Date("2026-11-03T20:00:00.000Z");
  await db.iglesia.createMany({
    data: [own, other].map((id) => ({
      ...inicial[0],
      id,
      nombre: "Iglesia ficticia " + id,
      cerradaDesde: null,
    })),
  });
  await db.usuario.createMany({
    data: [
      {
        id: adminId,
        identificador: "admin",
        rol: "ADMIN_IGLESIA" as const,
        iglesiaId: own,
      },
      {
        id: randomUUID(),
        identificador: "ajeno",
        rol: "ADMIN_IGLESIA" as const,
        iglesiaId: other,
      },
      {
        id: randomUUID(),
        identificador: "tesorero",
        rol: "TESORERO" as const,
        iglesiaId: own,
      },
      {
        id: randomUUID(),
        identificador: "coord",
        rol: "COORDINACION" as const,
        iglesiaId: null,
      },
    ].map((u) => ({ ...u, passwordHash: hash })),
  });
  app = createApp(db, config, 2026, () => new Date(ahora));
  tokens = {};
  const r = await request(app).get("/api/v1/solicitudes/acceso");
  expect(r.status).toBe(200);
  csrf = r.body.csrf;
  cookie = (r.headers["set-cookie"] as unknown as string[])
    .map((s) => s.split(";")[0])
    .join("; ");
  await espacio();
});
afterAll(async () => {
  await limpiar();
  await db.iglesia.createMany({ data: inicial });
  await db.$disconnect();
});
async function token(u = "admin") {
  if (!tokens[u]) {
    const r = await request(app)
      .post("/api/v1/auth/login")
      .send({ identificador: u, password });
    expect(r.status).toBe(200);
    tokens[u] = r.body.accessToken;
  }
  return tokens[u];
}
async function espacio(
  tipo = "NICHO",
  activo = true,
  version = 0,
  u = "admin",
  i = own,
) {
  return request(app)
    .put(base(i) + "/ofertas-espacio/" + tipo)
    .auth(await token(u), { type: "bearer" })
    .send({ activo, version });
}
function post(path: string, d: object) {
  return request(app)
    .post(path)
    .set("Cookie", cookie)
    .set("Origin", config.origin)
    .set("X-CSRF-Token", csrf)
    .send(d);
}
async function alta(d = datos(), i = own) {
  const r = await post(base(i) + "/solicitudes", d);
  expect(r.status, JSON.stringify(r.body)).toBe(201);
  return r.body as { folio: string; clave: string };
}
async function fila(a: { folio: string }) {
  return await db.solicitudEspacio.findUniqueOrThrow({
    where: { folio: a.folio },
  });
}
function seguir(a: { folio: string; clave: string }) {
  return request(app)
    .get("/api/v1/solicitudes/" + a.folio)
    .set("X-Solicitud-Clave", a.clave);
}
async function revisar(
  a: { folio: string },
  d: object = {
    resultado: "COTIZAR",
    version: 1,
    precio: "1234.56",
    condiciones: "Solo servicio solicitado, sin asignación física",
  },
) {
  return request(app)
    .post(base() + "/solicitudes/" + (await fila(a)).id + "/revision")
    .auth(await token(), { type: "bearer" })
    .send(d);
}
function decidir(
  a: { folio: string; clave: string },
  accion = "aceptar",
  version = 2,
) {
  return post("/api/v1/solicitudes/" + a.folio + "/" + accion, { version }).set(
    "X-Solicitud-Clave",
    a.clave,
  );
}
const repo = () => new PrismaRepositorioSolicitudes(db, () => new Date(ahora));
describe("RF25–31 solicitudes PostgreSQL real", () => {
  it("respuestas HTTP reales cumplen contrato sin contacto ni verificador público", async () => {
    const api = JSON.parse(readFileSync("openapi.yaml", "utf8")),
      ajv = new Ajv2020({ strict: false, validateFormats: false });
    ajv.addSchema({ $id: "solicitudes", components: api.components });
    const validar = (name: string, d: unknown) =>
      expect(
        ajv.validate({ $ref: "solicitudes#/components/schemas/" + name }, d),
        JSON.stringify(ajv.errors),
      ).toBe(true);
    const a = await alta();
    validar("SolicitudRecibo", a);
    validar("SolicitudSeguimiento", (await seguir(a)).body);
    validar("SolicitudFicha", (await revisar(a)).body);
    validar("SolicitudSeguimiento", (await decidir(a)).body);
    validar(
      "SolicitudLista",
      (
        await request(app)
          .get(base() + "/solicitudes")
          .auth(await token(), { type: "bearer" })
      ).body,
    );
  });
  it("precio exacto y frontera de 15 días: dominio sin flotantes ni reloj oculto", () => {
    expect(precioCentavos("1234.56")).toBe(123456n);
    expect(precioDecimal(10n)).toBe("0.10");
    expect(precioCentavos("999999999.99")).toBe(99999999999n);
    for (const p of ["1e3", "-1.00", "01.00", "1.1", "1000000000.00", "1.00\n"])
      expect(() => precioCentavos(p)).toThrow();
    const fin = venceEn(ahora);
    expect(fin.toISOString()).toBe("2026-11-18T20:00:00.000Z");
    expect(vencida("COTIZADA", fin, new Date(fin.getTime() - 1))).toBe(false);
    expect(vencida("COTIZADA", fin, fin)).toBe(true);
    expect(vencida("REGISTRADA", null, fin)).toBe(false);
    expect(transicion("COTIZADA", "RECHAZAR")).toBe("RECHAZADA");
    for (const e of [
      "REGISTRADA",
      "SIN_LUGAR",
      "COTIZADA",
      "RECHAZADA",
      "VENCIDA",
    ] as EstadoSolicitud[])
      expect(transicion(e, "CANCELAR")).toBe("CANCELADA");
    expect(() => transicion("ACEPTADA", "CANCELAR")).toThrow();
    expect(() => transicion("CANCELADA", "CANCELAR")).toThrow();
  });
  it("clave aleatoria segura: solo hash persistido y auditoría sin secretos ni contacto", async () => {
    const a = await alta(),
      b = await alta();
    expect(a.folio).not.toBe(b.folio);
    expect(a.clave).not.toBe(b.clave);
    expect(a.clave).toMatch(/^[\w-]{43}$/);
    expect(a.folio).toMatch(/^[A-F0-9]{24}$/);
    const s = await fila(a);
    expect(s.claveHash).toBe(hashClave(a.clave));
    expect(s.claveHash).not.toBe(a.clave);
    expect(verificaClave(a.clave, s.claveHash)).toBe(true);
    expect(verificaClave(a.clave)).toBe(false);
    const auditoria = JSON.stringify(await db.cambioSolicitud.findMany());
    expect(auditoria).not.toContain(a.clave);
    expect(auditoria).not.toContain(s.claveHash);
    expect(auditoria).not.toContain(datos().contacto);
    const seguimiento = await seguir(a);
    expect(seguimiento.status).toBe(200);
    for (const f of [
      "nombre",
      "contacto",
      "clave",
      "claveHash",
      "historial",
      "peticionId",
      "id",
    ])
      expect(seguimiento.body).not.toHaveProperty(f);
    expect(await db.usuario.count()).toBe(4);
  });
  it("oferta pública sin precio ni contactos; cuatro tipos y retirada con versión/auditoría", async () => {
    for (const t of ["CRIPTA", "COLUMBARIO", "OSARIO"])
      expect((await espacio(t)).status).toBe(200);
    const r = await request(app).get(base() + "/ofertas-espacio");
    expect(r.body.data).toHaveLength(4);
    expect(Object.keys(r.body.data[0])).toEqual(["tipo"]);
    expect((await espacio("NICHO", false, 1)).status).toBe(200);
    expect((await espacio("NICHO", true, 1)).status).toBe(409);
    expect((await post(base() + "/solicitudes", datos())).status).toBe(404);
    expect(await db.cambioEspacio.count({ where: { tipo: "NICHO" } })).toBe(2);
    expect((await espacio("NICHO", true, 2)).status).toBe(200);
  });
  it("401/403 y ámbito: administrador propio, tesorero/Coordinación/iglesia ajena rechazados", async () => {
    const a = await alta(),
      s = await fila(a);
    expect((await request(app).get(base() + "/solicitudes")).status).toBe(401);
    for (const u of ["tesorero", "coord", "ajeno"]) {
      for (const path of [
        base() + "/solicitudes",
        base() + "/solicitudes/" + s.id,
        web(),
      ])
        expect(
          (
            await request(app)
              .get(path)
              .auth(await token(u), { type: "bearer" })
          ).status,
        ).toBe(403);
      expect((await espacio("CRIPTA", true, 0, u)).status).toBe(403);
    }
    const r = await request(app)
      .get(base(other) + "/solicitudes/" + s.id)
      .auth(await token("ajeno"), { type: "bearer" });
    expect(r.status).toBe(404);
    await expect(
      repo().ficha(
        own,
        s.id,
        (
          await db.usuario.findUniqueOrThrow({
            where: { identificador: "tesorero" },
          })
        ).id,
      ),
    ).rejects.toThrow("Administrador activo");
    const servicio = new ServicioSolicitudes(repo(), new ClavesSolicitud());
    expect(() => servicio.autorizar(own)).toThrow("Inicie sesión");
  });
  it("respuestas uniformes contra enumeración: folio sin clave, ajeno y malformado", async () => {
    const a = await alta(),
      b = await alta();
    const respuestas: unknown[] = [];
    for (const [folio, clave] of [
      [a.folio, b.clave],
      ["0".repeat(24), a.clave],
      [a.folio, ""],
      ["malformado", a.clave],
    ]) {
      const r = await seguir({ folio, clave });
      expect(r.status).toBe(404);
      respuestas.push(r.body);
    }
    expect(
      respuestas.every(
        (r) => JSON.stringify(r) === JSON.stringify(respuestas[0]),
      ),
    ).toBe(true);
    expect(
      (
        await request(app).get(
          "/api/v1/solicitudes/" + a.folio + "?clave=" + a.clave,
        )
      ).status,
    ).toBe(404);
  });
  it("limitación persistente por folio incluso con clave válida; ventana controlada y sin IP/clave en base", async () => {
    const a = await alta();
    for (let i = 0; i < 20; i++)
      expect((await seguir({ ...a, clave: "x".repeat(43) })).status).toBe(404);
    expect((await seguir(a)).status).toBe(429);
    const nuevo = createApp(db, config, 2026, () => ahora);
    expect(
      (
        await request(nuevo)
          .get("/api/v1/solicitudes/" + a.folio)
          .set("X-Solicitud-Clave", a.clave)
      ).status,
    ).toBe(429);
    const limites = await db.limiteSolicitud.findMany();
    expect(limites.every((l) => /^[a-f0-9]{64}$/.test(l.clave))).toBe(true);
    ahora = new Date(ahora.getTime() + 900000);
    expect((await seguir(a)).status).toBe(200);
  });
  it("limitación por conexión: X-Forwarded-For no permite eludir alta o enumeración", async () => {
    for (let n = 0; n < 10; n++)
      expect(
        (
          await post(base() + "/solicitudes", datos()).set(
            "X-Forwarded-For",
            "192.0.2." + n,
          )
        ).status,
      ).toBe(201);
    expect(
      (
        await post(base() + "/solicitudes", datos()).set(
          "X-Forwarded-For",
          "198.51.100.5",
        )
      ).status,
    ).toBe(429);
    await db.limiteSolicitud.deleteMany();
    for (let n = 0; n < 60; n++)
      expect(
        (
          await seguir({
            folio: randomUUID().replaceAll("-", "").slice(0, 24).toUpperCase(),
            clave: "x".repeat(43),
          })
        ).status,
      ).toBe(404);
    expect(
      (await seguir({ folio: "0".repeat(24), clave: "x".repeat(43) })).status,
    ).toBe(429);
  });
  it("limitación atómica concurrente conserva contador y reinicia después de ventana", async () => {
    const r = repo(),
      clave = "a".repeat(64);
    const respuestas = await Promise.allSettled(
      Array.from({ length: 5 }, () => r.limitar(clave, 3, 1000)),
    );
    expect(respuestas.filter((x) => x.status === "fulfilled")).toHaveLength(3);
    expect(respuestas.filter((x) => x.status === "rejected")).toHaveLength(2);
    ahora = new Date(ahora.getTime() + 1000);
    await expect(r.limitar(clave, 3, 1000)).resolves.toBeUndefined();
  });
  it("cotización individual y falta de lugar se comunican solo en seguimiento", async () => {
    const a = await alta(),
      b = await alta();
    expect((await revisar(a)).status).toBe(200);
    expect(
      (await revisar(b, { resultado: "SIN_LUGAR", version: 1 })).status,
    ).toBe(200);
    const r = await seguir(a);
    expect(r.body.cotizacion.precio).toBe("1234.56");
    expect(r.body.cotizacion.vence).toBe("2026-11-18T20:00:00.000Z");
    const sin = await seguir(b);
    expect(sin.body.estado).toBe("SIN_LUGAR");
    expect(sin.body.cotizacion).toBeNull();
    expect((await revisar(a)).status).toBe(409);
    const ficha = await request(app)
      .get(base() + "/solicitudes/" + (await fila(a)).id)
      .auth(await token(), { type: "bearer" });
    expect(ficha.body.nombre).toBe(datos().nombre);
    expect(ficha.body.historial[1].actorId).toBe(adminId);
    expect(
      JSON.stringify(
        (await request(app).get(base() + "/ofertas-espacio")).body,
      ),
    ).not.toContain("1234.56");
  });
  it("aceptación y rechazo vigentes; decisión duplicada y cancelación aceptada bloqueadas", async () => {
    const a = await alta(),
      b = await alta();
    await revisar(a);
    await revisar(b);
    expect((await decidir(a)).body.estado).toBe("ACEPTADA");
    expect((await decidir(a)).status).toBe(409);
    expect((await decidir(a, "cancelar", 3)).status).toBe(409);
    expect((await decidir(b, "rechazar")).body.estado).toBe("RECHAZADA");
    expect((await decidir(b, "aceptar", 3)).status).toBe(409);
    expect(
      await db.cambioSolicitud.findMany({
        where: { solicitudId: (await fila(a)).id },
      }),
    ).toHaveLength(3);
  });
  it("frontera exacta: vence al consultar y persiste auditoría aunque decidir responda 409", async () => {
    const a = await alta(),
      b = await alta(),
      c = await alta();
    await revisar(a);
    await revisar(b);
    await revisar(c);
    ahora = new Date("2026-11-18T19:59:59.999Z");
    expect((await decidir(a)).status).toBe(200);
    ahora = new Date("2026-11-18T20:00:00.000Z");
    expect((await decidir(b)).status).toBe(409);
    expect((await fila(b)).estado).toBe("VENCIDA");
    expect((await seguir(c)).body.estado).toBe("VENCIDA");
    expect((await seguir(c)).body.version).toBe(3);
    const h = await db.cambioSolicitud.findMany({
      where: { solicitudId: (await fila(b)).id },
      orderBy: { version: "asc" },
    });
    expect(h).toHaveLength(3);
    expect(h[2].actor).toBe("SISTEMA");
    expect(h[2].actorId).toBeNull();
    expect((await seguir(a)).body.estado).toBe("ACEPTADA");
  });
  it("vencimiento en lista/detalle gestor y rechazo de revisión tardía también hace COMMIT", async () => {
    const a = await alta(),
      b = await alta(),
      c = await alta();
    await revisar(a);
    await revisar(b);
    await revisar(c);
    ahora = new Date("2026-11-19T20:00:00.000Z");
    expect((await revisar(a)).status).toBe(409);
    expect((await fila(a)).estado).toBe("VENCIDA");
    const detalle = await request(app)
      .get(base() + "/solicitudes/" + (await fila(b)).id)
      .auth(await token(), { type: "bearer" });
    expect(detalle.body.estado).toBe("VENCIDA");
    const lista = await request(app)
      .get(base() + "/solicitudes")
      .auth(await token(), { type: "bearer" });
    expect(
      lista.body.data.every((s: { estado: string }) => s.estado === "VENCIDA"),
    ).toBe(true);
    expect(lista.body.total).toBe(3);
  });
  it("cancelación en todos los estados no aceptados; no reabre ni recotiza", async () => {
    for (const estado of [
      "REGISTRADA",
      "COTIZADA",
      "SIN_LUGAR",
      "RECHAZADA",
      "VENCIDA",
    ]) {
      const a = await alta();
      if (estado === "SIN_LUGAR")
        await revisar(a, { resultado: "SIN_LUGAR", version: 1 });
      else if (estado !== "REGISTRADA") await revisar(a);
      if (estado === "RECHAZADA") await decidir(a, "rechazar");
      if (estado === "VENCIDA") {
        ahora = new Date(ahora.getTime() + 15 * 86400000);
        await seguir(a);
      }
      const version = (await fila(a)).version;
      expect((await decidir(a, "cancelar", version)).body.estado).toBe(
        "CANCELADA",
      );
      expect((await decidir(a, "cancelar", version + 1)).status).toBe(409);
      expect(
        (await revisar(a, { resultado: "SIN_LUGAR", version: version + 1 }))
          .status,
      ).toBe(409);
    }
  });
  it("concurrencia de revisión: cotizar/sin lugar solo un ganador y una auditoría", async () => {
    const a = await alta();
    const rr = await Promise.all([
      revisar(a),
      revisar(a, { resultado: "SIN_LUGAR", version: 1 }),
    ]);
    expect(rr.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await db.cambioSolicitud.count()).toBe(2);
  });
  it("concurrencia de decisiones: aceptar/cancelar no pueden persistir ambas", async () => {
    const a = await alta();
    await revisar(a);
    const rr = await Promise.all([decidir(a), decidir(a, "cancelar")]);
    expect(rr.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await db.cambioSolicitud.count()).toBe(3);
  });
  it("reloj releído después del bloqueo: espera no extiende cotización vigente", async () => {
    const a = await alta();
    await revisar(a);
    ahora = new Date("2026-11-18T19:59:59.999Z");
    const pg = new Client({ connectionString: process.env.DATABASE_URL });
    await pg.connect();
    await pg.query("BEGIN");
    await pg.query('SELECT id FROM "Iglesia" WHERE id=$1 FOR UPDATE', [own]);
    try {
      const pendiente = repo().seguimiento(a, {
        accion: "ACEPTAR",
        version: 2,
      });
      // Esperar bloqueo real observado, no una pausa arbitraria.
      let bloqueado = false;
      for (let n = 0; n < 500; n++) {
        await pg.query("SELECT pg_stat_clear_snapshot()");
        const r = await pg.query(
          "SELECT 1 FROM pg_stat_activity WHERE wait_event_type='Lock' AND query LIKE '%Iglesia%' AND pid<>pg_backend_pid()",
        );
        if (r.rowCount) {
          bloqueado = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 5));
      }
      expect(bloqueado).toBe(true);
      ahora = new Date("2026-11-18T20:00:00.000Z");
      await pg.query("COMMIT");
      await expect(pendiente).rejects.toThrow("estado o la versión");
      expect((await fila(a)).estado).toBe("VENCIDA");
    } finally {
      await pg.query("ROLLBACK");
      await pg.end();
    }
  });
  it("duplicado de envío e identificador concurrente: no crea dos solicitudes ni reexpone clave", async () => {
    const d = datos();
    const rr = await Promise.all([
      post(base() + "/solicitudes", d),
      post(base() + "/solicitudes", d),
    ]);
    expect(rr.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await db.solicitudEspacio.count()).toBe(1);
    expect(rr.find((r) => r.status === 409)!.body).not.toHaveProperty("clave");
  });
  it("dos cambios simultáneos de oferta: versión atómica", async () => {
    const rr = await Promise.all([
      espacio("NICHO", false, 1),
      espacio("NICHO", true, 1),
    ]);
    expect(rr.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await db.cambioEspacio.count()).toBe(2);
  });
  it("retirada de tipo conserva seguimiento y cotización existente; iglesia cerrada bloqueada", async () => {
    const a = await alta();
    await espacio("NICHO", false, 1);
    expect((await seguir(a)).status).toBe(200);
    expect((await revisar(a)).status).toBe(200);
    await db.iglesia.update({
      where: { id: own },
      data: { cerradaDesde: ahora },
    });
    expect((await request(app).get(base() + "/ofertas-espacio")).status).toBe(
      404,
    );
    expect((await seguir(a)).status).toBe(404);
    expect((await espacio("NICHO", true, 2)).status).toBe(404);
  });
  it("entrada estricta rechaza precio float, estado/actor suplantado, versión y campos extras", async () => {
    for (const d of [
      { ...datos(), nombre: "" },
      { ...datos(), tipo: "OTRO" },
      { ...datos(), contacto: "x" },
      { ...datos(), actorId: adminId },
      { ...datos(), estado: "ACEPTADA" },
    ])
      expect((await post(base() + "/solicitudes", d)).status).toBe(422);
    const a = await alta();
    for (const d of [
      { resultado: "COTIZAR", version: 1, precio: 12.34, condiciones: "X" },
      { resultado: "SIN_LUGAR", version: 0 },
      { resultado: "COTIZAR", version: 1, precio: "1.00", condiciones: "" },
      { resultado: "SIN_LUGAR", version: 1, actorId: adminId },
    ])
      expect((await revisar(a, d)).status).toBe(422);
    expect((await espacio("OTRO")).status).toBe(422);
    expect(
      (
        await request(app)
          .get(base() + "/solicitudes?pagina=0")
          .auth(await token(), { type: "bearer" })
      ).status,
    ).toBe(422);
  });
  it("FK/CHECK impiden datos cruzados, cotización incompleta y decisiones vencidas", async () => {
    const a = await alta(),
      s = await fila(a);
    for (const data of [
      { version: 0 },
      { nombre: "" },
      { contacto: "x" },
      { claveHash: "claro" },
      { folio: "123" },
      { iglesiaId: other },
      { estado: "COTIZADA" as const },
      { precioCentavos: -1n },
    ])
      await expect(
        db.solicitudEspacio.update({ where: { id: s.id }, data }),
      ).rejects.toThrow();
    await revisar(a);
    for (const data of [
      { vence: new Date("2026-12-01") },
      { estado: "ACEPTADA" as const, decisionEn: new Date("2026-11-19") },
      { condiciones: "" },
    ])
      await expect(
        db.solicitudEspacio.update({ where: { id: s.id }, data }),
      ).rejects.toThrow();
    await expect(
      db.cambioSolicitud.create({
        data: {
          solicitudId: s.id,
          iglesiaId: other,
          actor: "SISTEMA",
          instante: ahora,
          antes: {},
          despues: {},
          version: 3,
        },
      }),
    ).rejects.toThrow();
    await expect(
      db.cambioSolicitud.create({
        data: {
          solicitudId: s.id,
          iglesiaId: own,
          actor: "PERSONAL",
          instante: ahora,
          antes: {},
          despues: {},
          version: 3,
        },
      }),
    ).rejects.toThrow();
    await expect(
      db.ofertaFuneraria.delete({
        where: { iglesiaId_tipo: { iglesiaId: own, tipo: "NICHO" } },
      }),
    ).rejects.toThrow();
  });
  it("fallo de auditoría revierte alta, revisión, decisión y vencimiento; oferta también atómica", async () => {
    const a = await alta(),
      s = await fila(a);
    const pg = new Client({ connectionString: process.env.DATABASE_URL });
    await pg.connect();
    await pg.query(
      "CREATE FUNCTION pg_temp.no_auditoria() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'auditoria preparada'; END $$",
    );
    await pg.query(
      'CREATE TRIGGER fallo_solicitud BEFORE INSERT ON "CambioSolicitud" FOR EACH ROW EXECUTE FUNCTION pg_temp.no_auditoria()',
    );
    try {
      expect((await post(base() + "/solicitudes", datos())).status).toBe(500);
      expect((await revisar(a)).status).toBe(500);
      expect((await fila(a)).version).toBe(1);
    } finally {
      await pg.query('DROP TRIGGER fallo_solicitud ON "CambioSolicitud"');
    }
    await revisar(a);
    await pg.query(
      'CREATE TRIGGER fallo_solicitud BEFORE INSERT ON "CambioSolicitud" FOR EACH ROW EXECUTE FUNCTION pg_temp.no_auditoria()',
    );
    try {
      expect((await decidir(a)).status).toBe(500);
      expect((await fila(a)).estado).toBe("COTIZADA");
      ahora = new Date("2026-11-19T00:00:00Z");
      expect((await seguir(a)).status).toBe(500);
      expect((await fila(a)).estado).toBe("COTIZADA");
    } finally {
      await pg.query('DROP TRIGGER fallo_solicitud ON "CambioSolicitud"');
    }
    await pg.query(
      'CREATE TRIGGER fallo_espacio BEFORE INSERT ON "CambioEspacio" FOR EACH ROW EXECUTE FUNCTION pg_temp.no_auditoria()',
    );
    try {
      expect((await espacio("NICHO", false, 1)).status).toBe(500);
      expect((await db.ofertaFuneraria.findFirstOrThrow()).version).toBe(1);
    } finally {
      await pg.query('DROP TRIGGER fallo_espacio ON "CambioEspacio"');
      await pg.end();
    }
    expect(await db.solicitudEspacio.count()).toBe(1);
    expect(
      await db.cambioSolicitud.count({ where: { solicitudId: s.id } }),
    ).toBe(2);
  });
  it("CSRF/Origin visitante y personal: tokens firmados, cookie y doble envío requeridos", async () => {
    for (const [origin, c, ck] of [
      [config.origin, "x", cookie],
      [config.origin, "é".repeat(csrf.length), cookie],
      ["https://otro.invalid", csrf, cookie],
      [config.origin, csrf, ""],
      [config.origin, csrf, cookie.replace(/.$/, "x")],
    ]) {
      const r = await request(app)
        .post(base() + "/solicitudes")
        .set("Origin", origin)
        .set("Cookie", ck)
        .set("X-CSRF-Token", c)
        .send(datos());
      expect(r.status).toBe(403);
    }
    const a = await alta();
    await revisar(a);
    expect(
      (
        await request(app)
          .post("/api/v1/solicitudes/" + a.folio + "/aceptar")
          .set("X-Solicitud-Clave", a.clave)
          .send({ version: 2 })
      ).status,
    ).toBe(403);
    const login = await request(app)
      .post("/personal/login")
      .set("Origin", config.origin)
      .type("form")
      .send({ identificador: "admin", password });
    const ck = (login.headers["set-cookie"] as unknown as string[])
      .map((s) => s.split(";")[0])
      .join("; ");
    const panel = await request(app).get("/personal").set("Cookie", ck);
    const token = panel.text.match(/name="_csrf" value="([^"]+)"/)![1];
    expect(
      (
        await request(app)
          .post(web() + "/espacios/OSARIO")
          .set("Cookie", ck)
          .type("form")
          .send({ activo: "true", version: 0, _csrf: token })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post(web() + "/espacios/OSARIO")
          .set("Cookie", ck)
          .set("Origin", config.origin)
          .type("form")
          .send({ activo: "true", version: 0, _csrf: token })
      ).status,
    ).toBe(303);
  });
  it("EJS completo y escape XSS; errores conservan contacto/cotización sin revelar verificador", async () => {
    const d = {
      ...datos(),
      nombre: "<script>alert(1)</script>",
      contacto: "<img src=x onerror=alert(1)>",
    };
    const pagina = await request(app)
      .get("/iglesias/" + own + "/espacios")
      .set("Cookie", cookie);
    expect(pagina.status).toBe(200);
    expect(pagina.text).toContain("Solicitar sin cuenta");
    const recibo = await request(app)
      .post("/iglesias/" + own + "/espacios")
      .set("Cookie", cookie)
      .set("Origin", config.origin)
      .type("form")
      .send({ ...d, _csrf: csrf });
    expect(recibo.status).toBe(201);
    expect(recibo.text).toContain("Solicitud registrada");
    const a = {
      folio: recibo.text.match(/id="folio">([^<]+)/)![1],
      clave: recibo.text.match(/id="clave">([^<]+)/)![1],
    };
    const det = web() + "/" + (await fila(a)).id;
    const gestor = await request(app)
      .get(det)
      .auth(await token(), { type: "bearer" });
    expect(gestor.text).toContain("&lt;script&gt;");
    expect(gestor.text).not.toContain("<script>");
    const inv = await request(app)
      .post("/iglesias/" + own + "/espacios")
      .set("Cookie", cookie)
      .set("Origin", config.origin)
      .type("form")
      .send({ ...d, nombre: "", _csrf: csrf });
    expect(inv.status).toBe(422);
    expect(inv.text).toContain("&lt;img");
    const malas = await request(app)
      .post(det)
      .auth(await token(), { type: "bearer" })
      .type("form")
      .send({
        resultado: "COTIZAR",
        version: 1,
        precio: "x",
        condiciones: "<script>x</script>",
      });
    expect(malas.status).toBe(422);
    expect(malas.text).toContain("&lt;script&gt;");
    await revisar(a, {
      resultado: "COTIZAR",
      version: 1,
      precio: "0.10",
      condiciones: "<script>cotizacion</script>",
    });
    const p = await request(app)
      .post("/solicitudes/seguimiento")
      .set("Cookie", cookie)
      .set("Origin", config.origin)
      .type("form")
      .send({ ...a, _csrf: csrf });
    expect(p.status).toBe(200);
    expect(p.text).toContain("&lt;script&gt;cotizacion");
    expect(p.text).not.toContain(d.contacto);
    expect(p.text).not.toContain((await fila(a)).claveHash);
    const decision = await request(app)
      .post("/solicitudes/decision")
      .set("Cookie", cookie)
      .set("Origin", config.origin)
      .type("form")
      .send({ ...a, _csrf: csrf, version: "2", accion: "ACEPTAR" });
    expect(decision.status).toBe(200);
    expect(decision.text).toContain("ACEPTADA");
    expect(decision.text).not.toContain("Cancelar solicitud");
    const erronea = await request(app)
      .post("/solicitudes/seguimiento")
      .set("Cookie", cookie)
      .set("Origin", config.origin)
      .type("form")
      .send({ ...a, clave: "x", _csrf: csrf });
    expect(erronea.status).toBe(404);
    expect(erronea.text).not.toContain(a.clave);
    expect(
      (
        await request(app)
          .get(web())
          .auth(await token(), { type: "bearer" })
      ).text,
    ).toContain("Espacios y solicitudes");
  });
  it("paginación privada no pierde solicitudes y no devuelve contactos en lista", async () => {
    for (let n = 0; n < 26; n++) {
      await db.limiteSolicitud.deleteMany();
      await alta();
    }
    const get = (pagina: number) =>
      request(app)
        .get(base() + "/solicitudes?pagina=" + pagina)
        .auth(tokens.admin, { type: "bearer" });
    const a = await get(1),
      b = await get(2);
    expect(a.body.data).toHaveLength(25);
    expect(b.body.data).toHaveLength(1);
    expect(b.body.total).toBe(26);
    expect(JSON.stringify(a.body)).not.toContain(datos().contacto);
  });
  it("cabeceras privadas y ningún secreto en URL de formularios o navegación", async () => {
    const a = await alta();
    const r = await seguir(a);
    expect(r.headers["cache-control"]).toBe("no-store");
    expect(r.headers["referrer-policy"]).toBe("same-origin");
    expect((await request(app).get("/iglesias/" + own)).text).toContain(
      "/espacios",
    );
    const p = await request(app).get("/solicitudes").set("Cookie", cookie);
    expect(p.text).toContain('type="password"');
    expect(p.text).toContain('method="post"');
  });
  it("actualiza esquema previo conservando identidad, diezmos y el criterio 35.5", async () => {
    const pg = new Client({ connectionString: process.env.DATABASE_URL }),
      schema = "solicitudes_" + randomUUID().replaceAll("-", "");
    await pg.connect();
    try {
      await pg.query('CREATE SCHEMA "' + schema + '"');
      await pg.query('SET search_path TO "' + schema + '"');
      for (const f of readdirSync("prisma/migrations")
        .filter((f) => f < "202611030003_solicitudes")
        .sort())
        await pg.query(
          readFileSync("prisma/migrations/" + f + "/migration.sql", "utf8"),
        );
      await pg.query(
        'INSERT INTO "TipoIglesia" SELECT * FROM public."TipoIglesia"',
      );
      await pg.query(
        'INSERT INTO "Localidad" SELECT * FROM public."Localidad"',
      );
      await pg.query(
        'INSERT INTO "Iglesia" SELECT * FROM public."Iglesia" WHERE id=$1',
        [own],
      );
      await pg.query(
        'INSERT INTO "Usuario" (id,identificador,"passwordHash",rol,"iglesiaId",activo) SELECT id,identificador,"passwordHash",rol::text::"RolPersonal","iglesiaId",activo FROM public."Usuario" WHERE id=$1',
        [adminId],
      );
      const sacerdote = randomUUID(),
        horario = randomUUID(),
        ocurrencia = randomUUID(),
        celebracion = randomUUID(),
        diezmo = randomUUID();
      await pg.query('INSERT INTO "Sacerdote" (id,nombre) VALUES ($1,$2)', [
        sacerdote,
        "Ficticio migración",
      ]);
      await pg.query('INSERT INTO "AsignacionSacerdote" VALUES ($1,$2)', [
        own,
        sacerdote,
      ]);
      await pg.query(
        'INSERT INTO "HorarioMisa" (id,"iglesiaId","sacerdoteId","diaSemana","horaLocal",tipo,idioma,desde,hasta,"zonaIana") VALUES ($1,$2,$3,1,$4,$5,$6,$7,$7,$8)',
        [
          horario,
          own,
          sacerdote,
          "10:00",
          "DIARIA",
          "Español",
          "2026-10-05",
          "America/Mexico_City",
        ],
      );
      await pg.query(
        'INSERT INTO "OcurrenciaMisa" (id,"horarioId","iglesiaId","sacerdoteId","fechaLocal","horaLocal","zonaIana",inicio,fin) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [
          ocurrencia,
          horario,
          own,
          sacerdote,
          "2026-10-05",
          "10:00",
          "America/Mexico_City",
          "2026-10-05T16:00Z",
          "2026-10-05T17:00Z",
        ],
      );
      await pg.query(
        'INSERT INTO "CelebracionMisa" (id,"ocurrenciaId","iglesiaId","previstoId","oficianteId","fechaLocal","horaLocal","zonaIana",inicio,fin,"actorId") VALUES ($1,$2,$3,$4,$4,$5,$6,$7,$8,$9,$10)',
        [
          celebracion,
          ocurrencia,
          own,
          sacerdote,
          "2026-10-05",
          "10:00",
          "America/Mexico_City",
          "2026-10-05T16:00Z",
          "2026-10-05T17:00Z",
          adminId,
        ],
      );
      await pg.query(
        'INSERT INTO "Diezmo" (id,"celebracionId","iglesiaId","importeCentavos") VALUES ($1,$2,$3,123456)',
        [diezmo, celebracion, own],
      );
      const previo = await pg.query('SELECT * FROM "Diezmo"');
      const identidad = await pg.query(
        'SELECT id,identificador,rol,"iglesiaId" FROM "Usuario"',
      );
      const criterio = await pg.query('SELECT * FROM "CriterioPatrimonio"');
      await pg.query(
        readFileSync(
          "prisma/migrations/202611030003_solicitudes/migration.sql",
          "utf8",
        ),
      );
      expect(
        (await pg.query('SELECT * FROM "CriterioPatrimonio"')).rows,
      ).toEqual(criterio.rows);
      expect(
        (await pg.query('SELECT count(*) FROM "SolicitudEspacio"')).rows[0]
          .count,
      ).toBe("0");
      expect((await pg.query('SELECT * FROM "Diezmo"')).rows).toEqual(
        previo.rows,
      );
      expect(
        (
          await pg.query(
            'SELECT id,identificador,rol,"iglesiaId" FROM "Usuario"',
          )
        ).rows,
      ).toEqual(identidad.rows);
    } finally {
      await pg.query("SET search_path TO public");
      await pg.query('DROP SCHEMA "' + schema + '" CASCADE');
      await pg.end();
    }
  });
});
