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
  centavos,
  decimal,
  resumen,
  type FilaMisa,
} from "../src/modules/diezmos/domain/diezmo.js";
import { ServicioDiezmos } from "../src/modules/diezmos/application/servicio.js";
import { PrismaRepositorioDiezmos } from "../src/modules/diezmos/infrastructure/prisma-repositorio.js";
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
const adminId = randomUUID(),
  tesoreroId = randomUUID();
const password = "Diezmos ficticios para pruebas!";
const q = {
  desde: "2026-10-01",
  hasta: "2026-10-31",
  periodo: "DIA",
  desglose: "NINGUNO",
};
const api = JSON.parse(readFileSync("openapi.yaml", "utf8"));
const ajv = new Ajv2020({ strict: false, validateFormats: false });
ajv.addSchema({ $id: "diezmos", components: api.components });
function contrato(name: string, valor: unknown) {
  expect(
    ajv.validate({ $ref: `diezmos#/components/schemas/${name}` }, valor),
    JSON.stringify(ajv.errors),
  ).toBe(true);
}
let inicial: Iglesia[],
  hash: string,
  app: ReturnType<typeof createApp>,
  tokens: Record<string, string>,
  cid: string;
const ruta = (c = cid, i = own) =>
  `/api/v1/iglesias/${i}/celebraciones/${c}/diezmo`;
const reportPath = (i = own) => `/api/v1/iglesias/${i}/reportes/diezmos`;
const web = (i = own) => `/personal/diezmos/${i}`;
async function limpiar() {
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
async function hecho(
  fechaLocal = "2026-10-05",
  horaLocal = "10:00",
  iglesiaId = own,
  oficianteId = padre,
  horarioId?: string,
) {
  const zonaIana = "America/Mexico_City";
  if (!horarioId)
    horarioId = (
      await db.horarioMisa.create({
        data: {
          iglesiaId,
          sacerdoteId: padre,
          diaSemana:
            ((new Date(fechaLocal + "T12:00:00Z").getUTCDay() + 6) % 7) + 1,
          horaLocal,
          tipo: "DIARIA",
          idioma: "Español",
          desde: fechaLocal,
          hasta: fechaLocal,
          zonaIana,
        },
      })
    ).id;
  const inicio = new Date(fechaLocal + "T" + horaLocal + ":00-06:00"),
    fin = new Date(inicio.getTime() + 3600000);
  const o = await db.ocurrenciaMisa.create({
    data: {
      horarioId,
      iglesiaId,
      sacerdoteId: padre,
      fechaLocal,
      horaLocal,
      zonaIana,
      inicio,
      fin,
    },
  });
  return db.celebracionMisa.create({
    data: {
      ocurrenciaId: o.id,
      iglesiaId,
      previstoId: padre,
      oficianteId,
      fechaLocal,
      horaLocal,
      zonaIana,
      inicio,
      fin,
      actorId: adminId,
      motivo: oficianteId !== padre ? "Sustitución de prueba" : null,
    },
  });
}
beforeAll(async () => {
  inicial = await db.iglesia.findMany();
  hash = await bcrypt.hash(password, 12);
});
beforeEach(async () => {
  await limpiar();
  await db.iglesia.createMany({
    data: [own, other].map((id) => ({
      ...inicial[0],
      id,
      nombre: "Iglesia " + id,
      zonaIana: "America/Mexico_City",
      version: 1,
      cerradaDesde: null,
    })),
  });
  await db.sacerdote.createMany({
    data: [
      { id: padre, nombre: "Padre previsto" },
      { id: suplente, nombre: "Padre real" },
    ],
  });
  await db.asignacionSacerdote.createMany({
    data: [own, other].flatMap((iglesiaId) =>
      [padre, suplente].map((sacerdoteId) => ({ iglesiaId, sacerdoteId })),
    ),
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
        id: tesoreroId,
        identificador: "tesorero",
        rol: "TESORERO" as const,
        iglesiaId: own,
      },
      {
        id: randomUUID(),
        identificador: "otro",
        rol: "TESORERO" as const,
        iglesiaId: other,
      },
      {
        id: randomUUID(),
        identificador: "coord",
        rol: "COORDINACION" as const,
        iglesiaId: null,
      },
    ].map((u) => ({ ...u, passwordHash: hash })),
  });
  cid = (await hecho()).id;
  app = createApp(db, config, 2026);
  tokens = {};
});
afterAll(async () => {
  await limpiar();
  await db.iglesia.createMany({ data: inicial });
  await db.$disconnect();
});
async function token(u = "tesorero") {
  if (!tokens[u]) {
    const r = await request(app)
      .post("/api/v1/auth/login")
      .send({ identificador: u, password });
    expect(r.status).toBe(200);
    tokens[u] = r.body.accessToken;
  }
  return tokens[u];
}
async function alta(importe = "10.01", c = cid, u = "tesorero", i = own) {
  return request(app)
    .post(ruta(c, i))
    .auth(await token(u), { type: "bearer" })
    .send({ importe });
}
async function corregir(importe = "20.02", version = 1, c = cid) {
  return request(app)
    .put(ruta(c))
    .auth(await token(), { type: "bearer" })
    .send({ importe, version });
}
async function informe(cambio: object = {}, u = "tesorero", i = own) {
  return request(app)
    .get(reportPath(i))
    .auth(await token(u), { type: "bearer" })
    .query({ ...q, ...cambio });
}
async function sesion(u = "tesorero") {
  const r = await request(app)
    .post("/personal/login")
    .set("Origin", config.origin)
    .type("form")
    .send({ identificador: u, password });
  expect(r.status).toBe(303);
  const cookie = (r.headers["set-cookie"] as unknown as string[])
    .map((v) => v.split(";")[0])
    .join("; ");
  const p = await request(app).get("/personal").set("Cookie", cookie);
  return { cookie, csrf: p.text.match(/name="_csrf" value="([^"]+)"/)![1] };
}
describe("RF22–24 diezmos PostgreSQL real", () => {
  it("centavos exactos: 0.10 + 0.20 y sumas mayores al entero seguro sin float", () => {
    expect(centavos("0.10") + centavos("0.20")).toBe(30n);
    expect(decimal(99999999999n)).toBe("999999999.99");
    expect(() => centavos("1e2")).toThrow("dos decimales");
    expect(() => centavos("1.00\n")).toThrow("dos decimales");
    const filas = Array.from({ length: 100000 }, (_, i) => ({
      celebracionId: String(i),
      diezmo: { importeCentavos: "99999999999" },
    })) as FilaMisa[];
    const s = resumen(filas);
    expect(s.totalCentavos).toBe("9999999999900000");
    expect(s.total).toBe("99999999999000.00");
    expect(s.promedio).toEqual({
      numeradorCentavos: "9999999999900000",
      divisorMisas: 100000,
    });
  });
  it("registra una sola captura por celebración con actor e instante de sesión", async () => {
    const r = await alta();
    expect(r.status).toBe(201);
    contrato("DiezmoCaptura", r.body);
    expect(r.body).toMatchObject({
      importe: "10.01",
      importeCentavos: "1001",
      moneda: "MXN",
      version: 1,
      celebracionId: cid,
      iglesiaId: own,
    });
    const hist = await request(app)
      .get(ruta() + "/correcciones")
      .auth(await token(), { type: "bearer" });
    contrato("DiezmoHistorial", hist.body);
    expect(hist.body.data[0]).toMatchObject({
      actorId: tesoreroId,
      anteriorCentavos: null,
      nuevoCentavos: "1001",
      version: 1,
    });
    expect(Date.parse(hist.body.data[0].instante)).toBeLessThanOrEqual(
      Date.now(),
    );
    expect((await alta()).status).toBe(409);
    expect(await db.correccionDiezmo.count()).toBe(1);
    expect(
      (
        await request(app)
          .get(ruta())
          .auth(await token(), { type: "bearer" })
      ).body,
    ).toEqual(r.body);
  });
  it("integra el hecho de agenda HTTP con diezmo sin usar el horario como celebración", async () => {
    const t = await token("admin");
    const base = `/api/v1/iglesias/${own}/agenda`;
    const h = await request(app)
      .post(base + "/horarios")
      .auth(t, { type: "bearer" })
      .send({
        sacerdoteId: padre,
        diaSemana: 2,
        horaLocal: "12:00",
        tipo: "DIARIA",
        idioma: "Español",
        desde: "2026-10-06",
        hasta: "2026-10-06",
      });
    expect(h.status).toBe(201);
    expect((await alta("10.00", h.body.id)).status).toBe(404);
    const o = await db.ocurrenciaMisa.findFirstOrThrow({
      where: { horarioId: h.body.id },
    });
    expect((await alta("10.00", o.id)).status).toBe(404);
    const c = await request(app)
      .post(base + "/celebraciones")
      .auth(t, { type: "bearer" })
      .send({
        ocurrenciaId: o.id,
        oficianteId: suplente,
        fechaLocal: "2026-10-06",
        horaLocal: "12:00",
        motivo: "Suplencia",
      });
    expect(c.status).toBe(201);
    expect((await alta("10.00", c.body.id)).status).toBe(201);
    expect(
      (await informe({ sacerdoteId: suplente })).body.resumen.totalCentavos,
    ).toBe("1000");
  });
  it("corrección conserva cadena anterior/nueva, versión y total vigente sin doble conteo", async () => {
    await alta();
    const r = await corregir();
    expect(r.status).toBe(200);
    contrato("DiezmoCaptura", r.body);
    expect((await corregir("30.03", 2)).status).toBe(200);
    const hist = (
      await request(app)
        .get(ruta() + "/correcciones")
        .auth(await token(), { type: "bearer" })
    ).body.data;
    expect(
      hist.map(
        (c: {
          anteriorCentavos: string | null;
          nuevoCentavos: string;
          version: number;
        }) => [c.anteriorCentavos, c.nuevoCentavos, c.version],
      ),
    ).toEqual([
      [null, "1001", 1],
      ["1001", "2002", 2],
      ["2002", "3003", 3],
    ]);
    const r2 = await informe();
    contrato("DiezmoReporte", r2.body);
    expect(r2.body.resumen.totalCentavos).toBe("3003");
  });
  it("concurrencia de alta obtiene 201/409 y una sola auditoría", async () => {
    await token();
    const rs = await Promise.all([alta("10.01"), alta("20.02")]);
    expect(rs.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await db.diezmo.count()).toBe(1);
    expect(await db.correccionDiezmo.count()).toBe(1);
  });
  it("dos correcciones simultáneas obtienen 200/409 sin perder anterior ni versión", async () => {
    await alta();
    const rs = await Promise.all([corregir("20.02"), corregir("30.03")]);
    expect(rs.map((r) => r.status).sort()).toEqual([200, 409]);
    const ganador = rs.find((r) => r.status === 200)!.body;
    expect((await informe()).body.resumen.totalCentavos).toBe(
      ganador.importeCentavos,
    );
    expect(
      (await db.correccionDiezmo.findMany({ orderBy: { version: "asc" } })).map(
        (c) => [c.anteriorCentavos, c.nuevoCentavos, c.version],
      ),
    ).toEqual([
      [null, 1001n, 1],
      [1001n, BigInt(ganador.importeCentavos), 2],
    ]);
    expect((await corregir("99.99")).status).toBe(409);
  });
  it("fallo de auditoría revierte alta, importe y versión en PostgreSQL", async () => {
    await token();
    await db.$executeRawUnsafe(
      `CREATE FUNCTION fallar_auditoria_diezmo() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fallo de prueba'; END $$`,
    );
    await db.$executeRawUnsafe(
      `CREATE TRIGGER fallo_diezmo BEFORE INSERT ON "CorreccionDiezmo" FOR EACH ROW EXECUTE FUNCTION fallar_auditoria_diezmo()`,
    );
    try {
      expect((await alta()).status).toBe(500);
      expect(await db.diezmo.count()).toBe(0);
      await db.$executeRawUnsafe(
        `ALTER TABLE "CorreccionDiezmo" DISABLE TRIGGER fallo_diezmo`,
      );
      expect((await alta()).status).toBe(201);
      await db.$executeRawUnsafe(
        `ALTER TABLE "CorreccionDiezmo" ENABLE TRIGGER fallo_diezmo`,
      );
      expect((await corregir()).status).toBe(500);
      const d = await db.diezmo.findFirstOrThrow();
      expect([d.importeCentavos, d.version]).toEqual([1001n, 1]);
      expect(await db.correccionDiezmo.count()).toBe(1);
    } finally {
      await db.$executeRawUnsafe(
        `DROP TRIGGER fallo_diezmo ON "CorreccionDiezmo"`,
      );
      await db.$executeRawUnsafe(`DROP FUNCTION fallar_auditoria_diezmo()`);
    }
  });
  it("401/403 en cada ruta: tesorero propio escribe, personal propio reporta, Coordinación denegada", async () => {
    const svc = new ServicioDiezmos(new PrismaRepositorioDiezmos(db));
    expect(() => svc.autorizar(own)).toThrow("Inicie sesión");
    for (const u of [null, "admin", "otro", "coord"])
      for (const method of ["get", "post", "put", "historial"] as const) {
        const path = ruta() + (method === "historial" ? "/correcciones" : "");
        const req =
          method === "post"
            ? request(app).post(path).send({ importe: "1.00" })
            : method === "put"
              ? request(app).put(path).send({ importe: "2.00", version: 1 })
              : request(app).get(path);
        expect(
          (await (u ? req.auth(await token(u), { type: "bearer" }) : req))
            .status,
        ).toBe(u ? 403 : 401);
      }
    for (const u of ["tesorero", "admin"])
      expect((await informe({}, u)).status).toBe(200);
    for (const u of ["otro", "coord"])
      expect((await informe({}, u)).status).toBe(403);
    expect((await request(app).get(reportPath()).query(q)).status).toBe(401);
  });
  it("ámbito: UUID ajeno no permite captura, consulta, historial ni filtros cruzados", async () => {
    const ajena = await hecho("2026-10-05", "12:00", other);
    expect((await alta("1.00", ajena.id)).status).toBe(404);
    expect((await alta("1.00", ajena.id, "otro", other)).status).toBe(201);
    for (const extra of ["", "/correcciones"])
      expect(
        (
          await request(app)
            .get(ruta(ajena.id) + extra)
            .auth(await token(), { type: "bearer" })
        ).status,
      ).toBe(404);
    expect(
      (
        await informe({
          horarioId: (
            await db.ocurrenciaMisa.findUniqueOrThrow({
              where: { id: ajena.ocurrenciaId },
            })
          ).horarioId,
        })
      ).body.resumen.celebradas,
    ).toBe(0);
    expect(
      (await informe()).body.misas.map(
        (f: { celebracionId: string }) => f.celebracionId,
      ),
    ).toEqual([cid]);
    expect((await informe({}, "tesorero", other)).status).toBe(403);
    expect(
      (
        await request(app)
          .put(ruta(ajena.id))
          .auth(await token(), { type: "bearer" })
          .send({ importe: "5.00", version: 1 })
      ).status,
    ).toBe(404);
  });
  it("ingreso inválido rechaza floats, exponentes, signos, exceso, moneda e identidad suministrada", async () => {
    await token();
    for (const importe of [
      0.1,
      -1,
      "-1.00",
      "1",
      "1.0",
      "01.00",
      "1,00",
      " 1.00",
      "1e2",
      "+1.00",
      "1.001",
      "1.00\n",
      "1.00\r",
      "1000000000.00",
      null,
    ]) {
      const r = await request(app)
        .post(ruta())
        .auth(tokens.tesorero, { type: "bearer" })
        .send({ importe });
      expect(r.status, JSON.stringify(importe)).toBe(422);
    }
    for (const campo of [
      "iglesiaId",
      "actorId",
      "instante",
      "moneda",
      "version",
      "celebracionId",
    ])
      expect(
        (
          await request(app)
            .post(ruta())
            .auth(tokens.tesorero, { type: "bearer" })
            .send({ importe: "1.00", [campo]: own })
        ).status,
      ).toBe(422);
    expect(await db.diezmo.count()).toBe(0);
    await alta();
    for (const version of [undefined, 0, -1, 1.5, "1", 2147483647])
      expect(
        (
          await request(app)
            .put(ruta())
            .auth(tokens.tesorero, { type: "bearer" })
            .send({ importe: "1.00", version })
        ).status,
      ).toBe(422);
    expect(
      (
        await request(app)
          .get(ruta("no-uuid"))
          .auth(tokens.tesorero, { type: "bearer" })
      ).status,
    ).toBe(422);
  });
  it("cero registrado, ausentes y empates se distinguen del promedio exacto", async () => {
    const c2 = (await hecho("2026-10-06")).id,
      c3 = (await hecho("2026-10-07")).id,
      c4 = (await hecho("2026-10-08")).id;
    await alta("0.00");
    await alta("0.01", c2);
    await alta("0.01", c3);
    const r = await informe();
    expect(r.status).toBe(200);
    contrato("DiezmoReporte", r.body);
    expect(r.body.resumen).toMatchObject({
      celebradas: 4,
      registradas: 3,
      pendientes: 1,
      totalCentavos: "2",
      total: "0.02",
      promedio: { numeradorCentavos: "2", divisorMisas: 3 },
    });
    expect(r.body.resumen.maximo.celebraciones.sort()).toEqual([c2, c3].sort());
    expect(r.body.resumen.minimo.celebraciones).toEqual([cid]);
    expect(
      r.body.misas.find(
        (f: { celebracionId: string }) => f.celebracionId === c4,
      ).diezmo,
    ).toBeNull();
    await corregir("0.01");
    const todos = (await informe()).body.resumen;
    expect(todos.maximo.celebraciones).toEqual(todos.minimo.celebraciones);
  });
  it("sin capturas y periodo vacío devuelven promedio/extremos ausentes, sin inventar ceros", async () => {
    const r = await informe();
    expect(r.body.resumen).toMatchObject({
      celebradas: 1,
      registradas: 0,
      pendientes: 1,
      totalCentavos: "0",
      promedio: null,
      maximo: { importeCentavos: null, celebraciones: [] },
      minimo: { importeCentavos: null, celebraciones: [] },
    });
    const vacio = await informe({ desde: "2026-09-01", hasta: "2026-09-30" });
    expect(vacio.body.resumen.celebradas).toBe(0);
    expect(vacio.body.grupos).toEqual([]);
  });
  it("día/semana/mes usan fecha local, lunes y límites inclusivos aun con instantes en otro día UTC", async () => {
    const domingo = (await hecho("2026-10-04", "23:30")).id,
      lunes = (await hecho("2026-09-28")).id,
      fin = (await hecho("2026-10-31", "23:30")).id,
      fuera = (await hecho("2026-11-01")).id;
    for (const c of [cid, domingo, lunes, fin, fuera]) await alta("1.01", c);
    const semanal = await informe({ periodo: "SEMANA" });
    expect(semanal.body.resumen.totalCentavos).toBe("303");
    expect(
      semanal.body.grupos.map((g: { periodo: string }) => g.periodo),
    ).toEqual(["2026-09-28", "2026-10-05", "2026-10-26"]);
    expect((await informe({ periodo: "MES" })).body.grupos[0]).toMatchObject({
      periodo: "2026-10",
      totalCentavos: "303",
    });
    const diario = await informe({ desde: "2026-10-31", hasta: "2026-10-31" });
    expect(
      diario.body.misas.map((f: { celebracionId: string }) => f.celebracionId),
    ).toEqual([fin]);
    expect(
      (await informe({ desde: "2026-10-04", hasta: "2026-10-04" })).body.resumen
        .totalCentavos,
    ).toBe("101");
  });
  it("horario y sacerdote real: agrupación combinada y filtros no usan padre previsto", async () => {
    const original = await db.celebracionMisa.findUniqueOrThrow({
      where: { id: cid },
      include: { ocurrencia: true },
    });
    const c2 = await hecho(
      "2026-10-12",
      "10:00",
      own,
      suplente,
      original.ocurrencia.horarioId,
    );
    const c3 = await hecho("2026-10-12", "12:00", own, suplente);
    await alta("0.10");
    await alta("0.20", c2.id);
    await alta("0.30", c3.id);
    expect(
      (await informe({ periodo: "MES", desglose: "HORARIO" })).body.grupos
        .map((g: { totalCentavos: string }) => g.totalCentavos)
        .sort(),
    ).toEqual(["30", "30"]);
    const real = await informe({ periodo: "MES", desglose: "SACERDOTE" });
    expect(
      real.body.grupos.find(
        (g: { sacerdoteId: string }) => g.sacerdoteId === suplente,
      ).totalCentavos,
    ).toBe("50");
    expect(
      (await informe({ periodo: "MES", desglose: "HORARIO_SACERDOTE" })).body
        .grupos,
    ).toHaveLength(3);
    expect(
      (
        await informe({
          horarioId: original.ocurrencia.horarioId,
          sacerdoteId: suplente,
        })
      ).body.resumen.totalCentavos,
    ).toBe("20");
  });
  it("límite de 10000 misas rechaza totales parciales y permite reducir con filtros", async () => {
    await db.$executeRaw`
      WITH h AS (
        INSERT INTO "HorarioMisa" (id,"iglesiaId","sacerdoteId","diaSemana","horaLocal",tipo,idioma,desde,hasta,"zonaIana")
        SELECT gen_random_uuid(),${own}::uuid,${padre}::uuid,1,'10:00','DIARIA','Prueba','2026-10-05','2026-10-05','America/Mexico_City' FROM generate_series(1,10000) RETURNING id
      ), o AS (
        INSERT INTO "OcurrenciaMisa" (id,"horarioId","iglesiaId","sacerdoteId","fechaLocal","horaLocal","zonaIana",inicio,fin)
        SELECT gen_random_uuid(),id,${own}::uuid,${padre}::uuid,'2026-10-05','10:00','America/Mexico_City','2026-10-05T16:00:00Z','2026-10-05T17:00:00Z' FROM h RETURNING id
      ) INSERT INTO "CelebracionMisa" (id,"ocurrenciaId","iglesiaId","previstoId","oficianteId","fechaLocal","horaLocal","zonaIana",inicio,fin,"actorId")
        SELECT gen_random_uuid(),id,${own}::uuid,${padre}::uuid,${padre}::uuid,'2026-10-05','10:00','America/Mexico_City','2026-10-05T16:00:00Z','2026-10-05T17:00:00Z',${adminId}::uuid FROM o
    `;
    const r = await informe();
    expect(r.status).toBe(422);
    expect(r.body.code).toBe("PERIODO_EXTENSO");
    expect(r.body.resumen).toBeUndefined();
    const horario = (
      await db.celebracionMisa.findUniqueOrThrow({
        where: { id: cid },
        include: { ocurrencia: true },
      })
    ).ocurrencia.horarioId;
    expect(
      (await informe({ horarioId: horario })).body.resumen.celebradas,
    ).toBe(1);
  });
  it("periodos y filtros inválidos no aceptan rangos ilimitados ni parámetros de ámbito", async () => {
    for (const cambio of [
      { desde: "2026-02-30" },
      { desde: "1899-12-31" },
      { hasta: "2026-09-01" },
      { desde: "2025-01-01" },
      { periodo: "ANIO" },
      { desglose: "TODOS" },
      { sacerdoteId: "x" },
      { iglesiaId: other },
      { page: "1" },
    ])
      expect((await informe(cambio)).status).toBe(422);
    expect(
      (
        await request(app)
          .get(reportPath())
          .auth(await token(), { type: "bearer" })
      ).status,
    ).toBe(422);
  });
  it("iglesia cerrada y misa no finalizada quedan bloqueadas sin alterar agenda", async () => {
    await db.celebracionMisa.update({
      where: { id: cid },
      data: { fin: new Date(Date.now() + 3600000) },
    });
    expect((await alta()).status).toBe(422);
    await db.iglesia.update({
      where: { id: own },
      data: { cerradaDesde: new Date() },
    });
    expect((await alta()).status).toBe(404);
    expect((await informe()).status).toBe(404);
    const repo = new PrismaRepositorioDiezmos(db);
    await expect(repo.consultar(own, cid)).rejects.toThrow("no disponible");
  });
  it("CHECK/FK protegen centavos, ámbito, identidad, unicidad e historia frente a SQL inválido", async () => {
    await expect(
      db.diezmo.create({
        data: { celebracionId: cid, iglesiaId: other, importeCentavos: 1n },
      }),
    ).rejects.toThrow();
    for (const datos of [
      { importeCentavos: -1n },
      { importeCentavos: 100000000000n },
      { importeCentavos: 1n, moneda: "USD" },
      { importeCentavos: 1n, version: 0 },
    ])
      await expect(
        db.diezmo.create({
          data: { celebracionId: cid, iglesiaId: own, ...datos },
        }),
      ).rejects.toThrow();
    await alta();
    const d = await db.diezmo.findFirstOrThrow();
    await expect(
      db.diezmo.create({
        data: { celebracionId: cid, iglesiaId: own, importeCentavos: 1n },
      }),
    ).rejects.toThrow();
    for (const datos of [
      { actorId: randomUUID() },
      { iglesiaId: other },
      { anteriorCentavos: null },
      { nuevoCentavos: -1n },
    ])
      await expect(
        db.correccionDiezmo.create({
          data: {
            iglesiaId: own,
            diezmoId: d.id,
            actorId: tesoreroId,
            anteriorCentavos: 1001n,
            nuevoCentavos: 10n,
            version: 2,
            ...datos,
          },
        }),
      ).rejects.toThrow();
    await expect(
      db.celebracionMisa.delete({ where: { id: cid } }),
    ).rejects.toThrow();
    await expect(
      db.usuario.delete({ where: { id: tesoreroId } }),
    ).rejects.toThrow();
    const repo = new PrismaRepositorioDiezmos(db);
    await expect(repo.guardar(own, cid, adminId, 1n, 1)).rejects.toThrow(
      "Tesorero activo",
    );
  });
  it("CSRF/Origin en cookie: captura y corrección API/web requieren token y origen propio", async () => {
    const s = await sesion();
    for (const [origin, csrf] of [
      [config.origin, undefined],
      ["https://otro.invalid", s.csrf],
      [config.origin, "x"],
    ]) {
      const req = request(app)
        .post(web() + "/" + cid)
        .set("Cookie", s.cookie)
        .type("form");
      if (origin) req.set("Origin", origin);
      expect((await req.send({ importe: "1.00", _csrf: csrf })).status).toBe(
        403,
      );
    }
    expect(
      (
        await request(app)
          .post(web() + "/" + cid)
          .set("Cookie", s.cookie)
          .set("Origin", config.origin)
          .type("form")
          .send({ importe: "1.00", _csrf: s.csrf })
      ).status,
    ).toBe(303);
    expect(
      (
        await request(app)
          .put(ruta())
          .set("Cookie", s.cookie)
          .set("Origin", config.origin)
          .send({ importe: "2.00", version: 1 })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .put(ruta())
          .set("Cookie", s.cookie)
          .set("Origin", config.origin)
          .set("X-CSRF-Token", s.csrf)
          .send({ importe: "2.00", version: 1 })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .post(web() + "/" + cid)
          .set("Cookie", s.cookie)
          .set("Origin", config.origin)
          .type("form")
          .send({ importe: "3.00", version: "2", _csrf: s.csrf })
      ).status,
    ).toBe(303);
  });
  it("EJS usable y escape XSS; conserva importe/versión obsoletos tras 422/409", async () => {
    await db.sacerdote.update({
      where: { id: padre },
      data: { nombre: '<script>alert("x")</script>' },
    });
    const s = await sesion();
    const page = await request(app).get(web()).query(q).set("Cookie", s.cookie);
    expect(page.status).toBe(200);
    expect(page.text).toContain("&lt;script&gt;");
    expect(page.text).not.toContain("<script>alert");
    expect(page.text).toContain("Registrar diezmo");
    const post = (b: object) =>
      request(app)
        .post(web() + "/" + cid)
        .query(q)
        .set("Cookie", s.cookie)
        .set("Origin", config.origin)
        .type("form")
        .send({ ...b, _csrf: s.csrf });
    const invalido = await post({ importe: "<img src=x onerror=alert(1)>" });
    expect(invalido.status).toBe(422);
    expect(invalido.text).toContain("&lt;img");
    await alta();
    const dup = await post({ importe: "7.77" });
    expect(dup.status).toBe(409);
    expect(dup.text).toContain("7.77");
    await corregir("2.22");
    const r = await post({ importe: "9.99", version: "1" });
    expect(r.status).toBe(409);
    expect(r.text).toContain('value="9.99"');
    expect(r.text).toContain('name="version" value="1"');
    expect(r.text).toContain("2.22");
    expect(r.text).toContain("Abrir versión actual");
    const actual = await request(app)
      .get(web() + "/" + cid)
      .set("Cookie", s.cookie);
    expect(actual.text).toContain('name="version" value="2"');
    expect(actual.text).toContain(tesoreroId);
    const admin = await request(app)
      .get(web())
      .query(q)
      .auth(await token("admin"), { type: "bearer" });
    expect(admin.status).toBe(200);
    expect(admin.text).not.toContain("Registrar diezmo");
    expect(admin.text).not.toContain(tesoreroId);
    expect(
      (
        await request(app)
          .get(web() + "/" + cid)
          .auth(tokens.admin, { type: "bearer" })
      ).status,
    ).toBe(403);
  });
  it("rutas privadas y datos contables no salen en consultas públicas ni en caché", async () => {
    await alta();
    expect((await request(app).get(web())).status).toBe(401);
    const r = await informe();
    expect(r.headers["cache-control"]).toBe("no-store");
    expect(JSON.stringify(r.body)).not.toContain(tesoreroId);
    const publicas = [
      `/api/v1/iglesias/${own}`,
      `/api/v1/iglesias/${own}/misas?desde=2026-10-05`,
      `/iglesias/${own}`,
    ];
    for (const path of publicas) {
      const p = await request(app).get(path);
      expect(p.status).toBe(200);
      expect(p.text).not.toMatch(
        /importeCentavos|anteriorCentavos|nuevoCentavos|correccionesDiezmo/,
      );
    }
    expect(
      (
        await request(app)
          .get(web())
          .query(q)
          .auth(await token("coord"), { type: "bearer" })
      ).status,
    ).toBe(403);
  });
  it("actualiza esquema previo conservando celebraciones, identidad y módulos anteriores", async () => {
    const pg = new Client({ connectionString: process.env.DATABASE_URL });
    await pg.connect();
    try {
      await pg.query("BEGIN");
      const schema = "diezmos_" + randomUUID().replaceAll("-", "");
      await pg.query(`CREATE SCHEMA "${schema}"`);
      await pg.query(`SET LOCAL search_path TO "${schema}"`);
      for (const f of readdirSync("prisma/migrations")
        .filter((f) => f.startsWith("2026") && f < "202611030002_diezmos")
        .sort())
        await pg.query(
          readFileSync(`prisma/migrations/${f}/migration.sql`, "utf8"),
        );
      // Copia tablas con datos reales de fixture al esquema anterior, sin tablas financieras nuevas.
      for (const tabla of [
        "Localidad",
        "TipoIglesia",
        "Iglesia",
        "Usuario",
        "Sacerdote",
        "AsignacionSacerdote",
        "HorarioMisa",
        "OcurrenciaMisa",
        "CelebracionMisa",
      ])
        await pg.query(
          `INSERT INTO "${tabla}" SELECT (json_populate_record(NULL::"${tabla}", row_to_json(p))).* FROM public."${tabla}" p`,
        );
      const antes = (
        await pg.query(
          `SELECT id,"ocurrenciaId","oficianteId" FROM "CelebracionMisa" ORDER BY id`,
        )
      ).rows;
      await pg.query(
        readFileSync(
          "prisma/migrations/202611030002_diezmos/migration.sql",
          "utf8",
        ),
      );
      expect(
        (
          await pg.query(
            `SELECT id,"ocurrenciaId","oficianteId" FROM "CelebracionMisa" ORDER BY id`,
          )
        ).rows,
      ).toEqual(antes);
      expect(
        (await pg.query(`SELECT count(*)::int n FROM "Usuario"`)).rows[0].n,
      ).toBe(4);
      expect(
        (await pg.query(`SELECT count(*)::int n FROM "TipoServicio"`)).rows[0]
          .n,
      ).toBe(7);
      expect(
        (await pg.query(`SELECT count(*)::int n FROM "Diezmo"`)).rows[0].n,
      ).toBe(0);
      await pg.query(
        `INSERT INTO "Diezmo" (id,"iglesiaId","celebracionId","importeCentavos") VALUES ($1,$2,$3,123)`,
        [randomUUID(), own, cid],
      );
    } finally {
      await pg.query("ROLLBACK");
      await pg.end();
    }
  });
});
