import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import bcrypt from "bcryptjs";
import { Ajv2020 } from "ajv/dist/2020.js";
import { Client } from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createApp } from "../src/composition/app.js";
import {
  DescargaInegi,
  MAX_BYTES_INEGI,
} from "../src/modules/iglesias/infrastructure/descarga-inegi.js";
import {
  PrismaRepositorioImportacion,
  validarLocalidades,
} from "../src/modules/iglesias/infrastructure/importacion.js";
import { ServicioImportacion } from "../src/modules/iglesias/application/importacion.js";
import {
  cargarFuentes,
  importarFuentes,
} from "../src/modules/iglesias/infrastructure/fuentes-inegi.js";
import type { FilaLocalidad } from "../src/modules/iglesias/domain/importacion.js";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
const config = {
  secret: process.env.TEST_JWT_SECRET!,
  issuer: "ecclesia-personal",
  audience: "ecclesia-api",
  origin: "http://127.0.0.1:3000",
};
const ambito = {
  estadoClave: "21",
  municipioClave: "114",
  origen: "SNAPSHOT" as const,
};
const raw = readFileSync("prisma/fuentes/rf05/21114.json", "utf8");
const oficial = {
  fuente: "https://gaia.inegi.org.mx/wscatgeo/v2/localidades/21114",
  consulta: "2026-11-04",
  original: raw,
};
let fuente = { ...oficial };
const descarga = { descargar: async () => fuente };
const app = createApp(db, config, 2026, undefined, descarga);
const repo = new PrismaRepositorioImportacion(db);
const servicio = new ServicioImportacion(repo, descarga);
const ids = [randomUUID(), randomUUID(), randomUUID()];
const password = "Prueba localidades oficial 2026!";
const principal = { id: ids[0], rol: "COORDINACION" as const };
const url = "/api/v1/catalogos/importaciones-localidades";
let tokens: string[] = [];
let inicial: FilaLocalidad[];
let iglesiaId: string;
const nuevaIglesia = randomUUID();
beforeAll(async () => {
  inicial = await db.localidad.findMany({ orderBy: { clave: "asc" } });
  iglesiaId = (await db.iglesia.findFirstOrThrow()).id;
  const hash = await bcrypt.hash(password, 12);
  await db.usuario.createMany({
    data: ids.map((id, i) => ({
      id,
      identificador: "rf05-" + i,
      passwordHash: hash,
      rol: i === 0 ? "COORDINACION" : i === 1 ? "ADMIN_IGLESIA" : "TESORERO",
      iglesiaId: i ? iglesiaId : null,
    })),
  });
  tokens = await Promise.all(
    ids.map(async (_, i) => {
      const r = await request(app)
        .post("/api/v1/auth/login")
        .send({ identificador: "rf05-" + i, password });
      expect(r.status).toBe(200);
      return r.body.accessToken;
    }),
  );
});
async function limpiar() {
  await db.iglesia.deleteMany({ where: { id: nuevaIglesia } });
  await db.importacionLocalidades.deleteMany();
  await db.localidad.deleteMany({
    where: { clave: { notIn: inicial.map((v) => v.clave) } },
  });
  for (const v of inicial)
    await db.localidad.update({ where: { clave: v.clave }, data: v });
}
beforeEach(async () => {
  await limpiar();
  fuente = { ...oficial };
});
afterAll(async () => {
  await limpiar();
  await db.sesion.deleteMany({ where: { usuarioId: { in: ids } } });
  await db.usuario.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
});
const preparar = () => servicio.preparar(ambito, principal);
const aplicar = (id: string) =>
  servicio.aplicar(id, "Actualización oficial revisada", principal);
const revertir = (id: string) =>
  servicio.revertir(id, "Reversión técnica revisada", principal);
const post = (path: string, b: object, t = 0) =>
  request(app).post(path).auth(tokens[t], { type: "bearer" }).send(b);
function cambiarFuente(editar: (v: ReturnType<typeof JSON.parse>) => void) {
  const v = JSON.parse(raw);
  editar(v);
  fuente.original = JSON.stringify(v);
}
describe("RF05 importación oficial con PostgreSQL", () => {
  it("snapshot conserva bytes/hash, metadatos y 144 claves oficiales únicas", async () => {
    const f = await new DescargaInegi().descargar(ambito);
    const m = JSON.parse(
      readFileSync("prisma/fuentes/rf05/manifest.json", "utf8"),
    );
    expect(createHash("sha256").update(f.original).digest("hex")).toBe(
      m.sha256,
    );
    expect(validarLocalidades(ambito, f)).toHaveLength(144);
    expect(await db.estado.count()).toBe(32);
    expect(await db.municipio.count()).toBe(2478);
  });
  it("vista previa no escribe localidades y conserva original consultable", async () => {
    const l = await preparar();
    expect(l.diferencias.altas).toHaveLength(143);
    expect(l.diferencias.sinCambio).toBe(1);
    expect(l.metadatos).toContain("2020");
    expect(l.periodos).toEqual(["2015-06-01", "2017-02-28"]);
    expect(await servicio.original(l.id, principal)).toBe(raw);
    expect(await db.localidad.findMany({ orderBy: { clave: "asc" } })).toEqual(
      inicial,
    );
    expect((await preparar()).id).toBe(l.id);
  });
  it("aplicación idempotente conserva iglesias y seed posterior no deshace nombres", async () => {
    const iglesias = await db.iglesia.findMany();
    cambiarFuente((v) => {
      v.datos[0].nomgeo = "Nombre sintético para probar corrección";
    });
    const l = await preparar();
    expect(l.diferencias.cambios).toHaveLength(1);
    await aplicar(l.id);
    await aplicar(l.id);
    await importarFuentes(db, cargarFuentes("prisma/fuentes"));
    expect(await db.localidad.count()).toBe(144);
    expect(
      (await db.localidad.findUniqueOrThrow({ where: { clave: "211140001" } }))
        .nombre,
    ).toContain("sintético");
    expect(await db.iglesia.findMany()).toEqual(iglesias);
    expect(await db.importacionLocalidades.count()).toBe(1);
    const l2 = await preparar();
    expect(l2.diferencias.altas).toHaveLength(0);
    expect(l2.diferencias.cambios).toHaveLength(0);
  });
  it("ausencias no borran ni reclasifican localidades históricas", async () => {
    await aplicar((await preparar()).id);
    cambiarFuente((v) => {
      v.datos = v.datos.slice(0, 1);
      v.numReg = 1;
    });
    const l = await preparar();
    expect(l.diferencias.ausentesConservadas).toHaveLength(143);
    await aplicar(l.id);
    expect(await db.localidad.count()).toBe(144);
  });
  it("localidad oficial añadida aparece en selector y admite registro HTTP consistente", async () => {
    const l = await preparar();
    await aplicar(l.id);
    const alta = l.diferencias.altas[0];
    const form = await request(app)
      .get("/personal/iglesias/nueva")
      .auth(tokens[0], { type: "bearer" });
    expect(form.status).toBe(200);
    expect(form.text).toContain(alta.clave);
    const r = await post("/api/v1/iglesias", {
      nombre: "Iglesia ficticia RF05",
      tipoId: (await db.tipoIglesia.findFirstOrThrow()).id,
      estadoClave: alta.estadoClave,
      municipioClave: alta.municipioClave,
      localidadClave: alta.localidadClave,
      direccion: "Dirección ficticia",
    });
    expect(r.status, r.text).toBe(201);
    await db.iglesia.delete({ where: { id: r.body.id } });
  });
  it("fallo de auditoría de rollback revierte eliminaciones y conserva estado aplicado", async () => {
    const l = await preparar();
    await aplicar(l.id);
    const c = new Client({ connectionString: process.env.DATABASE_URL });
    await c.connect();
    try {
      await c.query(
        `CREATE FUNCTION rf05_fallo_rollback() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Fallo sintético'; END $$; CREATE TRIGGER rf05_fallo_rollback BEFORE UPDATE ON "ImportacionLocalidades" FOR EACH ROW EXECUTE FUNCTION rf05_fallo_rollback()`,
      );
      await expect(revertir(l.id)).rejects.toThrow();
      expect(await db.localidad.count()).toBe(144);
      expect((await repo.obtener(l.id)).estado).toBe("APLICADA");
    } finally {
      await c.query(
        'DROP TRIGGER rf05_fallo_rollback ON "ImportacionLocalidades"; DROP FUNCTION rf05_fallo_rollback()',
      );
      await c.end();
    }
  });
  it("vista previa obsoleta 409 sin escrituras ni auditoría aplicada", async () => {
    const l = await preparar();
    await db.localidad.update({
      where: { clave: "211140001" },
      data: { nombre: "Cambio simultáneo" },
    });
    await expect(aplicar(l.id)).rejects.toMatchObject({ status: 409 });
    expect(await db.localidad.count()).toBe(1);
    expect((await repo.obtener(l.id)).estado).toBe("PREVIA");
  });
  it("dos aplicaciones concurrentes compiten con vista previa, solo una cambia", async () => {
    const l1 = await preparar();
    cambiarFuente((v) => {
      v.datos[0].nomgeo = "Versión sintética distinta";
    });
    const l2 = await preparar();
    const resultados = await Promise.allSettled([
      aplicar(l1.id),
      aplicar(l2.id),
    ]);
    expect(resultados.filter((v) => v.status === "fulfilled")).toHaveLength(1);
    expect(resultados.filter((v) => v.status === "rejected")).toHaveLength(1);
    expect(await db.localidad.count()).toBe(144);
  });
  it("fallo de auditoría revierte todas las altas y cambios", async () => {
    const l = await preparar();
    const c = new Client({ connectionString: process.env.DATABASE_URL });
    await c.connect();
    try {
      await c.query(
        `CREATE FUNCTION rf05_fallo() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Fallo sintético'; END $$; CREATE TRIGGER rf05_fallo BEFORE UPDATE ON "ImportacionLocalidades" FOR EACH ROW EXECUTE FUNCTION rf05_fallo()`,
      );
      await expect(aplicar(l.id)).rejects.toThrow();
      expect(
        await db.localidad.findMany({ orderBy: { clave: "asc" } }),
      ).toEqual(inicial);
      expect((await repo.obtener(l.id)).estado).toBe("PREVIA");
    } finally {
      await c.query(
        'DROP TRIGGER rf05_fallo ON "ImportacionLocalidades"; DROP FUNCTION rf05_fallo()',
      );
      await c.end();
    }
  });
  it("rollback restaura nombres/procedencia, conserva original e historia e idempotencia", async () => {
    cambiarFuente((v) => {
      v.datos[0].nomgeo = "Nombre sintético temporal";
    });
    const l = await preparar();
    await aplicar(l.id);
    await revertir(l.id);
    await revertir(l.id);
    expect(await db.localidad.findMany({ orderBy: { clave: "asc" } })).toEqual(
      inicial,
    );
    const historial = await db.importacionLocalidades.findUniqueOrThrow({
      where: { id: l.id },
    });
    expect(historial.estado).toBe("REVERTIDA");
    expect(historial.aplicadoPor).toBe(ids[0]);
    expect(historial.revertidaPor).toBe(ids[0]);
    expect(historial.original).toBe(fuente.original);
    await expect(aplicar(l.id)).rejects.toMatchObject({ status: 409 });
  });
  it("rollback bloquea localidad en uso y conserva iglesias incluso cerradas", async () => {
    const l = await preparar();
    await aplicar(l.id);
    const alta = l.diferencias.altas[0];
    await db.iglesia.create({
      data: {
        id: nuevaIglesia,
        nombre: "Iglesia sintética",
        nombreBusqueda: "iglesia sintetica",
        tipoId: (await db.tipoIglesia.findFirstOrThrow()).id,
        estadoClave: alta.estadoClave,
        municipioClave: alta.municipioClave,
        localidadClave: alta.localidadClave,
        direccion: "Dirección de prueba",
        cerradaDesde: new Date(),
      },
    });
    await expect(revertir(l.id)).rejects.toMatchObject({
      status: 409,
      code: "LOCALIDAD_EN_USO",
    });
    expect(await db.localidad.count()).toBe(144);
    expect((await repo.obtener(l.id)).estado).toBe("APLICADA");
    expect(
      await db.iglesia.findUnique({ where: { id: nuevaIglesia } }),
    ).not.toBeNull();
  });
  it("rollback exige orden inverso y detecta cambios posteriores", async () => {
    const l1 = await preparar();
    await aplicar(l1.id);
    const l2 = await preparar();
    await aplicar(l2.id);
    await expect(revertir(l1.id)).rejects.toMatchObject({ status: 409 });
    await revertir(l2.id);
    await revertir(l1.id);
    expect(await db.localidad.count()).toBe(1);
    const l3 = await preparar();
    await aplicar(l3.id);
    await db.localidad.update({
      where: { clave: "211140001" },
      data: { nombre: "Cambio posterior" },
    });
    await expect(revertir(l3.id)).rejects.toMatchObject({ status: 409 });
  });
  it.each([
    "duplicados",
    "conteo",
    "otro municipio",
    "clave",
    "estatus",
    "vacío",
    "JSON",
    "URL",
    "fecha",
    "metadatos",
  ])("rechaza fuente incompatible: %s", async (caso) => {
    if (caso === "URL") fuente.fuente = "https://ajeno.invalid/21114";
    else if (caso === "fecha") fuente.consulta = "9999-01-01";
    else if (caso === "JSON") fuente.original = "<html>error</html>";
    else
      cambiarFuente((v) => {
        if (caso === "duplicados") {
          v.datos.push(v.datos[0]);
          v.numReg++;
        }
        if (caso === "conteo") v.numReg++;
        if (caso === "otro municipio") {
          v.datos[0].cve_mun = "119";
          v.datos[0].cvegeo = "211190001";
        }
        if (caso === "clave") v.datos[0].cvegeo = "211140002";
        if (caso === "estatus") v.datos[0].estatus = 0;
        if (caso === "vacío") {
          v.datos = [];
          v.numReg = 0;
        }
        if (caso === "metadatos") v.metadatos = {};
      });
    await expect(preparar()).rejects.toThrow();
    expect(await db.importacionLocalidades.count()).toBe(0);
    expect(await db.localidad.count()).toBe(1);
  });
  it("PostgreSQL rechaza jerarquía, clave duplicada y padres borrados", async () => {
    const alta = validarLocalidades(ambito, oficial)[1];
    await expect(
      db.localidad.create({
        data: { ...alta, estadoClave: "99", clave: "99" + alta.clave.slice(2) },
      }),
    ).rejects.toThrow();
    await expect(
      db.localidad.create({ data: { ...alta, clave: "211140002" } }),
    ).rejects.toThrow();
    await db.localidad.create({ data: alta });
    await expect(db.localidad.create({ data: alta })).rejects.toThrow();
    await expect(
      db.municipio.delete({ where: { clave: "21114" } }),
    ).rejects.toThrow();
  });
  it("API/UI 401/403 para consulta, detalle, original y mutaciones", async () => {
    const l = await preparar();
    for (const path of [
      url,
      url + "/" + l.id,
      url + "/" + l.id + "/original",
      "/personal/catalogos/localidades",
      "/personal/catalogos/localidades/" + l.id,
    ]) {
      expect((await request(app).get(path)).status).toBe(401);
      for (const t of [1, 2])
        expect(
          (await request(app).get(path).auth(tokens[t], { type: "bearer" }))
            .status,
        ).toBe(403);
    }
    for (const [path, b] of [
      [url, ambito],
      [url + "/" + l.id + "/aplicar", { motivo: "Prueba válida" }],
      [url + "/" + l.id + "/revertir", { motivo: "Prueba válida" }],
    ] as const) {
      expect((await request(app).post(path).send(b)).status).toBe(401);
      for (const t of [1, 2]) expect((await post(path, b, t)).status).toBe(403);
    }
    expect(
      (
        await db.importacionLocalidades.findUniqueOrThrow({
          where: { id: l.id },
        })
      ).estado,
    ).toBe("PREVIA");
  });
  it("API valida ámbito/entrada estricta y expone el original exacto solo a Coordinación", async () => {
    const contrato = JSON.parse(
      readFileSync("docs/api-referencia-revision03.json", "utf8"),
    );
    const ajv = new Ajv2020({ strict: false, validateFormats: false });
    ajv.addSchema({ $id: "rf05", components: contrato.components });
    for (const b of [
      { ...ambito, rol: "COORDINACION" },
      { ...ambito, municipioClave: "000" },
      { ...ambito, estadoClave: "99" },
      { ...ambito, municipioClave: "999" },
    ])
      expect((await post(url, b)).status).toBe(422);
    const r = await post(url, ambito);
    expect(r.status).toBe(201);
    expect(
      ajv.validate(
        { $ref: "rf05#/components/schemas/ImportacionLocalidades" },
        r.body,
      ),
      JSON.stringify(ajv.errors),
    ).toBe(true);
    expect(
      (
        await request(app)
          .get(url + "/" + r.body.id + "/original")
          .auth(tokens[0], { type: "bearer" })
      ).text,
    ).toBe(raw);
    expect(
      (await post(url + "/" + r.body.id + "/aplicar", { motivo: "abc" }))
        .status,
    ).toBe(422);
    expect(
      (
        await post(url + "/" + r.body.id + "/aplicar", {
          motivo: "Prueba válida",
        })
      ).status,
    ).toBe(200);
    const listado = await request(app)
      .get(url)
      .auth(tokens[0], { type: "bearer" });
    expect(listado.body.data).toHaveLength(1);
    expect(
      ajv.validate(
        { $ref: "rf05#/components/schemas/ImportacionesLocalidades" },
        listado.body,
      ),
      JSON.stringify(ajv.errors),
    ).toBe(true);
    expect(
      (
        await request(app)
          .get(url + "/" + randomUUID())
          .auth(tokens[0], { type: "bearer" })
      ).status,
    ).toBe(404);
  });
  it("CSRF/Origin y escape EJS: formulario/revisión/confirmación/reversión reales", async () => {
    const login = await request(app)
      .post("/personal/login")
      .set("Origin", config.origin)
      .type("form")
      .send({ identificador: "rf05-0", password });
    const cookie = login.headers["set-cookie"][0].split(";")[0];
    const web = "/personal/catalogos/localidades";
    const page = await request(app).get(web).set("Cookie", cookie);
    expect(page.status).toBe(200);
    expect(page.text).toContain("Cargar municipios");
    const csrf = page.text.match(/name="_csrf" value="([^"]+)"/)![1];
    expect(
      (
        await request(app)
          .post(web)
          .set("Cookie", cookie)
          .type("form")
          .send({ ...ambito, _csrf: csrf })
      ).status,
    ).toBe(403);
    cambiarFuente((v) => {
      v.datos[0].nomgeo = "<script>alert(1)</script>";
    });
    const envio = await request(app)
      .post(web)
      .set("Cookie", cookie)
      .set("Origin", config.origin)
      .type("form")
      .send({ ...ambito, _csrf: csrf });
    expect(envio.status).toBe(303);
    const vista = await request(app)
      .get(envio.headers.location)
      .set("Cookie", cookie);
    expect(vista.text).toContain("&lt;script&gt;");
    expect(vista.text).not.toContain("<script>");
    expect(vista.headers["content-security-policy"]).toContain(
      "script-src 'none'",
    );
    for (const accion of ["aplicar", "revertir"]) {
      expect(
        (
          await request(app)
            .post(envio.headers.location + "/" + accion)
            .set("Cookie", cookie)
            .set("Origin", "https://ajeno.invalid")
            .type("form")
            .send({ _csrf: csrf, motivo: "Revisión sintética" })
        ).status,
      ).toBe(403);
      expect(
        (
          await request(app)
            .post(envio.headers.location + "/" + accion)
            .set("Cookie", cookie)
            .set("Origin", config.origin)
            .type("form")
            .send({ _csrf: csrf, motivo: "Revisión sintética" })
        ).status,
      ).toBe(303);
    }
  });
  it("fallo remoto y hash alterado no generan vista previa", async () => {
    await expect(
      new DescargaInegi().descargar({ ...ambito, municipioClave: "119" }),
    ).rejects.toMatchObject({ status: 422 });
    const remoto = new DescargaInegi(async () => {
      throw new Error("Red no disponible");
    });
    await expect(
      new ServicioImportacion(repo, remoto).preparar(
        { ...ambito, origen: "INEGI" },
        principal,
      ),
    ).rejects.toMatchObject({ status: 502 });
    const l = await preparar();
    await db.importacionLocalidades.update({
      where: { id: l.id },
      data: { sha256: "0".repeat(64) },
    });
    await expect(aplicar(l.id)).rejects.toMatchObject({ status: 409 });
    expect(await db.localidad.count()).toBe(1);
  });
  it("descarga usa URL fija, sin redirección, límite y UTF-8 comprobados", async () => {
    const fake = new DescargaInegi(async (url, options) => {
      expect(url).toBe(oficial.fuente);
      expect(options?.redirect).toBe("error");
      return new Response(raw, {
        headers: { "Content-Type": "application/json" },
      });
    });
    expect(
      (await fake.descargar({ ...ambito, origen: "INEGI" })).original,
    ).toBe(raw);
    for (const response of [
      new Response("error", { status: 503 }),
      new Response("<html>", { headers: { "Content-Type": "text/html" } }),
      new Response(" ".repeat(MAX_BYTES_INEGI + 1), {
        headers: { "Content-Type": "application/json" },
      }),
      new Response(new Uint8Array([255]), {
        headers: { "Content-Type": "application/json" },
      }),
    ])
      await expect(
        new DescargaInegi(async () => response).descargar({
          ...ambito,
          origen: "INEGI",
        }),
      ).rejects.toMatchObject({ status: 502 });
  });
  it("undécima migración conserva diez esquemas, rechaza huérfanos sin inventar padres", async () => {
    const c = new Client({ connectionString: process.env.DATABASE_URL });
    await c.connect();
    try {
      await c.query(
        "CREATE SCHEMA rf05_upgrade; SET search_path TO rf05_upgrade",
      );
      const migrations = readdirSync("prisma/migrations")
        .filter((v) => /^\d/.test(v))
        .sort();
      for (const m of migrations.slice(0, 10))
        await c.query(
          readFileSync(`prisma/migrations/${m}/migration.sql`, "utf8"),
        );
      const original = JSON.parse(
        readFileSync("prisma/fuentes/inegi-localidad.json", "utf8"),
      ).datos[0];
      await c.query('INSERT INTO "Localidad" VALUES ($1,$2,$3,$4,$5,$6,$7)', [
        original.cvegeo,
        original.cve_ent,
        original.cve_mun,
        original.cve_loc,
        original.nomgeo,
        oficial.fuente,
        oficial.consulta,
      ]);
      const sql = readFileSync(
        `prisma/migrations/${migrations[10]}/migration.sql`,
        "utf8",
      );
      await expect(c.query(sql)).rejects.toThrow();
      expect(
        (await c.query('SELECT count(*)::int AS n FROM "Municipio"')).rows[0].n,
      ).toBe(0);
      await c.query('INSERT INTO "Estado" VALUES ($1,$2)', ["21", "Puebla"]);
      await c.query('INSERT INTO "Municipio" VALUES ($1,$2,$3,$4)', [
        "21114",
        "21",
        "114",
        "Puebla",
      ]);
      const antes = (await c.query('SELECT * FROM "Localidad"')).rows;
      await c.query(sql);
      expect((await c.query('SELECT * FROM "Localidad"')).rows).toEqual(antes);
      expect(
        (await c.query('SELECT "criterioId" FROM "ConfiguracionIndice"'))
          .rows[0].criterioId,
      ).toBe("caso-v1");
    } finally {
      await c.query(
        "SET search_path TO public; DROP SCHEMA IF EXISTS rf05_upgrade CASCADE",
      );
      await c.end();
    }
  });
});
