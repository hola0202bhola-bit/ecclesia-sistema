import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { readFileSync, readdirSync } from "node:fs";
import { Client } from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createApp } from "../src/composition/app.js";
import {
  criteriosCaso,
  tiposObjeto,
  calcularIndice,
  type Objeto,
} from "../src/modules/patrimonio/domain/patrimonio.js";
import { validarCriterios } from "../src/modules/patrimonio/domain/criterios.js";
import { ServicioCriterios } from "../src/modules/patrimonio/application/criterios.js";
import { PrismaRepositorioCriterios } from "../src/modules/patrimonio/infrastructure/criterios.js";
import { ServicioIglesias } from "../src/modules/iglesias/application/servicio.js";
import { PrismaRepositorioIglesias } from "../src/modules/iglesias/infrastructure/prisma-repositorio.js";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
const config = {
  secret: process.env.TEST_JWT_SECRET!,
  issuer: "ecclesia-personal",
  audience: "ecclesia-api",
  origin: "http://127.0.0.1:3000",
};
const app = createApp(db, config, 2026);
const own = randomUUID(),
  other = randomUUID();
const ids = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
const password = "Contraseña sintética de pruebas!";
const nombres = ["ui-coord", "ui-admin", "ui-otro", "ui-tes"];
const parametros = () => {
  const { id: _, ...p } = structuredClone(criteriosCaso);
  void _;
  return p;
};
const pieza: Omit<Objeto, "id"> = {
  iglesiaId: own,
  descripcion: "Imagen de prueba",
  tipoId: tiposObjeto[0].id,
  anioExacto: 1720,
  siglo: null,
  material: "Prueba",
  conservacion: "Prueba",
  ubicacionInterna: "Prueba",
  catalogadoInah: true,
  condicion: "VIGENTE",
  version: 1,
};
const ruta = `/api/v1/iglesias/${own}`;
const criterios = "/api/v1/criterios-patrimoniales";
let tokens: string[] = [];
let activeVersion = 1;
beforeAll(async () => {
  const hash = await bcrypt.hash(password, 12);
  for (const [i, id] of [own, other].entries())
    await db.iglesia.create({
      data: {
        id,
        nombre: `Iglesia UI ficticia ${i}`,
        nombreBusqueda: `iglesia ui ficticia ${i}`,
        tipoId: "10000000-0000-4000-8000-000000000005",
        estadoClave: "21",
        municipioClave: "114",
        localidadClave: "0001",
        direccion: "Dirección ficticia",
      },
    });
  await db.usuario.createMany({
    data: ids.map((id, i) => ({
      id,
      identificador: nombres[i],
      passwordHash: hash,
      rol: i === 0 ? "COORDINACION" : i === 3 ? "TESORERO" : "ADMIN_IGLESIA",
      iglesiaId: i === 0 ? null : i === 2 ? other : own,
    })),
  });
  tokens = await Promise.all(
    nombres.map(async (identificador) => {
      const r = await request(app)
        .post("/api/v1/auth/login")
        .send({ identificador, password });
      expect(r.status).toBe(200);
      return r.body.accessToken;
    }),
  );
});
async function limpiar() {
  await db.cambioCierre.deleteMany({
    where: { iglesiaId: { in: [own, other] } },
  });
  await db.cambioCriterio.deleteMany({ where: { actorId: { in: ids } } });
  await db.configuracionIndice.update({
    where: { id: "global" },
    data: { criterioId: "caso-v1", version: 1 },
  });
  await db.criterioPatrimonio.deleteMany({ where: { id: { not: "caso-v1" } } });
  await db.objetoPatrimonial.deleteMany({
    where: { iglesiaId: { in: [own, other] } },
  });
  await db.iglesia.updateMany({
    where: { id: { in: [own, other] } },
    data: { cerradaDesde: null, version: 1 },
  });
}
beforeEach(async () => {
  await limpiar();
  activeVersion = 1;
  await db.objetoPatrimonial.create({ data: { ...pieza, id: randomUUID() } });
});
afterAll(async () => {
  await limpiar();
  await db.sesion.deleteMany({ where: { usuarioId: { in: ids } } });
  await db.usuario.deleteMany({ where: { id: { in: ids } } });
  await db.iglesia.deleteMany({ where: { id: { in: [own, other] } } });
  await db.$disconnect();
});
const cambiar = (comando = "cerrar", version = 1, t = 0) =>
  request(app)
    .post(`${ruta}/${comando}`)
    .auth(tokens[t], { type: "bearer" })
    .send({ version, motivo: "Motivo sintético de prueba" });
async function nueva(cambios: object = {}) {
  const r = await request(app)
    .post(criterios)
    .auth(tokens[0], { type: "bearer" })
    .send({
      nombre: "Versión de prueba",
      parametros: parametros(),
      motivo: "Revisión de prueba",
      ...cambios,
    });
  expect(r.status, r.text).toBe(201);
  return r.body;
}
const activar = (id: string, version = activeVersion) =>
  request(app)
    .post(`${criterios}/${id}/activar`)
    .auth(tokens[0], { type: "bearer" })
    .send({ version, motivo: "Activación de prueba" });
async function cookie() {
  const r = await request(app)
    .post("/personal/login")
    .set("Origin", config.origin)
    .type("form")
    .send({ identificador: nombres[0], password });
  const cookie = r.headers["set-cookie"][0].split(";")[0];
  const panel = await request(app).get("/personal").set("Cookie", cookie);
  return { cookie, csrf: panel.text.match(/name="_csrf" value="([^"]+)"/)![1] };
}

describe("RF04 cierre y consulta privada", () => {
  it("conflicto web conserva motivo sin invertir la acción ni sobrescribir", async () => {
    const s = await cookie();
    expect((await cambiar()).status).toBe(200);
    const r = await request(app)
      .post(`/personal/iglesias/${own}/cerrar`)
      .set("Cookie", s.cookie)
      .set("Origin", config.origin)
      .type("form")
      .send({
        _csrf: s.csrf,
        version: "1",
        motivo: "Motivo conservado de prueba",
      });
    expect(r.status).toBe(409);
    expect(r.text).toContain("Motivo conservado de prueba");
    expect(r.text).toContain("Cargar la versión actual");
    expect(r.text).not.toContain("Confirmar cierre</button>");
    expect(
      (await db.iglesia.findUniqueOrThrow({ where: { id: own } })).version,
    ).toBe(2);
  });
  it.each([0, 1])(
    "autoridad %i cierra, conserva patrimonio e historia y reabre",
    async (actor) => {
      const antes = await db.objetoPatrimonial.findMany({
        where: { iglesiaId: own },
      });
      const c = await cambiar("cerrar", 1, actor);
      expect(c.status).toBe(200);
      expect(c.body.version).toBe(2);
      expect(c.body.cerradaDesde).toBeTruthy();
      expect((await request(app).get(ruta)).status).toBe(404);
      expect((await request(app).get(`/iglesias/${own}`)).status).toBe(404);
      expect(
        (await request(app).get(`/iglesias/${own}/patrimonio`)).status,
      ).toBe(404);
      const list = await request(app).get("/api/v1/iglesias?estadoClave=21");
      expect(list.body.data.some((i: { id: string }) => i.id === own)).toBe(
        false,
      );
      const ranking = await request(app).get("/api/v1/ranking-patrimonial");
      expect(
        ranking.body.data.some(
          (i: { iglesia: { id: string } }) => i.iglesia.id === own,
        ),
      ).toBe(false);
      const s = new ServicioIglesias(new PrismaRepositorioIglesias(db), 2026);
      const privada = await s.privada(own, {
        id: ids[actor],
        rol: actor === 0 ? "COORDINACION" : "ADMIN_IGLESIA",
        iglesiaId: actor ? own : undefined,
      });
      expect(privada.historial).toHaveLength(1);
      expect(
        (
          await s.gestion(
            { estadoClave: "21", page: 1, pageSize: 100 },
            { id: ids[0], rol: "COORDINACION" },
          )
        ).data.some((i) => i.id === own),
      ).toBe(true);
      expect(
        await db.objetoPatrimonial.findMany({ where: { iglesiaId: own } }),
      ).toEqual(antes);
      expect((await cambiar("reabrir", 2, actor)).status).toBe(200);
      expect((await request(app).get(ruta)).status).toBe(200);
      expect(await db.cambioCierre.count({ where: { iglesiaId: own } })).toBe(
        2,
      );
    },
  );
  it.each([2, 3])("rechaza actor ajeno o tesorero %i", async (actor) => {
    expect((await cambiar("cerrar", 1, actor)).status).toBe(403);
    expect(await db.cambioCierre.count({ where: { iglesiaId: own } })).toBe(0);
  });
  it("dos cambios simultáneos solo permiten un cierre y una auditoría", async () => {
    const r = await Promise.all([cambiar(), cambiar()]);
    expect(r.map((x) => x.status).sort()).toEqual([200, 409]);
    expect(await db.cambioCierre.count({ where: { iglesiaId: own } })).toBe(1);
    expect((await cambiar("cerrar", 2)).status).toBe(409);
    expect((await cambiar("reabrir", 1)).status).toBe(409);
  });
  it("fallo de auditoría revierte cierre", async () => {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
      await client.query(
        `CREATE FUNCTION ui_fail_cierre() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fallo sintético'; END $$; CREATE TRIGGER ui_fail_cierre BEFORE INSERT ON "CambioCierre" FOR EACH ROW EXECUTE FUNCTION ui_fail_cierre()`,
      );
      expect((await cambiar()).status).toBe(500);
      expect(
        (await db.iglesia.findUniqueOrThrow({ where: { id: own } })).version,
      ).toBe(1);
      expect(
        (await db.iglesia.findUniqueOrThrow({ where: { id: own } }))
          .cerradaDesde,
      ).toBeNull();
    } finally {
      await client.query(
        'DROP TRIGGER ui_fail_cierre ON "CambioCierre"; DROP FUNCTION ui_fail_cierre()',
      );
      await client.end();
    }
  });
  it("CSRF/Origin y formulario privado preservan alcance", async () => {
    const s = await cookie();
    const url = `/personal/iglesias/${own}/cerrar`;
    expect(
      (
        await request(app)
          .post(url)
          .set("Cookie", s.cookie)
          .set("Origin", config.origin)
          .type("form")
          .send({ version: "1", motivo: "Prueba de cierre" })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post(url)
          .set("Cookie", s.cookie)
          .set("Origin", "https://ajeno.invalid")
          .type("form")
          .send({ _csrf: s.csrf, version: "1", motivo: "Prueba de cierre" })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post(url)
          .set("Cookie", s.cookie)
          .set("Origin", config.origin)
          .type("form")
          .send({
            _csrf: s.csrf,
            version: "1",
            motivo: "<script>alert(1)</script>",
          })
      ).status,
    ).toBe(303);
    const h = await request(app)
      .get(`/personal/iglesias/${own}/historial`)
      .set("Cookie", s.cookie);
    expect(h.status).toBe(200);
    expect(h.text).toContain("&lt;script&gt;");
    expect(h.text).toContain("Reabrir iglesia");
    expect(h.text).not.toContain("<script>");
  });
  it("valida motivo, versión, inexistentes y acceso anónimo", async () => {
    expect(
      (
        await request(app)
          .post(`${ruta}/cerrar`)
          .send({ version: 1, motivo: "Prueba" })
      ).status,
    ).toBe(401);
    for (const b of [
      { version: 0, motivo: "Prueba" },
      { version: 1, motivo: "" },
      { version: 1, motivo: "Prueba", rol: "COORDINACION" },
    ])
      expect(
        (
          await request(app)
            .post(`${ruta}/cerrar`)
            .auth(tokens[0], { type: "bearer" })
            .send(b)
        ).status,
      ).toBe(422);
    expect(
      (
        await request(app)
          .post(`/api/v1/iglesias/${randomUUID()}/cerrar`)
          .auth(tokens[0], { type: "bearer" })
          .send({ version: 1, motivo: "Prueba" })
      ).status,
    ).toBe(404);
  });
});
describe("RF11 versiones y activación exacta", () => {
  it("CA08 cambia imagen de 20 a 25 y conserva 35.5 con la versión original", async () => {
    const original = await request(app).get(`${ruta}/objetos`);
    expect(original.body.calculo.indice).toBe("20.0");
    const p = parametros();
    p.factoresDecimas[tiposObjeto[0].id] = 20;
    const v = await nueva({ parametros: p });
    expect(
      (await request(app).get(`${ruta}/objetos`)).body.calculo.indice,
    ).toBe("20.0");
    expect((await activar(v.id)).status).toBe(200);
    const calculo = (await request(app).get(`${ruta}/objetos`)).body.calculo;
    expect(calculo.indice).toBe("25.0");
    expect(calculo.criterioId).toBe(v.id);
    const ranking = await request(app).get("/api/v1/ranking-patrimonial");
    expect(
      ranking.body.data.find(
        (i: { iglesia: { id: string } }) => i.iglesia.id === own,
      ).indice,
    ).toBe("25.0");
    const otrosParametros = parametros();
    otrosParametros.tramos[4].puntos = 12;
    otrosParametros.bonoInahDecimas = 60;
    otrosParametros.distinciones = [
      { desdeDecimas: 240, nombre: "Distinción de prueba" },
    ];
    const otra = await nueva({ parametros: otrosParametros });
    expect((await activar(otra.id, 2)).status).toBe(200);
    expect(
      (await request(app).get(`${ruta}/objetos`)).body.calculo,
    ).toMatchObject({
      indice: "24.0",
      distincion: "Distinción de prueba",
      criterioId: otra.id,
    });
    expect((await activar("caso-v1", 3)).status).toBe(200);
    expect(
      (await request(app).get(`${ruta}/objetos`)).body.calculo.indice,
    ).toBe("20.0");
    const objetos = [
      { ...pieza, id: randomUUID() },
      {
        ...pieza,
        id: randomUUID(),
        tipoId: tiposObjeto[3].id,
        anioExacto: null,
        siglo: 18,
        catalogadoInah: false,
      },
      {
        ...pieza,
        id: randomUUID(),
        tipoId: tiposObjeto[8].id,
        anioExacto: 1890,
        catalogadoInah: false,
      },
      {
        ...pieza,
        id: randomUUID(),
        tipoId: tiposObjeto[7].id,
        anioExacto: 1950,
        catalogadoInah: false,
      },
    ];
    expect(calcularIndice(objetos, criteriosCaso, 2026).indice).toBe("35.5");
    expect(
      (
        await db.criterioPatrimonio.findUniqueOrThrow({
          where: { id: "caso-v1" },
        })
      ).parametros,
    ).toEqual(criteriosCaso);
  });
  it.each([1, 2, 3])(
    "solo Coordinación configura y activa, actor %i denegado",
    async (actor) => {
      expect(
        (
          await request(app)
            .get(criterios)
            .auth(tokens[actor], { type: "bearer" })
        ).status,
      ).toBe(403);
      expect(
        (
          await request(app)
            .post(criterios)
            .auth(tokens[actor], { type: "bearer" })
            .send({})
        ).status,
      ).toBe(403);
      expect(
        (
          await request(app)
            .post(`${criterios}/caso-v1/activar`)
            .auth(tokens[actor], { type: "bearer" })
            .send({})
        ).status,
      ).toBe(403);
    },
  );
  it("anónimo, sin motivo, inexistente, activo y versión inválida no mutan", async () => {
    expect((await request(app).get(criterios)).status).toBe(401);
    expect((await activar("caso-v1")).status).toBe(409);
    expect((await activar("inexistente")).status).toBe(404);
    expect((await activar("caso-v1", 0)).status).toBe(422);
    expect(
      (
        await request(app)
          .post(criterios)
          .auth(tokens[0], { type: "bearer" })
          .send({ nombre: "Prueba", motivo: "", parametros: parametros() })
      ).status,
    ).toBe(422);
    expect(await db.cambioCriterio.count({ where: { actorId: ids[0] } })).toBe(
      0,
    );
  });
  it("rangos, factores, precisión y distinciones inválidas se rechazan", async () => {
    const invalidos = [
      { tramos: [{ desde: 1, puntos: 1 }] },
      {
        tramos: [
          { desde: 0, puntos: 1 },
          { desde: 0, puntos: 2 },
        ],
      },
      { factoresDecimas: {} },
      { bonoInahDecimas: 1.1 },
      { bonoInahDecimas: -1 },
      {
        distinciones: [
          { desdeDecimas: 200, nombre: "A" },
          { desdeDecimas: 100, nombre: "B" },
        ],
      },
      {
        distinciones: [
          { desdeDecimas: 0, nombre: "A" },
          { desdeDecimas: 100, nombre: "A" },
        ],
      },
    ];
    for (const cambio of invalidos) {
      const p = { ...parametros(), ...cambio };
      expect(() => validarCriterios(p)).toThrow();
      expect(
        (
          await request(app)
            .post(criterios)
            .auth(tokens[0], { type: "bearer" })
            .send({
              nombre: "Prueba",
              motivo: "Revisión de prueba",
              parametros: p,
            })
        ).status,
      ).toBe(422);
    }
  });
  it("dos activaciones simultáneas solo confirman una y conservan ambas versiones", async () => {
    const a = await nueva(),
      b = await nueva();
    const r = await Promise.all([activar(a.id), activar(b.id)]);
    expect(r.map((x) => x.status).sort()).toEqual([200, 409]);
    expect(
      await db.cambioCriterio.count({
        where: { actorId: ids[0], tipo: "ACTIVACION" },
      }),
    ).toBe(1);
    expect(await db.criterioPatrimonio.count()).toBe(3);
  });
  it("fallo de auditoría revierte activación y creación", async () => {
    const v = await nueva();
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
      await client.query(
        `CREATE FUNCTION ui_fail_criterio() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fallo sintético'; END $$; CREATE TRIGGER ui_fail_criterio BEFORE INSERT ON "CambioCriterio" FOR EACH ROW EXECUTE FUNCTION ui_fail_criterio()`,
      );
      expect((await activar(v.id)).status).toBe(500);
      expect(
        (
          await db.configuracionIndice.findUniqueOrThrow({
            where: { id: "global" },
          })
        ).criterioId,
      ).toBe("caso-v1");
      expect(
        (
          await request(app)
            .post(criterios)
            .auth(tokens[0], { type: "bearer" })
            .send({
              nombre: "Prueba fallida",
              parametros: parametros(),
              motivo: "Prueba rollback",
            })
        ).status,
      ).toBe(500);
      expect(await db.criterioPatrimonio.count()).toBe(2);
    } finally {
      await client.query(
        'DROP TRIGGER ui_fail_criterio ON "CambioCriterio"; DROP FUNCTION ui_fail_criterio()',
      );
      await client.end();
    }
  });
  it("servicios rechazan llamadas directas fuera del rol y entradas inválidas", async () => {
    const s = new ServicioCriterios(new PrismaRepositorioCriterios(db));
    expect(() => s.listar()).toThrow("Inicie sesión");
    const a = { id: ids[0], rol: "COORDINACION" as const };
    expect(() => s.crear("", parametros(), "Motivo", a)).toThrow();
    expect(() => s.activar("caso-v1", 1, "", a)).toThrow();
    expect(() => s.activar("caso-v1", 0, "Motivo", a)).toThrow();
    const ig = new ServicioIglesias(new PrismaRepositorioIglesias(db), 2026);
    expect(() => ig.cambiarCierre(own, 0, true, "Motivo", a)).toThrow();
    await expect(
      ig.privada(own, { id: ids[2], rol: "ADMIN_IGLESIA", iglesiaId: other }),
    ).rejects.toThrow();
  });
  it("formulario legible, CSRF/Origin, error conservado y escape EJS", async () => {
    const s = await cookie();
    const form: Record<string, string> = {
      _csrf: s.csrf,
      nombre: "<script>Prueba</script>",
      motivo: "Revisión de prueba",
      bono: "10.0",
    };
    const p = parametros();
    for (let i = 0; i < 12; i++) {
      form[`edad_${i}`] = p.tramos[i]?.desde.toString() ?? "";
      form[`puntos_${i}`] = p.tramos[i]?.puntos.toString() ?? "";
    }
    for (let i = 0; i < 8; i++) {
      form[`umbral_${i}`] = p.distinciones[i]
        ? (p.distinciones[i].desdeDecimas / 10).toFixed(1)
        : "";
      form[`distincion_${i}`] = p.distinciones[i]?.nombre ?? "";
    }
    tiposObjeto.forEach(
      (t, i) =>
        (form[`factor_${i}`] = (p.factoresDecimas[t.id] / 10).toFixed(1)),
    );
    expect(
      (
        await request(app)
          .post("/personal/criterios")
          .set("Cookie", s.cookie)
          .set("Origin", "https://ajeno.invalid")
          .type("form")
          .send(form)
      ).status,
    ).toBe(403);
    for (const bono of ["-1", "0.11"]) {
      const invalid = await request(app)
        .post("/personal/criterios")
        .set("Cookie", s.cookie)
        .set("Origin", config.origin)
        .type("form")
        .send({ ...form, bono });
      expect(invalid.status).toBe(422);
      expect(invalid.text).toContain("&lt;script&gt;");
    }
    expect(
      (
        await request(app)
          .post("/personal/criterios")
          .set("Cookie", s.cookie)
          .set("Origin", config.origin)
          .type("form")
          .send(form)
      ).status,
    ).toBe(303);
    const guardado = await db.criterioPatrimonio.findFirstOrThrow({
      where: { nombre: form.nombre },
    });
    expect(guardado.parametros).toMatchObject({
      bonoInahDecimas: 100,
      factoresDecimas: { [tiposObjeto[0].id]: 15 },
      distinciones: [
        { desdeDecimas: 80 },
        { desdeDecimas: 200 },
        { desdeDecimas: 400 },
      ],
    });
    const page = await request(app)
      .get("/personal/criterios")
      .set("Cookie", s.cookie);
    expect(page.status).toBe(200);
    expect(page.text).toContain("Imagen de santo");
    expect(page.text).toContain("Activar esta versión");
    expect(page.text).not.toContain("<script>");
  });
  it("décima migración conserva los nueve esquemas y criterio inicial", async () => {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
      await client.query(
        "CREATE SCHEMA ui_upgrade; SET search_path TO ui_upgrade",
      );
      const migrations = readdirSync("prisma/migrations")
        .filter((f) => /^\d/.test(f))
        .sort();
      for (const m of migrations.slice(0, 9))
        await client.query(
          readFileSync(`prisma/migrations/${m}/migration.sql`, "utf8"),
        );
      const antes = (
        await client.query('SELECT parametros FROM "CriterioPatrimonio"')
      ).rows;
      await client.query(
        readFileSync(
          `prisma/migrations/${migrations[9]}/migration.sql`,
          "utf8",
        ),
      );
      expect(
        (await client.query('SELECT parametros FROM "CriterioPatrimonio"'))
          .rows,
      ).toEqual(antes);
      expect(
        (
          await client.query(
            'SELECT "criterioId",version FROM "ConfiguracionIndice"',
          )
        ).rows,
      ).toEqual([{ criterioId: "caso-v1", version: 1 }]);
    } finally {
      await client.query(
        "SET search_path TO public; DROP SCHEMA IF EXISTS ui_upgrade CASCADE",
      );
      await client.end();
    }
  });
});
describe("UI local transversal", () => {
  it("CSS e ilustración se sirven con CSP propia y navegación accesible", async () => {
    const css = await request(app).get("/assets/ecclesia.css");
    expect(css.status).toBe(200);
    expect(css.headers["content-type"]).toContain("text/css");
    expect(css.text).toContain("@media");
    expect(css.text).toContain(":focus-visible");
    expect(css.text).toContain(".table-scroll");
    expect(css.text).not.toContain("@import");
    expect((await request(app).get("/assets/iglesia.svg")).status).toBe(200);
    for (const url of [
      "/iglesias",
      "/iglesias?estadoClave=29",
      "/ranking-patrimonial",
      "/personal/login",
      "/solicitudes",
      `/iglesias/${own}`,
      `/iglesias/${own}/patrimonio`,
      `/iglesias/${own}/servicios`,
      `/iglesias/${own}/platicas`,
      `/iglesias/${own}/misas`,
      `/iglesias/${own}/espacios`,
    ]) {
      const r = await request(app).get(url);
      expect(r.status, r.text).toBe(200);
      expect(r.text).toContain('href="/assets/ecclesia.css"');
      expect(r.text).toContain('id="contenido"');
      expect(r.text).toContain('aria-label="Navegación principal"');
      expect(r.text).not.toContain("<style>");
      expect(r.headers["content-security-policy"]).toContain(
        "style-src 'self'",
      );
    }
  });
});
