import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { readFileSync } from "node:fs";
import { Ajv2020 } from "ajv/dist/2020.js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createApp } from "../src/composition/app.js";
import { PrismaRepositorioIglesias } from "../src/modules/iglesias/infrastructure/prisma-repositorio.js";
import { ServicioIglesias } from "../src/modules/iglesias/application/servicio.js";
import { normalizar } from "../src/modules/iglesias/domain/iglesia.js";
import {
  crearInput,
  editarInput,
} from "../src/modules/iglesias/presentation/validacion.js";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
const secret = process.env.TEST_JWT_SECRET!;
const config = {
  allowExternal: true, // Regresión del adaptador externo anterior; standalone solo acepta sesiones persistidas.
  secret,
  issuer: "ecclesia-personal",
  audience: "ecclesia-api",
};
const app = createApp(db, config, 2026);
const api = JSON.parse(
  readFileSync("docs/api-referencia-revision03.json", "utf8"),
);
const ajv = new Ajv2020({ strict: false, validateFormats: false });
ajv.addSchema({ $id: "referencia", components: api.components });
function cumple(name: string, payload: unknown) {
  expect(
    ajv.validate({ $ref: `referencia#/components/schemas/${name}` }, payload),
    JSON.stringify(ajv.errors),
  ).toBe(true);
}
const base = "/api/v1/iglesias";
const own = "20000000-0000-4000-8000-000000000010";
const other = "20000000-0000-4000-8000-000000000011";
const missing = "20000000-0000-4000-8000-000000000099";
const data = {
  nombre: "Capilla de prueba",
  tipoId: "10000000-0000-4000-8000-000000000005",
  estadoClave: "21",
  municipioClave: "114",
  localidadClave: "0001",
  direccion: "Calle ficticia 10",
  capacidad: 100,
};
function token(
  rol = "COORDINACION",
  iglesiaId?: string,
  overrides: Record<string, unknown> = {},
) {
  return jwt.sign({ rol, iglesiaId, ...overrides }, secret, {
    algorithm: "HS256",
    subject: "personal-ficticio",
    issuer: config.issuer,
    audience: config.audience,
    expiresIn: "5m",
  });
}
const coord = () => `Bearer ${token()}`;
const admin = (id = own) => `Bearer ${token("ADMIN_IGLESIA", id)}`;
const patch = (id: string, body: object, bearer = admin()) =>
  request(app).patch(`${base}/${id}`).set("Authorization", bearer).send(body);
beforeAll(async () => {
  expect(await db.localidad.count()).toBe(1);
  expect(await db.tipoIglesia.count()).toBe(6);
  expect(await db.iglesia.count()).toBe(1); // Dos seeds no duplican.
});
beforeEach(async () => {
  await db.iglesia.deleteMany();
  await db.iglesia.create({
    data: {
      ...data,
      id: own,
      nombre: "Capilla ÁNGEL",
      nombreBusqueda: normalizar("Capilla ÁNGEL"),
    },
  });
  await db.iglesia.create({
    data: {
      ...data,
      id: other,
      nombre: "Templo Beta",
      nombreBusqueda: "templo beta",
      capacidad: 200,
    },
  });
});
afterAll(async () => {
  await db.$disconnect();
});

describe("contratos escolares: correspondencia verificable con Zod", () => {
  const nombres = [
    "Iglesia",
    "IglesiaInput",
    "IglesiaCreateInput",
    "IglesiaPatchInput",
    "IglesiaReferenciaCreateInput",
    "IglesiaReferenciaPatchInput",
  ];
  const contratos = ["openapi.yaml", "docs/api-referencia-revision03.json"].map(
    (archivo) => ({ archivo, api: JSON.parse(readFileSync(archivo, "utf8")) }),
  );
  const validador = new Ajv2020({ strict: false, validateFormats: false });
  const reglas = contratos.flatMap(({ archivo, api }) =>
    nombres.map((nombre) => ({
      etiqueta: `${archivo}: ${nombre}`,
      foto: validador.compile(
        api.components.schemas[nombre].properties.fotoUrl,
      ),
      descripcion: validador.compile(
        api.components.schemas[nombre].properties.descripcion,
      ),
    })),
  );
  function aceptaZod(campo: "fotoUrl" | "descripcion", valor: unknown) {
    const cambio = { [campo]: valor };
    const editar = editarInput.safeParse({ version: 1, ...cambio }).success;
    expect(crearInput.safeParse({ ...data, ...cambio }).success).toBe(editar);
    return editar;
  }
  it("los seis esquemas de ambos contratos mantienen campos opcionales, iguales y borrado mediante null", () => {
    for (const nombre of nombres) {
      const primero = contratos[0]!.api.components.schemas[nombre];
      const segundo = contratos[1]!.api.components.schemas[nombre];
      for (const campo of ["fotoUrl", "descripcion"] as const) {
        expect(primero.properties[campo]).toEqual(segundo.properties[campo]);
        for (const schema of [primero, segundo])
          expect(schema.required ?? []).not.toContain(campo);
        expect(aceptaZod(campo, null)).toBe(true);
      }
    }
    for (const regla of reglas) {
      expect(regla.foto(null), regla.etiqueta).toBe(true);
      expect(regla.descripcion(null), regla.etiqueta).toBe(true);
    }
    expect(
      editarInput.parse({ version: 1, nombre: data.nombre }),
    ).not.toHaveProperty("fotoUrl");
    expect(
      editarInput.parse({ version: 1, nombre: data.nombre }),
    ).not.toHaveProperty("descripcion");
  });
  it("Ajv y Zod rechazan HTTP, javascript, userinfo, fragmentos, IP literal, nombres locales y foto vacía", () => {
    for (const valor of [
      "http://example.org/foto.jpg",
      "HTTP://example.org/foto.jpg",
      "javascript:alert(1)",
      "data:image/png;base64,AA==",
      "file:///foto.jpg",
      "//example.org/foto.jpg",
      "https://usuario:clave@example.org/foto.jpg",
      "https://usuario@example.org/foto.jpg",
      "https://:clave@example.org/foto.jpg",
      "https://example.org/foto.jpg#fragmento",
      "https://example.org/foto.jpg#",
      "https://127.0.0.1/foto.jpg",
      "https://10.0.0.1/foto.jpg",
      "https://[::1]/foto.jpg",
      "https://2130706433/foto.jpg",
      "https://0x7f000001/foto.jpg",
      "https://localhost/foto.jpg",
      "https://foto.localhost/foto.jpg",
      "https://foto.local/foto.jpg",
      "https://FOTO.LOCAL./foto.jpg",
      "https://sub.foto.internal:443/foto.jpg",
      "https://foto.invalid/foto.jpg",
      "https://foto.test/foto.jpg",
      "https://foto.example/foto.jpg",
      "https://foto.onion/foto.jpg",
      "https://example.org:65536/foto.jpg",
      "https://example.org/una foto.jpg",
      "",
      " \t\n",
      42,
      false,
      {},
      "https://example.org/" + "a".repeat(701),
    ]) {
      expect(aceptaZod("fotoUrl", valor), JSON.stringify(valor)).toBe(false);
      for (const regla of reglas)
        expect(
          regla.foto(valor),
          `${regla.etiqueta}: ${JSON.stringify(valor)}`,
        ).toBe(false);
    }
  });
  it("Ajv y Zod aceptan HTTPS válida, puertos, mayúsculas, IDN y límite ASCII de 700", () => {
    const inicio = "https://example.org/";
    for (const valor of [
      "https://example.org",
      inicio,
      "https://sub-dominio.example.org/foto.jpg?v=1&ancho=800",
      "HTTPS://FOTO.EXAMPLE.ORG/a.JPG",
      "https://example.org.:443/foto.png",
      "https://example.org:65535/foto.jpg",
      "https://example.org:000443/foto.jpg",
      " https://example.org/foto.jpg ",
      "https://mañana.example.org/iglesia-á.jpg",
      "https://xn--maana-pta.example.org/a.jpg",
      "https://example.org/foto.jpg?correo=demo@example.org",
      'https://example.org/foto.jpg?q="demo"&a=1',
      "https://example.org/a?fragmento=%23",
      inicio + "a".repeat(700 - inicio.length),
    ]) {
      expect(aceptaZod("fotoUrl", valor), valor).toBe(true);
      for (const regla of reglas)
        expect(regla.foto(valor), `${regla.etiqueta}: ${valor}`).toBe(true);
    }
  });
  it("Ajv y Zod rechazan descripción vacía o solo espacios y conservan texto válido y null", () => {
    for (const valor of [
      "",
      " ",
      "\t\r\n",
      "\u00a0\u2003",
      "x".repeat(501),
      42,
      false,
      {},
    ]) {
      expect(aceptaZod("descripcion", valor)).toBe(false);
      for (const regla of reglas)
        expect(regla.descripcion(valor), regla.etiqueta).toBe(false);
    }
    for (const valor of [
      "Descripción ficticia",
      "  Texto con espacios exteriores  ",
      "<script>solo texto</script>",
      "x".repeat(500),
      null,
    ]) {
      expect(aceptaZod("descripcion", valor)).toBe(true);
      for (const regla of reglas)
        expect(regla.descripcion(valor), regla.etiqueta).toBe(true);
    }
  });
});

describe("consulta pública con PostgreSQL", () => {
  it("lista anónima, filtros inclusivos AND y búsqueda sin acentos/mayúsculas", async () => {
    const r = await request(app).get(base).query({
      estadoClave: "21",
      municipioClave: "114",
      localidadClave: "0001",
      nombre: "ANGel",
      tipoId: data.tipoId,
      capacidadMin: 100,
      capacidadMax: 100,
    });
    expect(r.status).toBe(200);
    expect(r.body.meta).toEqual({ page: 1, pageSize: 20, total: 1 });
    expect(r.body.data[0].id).toBe(own);
    cumple("Iglesia", r.body.data[0]);
    cumple("Meta", r.body.meta);
    expect(r.body.data[0]).not.toHaveProperty("nombreBusqueda");
  });
  it("paginación estable, filtro vacío y estado distinto", async () => {
    const r = await request(app).get(
      `${base}?estadoClave=21&page=2&pageSize=1`,
    );
    expect(r.status).toBe(200);
    expect(r.body.data[0].id).toBe(other);
    expect(r.body.meta.total).toBe(2);
    expect(
      (await request(app).get(`${base}?estadoClave=22`)).body.meta.total,
    ).toBe(0);
  });
  it("ficha básica sin bloques de otros dominios inventados", async () => {
    const r = await request(app).get(`${base}/${own}`);
    expect(r.status).toBe(200);
    expect(r.body.iglesia.version).toBe(1);
    cumple("FichaBasicaPublica", r.body);
    expect(r.body).not.toHaveProperty("servicios");
    expect(r.headers["cache-control"]).toBe("no-store");
  });
  it("no publica cerradas por lista ni por ID y conserva su registro", async () => {
    await db.iglesia.update({
      where: { id: own },
      data: { cerradaDesde: new Date("2026-01-01") },
    });
    expect(
      (await request(app).get(`${base}?estadoClave=21`)).body.meta.total,
    ).toBe(1);
    expect((await request(app).get(`${base}/${own}`)).status).toBe(404);
    expect(await db.iglesia.findUnique({ where: { id: own } })).not.toBeNull();
  });
  it("devuelve 404 para ficha inexistente", async () => {
    expect((await request(app).get(`${base}/${missing}`)).status).toBe(404);
  });
  it.each([
    "",
    "?estadoClave=2",
    "?estadoClave=21&page=0",
    "?estadoClave=21&pageSize=101",
    "?estadoClave=21&capacidadMin=200&capacidadMax=100",
    "?estadoClave=21&capacidadMin=-1",
    "?estadoClave=21&localidadClave=0001",
    "?estadoClave=21&rol=COORDINACION",
    "?estadoClave=21&nombre=a&nombre=b",
    "?estadoClave=21&capacidad=100",
  ])("rechaza consulta inválida %s", async (query) => {
    expect((await request(app).get(base + query)).status).toBe(422);
  });
  it("no interpreta texto SQL como una condición", async () => {
    const r = await request(app)
      .get(base)
      .query({ estadoClave: "21", nombre: "%' OR 1=1 --" });
    expect(r.status).toBe(200);
    expect(r.body.meta.total).toBe(0);
  });
  it("una búsqueda ordinaria sin coincidencias devuelve una lista vacía", async () => {
    const r = await request(app)
      .get(base)
      .query({ estadoClave: "21", nombre: "ZZZ" });
    expect(r.status).toBe(200);
    expect(r.body.meta.total).toBe(0);
    expect(r.body.data).toEqual([]);
  });
  it.each(["%", "_", "\\", "\\%", "\\_", "\\\\"])(
    "no devuelve nombres sin el texto literal %j",
    async (nombre) => {
      const r = await request(app)
        .get(base)
        .query({ estadoClave: "21", nombre });
      expect(r.status).toBe(200);
      expect(r.body.meta.total).toBe(0);
      expect(r.body.data).toEqual([]);
    },
  );
  it.each(["%", "_", "\\", "\\%", "\\_", "\\\\"])(
    "encuentra el texto literal %j con normalización, filtros y páginas",
    async (symbol) => {
      const ids = [];
      for (const suffix of ["Norte", "Sur"]) {
        const created = await request(app)
          .post(base)
          .set("Authorization", coord())
          .send({ ...data, nombre: `Capilla ÁNGEL ${symbol} ${suffix}` });
        expect(created.status).toBe(201);
        ids.push(created.body.id);
      }
      const decoy = await request(app)
        .post(base)
        .set("Authorization", coord())
        .send({ ...data, nombre: "Capilla ÁNGEL X Norte" });
      expect(decoy.status).toBe(201);
      const query = {
        estadoClave: "21",
        municipioClave: "114",
        localidadClave: "0001",
        tipoId: data.tipoId,
        nombre: `aNGeL ${symbol}`,
        capacidadMin: 100,
        capacidadMax: 100,
        pageSize: 1,
      };
      for (const page of [1, 2, 3]) {
        const r = await request(app)
          .get(base)
          .query({ ...query, page });
        expect(r.status).toBe(200);
        expect(r.body.meta).toEqual({ page, pageSize: 1, total: 2 });
        expect(r.body.data.map((row: { id: string }) => row.id)).toEqual(
          page <= 2 ? [ids[page - 1]] : [],
        );
      }
      const excluded = await request(app)
        .get(base)
        .query({ ...query, capacidadMin: 101, capacidadMax: 200 });
      expect(excluded.status).toBe(200);
      expect(excluded.body.meta.total).toBe(0);
      expect(excluded.body.data).toEqual([]);
    },
  );
});
describe("escritura mínima y persistencia", () => {
  it("alta completa de referencia y lectura desde un segundo cliente Prisma", async () => {
    const r = await request(app)
      .post(base)
      .set("Authorization", coord())
      .send({
        ...data,
        anioConstruccion: 1900,
        contacto: "Contacto ficticio",
        latitud: 19,
        longitud: -98,
        zonaIana: "America/Mexico_City",
      });
    expect(r.status).toBe(201);
    cumple("Iglesia", r.body);
    expect(r.headers.location).toBe(`${base}/${r.body.id}`);
    const independent = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
    });
    try {
      expect(
        (
          await independent.iglesia.findUniqueOrThrow({
            where: { id: r.body.id },
          })
        ).nombre,
      ).toBe(data.nombre);
    } finally {
      await independent.$disconnect();
    }
  });
  it("edita datos propios e incrementa versión atómicamente", async () => {
    const r = await patch(own, {
      version: 1,
      nombre: "Nuevo nombre",
      capacidad: 0,
    });
    expect(r.status).toBe(200);
    expect(r.body.version).toBe(2);
    cumple("Iglesia", r.body);
    expect(
      (await db.iglesia.findUniqueOrThrow({ where: { id: own } })).capacidad,
    ).toBe(0);
  });
  it("guarda y elimina descripción y foto opcionales, con persistencia y lectura de referencia", async () => {
    const fotoUrl =
      "https://upload.wikimedia.org/wikipedia/commons/a/ab/iglesia.jpg";
    const r = await patch(own, {
      version: 1,
      descripcion: "Una iglesia de demostración.",
      fotoUrl,
    });
    expect(r.status).toBe(200);
    expect(r.body.descripcion).toBe("Una iglesia de demostración.");
    expect(r.body.fotoUrl).toBe(fotoUrl);
    const stored = await db.iglesia.findUniqueOrThrow({ where: { id: own } });
    expect(stored.descripcion).toBe("Una iglesia de demostración.");
    expect(stored.fotoUrl).toBe(fotoUrl);
    const ficha = await request(app).get(base + "/" + own);
    expect(ficha.status).toBe(200);
    expect(ficha.body.iglesia.descripcion).toBe("Una iglesia de demostración.");
    cumple("Iglesia", r.body);
    cumple("FichaBasicaPublica", ficha.body);
    const lista = await request(app).get(base).query({ estadoClave: "21" });
    expect(
      lista.body.data.find((i: { id: string }) => i.id === own).fotoUrl,
    ).toBe(fotoUrl);
    const omitida = await patch(own, {
      version: 2,
      direccion: "Otra calle ficticia",
    });
    expect(omitida.body).toMatchObject({
      descripcion: stored.descripcion,
      fotoUrl,
    });
    expect((await patch(own, { version: 2, fotoUrl: null })).status).toBe(409);
    const limpia = await patch(own, {
      version: 3,
      descripcion: null,
      fotoUrl: null,
    });
    expect(limpia.status).toBe(200);
    const final = await db.iglesia.findUniqueOrThrow({ where: { id: own } });
    expect(final.descripcion).toBeNull();
    expect(final.fotoUrl).toBeNull();
  });
  it("rechaza fotos HTTP, credenciales, fragmentos y descripciones excesivas", async () => {
    for (const cambio of [
      { fotoUrl: "http://example.org/foto.jpg" },
      { fotoUrl: "https://usuario:clave@example.org/foto.jpg" },
      { fotoUrl: "https://example.org/foto.jpg#clave" },
      { fotoUrl: "https://example.org/foto.jpg#" },
      { fotoUrl: "javascript:alert(1)" },
      { fotoUrl: "data:image/png;base64,AA==" },
      { fotoUrl: "file:///foto.jpg" },
      { fotoUrl: "https://localhost/foto.jpg" },
      { fotoUrl: "https://foto.local/foto.jpg" },
      { fotoUrl: "https://127.0.0.1/foto.jpg" },
      { fotoUrl: "https://10.0.0.1/foto.jpg" },
      { fotoUrl: "https://[::1]/foto.jpg" },
      { fotoUrl: "https://example.org/una foto.jpg" },
      { fotoUrl: "https://example.org/" + "a".repeat(700) },
      { fotoUrl: "" },
      { fotoUrl: 42 },
      { descripcion: " " },
      { descripcion: "x".repeat(501) },
    ]) {
      expect((await patch(own, { version: 1, ...cambio })).status).toBe(422);
      expect(
        (await db.iglesia.findUniqueOrThrow({ where: { id: own } })).version,
      ).toBe(1);
    }
  });
  it("Coordinación registra campos nuevos y la matriz de roles protege su edición", async () => {
    const extras = {
      descripcion: "  Descripción de demostración  ",
      fotoUrl: " https://example.org/foto.jpg ",
    };
    const alta = await request(app)
      .post(base)
      .set("Authorization", coord())
      .send({ ...data, ...extras });
    expect(alta.status).toBe(201);
    expect(alta.body).toMatchObject({
      descripcion: extras.descripcion.trim(),
      fotoUrl: extras.fotoUrl.trim(),
    });
    cumple("Iglesia", alta.body);
    for (const bearer of [admin(other), `Bearer ${token("TESORERO", own)}`]) {
      expect((await patch(own, { version: 1, ...extras }, bearer)).status).toBe(
        403,
      );
    }
    // El emisor externo histórico no admite VISITANTE; requiere sesión real.
    expect(
      (
        await patch(
          own,
          { version: 1, ...extras },
          `Bearer ${token("VISITANTE")}`,
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await request(app)
          .patch(`${base}/${own}`)
          .send({ version: 1, ...extras })
      ).status,
    ).toBe(401);
    expect((await patch(own, { version: 1, ...extras }, coord())).status).toBe(
      200,
    );
    expect(
      (await db.iglesia.findUniqueOrThrow({ where: { id: other } })).version,
    ).toBe(1);
  });
  it("Coordinación edita conforme P092", async () => {
    expect(
      (
        await patch(
          other,
          { version: 1, direccion: "Nueva dirección" },
          coord(),
        )
      ).status,
    ).toBe(200);
  });
  it("rechaza versión obsoleta sin modificar ni incrementar", async () => {
    await patch(own, { version: 1, nombre: "Primero" });
    const r = await patch(own, { version: 1, nombre: "Obsoleto" });
    expect(r.status).toBe(409);
    expect(
      (await db.iglesia.findUniqueOrThrow({ where: { id: own } })).nombre,
    ).toBe("Primero");
  });
  it("dos escrituras concurrentes: una gana y otra recibe 409", async () => {
    const responses = await Promise.all([
      patch(own, { version: 1, nombre: "Uno" }),
      patch(own, { version: 1, nombre: "Dos" }),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(
      (await db.iglesia.findUniqueOrThrow({ where: { id: own } })).version,
    ).toBe(2);
  });
  it("FK geográfica y tipo inválidos rechazan sin insertar", async () => {
    for (const change of [{ municipioClave: "999" }, { tipoId: missing }]) {
      const r = await request(app)
        .post(base)
        .set("Authorization", coord())
        .send({ ...data, ...change });
      expect(r.status).toBe(422);
      expect(r.body.code).toBe("REFERENCIA_INVALIDA");
    }
    expect(await db.iglesia.count()).toBe(2);
  });
  it("edición con FK inválida revierte versión y resto de datos", async () => {
    expect(
      (await patch(own, { version: 1, tipoId: missing, nombre: "No persiste" }))
        .status,
    ).toBe(422);
    const row = await db.iglesia.findUniqueOrThrow({ where: { id: own } });
    expect(row.version).toBe(1);
    expect(row.nombre).toBe("Capilla ÁNGEL");
  });
  it("restricciones SQL sobreviven al acceso directo fuera de HTTP", async () => {
    await expect(
      db.iglesia.update({ where: { id: own }, data: { capacidad: -1 } }),
    ).rejects.toThrow();
    await expect(
      db.iglesia.update({
        where: { id: own },
        data: { latitud: 91, longitud: 0 },
      }),
    ).rejects.toThrow();
    await expect(
      db.iglesia.update({ where: { id: own }, data: { nombre: " " } }),
    ).rejects.toThrow();
    expect(
      (await db.iglesia.findUniqueOrThrow({ where: { id: own } })).version,
    ).toBe(1);
  });
  it("edición inexistente distingue 404 y política de cerrada sigue pendiente", async () => {
    expect(
      (await patch(missing, { version: 1, nombre: "X" }, coord())).status,
    ).toBe(404);
    await db.iglesia.update({
      where: { id: own },
      data: { cerradaDesde: new Date() },
    });
    expect((await patch(own, { version: 1, nombre: "X" })).status).toBe(409);
  });
  it.each([
    {},
    { nombre: " " },
    { ...data, nombre: "" },
    { ...data, capacidad: -1 },
    { ...data, capacidad: 1.5 },
    { ...data, latitud: 19 },
    { ...data, latitud: 91, longitud: 0 },
    { ...data, zonaIana: "Zona/Inexistente" },
    { ...data, anioConstruccion: 2027 },
    { ...data, rol: "COORDINACION" },
    { ...data, cerradaDesde: "2026-01-01" },
  ])("rechaza alta inválida %#", async (body) => {
    expect(
      (await request(app).post(base).set("Authorization", coord()).send(body))
        .status,
    ).toBe(422);
    expect(await db.iglesia.count()).toBe(2);
  });
  it.each([
    { version: 1 },
    { nombre: "Sin versión" },
    { version: 1, latitud: 10 },
    { version: 1, estadoClave: "2" },
  ])("rechaza patch inválido %#", async (body) => {
    expect((await patch(own, body)).status).toBe(422);
  });
});
describe("credenciales y permisos limitados por caso", () => {
  it("no admite altas anónimas ni por administrador/tesorero", async () => {
    expect((await request(app).post(base).send(data)).status).toBe(401);
    for (const bearer of [admin(), `Bearer ${token("TESORERO", own)}`])
      expect(
        (await request(app).post(base).set("Authorization", bearer).send(data))
          .status,
      ).toBe(403);
  });
  it("admin no edita otra iglesia y tesorero no edita", async () => {
    expect((await patch(other, { version: 1, nombre: "Ataque" })).status).toBe(
      403,
    );
    expect(
      (
        await patch(
          own,
          { version: 1, nombre: "Ataque" },
          `Bearer ${token("TESORERO", own)}`,
        )
      ).status,
    ).toBe(403);
  });
  it("ámbito en cuerpo no amplía permisos", async () => {
    expect(
      (await patch(other, { version: 1, nombre: "Ataque", iglesiaId: other }))
        .status,
    ).toBe(422);
    expect(
      (await db.iglesia.findUniqueOrThrow({ where: { id: other } })).version,
    ).toBe(1);
  });
  it.each([
    () => "corrupto",
    () =>
      jwt.sign({ rol: "COORDINACION" }, "clave-equivocada", {
        expiresIn: "5m",
      }),
    () => token("OTRO"),
    () => token("ADMIN_IGLESIA"),
    () =>
      token("COORDINACION", undefined, {
        roles: ["COORDINACION", "ADMIN_IGLESIA"],
      }),
    () => token("COORDINACION", undefined, { iglesiaIds: [own, other] }),
    () =>
      jwt.sign(
        {
          rol: "COORDINACION",
          sub: "x",
          iss: config.issuer,
          aud: config.audience,
          exp: 1,
        },
        secret,
      ),
    () =>
      jwt.sign(
        {
          rol: "COORDINACION",
          sub: "x",
          iss: "otro",
          aud: config.audience,
          exp: 9999999999,
        },
        secret,
      ),
    () =>
      jwt.sign(
        {
          rol: "COORDINACION",
          sub: "x",
          iss: config.issuer,
          aud: config.audience,
        },
        secret,
      ),
    () =>
      jwt.sign(
        {
          rol: "COORDINACION",
          sub: "x",
          iss: config.issuer,
          aud: config.audience,
          exp: 9999999999,
        },
        secret,
        { algorithm: "HS384" },
      ),
  ])("rechaza JWT fuera del perfil %#", async (make) => {
    expect(
      (
        await request(app)
          .post(base)
          .set("Authorization", `Bearer ${make()}`)
          .send(data)
      ).status,
    ).toBe(401);
  });
  it("cierre y reapertura requieren entrada completa; sin credencial 401", async () => {
    for (const command of ["cerrar", "reabrir"]) {
      expect(
        (await request(app).post(`${base}/${own}/${command}`)).status,
      ).toBe(401);
      const r = await request(app)
        .post(`${base}/${own}/${command}`)
        .set("Authorization", coord());
      expect(r.status).toBe(422);
      expect(r.body.code).toBe("ENTRADA_INVALIDA");
    }
    expect(
      (await db.iglesia.findUniqueOrThrow({ where: { id: own } })).cerradaDesde,
    ).toBeNull();
  });
  it("servicio rechaza llamadas sin principal y servidor exige clave fuerte", async () => {
    const service = new ServicioIglesias(
      new PrismaRepositorioIglesias(db),
      2026,
    );
    expect(() => service.crear(data)).toThrow("Credencial");
    await expect(service.editar(own, 1, { nombre: "X" })).rejects.toThrow(
      "Credencial",
    );
    expect(() => createApp(db, { ...config, secret: "corta" })).toThrow(
      "32 bytes",
    );
  });
});
describe("web y errores", () => {
  it("EJS renderiza lista y ficha escapando HTML", async () => {
    await db.iglesia.update({
      where: { id: own },
      data: {
        nombre: "<script>alert(1)</script>",
        contacto: "Ficticio",
        anioConstruccion: 1900,
      },
    });
    expect((await request(app).get("/iglesias")).text).toContain("Ecclesia");
    expect((await request(app).get("/iglesias?estadoClave=21")).text).toContain(
      "&lt;script&gt;",
    );
    const page = await request(app).get(`/iglesias/${own}`);
    expect(page.status).toBe(200);
    expect(page.text).not.toContain("<script>");
    expect((await request(app).get(`/iglesias/${other}`)).text).toContain(
      "Sin dato",
    );
    expect((await request(app).get("/")).status).toBe(302);
  });
  it("errores de UUID, JSON, tamaño y rutas desconocidas", async () => {
    expect((await request(app).get(`${base}/no-uuid`)).status).toBe(422);
    expect(
      (
        await request(app)
          .post(base)
          .set("Content-Type", "application/json")
          .send("{mal")
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .post(base)
          .send({ texto: "x".repeat(17000) })
      ).status,
    ).toBe(413);
    expect((await request(app).delete(`${base}/${own}`)).status).toBe(404);
    expect((await request(app).get("/api/v1/servicios")).status).toBe(404);
  });
});
