import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { randomUUID, createHash } from "node:crypto";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PrismaClient, type Iglesia } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Ajv2020 } from "ajv/dist/2020.js";
import { createApp } from "../src/composition/app.js";
import {
  cargarFuentes,
  importarFuentes,
} from "../src/modules/iglesias/infrastructure/fuentes-inegi.js";
import { Client } from "pg";
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
const password = "Solo prueba ficticia iglesias!";
const own = randomUUID(),
  other = randomUUID(),
  missing = randomUUID();
const form = {
  nombre: "Capilla nueva ficticia",
  tipoId: "10000000-0000-4000-8000-000000000005",
  ubicacion: "211140001",
  direccion: "Calle ficticia 25",
  capacidad: "125",
  anioConstruccion: "1900",
  contacto: "",
  latitud: "",
  longitud: "",
  zonaIana: "",
};
let app: ReturnType<typeof createApp>, hash: string, inicial: Iglesia[];
const schema = JSON.parse(
  readFileSync("docs/api-referencia-revision03.json", "utf8"),
);
const ajv = new Ajv2020({ strict: false, validateFormats: false });
ajv.addSchema({ $id: "catalogos", components: schema.components });
beforeAll(async () => {
  hash = await bcrypt.hash(password, 12);
  inicial = await db.iglesia.findMany();
});
beforeEach(async () => {
  await db.usuario.deleteMany();
  await db.iglesia.deleteMany();
  await db.iglesia.createMany({
    data: [own, other].map((id, i) => ({
      ...inicial[0],
      id,
      nombre: i ? "Otra iglesia ficticia" : "Iglesia propia ficticia",
      nombreBusqueda: i ? "otra" : "propia",
      version: 1,
      cerradaDesde: null,
    })),
  });
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
  await db.iglesia.deleteMany();
  await db.iglesia.createMany({ data: inicial });
  await db.$disconnect();
});
async function sesion(identificador = "coordinacion") {
  const r = await request(app)
    .post("/personal/login")
    .set("Origin", config.origin)
    .type("form")
    .send({ identificador, password });
  expect(r.status).toBe(303);
  const cookie = (r.headers["set-cookie"] as unknown as string[])
    .map((v) => v.split(";")[0])
    .join("; ");
  const panel = await request(app).get("/personal").set("Cookie", cookie);
  const csrf = panel.text.match(/name="_csrf" value="([^"]+)"/)![1];
  return { cookie, csrf };
}
async function guardar(
  s: { cookie: string; csrf: string },
  datos: object = form,
  id?: string,
) {
  return request(app)
    .post("/personal/iglesias/" + (id ? id + "/editar" : "nueva"))
    .set("Cookie", s.cookie)
    .set("Origin", config.origin)
    .type("form")
    .send({ _csrf: s.csrf, ...datos });
}
describe("gestión EJS con sesión real y PostgreSQL", () => {
  it("campos opcionales vacíos conservan sus datos previos al editar", async () => {
    const s = await sesion("administrador");
    await db.iglesia.update({
      where: { id: own },
      data: {
        capacidad: 75,
        contacto: "Contacto ficticio",
        latitud: 19,
        longitud: -98,
      },
    });
    const r = await guardar(s, { ...form, capacidad: "", version: "1" }, own);
    expect(r.status).toBe(303);
    expect(
      await db.iglesia.findUniqueOrThrow({ where: { id: own } }),
    ).toMatchObject({
      capacidad: 75,
      contacto: "Contacto ficticio",
      latitud: 19,
      longitud: -98,
      version: 2,
    });
  });
  it("errores de tamaño y sintaxis conservan el estado HTTP y muestran una página segura", async () => {
    const s = await sesion();
    const vacio = await request(app)
      .post("/personal/iglesias/nueva")
      .set("Cookie", s.cookie)
      .set("Origin", config.origin)
      .set("X-CSRF-Token", s.csrf);
    expect(vacio.status).toBe(422);
    expect(vacio.text).toContain("Revise el formulario");
    const grande = await request(app)
      .post("/personal/iglesias/nueva")
      .type("form")
      .send({ nombre: "x".repeat(17000) });
    expect(grande.status).toBe(413);
    expect(grande.text).toContain("Entrada demasiado grande");
    const json = await request(app)
      .post("/personal/iglesias/nueva")
      .set("Content-Type", "application/json")
      .send("{mal");
    expect(json.status).toBe(400);
    expect(json.text).toContain("Solicitud inválida");
  });
  it("Coordinación lista, registra, recibe confirmación y edita con versión", async () => {
    const s = await sesion();
    const lista = await request(app)
      .get("/personal/iglesias?pageSize=1")
      .set("Cookie", s.cookie);
    expect(lista.status).toBe(200);
    expect(lista.text).toContain("Registrar iglesia");
    expect(lista.text).toContain("Siguiente");
    const siguiente = await request(app)
      .get("/personal/iglesias?pageSize=1&page=2")
      .set("Cookie", s.cookie);
    expect(siguiente.text).toContain("Anterior");
    const alta = await guardar(s);
    expect(alta.status).toBe(303);
    const id = alta.headers.location.split("/")[3];
    const confirmacion = await request(app)
      .get(alta.headers.location)
      .set("Cookie", s.cookie);
    expect(confirmacion.status).toBe(200);
    expect(confirmacion.text).toContain("Iglesia guardada");
    expect(confirmacion.text).toContain("Heroica Puebla de Zaragoza");
    expect(confirmacion.text).toContain('name="version" value="1"');
    expect(
      (
        await guardar(
          s,
          {
            ...form,
            nombre: "Nombre editado",
            version: "1",
            capacidad: "0",
            latitud: "0",
            longitud: "-98.2",
            zonaIana: "America/Mexico_City",
          },
          id,
        )
      ).status,
    ).toBe(303);
    const fila = await db.iglesia.findUniqueOrThrow({ where: { id } });
    expect(fila).toMatchObject({
      nombre: "Nombre editado",
      capacidad: 0,
      latitud: 0,
      longitud: -98.2,
      version: 2,
    });
    const ficha = await request(app).get("/iglesias/" + id);
    expect(ficha.text).toContain("Nombre editado");
  });
  it("administrador ve y edita solo su iglesia; tesorero no tiene enlace ni gestión", async () => {
    const s = await sesion("administrador");
    const lista = await request(app)
      .get("/personal/iglesias")
      .set("Cookie", s.cookie);
    expect(lista.status).toBe(200);
    expect(lista.text).toContain(own);
    expect(lista.text).not.toContain(other);
    expect(lista.text).not.toContain("Registrar iglesia");
    expect((await guardar(s, { ...form, version: "1" }, own)).status).toBe(303);
    expect(
      (await db.iglesia.findUniqueOrThrow({ where: { id: own } })).version,
    ).toBe(2);
    const t = await sesion("tesorero");
    expect(
      (await request(app).get("/personal").set("Cookie", t.cookie)).text,
    ).not.toContain("Gestionar iglesias");
    expect(
      (await request(app).get("/personal/iglesias").set("Cookie", t.cookie))
        .status,
    ).toBe(403);
  });
  it.each(["administrador", "tesorero"])(
    "%s no puede dar altas ni editar otra iglesia aunque manipule ruta y cuerpo",
    async (rol) => {
      const s = await sesion(rol);
      expect(
        (
          await request(app)
            .get("/personal/iglesias/nueva")
            .set("Cookie", s.cookie)
        ).status,
      ).toBe(403);
      expect((await guardar(s)).status).toBe(403);
      expect(
        (
          await request(app)
            .get(`/personal/iglesias/${other}/editar`)
            .set("Cookie", s.cookie)
        ).status,
      ).toBe(403);
      expect(
        (
          await guardar(
            s,
            { ...form, version: "1", rol: "COORDINACION", iglesiaId: own },
            other,
          )
        ).status,
      ).toBe(403);
      expect(await db.iglesia.count()).toBe(2);
      expect(
        (await db.iglesia.findUniqueOrThrow({ where: { id: other } })).version,
      ).toBe(1);
    },
  );
  it("anónimo recibe página de acceso requerida y ninguna escritura", async () => {
    expect((await request(app).get("/personal/iglesias")).status).toBe(401);
    expect((await request(app).get("/personal/iglesias/nueva")).text).toContain(
      "Iniciar sesión",
    );
    expect(
      (
        await request(app)
          .post("/personal/iglesias/nueva")
          .type("form")
          .send(form)
      ).status,
    ).toBe(401);
    expect(await db.iglesia.count()).toBe(2);
  });
  it.each(["ausente", "incorrecto", "origen"])(
    "rechaza CSRF/origen %s sin guardar",
    async (caso) => {
      const s = await sesion();
      const r = await request(app)
        .post("/personal/iglesias/nueva")
        .set("Cookie", s.cookie)
        .set(
          "Origin",
          caso === "origen" ? "https://ajeno.invalid" : config.origin,
        )
        .type("form")
        .send({
          ...form,
          ...(caso === "ausente"
            ? {}
            : { _csrf: caso === "incorrecto" ? "incorrecto" : s.csrf }),
        });
      expect(r.status).toBe(403);
      expect(r.headers["content-type"]).toContain("text/html");
      expect(await db.iglesia.count()).toBe(2);
    },
  );
  it.each([
    { nombre: "" },
    { nombre: "x".repeat(201) },
    { direccion: "" },
    { tipoId: randomUUID() },
    { ubicacion: "219990001" },
    { capacidad: "-1" },
    { capacidad: "no-numero" },
    { anioConstruccion: "2027" },
    { latitud: "19", longitud: "" },
    { latitud: "91", longitud: "0" },
    { zonaIana: "Zona/Inexistente" },
    { rol: "COORDINACION" },
    { version: "1" },
  ])(
    "rechaza datos inválidos y conserva campos de captura: %j",
    async (cambio) => {
      const s = await sesion();
      const r = await guardar(s, { ...form, ...cambio });
      expect(r.status).toBe(422);
      expect(r.text).toContain("Revise el formulario");
      if (cambio.direccion === "") expect(r.text).toContain(form.nombre);
      else expect(r.text).toContain(form.direccion);
      expect(r.text).toContain('name="_csrf"');
      expect(await db.iglesia.count()).toBe(2);
    },
  );
  it("exige versión al editar", async () => {
    const s = await sesion();
    expect((await guardar(s, form, own)).status).toBe(422);
    expect((await guardar(s, { ...form, version: "0" }, own)).status).toBe(422);
    expect(
      (await db.iglesia.findUniqueOrThrow({ where: { id: own } })).version,
    ).toBe(1);
  });
  it("dos ediciones concurrentes solo permiten una, preservan datos perdedores y no sobrescriben", async () => {
    const s = await sesion();
    const respuestas = await Promise.all(
      ["Primera", "Segunda"].map((nombre) =>
        guardar(s, { ...form, version: "1", nombre }, own),
      ),
    );
    expect(respuestas.map((r) => r.status).sort()).toEqual([303, 409]);
    const conflicto = respuestas.find((r) => r.status === 409)!;
    expect(conflicto.text).toContain("cargue la versión actual");
    expect(conflicto.text).toContain('name="version" value="1"');
    const fila = await db.iglesia.findUniqueOrThrow({ where: { id: own } });
    expect(fila.version).toBe(2);
    expect(fila.nombre).toBe(
      respuestas[0].status === 303 ? "Primera" : "Segunda",
    );
  });
  it("escapa XSS persistido y reflejado en formulario, listado y errores", async () => {
    const s = await sesion();
    const nombre = '<script>alert("x")</script>';
    expect(
      (await guardar(s, { ...form, version: "1", nombre }, own)).status,
    ).toBe(303);
    for (const ruta of [
      `/personal/iglesias/${own}/editar`,
      "/personal/iglesias",
      "/iglesias?estadoClave=21",
    ]) {
      const r = await request(app).get(ruta).set("Cookie", s.cookie);
      expect(r.status).toBe(200);
      expect(r.text).toContain("&lt;script&gt;");
      expect(r.text).not.toContain("<script>");
    }
    const invalido = await guardar(s, { ...form, nombre, capacidad: "-1" });
    expect(invalido.text).not.toContain("<script>");
    expect(invalido.text).toContain("&lt;script&gt;");
  });
  it("rechaza sesiones revocadas y aplica el nuevo rol guardado en BD", async () => {
    const s = await sesion();
    await db.usuario.update({
      where: { identificador: "coordinacion" },
      data: { rol: "TESORERO", iglesiaId: own },
    });
    expect((await guardar(s)).status).toBe(403);
    await db.sesion.deleteMany();
    expect((await guardar(s)).status).toBe(401);
  });
  it("no habilita gestión de cerradas, cierre ni reapertura", async () => {
    const s = await sesion();
    await db.iglesia.update({
      where: { id: own },
      data: { cerradaDesde: new Date() },
    });
    expect(
      (
        await request(app)
          .get(`/personal/iglesias/${own}/editar`)
          .set("Cookie", s.cookie)
      ).status,
    ).toBe(501);
    expect((await guardar(s, { ...form, version: "1" }, own)).status).toBe(501);
    expect(
      (
        await request(app)
          .post(`/api/v1/iglesias/${own}/reabrir`)
          .set("Cookie", s.cookie)
          .set("Origin", config.origin)
          .type("form")
          .send({ _csrf: s.csrf })
      ).status,
    ).toBe(501);
    expect((await request(app).get("/iglesias/" + own)).status).toBe(404);
  });
  it("UUID inválido y recurso ausente producen errores web comprensibles", async () => {
    const s = await sesion();
    expect(
      (
        await request(app)
          .get("/personal/iglesias/invalido/editar")
          .set("Cookie", s.cookie)
      ).status,
    ).toBe(422);
    expect(
      (
        await request(app)
          .get(`/personal/iglesias/${missing}/editar`)
          .set("Cookie", s.cookie)
      ).status,
    ).toBe(404);
    expect((await request(app).get("/iglesias?estadoClave=mal")).status).toBe(
      422,
    );
    const servicio = new ServicioIglesias(
      new PrismaRepositorioIglesias(db),
      2026,
    );
    await expect(servicio.formulario(undefined)).rejects.toMatchObject({
      status: 401,
    });
  });
});
describe("catálogos auténticos, contratos, selección y trazabilidad", () => {
  it("la migración aditiva conserva iglesias y usuarios de la versión anterior", async () => {
    const pg = new Client({ connectionString: process.env.DATABASE_URL! });
    await pg.connect();
    try {
      await pg.query(
        "BEGIN; CREATE SCHEMA prueba_migracion; SET LOCAL search_path TO prueba_migracion",
      );
      for (const migration of [
        "202611010001_referencia_iglesias",
        "202611010002_identidad",
      ])
        await pg.query(
          readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"),
        );
      await pg.query('INSERT INTO "Localidad" VALUES ($1,$2,$3,$4,$5,$6,$7)', [
        "211140001",
        "21",
        "114",
        "0001",
        "Localidad prueba",
        "Fixture",
        "2026-11-01",
      ]);
      await pg.query('INSERT INTO "TipoIglesia" VALUES ($1,$2)', [
        form.tipoId,
        "Capilla",
      ]);
      await pg.query(
        'INSERT INTO "Iglesia" ("id","nombre","nombreBusqueda","tipoId","estadoClave","municipioClave","localidadClave","direccion","version") VALUES ($1,$2,$2,$3,$4,$5,$6,$7,5)',
        [
          own,
          "Iglesia previa",
          form.tipoId,
          "21",
          "114",
          "0001",
          "Dirección ficticia",
        ],
      );
      await pg.query(
        'INSERT INTO "Usuario" ("id","identificador","passwordHash","rol","iglesiaId") VALUES ($1,$2,$3,$4,$5)',
        [randomUUID(), "administrador", hash, "ADMIN_IGLESIA", own],
      );
      await pg.query(
        readFileSync(
          "prisma/migrations/202611010003_catalogos/migration.sql",
          "utf8",
        ),
      );
      expect(
        (await pg.query('SELECT "nombre","version" FROM "Iglesia"')).rows,
      ).toEqual([{ nombre: "Iglesia previa", version: 5 }]);
      expect(
        (await pg.query('SELECT "iglesiaId" FROM "Usuario"')).rows[0].iglesiaId,
      ).toBe(own);
    } finally {
      await pg.query("ROLLBACK");
      await pg.end();
    }
  });
  it("reimportar es idempotente y una colisión de versión revierte todos los cambios", async () => {
    const f = cargarFuentes(resolve("prisma/fuentes"));
    await importarFuentes(db, f);
    expect(await db.estado.count()).toBe(32);
    expect(await db.catalogoVersion.count()).toBe(1);
    f.estados[0].nomgeo = "Nombre alterado de prueba";
    f.sha256 = "0".repeat(64);
    await expect(importarFuentes(db, f)).rejects.toThrow(
      "Versión INEGI ya usada",
    );
    expect(
      (
        await db.estado.findUniqueOrThrow({
          where: { clave: f.estados[0].cvegeo },
        })
      ).nombre,
    ).not.toBe("Nombre alterado de prueba");
  });
  it("conserva 32 estados, todos los municipios recibidos, seis tipos y una localidad con snapshot íntegro", async () => {
    const f = cargarFuentes(resolve("prisma/fuentes"));
    expect(await db.estado.count()).toBe(32);
    expect(await db.municipio.count()).toBe(f.municipios.length);
    expect(f.municipios.length).toBe(2478);
    const version = await db.catalogoVersion.findUniqueOrThrow({
      where: { version: f.manifest.version },
    });
    expect(version.sha256).toBe(f.sha256);
    expect(version.manifest).toEqual(f.manifest);
    expect(await db.localidad.count()).toBe(1);
    expect(await db.tipoIglesia.count()).toBe(6);
  });
  it("API pública paginada cumple su contrato, filtra municipios/localidades y expone versión", async () => {
    for (const [ruta, total] of [
      ["estados?pageSize=100", 32],
      ["municipios?estadoClave=21&pageSize=100", 217],
      ["localidades?estadoClave=21&municipioClave=114", 1],
      ["tipos-iglesia", 6],
    ] as const) {
      const r = await request(app).get("/api/v1/catalogos/" + ruta);
      expect(r.status).toBe(200);
      expect(r.body.meta.total).toBe(total);
      expect(
        ajv.validate(
          { $ref: "catalogos#/components/schemas/CatalogoPaginaLectura" },
          r.body,
        ),
        JSON.stringify(ajv.errors),
      ).toBe(true);
      expect(r.body.fuentes[0].sha256).toMatch(/^[a-f0-9]{64}$/);
    }
    const p1 = await request(app).get(
      "/api/v1/catalogos/municipios?estadoClave=21&pageSize=100",
    );
    const p2 = await request(app).get(
      "/api/v1/catalogos/municipios?estadoClave=21&pageSize=100&page=2",
    );
    expect(p2.body.data).toHaveLength(100);
    expect(
      p1.body.data
        .map((v: { id: string }) => v.id)
        .some((id: string) =>
          p2.body.data.some((v: { id: string }) => v.id === id),
        ),
    ).toBe(false);
    const vacio = await request(app).get(
      "/api/v1/catalogos/localidades?estadoClave=01&municipioClave=001",
    );
    expect(vacio.body.meta.total).toBe(0);
  });
  it.each([
    "municipios",
    "municipios?estadoClave=2",
    "localidades?estadoClave=21",
    "estados?pageSize=101",
    "estados?rol=COORDINACION",
    "estados?page=0",
  ])("rechaza consulta no válida %s", async (ruta) => {
    expect((await request(app).get("/api/v1/catalogos/" + ruta)).status).toBe(
      422,
    );
  });
  it("no publica otros catálogos ni permite mutaciones de tipos", async () => {
    expect((await request(app).get("/api/v1/catalogos/objetos")).status).toBe(
      404,
    );
    expect(
      (
        await request(app)
          .post("/api/v1/catalogos/tipos-iglesia")
          .send({ nombre: "Inventado" })
      ).status,
    ).toBe(404);
    expect(await db.tipoIglesia.count()).toBe(6);
  });
  it("selectores web muestran nombres oficiales y preservan filtros al paginar", async () => {
    await db.iglesia.updateMany({ data: { tipoId: form.tipoId } });
    const r = await request(app).get(
      "/iglesias?estadoClave=21&municipioClave=114&localidadClave=0001&tipoId=" +
        form.tipoId +
        "&nombre=&capacidadMin=&capacidadMax=&pageSize=1",
    );
    expect(r.status).toBe(200);
    expect(r.text).toContain("Heroica Puebla de Zaragoza");
    expect(r.text).toContain("Basílica");
    expect(r.text).toContain("municipioClave=114");
    expect(r.text).toContain("localidadClave=0001");
    expect(r.text).toContain("tipoId=");
  });
  it("PostgreSQL rechaza municipio con estado inexistente o clave incongruente", async () => {
    await expect(
      db.municipio.create({
        data: {
          clave: "99001",
          estadoClave: "99",
          codigo: "001",
          nombre: "Fixture inválido",
        },
      }),
    ).rejects.toThrow();
    await expect(
      db.municipio.create({
        data: {
          clave: "21000",
          estadoClave: "21",
          codigo: "001",
          nombre: "Fixture inválido",
        },
      }),
    ).rejects.toThrow();
  });
  it.each([
    "hash",
    "conteo",
    "duplicado",
    "fuente",
    "clave",
    "estado",
    "localidad",
  ])("rechaza fuente manipulada: %s antes de importar", async (caso) => {
    const folder = mkdtempSync(join(tmpdir(), "ecclesia-catalogo-"));
    try {
      cpSync("prisma/fuentes", folder, { recursive: true });
      const path = join(folder, "manifest.json");
      const m = JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
      if (caso === "hash") m.archivos[0].sha256 = "0".repeat(64);
      if (caso === "conteo") m.archivos[0].registros++;
      if (caso === "duplicado") m.archivos[1] = m.archivos[0];
      if (caso === "fuente")
        m.archivos[0].fuente = "https://ajeno.invalid/estados";
      if (["clave", "estado", "localidad"].includes(caso)) {
        const entry = m.archivos.find(
          (v: { archivo: string }) =>
            v.archivo ===
            (caso === "localidad"
              ? "inegi-localidad.json"
              : "inegi-municipios-21.json"),
        );
        const file = join(folder, entry.archivo);
        const body = JSON.parse(readFileSync(file, "utf8"));
        if (caso === "clave") body.datos[0].cvegeo = "21999";
        if (caso === "estado") {
          body.datos[0].cve_ent = "22";
          body.datos[0].cvegeo = "22" + body.datos[0].cve_mun;
        }
        if (caso === "localidad") {
          body.datos[0].cve_loc = "0002";
          body.datos[0].cvegeo = "211140002";
        }
        writeFileSync(file, JSON.stringify(body));
        entry.sha256 = createHash("sha256")
          .update(readFileSync(file))
          .digest("hex");
      }
      writeFileSync(path, JSON.stringify(m));
      expect(() => cargarFuentes(folder)).toThrow();
      expect(await db.estado.count()).toBe(32);
    } finally {
      rmSync(folder, { recursive: true, force: true });
    }
  });
});
