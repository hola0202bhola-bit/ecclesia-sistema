import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { Client } from "pg";
import { PrismaClient, type Iglesia } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Ajv2020 } from "ajv/dist/2020.js";
import { createApp } from "../src/composition/app.js";
import {
  calcularIndice,
  criteriosCaso,
  distincion,
  anioObjeto,
  tiposObjeto,
  type Objeto,
  type DatosObjeto,
} from "../src/modules/patrimonio/domain/patrimonio.js";
import { ServicioPatrimonio } from "../src/modules/patrimonio/application/servicio.js";
import { PrismaRepositorioPatrimonio } from "../src/modules/patrimonio/infrastructure/prisma-repositorio.js";

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
  empty = randomUUID();
const password = "Patrimonio ficticio de prueba!";
const datos: DatosObjeto = {
  descripcion: "Imagen de San Miguel Arcángel",
  tipoId: tiposObjeto[0].id,
  anioExacto: 1720,
  siglo: null,
  material: "Material no especificado en el ejemplo (prueba)",
  conservacion: "Dato ficticio de prueba",
  ubicacionInterna: "Ubicación ficticia",
  catalogadoInah: true,
};
const pieza = (cambios: Partial<Objeto> = {}): Objeto => ({
  ...datos,
  id: randomUUID(),
  iglesiaId: own,
  condicion: "VIGENTE",
  version: 1,
  ...cambios,
});
const ejemplo = () => [
  pieza(),
  pieza({
    descripcion: "Retablo lateral del siglo XVIII",
    tipoId: tiposObjeto[3].id,
    anioExacto: null,
    siglo: 18,
    catalogadoInah: false,
  }),
  pieza({
    descripcion: "Par de candelabros de plata",
    tipoId: tiposObjeto[8].id,
    anioExacto: 1890,
    material: "Plata",
    catalogadoInah: false,
  }),
  pieza({
    descripcion: "Piano vertical",
    tipoId: tiposObjeto[7].id,
    anioExacto: 1950,
    catalogadoInah: false,
  }),
];

describe("P068/P071–074: cálculo puro exacto", () => {
  it("reproduce exactamente P074 en 2026: 20 + 9.1 + 4 + 2.4 = 35.5", () => {
    const objetos = ejemplo();
    const antes = structuredClone(objetos);
    const r = calcularIndice(objetos, criteriosCaso, 2026);
    expect(r.aportaciones.map((a) => a.puntos)).toEqual([
      "20.0",
      "9.1",
      "4.0",
      "2.4",
    ]);
    expect(r).toMatchObject({
      indice: "35.5",
      distincion: "Alto valor patrimonial",
      referencia: 2026,
      criterioId: "caso-v1",
    });
    expect(calcularIndice(objetos, criteriosCaso, 2026)).toEqual(r);
    expect(objetos).toEqual(antes);
    expect(anioObjeto({ anioExacto: null, siglo: 18 })).toBe(1750);
  });
  it.each([
    [0, 1],
    [49, 1],
    [50, 2],
    [99, 2],
    [100, 4],
    [199, 4],
    [200, 7],
    [299, 7],
    [300, 10],
  ])("antigüedad %i => base %i", (edad, puntos) => {
    expect(
      calcularIndice(
        [
          pieza({
            anioExacto: 2026 - edad,
            tipoId: tiposObjeto[8].id,
            catalogadoInah: false,
          }),
        ],
        criteriosCaso,
        2026,
      ).indice,
    ).toBe(`${puntos}.0`);
  });
  it.each(tiposObjeto)("factor exacto para $nombre, con y sin INAH", (tipo) => {
    for (const catalogadoInah of [false, true]) {
      const r = calcularIndice(
        [pieza({ tipoId: tipo.id, catalogadoInah })],
        criteriosCaso,
        2026,
      );
      expect(Number(r.indice)).toBe(
        tipo.factorDecimas + (catalogadoInah ? 5 : 0),
      );
    }
  });
  it.each([
    [0, null],
    [79, null],
    [80, "Valor patrimonial"],
    [199, "Valor patrimonial"],
    [200, "Alto valor patrimonial"],
    [399, "Alto valor patrimonial"],
    [400, "Patrimonio sobresaliente"],
  ])("umbral en décimas %i", (puntos, nombre) =>
    expect(distincion(Number(puntos), criteriosCaso)).toBe(nombre),
  );
  it.each(["PERDIDO", "PRESTADO", "BAJA"] as const)(
    "%s aporta cero sin borrar",
    (condicion) => {
      const objetos = ejemplo();
      objetos[0].condicion = condicion;
      const r = calcularIndice(objetos, criteriosCaso, 2026);
      expect(r.indice).toBe("15.5");
      expect(r.aportaciones).toHaveLength(4);
      expect(r.aportaciones[0].puntos).toBe("0.0");
    },
  );
  it("admite criterios como entrada pura; un factor de prueba no altera la base", () => {
    const criterios = structuredClone(criteriosCaso);
    criterios.factoresDecimas[tiposObjeto[0].id] = 20;
    expect(calcularIndice([pieza()], criterios, 2026).indice).toBe("25.0");
    expect(calcularIndice([pieza()], criteriosCaso, 2026).indice).toBe("20.0");
    expect(calcularIndice([], criteriosCaso, 2026).indice).toBe("0.0");
  });
  it.each([
    { anioExacto: null, siglo: null },
    { anioExacto: 1720, siglo: 18 },
    { anioExacto: 2027, siglo: null },
    { anioExacto: 0, siglo: null },
    { tipoId: randomUUID() },
  ])("rechaza fecha/tipo fuera del perfil %o", (cambios) => {
    expect(() =>
      calcularIndice([pieza(cambios)], criteriosCaso, 2026),
    ).toThrow();
  });
});

let app: ReturnType<typeof createApp>, inicial: Iglesia[], hash: string;
beforeAll(async () => {
  inicial = await db.iglesia.findMany();
  hash = await bcrypt.hash(password, 12);
});
async function limpiar() {
  await db.cambioPatrimonio.deleteMany();
  await db.objetoPatrimonial.deleteMany();
  await db.usuario.deleteMany();
  await db.iglesia.deleteMany();
}
beforeEach(async () => {
  await limpiar();
  await db.iglesia.createMany({
    data: [own, other, empty].map((id, i) => ({
      ...inicial[0],
      id,
      nombre: ["Propia ficticia", "Otra ficticia", "Sin piezas ficticia"][i],
      version: 1,
      cerradaDesde: null,
    })),
  });
  await db.usuario.createMany({
    data: [
      {
        identificador: "admin",
        passwordHash: hash,
        rol: "ADMIN_IGLESIA",
        iglesiaId: own,
      },
      {
        identificador: "otro",
        passwordHash: hash,
        rol: "ADMIN_IGLESIA",
        iglesiaId: other,
      },
      {
        identificador: "tesorero",
        passwordHash: hash,
        rol: "TESORERO",
        iglesiaId: own,
      },
      { identificador: "coord", passwordHash: hash, rol: "COORDINACION" },
    ],
  });
  app = createApp(db, config, 2026);
});
afterAll(async () => {
  await limpiar();
  await db.iglesia.createMany({ data: inicial });
  await db.$disconnect();
});
const ruta = (id: string = own) => `/api/v1/iglesias/${id}/objetos`;
async function token(identificador = "admin") {
  const r = await request(app)
    .post("/api/v1/auth/login")
    .send({ identificador, password });
  expect(r.status).toBe(200);
  return r.body.accessToken as string;
}
async function alta(t: string, body: object = datos, iglesiaId = own) {
  return request(app)
    .post(ruta(iglesiaId))
    .auth(t, { type: "bearer" })
    .send(body);
}
async function crearEjemplo(t: string) {
  const objetos = [];
  for (const o of ejemplo()) {
    const { id: _id, iglesiaId: _i, condicion: _c, version: _v, ...data } = o;
    void _id;
    void _i;
    void _c;
    void _v;
    const r = await alta(t, data);
    expect(r.status).toBe(201);
    objetos.push(r.body);
  }
  return objetos;
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
  const panel = await request(app).get("/personal").set("Cookie", cookie);
  return { cookie, csrf: panel.text.match(/name="_csrf" value="([^"]+)"/)![1] };
}
const form = {
  ...datos,
  anioExacto: "1720",
  siglo: "",
  catalogadoInah: "true",
};

describe("patrimonio vertical con PostgreSQL y sesiones reales", () => {
  it("persiste el ejemplo, cumple DTOs reales y consulta pública calcula 35.5", async () => {
    const t = await token();
    await crearEjemplo(t);
    const r = await request(app).get(ruta());
    expect(r.status).toBe(200);
    expect(r.body.calculo).toMatchObject({
      indice: "35.5",
      distincion: "Alto valor patrimonial",
    });
    expect(r.body.meta.total).toBe(4);
    expect(await db.cambioPatrimonio.count()).toBe(4);
    expect(
      (
        await db.criterioPatrimonio.findUniqueOrThrow({
          where: { id: "caso-v1" },
        })
      ).parametros,
    ).toEqual(criteriosCaso);
    const api = JSON.parse(
      readFileSync("docs/api-referencia-revision03.json", "utf8"),
    );
    const ajv = new Ajv2020({ strict: false, validateFormats: false });
    ajv.addSchema({ $id: "patrimonio", components: api.components });
    expect(
      ajv.validate(
        { $ref: "patrimonio#/components/schemas/PatrimonioConsulta" },
        r.body,
      ),
      JSON.stringify(ajv.errors),
    ).toBe(true);
    const ranking = await request(app).get("/api/v1/ranking-patrimonial");
    expect(
      ajv.validate(
        { $ref: "patrimonio#/components/schemas/PatrimonioRanking" },
        ranking.body,
      ),
      JSON.stringify(ajv.errors),
    ).toBe(true);
  });
  it.each(["PERDIDO", "PRESTADO", "BAJA"])(
    "cambiar a %s excluye de público y conserva pieza y auditoría",
    async (condicion) => {
      const t = await token();
      const objetos = await crearEjemplo(t);
      const r = await request(app)
        .put(`${ruta()}/${objetos[0].id}/condicion`)
        .auth(t, { type: "bearer" })
        .send({ version: 1, condicion });
      expect(r.status).toBe(200);
      expect(r.body.version).toBe(2);
      const publico = await request(app).get(ruta());
      expect(publico.body.meta.total).toBe(3);
      expect(publico.body.calculo.indice).toBe("15.5");
      expect(JSON.stringify(publico.body)).not.toContain(objetos[0].id);
      expect(await db.objetoPatrimonial.count()).toBe(4);
      const audit = await db.cambioPatrimonio.findMany({
        where: { objetoId: objetos[0].id },
        orderBy: { fecha: "asc" },
      });
      expect(audit).toHaveLength(2);
      expect(audit[1].antes).toMatchObject({
        condicion: "VIGENTE",
        version: 1,
      });
      expect(audit[1].despues).toMatchObject({ condicion, version: 2 });
      const reactivar = await request(app)
        .put(`${ruta()}/${objetos[0].id}/condicion`)
        .auth(t, { type: "bearer" })
        .send({ version: 2, condicion: "VIGENTE" });
      expect(reactivar.status).toBe(422);
      expect(await db.cambioPatrimonio.count()).toBe(5);
      const repetido = await request(app)
        .put(`${ruta()}/${objetos[0].id}/condicion`)
        .auth(t, { type: "bearer" })
        .send({ version: 2, condicion });
      expect(repetido.status).toBe(422);
    },
  );
  it("PATCH parcial y cambio de año a siglo no modifican estado ni ámbito", async () => {
    const t = await token();
    const o = (await alta(t)).body;
    const r = await request(app)
      .patch(`${ruta()}/${o.id}`)
      .auth(t, { type: "bearer" })
      .send({ version: 1, anioExacto: null, siglo: 18 });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({
      anioExacto: null,
      siglo: 18,
      version: 2,
      iglesiaId: own,
      condicion: "VIGENTE",
    });
    expect((await request(app).get(ruta())).body.calculo.indice).toBe("15.5");
    expect(
      (
        await request(app)
          .patch(`${ruta()}/${o.id}`)
          .auth(t, { type: "bearer" })
          .send({ version: 2, anioExacto: 1700 })
      ).status,
    ).toBe(422);
  });
  it("dos cambios simultáneos solo generan un ganador y una entrada de auditoría", async () => {
    const t = await token();
    const o = (await alta(t)).body;
    const r = await Promise.all(
      ["PRESTADO", "PERDIDO"].map((condicion) =>
        request(app)
          .put(`${ruta()}/${o.id}/condicion`)
          .auth(t, { type: "bearer" })
          .send({ version: 1, condicion }),
      ),
    );
    expect(r.map((x) => x.status).sort()).toEqual([200, 409]);
    expect(await db.cambioPatrimonio.count()).toBe(2);
    const stale = await request(app)
      .patch(`${ruta()}/${o.id}`)
      .auth(t, { type: "bearer" })
      .send({ version: 1, descripcion: "Obsoleto" });
    expect(stale.status).toBe(409);
    expect(await db.cambioPatrimonio.count()).toBe(2);
  });
  it.each(["coord", "tesorero", "otro"])(
    "%s no obtiene permisos de patrimonio por inferencia",
    async (usuario) => {
      const t = await token(usuario);
      expect((await alta(t)).status).toBe(403);
      expect(
        (
          await request(app)
            .patch(`${ruta()}/${randomUUID()}`)
            .auth(t, { type: "bearer" })
            .send({ version: 1, descripcion: "Cambio" })
        ).status,
      ).toBe(403);
      expect(
        (
          await request(app)
            .put(`${ruta()}/${randomUUID()}/condicion`)
            .auth(t, { type: "bearer" })
            .send({ version: 1, condicion: "BAJA" })
        ).status,
      ).toBe(403);
      expect(await db.objetoPatrimonial.count()).toBe(0);
    },
  );
  it("anónimo, sesión revocada y manipulación de IDs no permiten escritura", async () => {
    expect((await request(app).post(ruta()).send(datos)).status).toBe(401);
    const t = await token();
    const o = (await alta(t)).body;
    const otro = await token("otro");
    expect(
      (
        await request(app)
          .patch(`${ruta(other)}/${o.id}`)
          .auth(otro, { type: "bearer" })
          .send({ version: 1, descripcion: "Cruce" })
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .put(`${ruta(other)}/${o.id}/condicion`)
          .auth(otro, { type: "bearer" })
          .send({ version: 1, condicion: "BAJA" })
      ).status,
    ).toBe(404);
    await db.sesion.deleteMany();
    expect((await alta(t)).status).toBe(401);
  });
  it.each([
    { anioExacto: null, siglo: null },
    { anioExacto: 1720, siglo: 18 },
    { anioExacto: 2027 },
    { descripcion: " " },
    { descripcion: "x".repeat(301) },
    { catalogadoInah: "false" },
    { iglesiaId: other },
    { rol: "COORDINACION" },
    { condicion: "VIGENTE" },
    { tipoId: randomUUID() },
    { anioExacto: 1.5 },
    { anioExacto: 0 },
    { siglo: 0 },
    { catalogadoInah: null },
  ])("alta inválida sin escrituras %o", async (cambios) => {
    expect((await alta(await token(), { ...datos, ...cambios })).status).toBe(
      422,
    );
    expect(await db.objetoPatrimonial.count()).toBe(0);
    expect(await db.cambioPatrimonio.count()).toBe(0);
  });
  it("ID inválido, inexistentes, cerradas y DELETE reciben rechazo", async () => {
    const t = await token();
    expect((await request(app).get(ruta("mal"))).status).toBe(422);
    expect((await request(app).get(ruta(randomUUID()))).status).toBe(404);
    expect((await alta(t, datos, randomUUID())).status).toBe(403);
    await db.iglesia.update({
      where: { id: own },
      data: { cerradaDesde: new Date() },
    });
    expect((await alta(t)).status).toBe(404);
    expect((await request(app).get(ruta())).status).toBe(404);
    expect(
      (
        await request(app)
          .delete(`${ruta()}/${randomUUID()}`)
          .auth(t, { type: "bearer" })
      ).status,
    ).toBe(404);
    await db.iglesia.update({
      where: { id: own },
      data: { cerradaDesde: null },
    });
    expect(
      (
        await request(app)
          .patch(`${ruta()}/${randomUUID()}`)
          .auth(t, { type: "bearer" })
          .send({ version: 1, descripcion: "Ausente" })
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .put(`${ruta()}/${randomUUID()}/condicion`)
          .auth(t, { type: "bearer" })
          .send({ version: 1, condicion: "BAJA" })
      ).status,
    ).toBe(404);
  });
  it("fallo de auditoría revierte alta y edición en PostgreSQL", async () => {
    const repo = new PrismaRepositorioPatrimonio(db);
    await expect(repo.guardar(own, randomUUID(), datos)).rejects.toThrow();
    expect(await db.objetoPatrimonial.count()).toBe(0);
    const o = (await alta(await token())).body;
    await expect(
      repo.guardar(
        own,
        randomUUID(),
        { ...datos, descripcion: "No debe guardarse" },
        { id: o.id, version: 1 },
      ),
    ).rejects.toThrow();
    expect(
      await db.objetoPatrimonial.findUniqueOrThrow({ where: { id: o.id } }),
    ).toMatchObject({ descripcion: datos.descripcion, version: 1 });
    expect(await db.cambioPatrimonio.count()).toBe(1);
  });
  it("servicio exige principal y permite detectar iglesia inexistente sin mutar", async () => {
    const s = new ServicioPatrimonio(new PrismaRepositorioPatrimonio(db), 2026);
    expect(() => s.autorizar(own)).toThrow("Inicie sesión");
    const actor = {
      id: randomUUID(),
      rol: "ADMIN_IGLESIA" as const,
      iglesiaId: randomUUID(),
    };
    await expect(s.guardar(actor.iglesiaId, datos, actor)).rejects.toThrow(
      "Iglesia no disponible",
    );
  });
});

describe("ranking geográfico y búsquedas escritas P075–076", () => {
  it("ordena por índice, excluye cerradas y sin piezas; no excluye cero registrado", async () => {
    const t = await token();
    await crearEjemplo(t);
    const o = (
      await alta(
        await token("otro"),
        { ...datos, anioExacto: 2000, catalogadoInah: false },
        other,
      )
    ).body;
    const r = await request(app).get("/api/v1/ranking-patrimonial?pageSize=1");
    expect(r.body.meta.total).toBe(2);
    expect(r.body.data[0].iglesia.id).toBe(own);
    expect(
      (await request(app).get("/api/v1/ranking-patrimonial?pageSize=1&page=2"))
        .body.data[0].iglesia.id,
    ).toBe(other);
    await request(app)
      .put(`${ruta(other)}/${o.id}/condicion`)
      .auth(await token("otro"), { type: "bearer" })
      .send({ version: 1, condicion: "BAJA" });
    const cero = await request(app).get("/api/v1/ranking-patrimonial");
    expect(cero.body.data[1].indice).toBe("0.0");
    expect(JSON.stringify(cero.body)).not.toContain(o.id);
    await db.iglesia.update({
      where: { id: own },
      data: { cerradaDesde: new Date() },
    });
    expect(
      (await request(app).get("/api/v1/ranking-patrimonial")).body.data,
    ).toHaveLength(1);
  });
  it("estado, municipio y localidad usan filtros AND; tipo y edad corresponden a la misma pieza vigente", async () => {
    await crearEjemplo(await token());
    for (const q of [
      "estadoClave=21",
      "estadoClave=21&municipioClave=114",
      "estadoClave=21&municipioClave=114&localidadClave=0001",
    ]) {
      expect(
        (await request(app).get(`/api/v1/ranking-patrimonial?${q}`)).body.meta
          .total,
      ).toBe(1);
    }
    for (const q of [
      "estadoClave=20",
      "estadoClave=21&municipioClave=001",
      "estadoClave=21&municipioClave=114&localidadClave=9999",
    ]) {
      expect(
        (await request(app).get(`/api/v1/ranking-patrimonial?${q}`)).body.meta
          .total,
      ).toBe(0);
    }
    const consulta = `/api/v1/iglesias/por-patrimonio?estadoClave=21&tipoObjetoId=${tiposObjeto[0].id}&antiguedadMin=300`;
    const r = await request(app).get(consulta);
    expect(r.body.meta.total).toBe(1);
    expect(r.body.data[0].indice).toBe("35.5");
    expect(
      (
        await request(app).get(
          consulta.replace(tiposObjeto[0].id, tiposObjeto[7].id),
        )
      ).body.meta.total,
    ).toBe(0);
    expect(
      (await request(app).get(consulta.replace("300", "307"))).body.meta.total,
    ).toBe(0);
    const o = await db.objetoPatrimonial.findFirstOrThrow({
      where: { tipoId: tiposObjeto[0].id },
    });
    await request(app)
      .put(`${ruta()}/${o.id}/condicion`)
      .auth(await token(), { type: "bearer" })
      .send({ version: 1, condicion: "PRESTADO" });
    expect((await request(app).get(consulta)).body.meta.total).toBe(0);
  });
  it.each([
    "municipioClave=114",
    "localidadClave=0001",
    "estadoClave=2",
    "page=0",
    "pageSize=101",
    "antiguedadMin=-1",
    "tipoObjetoId=mal",
    "rol=ADMIN_IGLESIA",
    "page=1&page=2",
  ])("filtro inválido %s", async (q) =>
    expect(
      (await request(app).get(`/api/v1/ranking-patrimonial?${q}`)).status,
    ).toBe(422),
  );
  it("empate técnico estable y paginación de objetos sin duplicados", async () => {
    await alta(await token());
    await alta(await token("otro"), datos, other);
    await alta(await token());
    const p1 = await request(app).get(ruta() + "?pageSize=1"),
      p2 = await request(app).get(ruta() + "?pageSize=1&page=2");
    expect(p1.body.meta.total).toBe(2);
    expect(p1.body.data[0].id).not.toBe(p2.body.data[0].id);
    expect(p1.body.calculo.indice).toBe("40.0");
    await alta(await token("otro"), datos, other);
    const r = await request(app).get("/api/v1/ranking-patrimonial");
    expect(
      r.body.data.map((x: { iglesia: { id: string } }) => x.iglesia.id),
    ).toEqual([other, own]);
  });
});

describe("EJS útil, escape HTML y CSRF", () => {
  it("recorrido con cookie: panel, alta, edición, estado y consulta pública", async () => {
    const s = await sesion();
    const base = `/personal/patrimonio/${own}`;
    expect(
      (await request(app).get("/personal").set("Cookie", s.cookie)).text,
    ).toContain(base);
    expect(
      (
        await request(app)
          .get(base + "/nuevo")
          .set("Cookie", s.cookie)
      ).text,
    ).toContain("Registrar pieza");
    const crear = await request(app)
      .post(base + "/nuevo")
      .set("Cookie", s.cookie)
      .set("Origin", config.origin)
      .type("form")
      .send({ ...form, _csrf: s.csrf });
    expect(crear.status).toBe(303);
    const o = await db.objetoPatrimonial.findFirstOrThrow();
    expect(
      (await request(app).get(`${base}/${o.id}/editar`).set("Cookie", s.cookie))
        .text,
    ).toContain(datos.descripcion);
    const editar = await request(app)
      .post(`${base}/${o.id}/editar`)
      .set("Cookie", s.cookie)
      .set("Origin", config.origin)
      .type("form")
      .send({
        ...form,
        descripcion: "Editada ficticia",
        version: "1",
        _csrf: s.csrf,
      });
    expect(editar.status).toBe(303);
    expect(
      (await request(app).get(base).set("Cookie", s.cookie)).text,
    ).toContain("Editada ficticia");
    const estado = await request(app)
      .post(`${base}/${o.id}/condicion`)
      .set("Cookie", s.cookie)
      .set("Origin", config.origin)
      .type("form")
      .send({ condicion: "PRESTADO", version: "2", _csrf: s.csrf });
    expect(estado.status).toBe(303);
    expect(
      (await request(app).get(base).set("Cookie", s.cookie)).text,
    ).toContain("PRESTADO");
    const pub = await request(app).get(`/iglesias/${own}/patrimonio`);
    expect(pub.status).toBe(200);
    expect(pub.text).not.toContain("Editada ficticia");
    expect((await request(app).get(`/iglesias/${own}`)).text).toContain(
      `/iglesias/${own}/patrimonio`,
    );
  });
  it.each([{}, { _csrf: "incorrecto" }])(
    "CSRF ausente o inválido rechaza web y API con cookie %o",
    async (body) => {
      const s = await sesion();
      expect(
        (
          await request(app)
            .post(`/personal/patrimonio/${own}/nuevo`)
            .set("Cookie", s.cookie)
            .set("Origin", config.origin)
            .type("form")
            .send({ ...form, ...body })
        ).status,
      ).toBe(403);
      expect(
        (
          await request(app)
            .post(ruta())
            .set("Cookie", s.cookie)
            .set("Origin", config.origin)
            .send({ ...datos, ...body })
        ).status,
      ).toBe(403);
      expect(await db.objetoPatrimonial.count()).toBe(0);
    },
  );
  it("origen ajeno y acceso privado cruzado se rechazan", async () => {
    const s = await sesion();
    expect(
      (
        await request(app)
          .post(`/personal/patrimonio/${own}/nuevo`)
          .set("Cookie", s.cookie)
          .set("Origin", "https://ajeno.invalid")
          .type("form")
          .send({ ...form, _csrf: s.csrf })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .get(`/personal/patrimonio/${other}`)
          .set("Cookie", s.cookie)
      ).status,
    ).toBe(403);
    expect((await request(app).get(`/personal/patrimonio/${own}`)).status).toBe(
      401,
    );
  });
  it("escapa HTML en lectura pública, privada, formulario y ranking; conserva entradas con 422 y 409", async () => {
    const s = await sesion(),
      base = `/personal/patrimonio/${own}`;
    const peligro = '<script>alert("x")</script>';
    const crear = await request(app)
      .post(base + "/nuevo")
      .set("Cookie", s.cookie)
      .set("Origin", config.origin)
      .type("form")
      .send({ ...form, descripcion: peligro, _csrf: s.csrf });
    expect(crear.status).toBe(303);
    const o = await db.objetoPatrimonial.findFirstOrThrow();
    for (const [path, privado] of [
      [`/iglesias/${own}/patrimonio`, false],
      [base, true],
      [`${base}/${o.id}/editar`, true],
    ] as const) {
      const req = request(app).get(path);
      if (privado) req.set("Cookie", s.cookie);
      const r = await req;
      expect(r.status).toBe(200);
      expect(r.text).not.toContain("<script>");
      expect(r.text).toContain("&lt;script&gt;");
    }
    const malo = await request(app)
      .post(base + "/nuevo")
      .set("Cookie", s.cookie)
      .set("Origin", config.origin)
      .type("form")
      .send({ ...form, descripcion: peligro, siglo: "18", _csrf: s.csrf });
    expect(malo.status).toBe(422);
    expect(malo.text).toContain("&lt;script&gt;");
    const conflicto = await request(app)
      .post(`${base}/${o.id}/editar`)
      .set("Cookie", s.cookie)
      .set("Origin", config.origin)
      .type("form")
      .send({ ...form, version: "2", _csrf: s.csrf });
    expect(conflicto.status).toBe(409);
    expect(conflicto.text).toContain(datos.descripcion);
    await db.iglesia.update({ where: { id: own }, data: { nombre: peligro } });
    const rank = await request(app).get(
      "/ranking-patrimonial?estadoClave=21&tipoObjetoId=&antiguedadMin=",
    );
    expect(rank.status).toBe(200);
    expect(rank.text).toContain("&lt;script&gt;");
    expect(rank.text).not.toContain("<script>");
  });
  it("rutas inválidas privadas, objeto ausente y páginas no válidas muestran error seguro", async () => {
    const s = await sesion();
    for (const path of [
      `/personal/patrimonio/${own}/${randomUUID()}/editar`,
      `/personal/patrimonio/${own}?pageSize=101`,
      `/ranking-patrimonial?municipioClave=114`,
    ]) {
      const r = await request(app).get(path).set("Cookie", s.cookie);
      expect([404, 422]).toContain(r.status);
      expect(r.text).not.toContain("Prisma");
    }
  });
});

describe("migración aditiva y defensas PostgreSQL", () => {
  it("actualiza esquema previo con iglesia y usuario conservados", async () => {
    const pg = new Client({ connectionString: process.env.DATABASE_URL });
    await pg.connect();
    try {
      await pg.query("BEGIN");
      const schema = "patrimonio_" + randomUUID().replaceAll("-", "");
      await pg.query(`CREATE SCHEMA "${schema}"`);
      await pg.query(`SET LOCAL search_path TO "${schema}"`);
      for (const folder of [
        "202611010001_referencia_iglesias",
        "202611010002_identidad",
        "202611010003_catalogos",
      ])
        await pg.query(
          readFileSync(`prisma/migrations/${folder}/migration.sql`, "utf8"),
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
      await pg.query(
        readFileSync(
          "prisma/migrations/202611020001_patrimonio/migration.sql",
          "utf8",
        ),
      );
      expect((await pg.query(`SELECT version FROM "Iglesia"`)).rows).toEqual([
        { version: 8 },
      ]);
      expect(
        (await pg.query(`SELECT "iglesiaId" FROM "Usuario"`)).rows[0].iglesiaId,
      ).toBe(own);
      expect(
        (await pg.query(`SELECT count(*)::int AS n FROM "TipoObjeto"`)).rows[0]
          .n,
      ).toBe(12);
    } finally {
      await pg.query("ROLLBACK");
      await pg.end();
    }
  });
  it("FK y CHECK impiden fechas contradictorias, textos vacíos, tipos inválidos y borrado de historia", async () => {
    for (const campos of [
      { anioExacto: 1720, siglo: 18 },
      { anioExacto: null, siglo: null },
      { material: " " },
      { version: 0 },
      { tipoId: randomUUID() },
    ])
      await expect(
        db.objetoPatrimonial.create({
          data: { ...datos, iglesiaId: own, ...campos },
        }),
      ).rejects.toThrow();
    const o = (await alta(await token())).body;
    await expect(
      db.objetoPatrimonial.delete({ where: { id: o.id } }),
    ).rejects.toThrow();
    await expect(db.iglesia.delete({ where: { id: own } })).rejects.toThrow();
  });
});
