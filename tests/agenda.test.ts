import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { Client } from "pg";
import { PrismaClient, type Iglesia } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Ajv2020 } from "ajv/dist/2020.js";
import { createApp } from "../src/composition/app.js";
import {
  instante,
  ocurrencias,
  traslapa,
  type DatosHorario,
} from "../src/modules/agenda/domain/agenda.js";
import { PrismaRepositorioAgenda } from "../src/modules/agenda/infrastructure/prisma-repositorio.js";
import { ServicioAgenda } from "../src/modules/agenda/application/servicio.js";
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
  padre = randomUUID(),
  suplente = randomUUID();
const password = "Agenda ficticia para pruebas!";
const api = JSON.parse(readFileSync("openapi.yaml", "utf8"));
const ajv = new Ajv2020({ strict: false, validateFormats: false });
ajv.addSchema({ $id: "agenda", components: api.components });
function contrato(nombre: string, valor: unknown) {
  expect(
    ajv.validate({ $ref: `agenda#/components/schemas/${nombre}` }, valor),
    JSON.stringify(ajv.errors),
  ).toBe(true);
}
let inicial: Iglesia[],
  hash: string,
  app: ReturnType<typeof createApp>,
  tokens: Record<string, string>;
const ruta = (i = own) => `/api/v1/iglesias/${i}/agenda`;
const publico = (i = own) => `/api/v1/iglesias/${i}/misas`;
const web = (i = own) => `/personal/agenda/${i}`;
const horario: DatosHorario = {
  sacerdoteId: padre,
  diaSemana: 1,
  horaLocal: "10:00",
  tipo: "DIARIA",
  idioma: "Español",
  duracionMinutos: 60,
  desde: "2026-10-05",
  hasta: "2026-10-26",
  activo: true,
};
async function limpiar() {
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
  await db.iglesia.createMany({
    data: [own, other].map((id, i) => ({
      ...inicial[0],
      id,
      nombre: i ? "Otra iglesia" : "Iglesia propia",
      zonaIana: "America/Mexico_City",
      version: 1,
      cerradaDesde: null,
    })),
  });
  await db.sacerdote.createMany({
    data: [
      { id: padre, nombre: "Padre ficticio" },
      { id: suplente, nombre: "Suplente ficticio" },
    ],
  });
  await db.asignacionSacerdote.createMany({
    data: [
      { iglesiaId: own, sacerdoteId: padre },
      { iglesiaId: other, sacerdoteId: padre },
      { iglesiaId: own, sacerdoteId: suplente },
    ],
  });
  await db.usuario.createMany({
    data: [
      { identificador: "admin", rol: "ADMIN_IGLESIA", iglesiaId: own },
      { identificador: "otro", rol: "ADMIN_IGLESIA", iglesiaId: other },
      { identificador: "tesorero", rol: "TESORERO", iglesiaId: own },
      { identificador: "coord", rol: "COORDINACION", iglesiaId: null },
    ].map((x) => ({
      ...x,
      rol: x.rol as "ADMIN_IGLESIA" | "COORDINACION" | "TESORERO",
      passwordHash: hash,
    })),
  });
  app = createApp(db, config, 2026);
  tokens = {};
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
async function alta(cambios: object = {}, i = own, u = "admin") {
  return request(app)
    .post(ruta(i) + "/horarios")
    .auth(await token(u), { type: "bearer" })
    .send({ ...horario, ...cambios });
}
async function editar(id: string, body: object, i = own, u = "admin") {
  return request(app)
    .put(ruta(i) + "/horarios/" + id)
    .auth(await token(u), { type: "bearer" })
    .send({ ...horario, version: 1, ...body });
}
async function lista() {
  return (await request(app).get(publico() + "?desde=2026-10-05")).body.data;
}
async function celebrar(body: object = {}) {
  return request(app)
    .post(ruta() + "/celebraciones")
    .auth(await token(), { type: "bearer" })
    .send({
      ocurrenciaId: (await lista())[0].id,
      oficianteId: padre,
      fechaLocal: "2026-10-05",
      horaLocal: "10:00",
      ...body,
    });
}
async function sesion() {
  const r = await request(app)
    .post("/personal/login")
    .set("Origin", config.origin)
    .type("form")
    .send({ identificador: "admin", password });
  expect(r.status).toBe(303);
  const cookie = (r.headers["set-cookie"] as unknown as string[])
    .map((v) => v.split(";")[0])
    .join("; ");
  const p = await request(app).get("/personal").set("Cookie", cookie);
  return { cookie, csrf: p.text.match(/name="_csrf" value="([^"]+)"/)![1] };
}

describe("RF16–21 agenda real PostgreSQL", () => {
  it("registra padre, vincula identidad compartida y restringe edición unilateral PC10", async () => {
    const creado = await request(app)
      .post(ruta() + "/sacerdotes")
      .auth(await token(), { type: "bearer" })
      .send({ nombre: " Nuevo padre " });
    expect(creado.status).toBe(201);
    contrato("AgendaSacerdote", creado.body);
    expect(creado.body.nombre).toBe("Nuevo padre");
    const path = ruta() + "/sacerdotes/" + creado.body.id;
    expect(
      (
        await request(app)
          .patch(path)
          .auth(await token(), { type: "bearer" })
          .send({ nombre: "Editado", version: 1 })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .patch(path)
          .auth(await token(), { type: "bearer" })
          .send({ nombre: "Obsoleto", version: 1 })
      ).status,
    ).toBe(409);
    const vinculo = () =>
      request(app)
        .post(ruta(other) + "/asignaciones")
        .auth(tokens.otro, { type: "bearer" })
        .send({ sacerdoteId: creado.body.id });
    await token("otro");
    expect((await vinculo()).status).toBe(201);
    expect((await vinculo()).status).toBe(409);
    expect(
      (
        await request(app)
          .patch(path)
          .auth(await token(), { type: "bearer" })
          .send({ nombre: "Unilateral", version: 2 })
      ).body.code,
    ).toBe("IDENTIDAD_COMPARTIDA_PC10");
    expect(await db.sacerdote.count({ where: { id: creado.body.id } })).toBe(1);
    expect(
      (
        await request(app)
          .get(ruta(other) + "/sacerdotes")
          .auth(await token("otro"), { type: "bearer" })
      ).body.data,
    ).toContainEqual({ ...creado.body, nombre: "Editado", version: 2 });
  });
  it("horario público muestra idioma, tipo, padre, zona local y duración predeterminada 60", async () => {
    const { duracionMinutos: _d, ...d } = horario;
    void _d;
    const r = await request(app)
      .post(ruta() + "/horarios")
      .auth(await token(), { type: "bearer" })
      .send(d);
    expect(r.status).toBe(201);
    expect(r.body.duracionMinutos).toBe(60);
    contrato("AgendaHorario", r.body);
    const os = await lista();
    contrato("AgendaOcurrenciaLista", { data: os });
    expect(os).toHaveLength(1);
    expect(os[0]).toMatchObject({
      horaLocal: "10:00",
      zonaIana: "America/Mexico_City",
      inicio: "2026-10-05T16:00:00.000Z",
      fin: "2026-10-05T17:00:00.000Z",
      sacerdote: { nombre: "Padre ficticio" },
      horario: { tipo: "DIARIA", idioma: "Español", duracionMinutos: 60 },
    });
    expect(JSON.stringify(os)).not.toMatch(/actorId|passwordHash|registradoEn/);
    expect(
      (await request(app).get(`/iglesias/${own}/misas?desde=2026-10-05`)).text,
    ).toContain("Padre ficticio");
  });
  it("traslapes entre iglesias se rechazan y extremos contiguos se permiten", async () => {
    expect((await alta()).status).toBe(201);
    expect((await alta({ horaLocal: "10:30" }, other, "otro")).status).toBe(
      409,
    );
    expect((await alta({ horaLocal: "11:00" }, other, "otro")).status).toBe(
      201,
    );
    expect((await alta({ horaLocal: "10:30" })).status).toBe(409);
  });
  it("duración explícita de 90 minutos participa del traslape", async () => {
    expect((await alta({ duracionMinutos: 90 })).status).toBe(201);
    expect((await alta({ horaLocal: "11:15" }, other, "otro")).status).toBe(
      409,
    );
    expect((await alta({ horaLocal: "11:30" }, other, "otro")).status).toBe(
      201,
    );
  });
  it("zonas distintas comparan instantes aunque las horas locales difieran", async () => {
    await db.iglesia.update({
      where: { id: other },
      data: { zonaIana: "America/Cancun" },
    });
    await alta();
    expect((await alta({ horaLocal: "11:30" }, other, "otro")).status).toBe(
      409,
    );
    expect((await alta({ horaLocal: "12:00" }, other, "otro")).status).toBe(
      201,
    );
  });
  it("DST: detecta conflicto solo en parte de la vigencia y conserva semana local", async () => {
    await db.iglesia.update({
      where: { id: other },
      data: { zonaIana: "America/Tijuana" },
    });
    await alta({ diaSemana: 7, desde: "2026-10-25", hasta: "2026-11-08" });
    expect(
      (
        await alta(
          {
            diaSemana: 7,
            horaLocal: "09:30",
            desde: "2026-10-25",
            hasta: "2026-11-08",
          },
          other,
          "otro",
        )
      ).status,
    ).toBe(409);
    expect(
      (
        await alta(
          {
            diaSemana: 7,
            horaLocal: "09:30",
            desde: "2026-11-01",
            hasta: "2026-11-08",
          },
          other,
          "otro",
        )
      ).status,
    ).toBe(201);
  });
  it("concurrencia entre iglesias deja una sola reserva: 201/409", async () => {
    await token();
    await token("otro");
    const rs = await Promise.all([alta(), alta({}, other, "otro")]);
    expect(rs.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await db.horarioMisa.count()).toBe(1);
    expect(await db.ocurrenciaMisa.count()).toBe(4);
    expect(await db.cambioAgenda.count()).toBe(1);
  });
  it("dos cambios simultáneos: 200/409 y auditoría completa sin pérdida", async () => {
    const h = (await alta()).body;
    const rs = await Promise.all([
      editar(h.id, { horaLocal: "08:00" }),
      editar(h.id, { horaLocal: "09:00" }),
    ]);
    expect(rs.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await db.cambioAgenda.count()).toBe(2);
    expect(await db.ocurrenciaMisa.count()).toBe(4);
  });
  it("el mutex relee con READ COMMITTED incluso si el cliente configura aislamiento distinto", async () => {
    const aislado = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
      transactionOptions: { isolationLevel: "RepeatableRead" },
    });
    try {
      const repo = new PrismaRepositorioAgenda(aislado);
      const actor = (
        await db.usuario.findUniqueOrThrow({
          where: { identificador: "admin" },
        })
      ).id;
      const actorOtro = (
        await db.usuario.findUniqueOrThrow({ where: { identificador: "otro" } })
      ).id;
      const resultados = await Promise.allSettled([
        repo.guardar(own, actor, horario),
        repo.guardar(other, actorOtro, horario),
      ]);
      expect(resultados.filter((r) => r.status === "fulfilled")).toHaveLength(
        1,
      );
      const fallo = resultados.find((r) => r.status === "rejected");
      expect(fallo?.status === "rejected" ? fallo.reason.code : null).toBe(
        "TRASLAPE",
      );
    } finally {
      await aislado.$disconnect();
    }
  });
  it("edición cambia padre, comprueba conflictos y revierte versión y ocurrencias al fallar", async () => {
    const a = (await alta()).body,
      b = (await alta({ sacerdoteId: suplente, horaLocal: "10:30" })).body;
    expect((await editar(b.id, { horaLocal: "10:30" })).status).toBe(409);
    expect(
      (await db.horarioMisa.findUniqueOrThrow({ where: { id: b.id } })).version,
    ).toBe(1);
    expect((await editar(a.id, { activo: false })).status).toBe(200);
    expect(await db.ocurrenciaMisa.count({ where: { horarioId: a.id } })).toBe(
      0,
    );
    expect((await editar(b.id, { horaLocal: "10:30" })).status).toBe(200);
  });
  it("agenda semanal interna permite padre compartido pero no recurso ajeno ni visitante", async () => {
    await alta();
    await alta({ horaLocal: "11:00" }, other, "otro");
    const url = ruta() + `/sacerdotes/${padre}/semana?desde=2026-10-05`;
    expect((await request(app).get(url)).status).toBe(401);
    const r = await request(app)
      .get(url)
      .auth(await token(), { type: "bearer" });
    expect(r.body.data).toHaveLength(2);
    expect(
      (
        await request(app)
          .get(ruta(other) + `/sacerdotes/${suplente}/semana?desde=2026-10-05`)
          .auth(await token("otro"), { type: "bearer" })
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .get(web() + `/sacerdotes/${padre}?desde=2026-10-05`)
          .auth(await token(), { type: "bearer" })
      ).text,
    ).toContain("Otra iglesia");
  });
  it("registra hecho con titular y conserva instantánea, autor y fecha", async () => {
    await alta();
    const r = await celebrar();
    expect(r.status).toBe(201);
    contrato("AgendaCelebracion", r.body);
    expect(r.body).toMatchObject({
      previstoId: padre,
      oficianteId: padre,
      motivo: null,
      fechaLocal: "2026-10-05",
      inicio: "2026-10-05T16:00:00.000Z",
    });
    expect(r.body.actorId).toBe(
      (
        await db.usuario.findUniqueOrThrow({
          where: { identificador: "admin" },
        })
      ).id,
    );
    expect(Date.parse(r.body.registradoEn)).toBeGreaterThan(0);
    expect((await celebrar()).status).toBe(409);
    expect(
      (await editar((await db.horarioMisa.findFirstOrThrow()).id, {})).body
        .code,
    ).toBe("HISTORICO_PC12");
    expect(
      (
        await request(app)
          .get(ruta() + "/celebraciones")
          .auth(await token(), { type: "bearer" })
      ).body.data,
    ).toEqual([r.body]);
  });
  it("sustitución exige motivo y guarda previsto, oficiante real, quién y cuándo", async () => {
    await alta();
    expect((await celebrar({ oficianteId: suplente })).status).toBe(422);
    const r = await celebrar({
      oficianteId: suplente,
      motivo: "Enfermedad del titular",
    });
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({
      previstoId: padre,
      oficianteId: suplente,
      motivo: "Enfermedad del titular",
    });
    expect((await db.cambioAgenda.findMany()).at(-1)!.despues).toMatchObject({
      id: r.body.id,
      actorId: r.body.actorId,
    });
    const html = await request(app)
      .get(web() + "?desde=2026-10-05")
      .auth(await token(), { type: "bearer" });
    expect(html.text).toContain("Enfermedad del titular");
    expect(html.text).toContain("Suplente ficticio");
  });
  it("sustituto ocupado en otra iglesia no puede oficiar y no registra hecho parcial", async () => {
    await db.asignacionSacerdote.create({
      data: { iglesiaId: other, sacerdoteId: suplente },
    });
    await alta();
    await alta({ sacerdoteId: suplente, horaLocal: "10:30" }, other, "otro");
    expect(
      (await celebrar({ oficianteId: suplente, motivo: "Suplencia" })).status,
    ).toBe(409);
    expect(await db.celebracionMisa.count()).toBe(0);
  });
  it("concurrencia de celebraciones duplicadas: 201/409 con una sola auditoría", async () => {
    await alta();
    const rs = await Promise.all([celebrar(), celebrar()]);
    expect(rs.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await db.celebracionMisa.count()).toBe(1);
    expect(await db.cambioAgenda.count()).toBe(2);
  });
  it("hechos reales impiden programar después un traslape del sustituto", async () => {
    await alta();
    await celebrar({ oficianteId: suplente, motivo: "Prueba" });
    expect(
      (await alta({ sacerdoteId: suplente, horaLocal: "10:30" })).status,
    ).toBe(409);
  });
  it("fecha, futuro, recurso y sacerdote inválidos no producen celebraciones", async () => {
    await alta();
    for (const body of [
      { fechaLocal: "2026-10-06" },
      { oficianteId: randomUUID() },
      { ocurrenciaId: randomUUID() },
      { actorId: randomUUID() },
      { motivo: " " },
    ])
      expect([422, 404]).toContain((await celebrar(body)).status);
    const h = await alta({ desde: "2030-01-07", hasta: "2030-01-07" });
    expect(h.status).toBe(201);
    const o = await db.ocurrenciaMisa.findFirstOrThrow({
      where: { horarioId: h.body.id },
    });
    expect(
      (await celebrar({ ocurrenciaId: o.id, fechaLocal: "2030-01-07" })).body
        .code,
    ).toBe("HECHO_FUTURO");
  });
  it("fallo de auditoría revierte sacerdotes, vínculos, horarios, hechos y versiones", async () => {
    const repo = new PrismaRepositorioAgenda(db),
      actor = randomUUID();
    await expect(repo.registrar(own, actor, "Rollback")).rejects.toThrow();
    expect(await db.sacerdote.count()).toBe(2);
    await expect(repo.vincular(other, actor, suplente)).rejects.toThrow();
    expect(await db.asignacionSacerdote.count()).toBe(3);
    await expect(
      repo.renombrar(own, actor, { id: suplente, version: 1 }, "Rollback"),
    ).rejects.toThrow();
    expect(
      (await db.sacerdote.findUniqueOrThrow({ where: { id: suplente } }))
        .version,
    ).toBe(1);
    await expect(repo.guardar(own, actor, horario)).rejects.toThrow();
    expect(await db.ocurrenciaMisa.count()).toBe(0);
    const h = (await alta()).body;
    await expect(
      repo.guardar(
        own,
        actor,
        { ...horario, horaLocal: "08:00" },
        { id: h.id, version: 1 },
      ),
    ).rejects.toThrow();
    expect((await lista())[0].horaLocal).toBe("10:00");
    await expect(
      repo.celebrar(own, actor, {
        ocurrenciaId: (await lista())[0].id,
        oficianteId: padre,
        fechaLocal: "2026-10-05",
        horaLocal: "10:00",
      }),
    ).rejects.toThrow();
    expect(await db.celebracionMisa.count()).toBe(0);
  });
  it("solo administrador propio; anónimo, tesorero y Coordinación rechazados sin ampliar permisos", async () => {
    const svc = new ServicioAgenda(new PrismaRepositorioAgenda(db));
    expect(() => svc.autorizar(own)).toThrow("Inicie sesión");
    for (const u of ["otro", "tesorero", "coord"])
      for (const [method, path, body] of [
        ["post", "/horarios", horario],
        ["post", "/sacerdotes", { nombre: "Ajeno" }],
        ["post", "/celebraciones", {}],
        ["post", "/asignaciones", { sacerdoteId: padre }],
        ["get", "/horarios", {}],
        ["get", "/sacerdotes", {}],
        ["get", "/celebraciones", {}],
      ] as const) {
        const req =
          method === "post"
            ? request(app)
                .post(ruta() + path)
                .send(body)
            : request(app).get(ruta() + path);
        expect(
          (await req.auth(await token(u), { type: "bearer" })).status,
        ).toBe(403);
      }
    expect(
      (
        await request(app)
          .post(ruta() + "/horarios")
          .send(horario)
      ).status,
    ).toBe(401);
    expect((await request(app).get(web())).status).toBe(401);
    expect(await db.cambioAgenda.count()).toBe(0);
  });
  it("recursos de otra iglesia no se pueden editar bajo el ámbito propio", async () => {
    const h = (await alta()).body;
    expect((await editar(h.id, {}, other, "otro")).status).toBe(404);
    expect((await editar(randomUUID(), {})).status).toBe(404);
    expect(
      (
        await request(app)
          .patch(ruta(other) + "/sacerdotes/" + suplente)
          .auth(await token("otro"), { type: "bearer" })
          .send({ nombre: "Ajeno", version: 1 })
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .post(ruta() + "/asignaciones")
          .auth(await token(), { type: "bearer" })
          .send({ sacerdoteId: randomUUID() })
      ).status,
    ).toBe(404);
    const o = (await lista())[0];
    expect(
      (
        await request(app)
          .post(ruta(other) + "/celebraciones")
          .auth(await token("otro"), { type: "bearer" })
          .send({
            ocurrenciaId: o.id,
            oficianteId: padre,
            fechaLocal: o.fechaLocal,
            horaLocal: o.horaLocal,
          })
      ).status,
    ).toBe(404);
  });
  it("iglesia cerrada no publica ni admite agenda y sin zona no programa", async () => {
    await db.iglesia.update({ where: { id: own }, data: { zonaIana: null } });
    expect((await alta()).body.code).toBe("ZONA_REQUERIDA");
    await db.iglesia.update({
      where: { id: own },
      data: { cerradaDesde: new Date() },
    });
    expect(
      (await request(app).get(publico() + "?desde=2026-10-05")).status,
    ).toBe(404);
    expect((await alta()).status).toBe(404);
    expect(
      (
        await request(app)
          .get(ruta() + "/horarios")
          .auth(await token(), { type: "bearer" })
      ).status,
    ).toBe(404);
    expect(
      (await request(app).get(publico(randomUUID()) + "?desde=2026-10-05"))
        .status,
    ).toBe(404);
  });
  it("protege zona de iglesia con agenda; cambios de otros datos siguen funcionando", async () => {
    await alta();
    const url = `/api/v1/iglesias/${own}`;
    expect(
      (
        await request(app)
          .patch(url)
          .auth(await token(), { type: "bearer" })
          .send({ version: 1, zonaIana: "America/Cancun" })
      ).status,
    ).toBe(409);
    expect(
      (
        await request(app)
          .patch(url)
          .auth(await token(), { type: "bearer" })
          .send({
            version: 1,
            zonaIana: "America/Mexico_City",
            nombre: "Nuevo nombre",
          })
      ).status,
    ).toBe(200);
  });
  it("validación Zod estricta: fechas, idioma, tipos, duración, vigencia y ámbito", async () => {
    for (const body of [
      { diaSemana: 0 },
      { diaSemana: 8 },
      { horaLocal: "24:00" },
      { horaLocal: "9:00" },
      { idioma: " " },
      { tipo: "PASTOR" },
      { duracionMinutos: 0 },
      { duracionMinutos: "60" },
      { activo: "true" },
      { desde: "2026-02-30" },
      { desde: "2026-10-27" },
      { hasta: "2028-01-01" },
      { hasta: "2026-10-05", diaSemana: 2 },
      { horaLocal: "23:30", duracionMinutos: 90 },
      { iglesiaId: other },
      { version: 1 },
      { sacerdoteId: randomUUID() },
    ])
      expect([422, 404], JSON.stringify(body)).toContain(
        (await alta(body)).status,
      );
    expect((await request(app).get(publico() + "?desde=no")).status).toBe(422);
    expect(
      (await request(app).get(publico() + "?desde=2026-10-05&otro=1")).status,
    ).toBe(422);
    expect((await editar((await alta()).body.id, { version: 0 })).status).toBe(
      422,
    );
  });
  it("CSRF/Origin en escrituras web y API con cookie; formularios útiles y navegación", async () => {
    const { cookie, csrf } = await sesion();
    const panel = await request(app).get("/personal").set("Cookie", cookie);
    expect(panel.text).toContain("Gestionar sacerdotes y misas");
    for (const [origin, tokenCSRF] of [
      [config.origin, ""],
      ["https://ajeno.test", csrf],
      [config.origin, "invalido"],
    ])
      expect(
        (
          await request(app)
            .post(web() + "/sacerdotes")
            .set("Cookie", cookie)
            .set("Origin", origin)
            .type("form")
            .send({ _csrf: tokenCSRF, nombre: "Bloqueado" })
        ).status,
      ).toBe(403);
    expect(
      (
        await request(app)
          .post(ruta() + "/sacerdotes")
          .set("Cookie", cookie)
          .set("Origin", config.origin)
          .send({ nombre: "Sin csrf" })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post(web() + "/sacerdotes")
          .set("Cookie", cookie)
          .set("Origin", config.origin)
          .type("form")
          .send({ _csrf: csrf, nombre: "Web" })
      ).status,
    ).toBe(303);
    expect(
      (await request(app).get(web()).set("Cookie", cookie)).text,
    ).toContain("Registrar horario");
  });
  it("escape EJS y errores conservan campos y versión; edición y celebración web reales", async () => {
    const { cookie, csrf } = await sesion();
    const form = {
      ...horario,
      duracionMinutos: "",
      activo: "true",
      _csrf: csrf,
      idioma: '<script>alert("x")</script>',
    };
    const post = (action: string, body: object) =>
      request(app)
        .post(web() + "/" + action + "?desde=2026-10-05")
        .set("Cookie", cookie)
        .set("Origin", config.origin)
        .type("form")
        .send(body);
    expect((await post("horarios", form)).status).toBe(303);
    const h = await db.horarioMisa.findFirstOrThrow();
    const page = await request(app)
      .get(web() + "?desde=2026-10-05")
      .set("Cookie", cookie);
    expect(page.text).toContain("&lt;script&gt;");
    expect(page.text).not.toContain('<script>alert("x")');
    expect(
      (
        await post("horarios", {
          ...form,
          horarioId: h.id,
          version: 1,
          horaLocal: "09:00",
        })
      ).status,
    ).toBe(303);
    const stale = await post("horarios", {
      ...form,
      horarioId: h.id,
      version: 1,
      idioma: "Texto conservado",
    });
    expect(stale.status).toBe(409);
    expect(stale.text).toContain("Texto conservado");
    expect(stale.text).toContain('name="version" value="1"');
    const invalid = await post("horarios", { ...form, diaSemana: 0 });
    expect(invalid.status).toBe(422);
    expect(invalid.text).toContain("diaSemana");
    const p = await post("nombre", {
      _csrf: csrf,
      sacerdoteId: suplente,
      nombre: "Nuevo suplente",
      version: 1,
    });
    expect(p.status).toBe(303);
    expect(
      (await post("asignaciones", { _csrf: csrf, sacerdoteId: padre })).status,
    ).toBe(409);
    expect(
      (
        await post("celebraciones", {
          _csrf: csrf,
          ocurrenciaId: (await lista())[0].id,
          oficianteId: suplente,
          fechaLocal: "2026-10-05",
          horaLocal: "09:00",
          motivo: "Suplencia web",
        })
      ).status,
    ).toBe(303);
    expect((await post("desconocido", { _csrf: csrf })).status).toBe(404);
  });
  it("actualiza esquema previo sin perder datos ni servicios ni criterios patrimoniales", async () => {
    const pg = new Client({ connectionString: process.env.DATABASE_URL });
    await pg.connect();
    try {
      await pg.query("BEGIN");
      const schema = "agenda_" + randomUUID().replaceAll("-", "");
      await pg.query(`CREATE SCHEMA "${schema}"`);
      await pg.query(`SET LOCAL search_path TO "${schema}"`);
      for (const f of readdirSync("prisma/migrations")
        .filter((x) => x.startsWith("2026") && x < "202611030001_agenda")
        .sort())
        await pg.query(
          readFileSync(`prisma/migrations/${f}/migration.sql`, "utf8"),
        );
      await pg.query(
        `INSERT INTO "Localidad" VALUES ('211140001','21','114','0001','Prueba','Prueba','Prueba')`,
      );
      await pg.query(`INSERT INTO "TipoIglesia" VALUES ($1,'Prueba')`, [own]);
      await pg.query(
        `INSERT INTO "Iglesia" (id,nombre,"nombreBusqueda","tipoId","estadoClave","municipioClave","localidadClave",direccion,version) VALUES ($1,'Previa','previa',$1,'21','114','0001','Prueba',8)`,
        [own],
      );
      await pg.query(
        `INSERT INTO "Usuario" (id,identificador,"passwordHash",rol,"iglesiaId") VALUES ($1,'previo',$2,'ADMIN_IGLESIA',$1)`,
        [own, hash],
      );
      const antes = (
        await pg.query(`SELECT parametros FROM "CriterioPatrimonio"`)
      ).rows;
      await pg.query(
        readFileSync(
          "prisma/migrations/202611030001_agenda/migration.sql",
          "utf8",
        ),
      );
      expect(
        (await pg.query(`SELECT version FROM "Iglesia"`)).rows[0].version,
      ).toBe(8);
      expect(
        (await pg.query(`SELECT "iglesiaId" FROM "Usuario"`)).rows[0].iglesiaId,
      ).toBe(own);
      expect(
        (await pg.query(`SELECT parametros FROM "CriterioPatrimonio"`)).rows,
      ).toEqual(antes);
      expect(
        (await pg.query(`SELECT count(*)::int AS n FROM "TipoServicio"`))
          .rows[0].n,
      ).toBe(7);
      expect(
        (await pg.query(`SELECT count(*)::int AS n FROM "HorarioMisa"`)).rows[0]
          .n,
      ).toBe(0);
    } finally {
      await pg.query("ROLLBACK");
      await pg.end();
    }
  });
  it("CHECK y FK impiden horarios inválidos, sustitución sin motivo y borrado de historia", async () => {
    for (const c of [
      { diaSemana: 0 },
      { horaLocal: "25:00" },
      { duracionMinutos: 0 },
      { desde: "2026-02-30" },
      { version: 0 },
    ])
      await expect(
        db.horarioMisa.create({
          data: {
            ...horario,
            iglesiaId: own,
            zonaIana: "America/Mexico_City",
            ...c,
          },
        }),
      ).rejects.toThrow();
    await alta();
    const c = (await celebrar()).body;
    await expect(
      db.celebracionMisa.update({
        where: { id: c.id },
        data: { oficianteId: suplente, motivo: null },
      }),
    ).rejects.toThrow();
    await expect(
      db.ocurrenciaMisa.delete({ where: { id: c.ocurrenciaId } }),
    ).rejects.toThrow();
    await expect(
      db.sacerdote.delete({ where: { id: padre } }),
    ).rejects.toThrow();
  });
});
describe("Hora local estricta", () => {
  it("rechaza zonas inválidas, huecos y horas ambiguas DST", () => {
    expect(() => instante("2026-10-05", "10:00", "No/Existe")).toThrow("IANA");
    expect(() => instante("2026-03-08", "02:30", "America/Tijuana")).toThrow(
      "ambigua",
    );
    expect(() => instante("2026-11-01", "01:30", "America/Tijuana")).toThrow(
      "ambigua",
    );
    expect(
      instante("2026-11-01", "03:00", "America/Tijuana").toISOString(),
    ).toBe("2026-11-01T11:00:00.000Z");
  });
  it("vigencias acotadas y medianoche requieren decisión explícita; contiguos sin traslape", () => {
    expect(() =>
      ocurrencias({ ...horario, horaLocal: "23:30" }, "America/Mexico_City"),
    ).toThrow("medianoche");
    expect(
      traslapa(
        { inicio: new Date(0), fin: new Date(60) },
        { inicio: new Date(60), fin: new Date(90) },
      ),
    ).toBe(false);
  });
});
