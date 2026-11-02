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
  tiposServicio,
  tiposPlatica,
  type DatosServicio,
  type DatosPlatica,
} from "../src/modules/servicios/domain/oferta.js";
import { PrismaRepositorioOferta } from "../src/modules/servicios/infrastructure/prisma-repositorio.js";
import { ServicioOferta } from "../src/modules/servicios/application/servicio.js";

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
  other = randomUUID();
const password = "Oferta ficticia solo para pruebas!";
const servicio: DatosServicio = {
  tipoId: tiposServicio[0].id,
  nombre: "Bautizo de prueba",
  modalidad: "FIJO",
  importe: "123.45",
  moneda: "MXN",
  requisitos: "Requisitos ficticios informados por la iglesia",
  duracionMinutos: 45,
  requiereCita: false,
  horarios: [
    { diaSemana: 6, horaLocal: "10:00" },
    { diaSemana: 7, horaLocal: "12:30" },
  ],
};
const platica: DatosPlatica = {
  tipoId: tiposPlatica[0].id,
  sesiones: 3,
  importe: "40.10",
  moneda: "MXN",
  cupo: 25,
  lugar: "Salón ficticio",
  impartidor: "Persona ficticia",
  horarios: [
    { diaSemana: 2, horaLocal: "18:00" },
    { diaSemana: 4, horaLocal: "18:30" },
  ],
};
const datos = { servicios: servicio, platicas: platica };
type Clase = keyof typeof datos;
const clases: Clase[] = ["servicios", "platicas"];
const ruta = (clase: Clase, iglesia: string = own) =>
  `/api/v1/iglesias/${iglesia}/${clase}`;
const web = (clase: Clase, iglesia: string = own) =>
  `/personal/oferta/${iglesia}/${clase}`;
let app: ReturnType<typeof createApp>, inicial: Iglesia[], hash: string;
beforeAll(async () => {
  inicial = await db.iglesia.findMany();
  hash = await bcrypt.hash(password, 12);
});
async function limpiar() {
  await db.cambioOferta.deleteMany();
  await db.servicioOfrecido.deleteMany();
  await db.platica.deleteMany();
  await db.cambioPatrimonio.deleteMany();
  await db.objetoPatrimonial.deleteMany();
  await db.usuario.deleteMany();
  await db.iglesia.deleteMany();
}
beforeEach(async () => {
  await limpiar();
  await db.iglesia.createMany({
    data: [own, other].map((id, i) => ({
      ...inicial[0],
      id,
      nombre: i ? "Otra iglesia ficticia" : "Iglesia propia ficticia",
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
async function token(identificador = "admin") {
  const r = await request(app)
    .post("/api/v1/auth/login")
    .send({ identificador, password });
  expect(r.status).toBe(200);
  return r.body.accessToken as string;
}
async function alta(
  clase: Clase,
  t: string,
  body: object = datos[clase],
  iglesia = own,
) {
  return request(app)
    .post(ruta(clase, iglesia))
    .auth(t, { type: "bearer" })
    .send(body);
}
async function sesion(identificador = "admin") {
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
  return { cookie, csrf: panel.text.match(/name="_csrf" value="([^"]+)"/)![1] };
}
function form(clase: Clase, cambios: Record<string, unknown> = {}) {
  const { horarios, ...campos } = datos[clase];
  return {
    ...campos,
    ...Object.fromEntries(
      Array.from({ length: 7 }, (_, i) => [
        `horario${i + 1}`,
        horarios
          .filter((h) => h.diaSemana === i + 1)
          .map((h) => h.horaLocal)
          .join(", "),
      ]),
    ),
    ...cambios,
  };
}
const api = JSON.parse(readFileSync("openapi.yaml", "utf8"));
const ajv = new Ajv2020({ strict: false, validateFormats: false });
ajv.addSchema({ $id: "oferta", components: api.components });
const contrato = (nombre: string, valor: unknown) => {
  expect(
    ajv.validate({ $ref: `oferta#/components/schemas/${nombre}` }, valor),
    JSON.stringify(ajv.errors),
  ).toBe(true);
};

describe("P078–079 RF13–15: oferta real por iglesia", () => {
  it("catálogos de tipos corresponden a migración y son públicos, sin permitir gestión inferida", async () => {
    for (const [nombre, tipos, filas] of [
      ["tipos-servicio", tiposServicio, await db.tipoServicio.findMany()],
      ["tipos-platica", tiposPlatica, await db.tipoPlatica.findMany()],
    ] as const) {
      expect(
        (await request(app).get(`/api/v1/catalogos/${nombre}`)).body.data,
      ).toEqual(tipos);
      expect(filas).toEqual(expect.arrayContaining(tipos));
      expect(
        (
          await request(app)
            .post(`/api/v1/catalogos/${nombre}`)
            .send({ nombre: "Inventado" })
        ).status,
      ).toBe(404);
    }
  });
  it("mismo tipo admite fijo, gratuito y donativo voluntario en distintas ofertas sin imponer tarifa", async () => {
    const t = await token(),
      t2 = await token("otro");
    expect((await alta("servicios", t)).status).toBe(201);
    expect(
      (
        await alta(
          "servicios",
          t2,
          { ...servicio, modalidad: "GRATUITO", importe: null },
          other,
        )
      ).status,
    ).toBe(201);
    expect(
      (
        await alta(
          "servicios",
          t2,
          { ...servicio, modalidad: "DONATIVO", importe: null },
          other,
        )
      ).status,
    ).toBe(201);
    const r = await request(app).get(ruta("servicios", other));
    expect(r.body.data.map((x: DatosServicio) => x.modalidad).sort()).toEqual([
      "DONATIVO",
      "GRATUITO",
    ]);
    expect(r.body.data.every((x: DatosServicio) => x.importe === null)).toBe(
      true,
    );
    const html = await request(app).get(`/iglesias/${other}/servicios`);
    expect(html.text).toContain("Donativo voluntario, sin tarifa obligatoria");
    expect(html.text).toContain("Gratuito");
  });
  for (const clase of clases) {
    it(`${clase}: alta, lectura pública exacta, edición parcial, horarios y auditoría atómica`, async () => {
      const t = await token(),
        creado = await alta(clase, t);
      expect(creado.status).toBe(201);
      contrato(clase === "servicios" ? "Servicio" : "Platica", creado.body);
      expect(creado.body).toMatchObject({ ...datos[clase], version: 1 });
      const r = await request(app).get(ruta(clase));
      expect(r.status).toBe(200);
      expect(r.body.data).toEqual([creado.body]);
      contrato(
        clase === "servicios" ? "ServiciosConsulta" : "PlaticasConsulta",
        r.body,
      );
      expect(JSON.stringify(r.body)).not.toMatch(
        /actorId|passwordHash|cambios|"sesion"|iglesiaId/,
      );
      const hs = [{ diaSemana: 1, horaLocal: "08:15" }];
      const editado = await request(app)
        .patch(`${ruta(clase)}/${creado.body.id}`)
        .auth(t, { type: "bearer" })
        .send({ version: 1, horarios: hs, importe: "999999999.99" });
      expect(editado.status).toBe(200);
      expect(editado.body).toMatchObject({
        importe: "999999999.99",
        horarios: hs,
        version: 2,
        tipoId: datos[clase].tipoId,
      });
      const audit = await db.cambioOferta.findMany({
        orderBy: { fecha: "asc" },
      });
      expect(audit).toHaveLength(2);
      expect(audit[0].antes).toBe(null);
      expect(audit[1].antes).toEqual(creado.body);
      expect(audit[1].despues).toEqual(editado.body);
      expect(audit[1].actorId).toBe(
        (
          await db.usuario.findUniqueOrThrow({
            where: { identificador: "admin" },
          })
        ).id,
      );
      expect(audit[1].fecha).toBeInstanceOf(Date);
    });
    it(`${clase}: rechaza anónimo, Coordinación, tesorero y administrador ajeno sin efectos`, async () => {
      expect(
        (await request(app).post(ruta(clase)).send(datos[clase])).status,
      ).toBe(401);
      const propio = (await alta(clase, await token())).body;
      for (const usuario of ["coord", "tesorero", "otro"]) {
        const t = await token(usuario);
        expect((await alta(clase, t)).status).toBe(403);
        expect(
          (
            await request(app)
              .patch(`${ruta(clase)}/${propio.id}`)
              .auth(t, { type: "bearer" })
              .send({ version: 1, importe: "10" })
          ).status,
        ).toBe(403);
      }
      expect(await db.cambioOferta.count()).toBe(1);
    });
    it(`${clase}: recurso ajeno bajo iglesia propia e identificadores inexistentes devuelven 404`, async () => {
      const propio = (await alta(clase, await token())).body,
        otro = await token("otro");
      expect(
        (
          await request(app)
            .patch(`${ruta(clase, other)}/${propio.id}`)
            .auth(otro, { type: "bearer" })
            .send({ version: 1, importe: "11" })
        ).status,
      ).toBe(404);
      expect(
        (
          await request(app)
            .patch(`${ruta(clase)}/${randomUUID()}`)
            .auth(await token(), { type: "bearer" })
            .send({ version: 1, importe: "11" })
        ).status,
      ).toBe(404);
      expect((await request(app).get(ruta(clase, randomUUID()))).status).toBe(
        404,
      );
      expect((await request(app).get(ruta(clase, "invalido"))).status).toBe(
        422,
      );
      const s = new ServicioOferta(new PrismaRepositorioOferta(db));
      expect(() => s.autorizar(own)).toThrow("Inicie sesión");
      const inexistente = randomUUID(),
        actor = {
          id: randomUUID(),
          rol: "ADMIN_IGLESIA" as const,
          iglesiaId: inexistente,
        };
      await expect(
        clase === "servicios"
          ? s.guardarServicio(inexistente, servicio, actor)
          : s.guardarPlatica(inexistente, platica, actor),
      ).rejects.toThrow("no disponible");
      expect(await db.cambioOferta.count()).toBe(1);
    });
    it(`${clase}: iglesia cerrada no publica ni admite captura o edición`, async () => {
      const t = await token(),
        creado = (await alta(clase, t)).body;
      await db.iglesia.update({
        where: { id: own },
        data: { cerradaDesde: new Date() },
      });
      expect((await request(app).get(ruta(clase))).status).toBe(404);
      expect((await request(app).get(`/iglesias/${own}/${clase}`)).status).toBe(
        404,
      );
      expect((await alta(clase, t)).status).toBe(404);
      expect(
        (
          await request(app)
            .patch(`${ruta(clase)}/${creado.id}`)
            .auth(t, { type: "bearer" })
            .send({ version: 1, importe: "11" })
        ).status,
      ).toBe(404);
      expect(await db.cambioOferta.count()).toBe(1);
    });
    it(`${clase}: dos cambios simultáneos dejan un 200 y un 409, con una sola auditoría nueva`, async () => {
      const t = await token(),
        creado = (await alta(clase, t)).body;
      const rs = await Promise.all(
        ["10.01", "20.02"].map((importe) =>
          request(app)
            .patch(`${ruta(clase)}/${creado.id}`)
            .auth(t, { type: "bearer" })
            .send({ version: 1, importe }),
        ),
      );
      expect(rs.map((r) => r.status).sort()).toEqual([200, 409]);
      expect((await request(app).get(ruta(clase))).body.data[0]).toMatchObject({
        version: 2,
        importe: rs.find((r) => r.status === 200)!.body.importe,
      });
      expect(await db.cambioOferta.count()).toBe(2);
    });
    it(`${clase}: fallo de auditoría revierte alta, importe, horarios y versión`, async () => {
      const repo = new PrismaRepositorioOferta(db);
      await expect(
        clase === "servicios"
          ? repo.guardarServicio(own, randomUUID(), servicio)
          : repo.guardarPlatica(own, randomUUID(), platica),
      ).rejects.toThrow();
      expect((await request(app).get(ruta(clase))).body.meta.total).toBe(0);
      const creado = (await alta(clase, await token())).body;
      const cambio = {
        ...datos[clase],
        horarios: [{ diaSemana: 3, horaLocal: "14:00" }],
        importe: "4.12",
      };
      await expect(
        clase === "servicios"
          ? repo.guardarServicio(own, randomUUID(), cambio as DatosServicio, {
              id: creado.id,
              version: 1,
            })
          : repo.guardarPlatica(own, randomUUID(), cambio as DatosPlatica, {
              id: creado.id,
              version: 1,
            }),
      ).rejects.toThrow();
      expect((await request(app).get(ruta(clase))).body.data).toEqual([creado]);
      expect(await db.cambioOferta.count()).toBe(1);
    });
    it(`${clase}: páginas estables, límite y filtros inválidos; sin ofertas ajenas`, async () => {
      const t = await token();
      await alta(clase, t);
      await alta(clase, t);
      await alta(clase, await token("otro"), datos[clase], other);
      const p1 = await request(app).get(ruta(clase) + "?pageSize=1"),
        p2 = await request(app).get(ruta(clase) + "?pageSize=1&page=2");
      expect(p1.body.meta.total).toBe(2);
      expect(p1.body.data[0].id).not.toBe(p2.body.data[0].id);
      expect(
        (await request(app).get(ruta(clase) + "?page=3&pageSize=1")).body.data,
      ).toEqual([]);
      for (const query of [
        "pageSize=101",
        "page=0",
        "page=x",
        "filtro=no",
        "page=1&page=2",
      ])
        expect((await request(app).get(ruta(clase) + "?" + query)).status).toBe(
          422,
        );
      for (const url of [
        `/iglesias/${own}/${clase}?pageSize=1`,
        web(clase) + "?pageSize=1",
      ]) {
        const req = request(app).get(url);
        if (url.startsWith("/personal")) req.auth(t, { type: "bearer" });
        expect((await req).text).toContain("Siguiente");
      }
      expect(
        (await request(app).get(`/iglesias/${own}/${clase}?page=2&pageSize=1`))
          .text,
      ).toContain("Anterior");
    });
  }
});

describe("Validación estricta de oferta", () => {
  it("JSON rechaza campos faltantes, ámbito, coerciones, importes imprecisos y horarios inválidos en ambos recursos", async () => {
    const t = await token();
    for (const clase of clases) {
      const invalidos: object[] = [
        { iglesiaId: other },
        { actorId: other },
        { tipoId: randomUUID() },
        { importe: 1.23 },
        { importe: "1.234" },
        { importe: "-1" },
        { importe: "1e2" },
        { importe: "1000000000" },
        { moneda: "pesos" },
        { horarios: [] },
        { horarios: [{ diaSemana: 0, horaLocal: "12:00" }] },
        { horarios: [{ diaSemana: 8, horaLocal: "12:00" }] },
        { horarios: [{ diaSemana: 1, horaLocal: "24:00" }] },
        { horarios: [{ diaSemana: 1, horaLocal: "9:00" }] },
        { horarios: [datos[clase].horarios[0], datos[clase].horarios[0]] },
      ];
      invalidos.push(
        ...(clase === "servicios"
          ? [
              { nombre: " " },
              { requiereCita: "false" },
              { duracionMinutos: 0 },
              { requisitos: " " },
              { modalidad: "DONATIVO", importe: "5" },
              { modalidad: "GRATUITO", importe: "0" },
              { importe: null },
              { importe: "0.00" },
            ]
          : [
              { sesiones: 0 },
              { cupo: -1 },
              { cupo: "25" },
              { lugar: " " },
              { impartidor: " " },
              { importe: null },
            ]),
      );
      for (const cambios of invalidos)
        expect(
          (await alta(clase, t, { ...datos[clase], ...cambios })).status,
          JSON.stringify(cambios),
        ).toBe(422);
      for (const campo of Object.keys(datos[clase])) {
        const body: Record<string, unknown> = { ...datos[clase] };
        delete body[campo];
        expect((await alta(clase, t, body)).status, campo).toBe(422);
      }
    }
    expect(await db.cambioOferta.count()).toBe(0);
  });
  it("PATCH exige versión y cambios, valida transición de modalidad con importe vigente", async () => {
    const t = await token();
    for (const clase of clases) {
      const creado = (await alta(clase, t)).body;
      for (const body of [
        {},
        { version: 1 },
        { importe: "3" },
        { version: 0, importe: "3" },
        { version: "1", importe: "3" },
        { version: 1, iglesiaId: other },
        { version: 1, horarios: [] },
      ])
        expect(
          (
            await request(app)
              .patch(`${ruta(clase)}/${creado.id}`)
              .auth(t, { type: "bearer" })
              .send(body)
          ).status,
        ).toBe(422);
      expect(
        (
          await request(app)
            .patch(`${ruta(clase)}/${creado.id}`)
            .auth(t, { type: "bearer" })
            .send({ version: 2, importe: "3" })
        ).status,
      ).toBe(409);
      if (clase === "servicios") {
        expect(
          (
            await request(app)
              .patch(`${ruta(clase)}/${creado.id}`)
              .auth(t, { type: "bearer" })
              .send({ version: 1, modalidad: "DONATIVO" })
          ).status,
        ).toBe(422);
        expect(
          (
            await request(app)
              .patch(`${ruta(clase)}/${creado.id}`)
              .auth(t, { type: "bearer" })
              .send({ version: 1, modalidad: "DONATIVO", importe: null })
          ).status,
        ).toBe(200);
      }
    }
  });
  it("plática gratuita, cupo cero y tipos escritos se informan sin reservas ni asistencia inferida", async () => {
    const t = await token();
    for (const tipo of tiposPlatica)
      expect(
        (
          await alta("platicas", t, {
            ...platica,
            tipoId: tipo.id,
            importe: "0",
            cupo: 0,
          })
        ).status,
      ).toBe(201);
    for (const tipo of tiposServicio)
      expect(
        (await alta("servicios", t, { ...servicio, tipoId: tipo.id })).status,
      ).toBe(201);
    expect(
      (await request(app).get(`/iglesias/${own}/platicas`)).text,
    ).toContain("Gratuito");
    expect(
      (
        await request(app)
          .post(ruta("platicas") + "/inscripciones")
          .auth(t, { type: "bearer" })
          .send({})
      ).status,
    ).toBe(404);
  });
});

describe("Interfaz EJS, sesión, CSRF y aislamiento", () => {
  for (const clase of clases) {
    it(`${clase}: recorrido EJS con alta, edición, consulta sin cuenta y enlaces desde ficha/panel`, async () => {
      const s = await sesion(),
        base = web(clase);
      expect(
        (await request(app).get("/personal").set("Cookie", s.cookie)).text,
      ).toContain(base);
      expect((await request(app).get(`/iglesias/${own}`)).text).toContain(
        `/iglesias/${own}/${clase}`,
      );
      expect(
        (
          await request(app)
            .get(base + "/nuevo")
            .set("Cookie", s.cookie)
        ).status,
      ).toBe(200);
      const crear = await request(app)
        .post(base + "/nuevo")
        .set("Cookie", s.cookie)
        .set("Origin", config.origin)
        .type("form")
        .send(form(clase, { _csrf: s.csrf }));
      expect(crear.status).toBe(303);
      expect(crear.headers.location).toBe(base);
      const item = (await request(app).get(ruta(clase))).body.data[0];
      expect(
        (
          await request(app)
            .get(`${base}/${item.id}/editar`)
            .set("Cookie", s.cookie)
        ).status,
      ).toBe(200);
      const edit = await request(app)
        .post(`${base}/${item.id}/editar`)
        .set("Cookie", s.cookie)
        .set("Origin", config.origin)
        .type("form")
        .send(
          form(clase, {
            _csrf: s.csrf,
            version: "1",
            importe: "17.25",
            horario1: "09:00, 17:00",
          }),
        );
      expect(edit.status).toBe(303);
      for (const [path, privado] of [
        [base, true],
        [`/iglesias/${own}/${clase}`, false],
      ] as const) {
        const req = request(app).get(path);
        if (privado) req.set("Cookie", s.cookie);
        const r = await req;
        expect(r.status).toBe(200);
        expect(r.text).toContain("17.25 MXN");
        expect(r.text).toContain("Lunes");
        expect(r.text).toContain("17:00");
      }
    });
    it(`${clase}: CSRF/Origin rechaza escrituras web y API con cookie; sin cambios`, async () => {
      const s = await sesion();
      for (const [origin, csrf] of [
        [config.origin, undefined],
        [config.origin, "incorrecto"],
        ["https://ajeno.invalid", s.csrf],
        [undefined, s.csrf],
      ]) {
        const req = request(app)
          .post(web(clase) + "/nuevo")
          .set("Cookie", s.cookie)
          .type("form");
        if (origin) req.set("Origin", origin);
        expect((await req.send(form(clase, { _csrf: csrf }))).status).toBe(403);
        const api = request(app).post(ruta(clase)).set("Cookie", s.cookie);
        if (origin) api.set("Origin", origin);
        if (csrf) api.set("X-CSRF-Token", csrf);
        expect((await api.send(datos[clase])).status).toBe(403);
      }
      expect(await db.cambioOferta.count()).toBe(0);
    });
    it(`${clase}: niega vistas/edición cruzadas, anónimo y roles sin gestión`, async () => {
      const creado = (await alta(clase, await token())).body;
      expect((await request(app).get(web(clase))).status).toBe(401);
      const s = await sesion();
      expect(
        (await request(app).get(web(clase, other)).set("Cookie", s.cookie))
          .status,
      ).toBe(403);
      expect(
        (
          await request(app)
            .get(`${web(clase)}/${randomUUID()}/editar`)
            .set("Cookie", s.cookie)
        ).status,
      ).toBe(404);
      const ajeno = (
        await alta(clase, await token("otro"), datos[clase], other)
      ).body;
      expect(
        (
          await request(app)
            .get(`${web(clase)}/${ajeno.id}/editar`)
            .set("Cookie", s.cookie)
        ).status,
      ).toBe(404);
      for (const usuario of ["coord", "tesorero", "otro"]) {
        const ses = await sesion(usuario);
        expect(
          (
            await request(app)
              .get(`${web(clase)}/${creado.id}/editar`)
              .set("Cookie", ses.cookie)
          ).status,
        ).toBe(403);
      }
    });
    it(`${clase}: escape de HTML y conservación de campos con 422 y 409 sin sobrescribir`, async () => {
      const s = await sesion(),
        base = web(clase),
        peligro = '<script>alert("x")</script>';
      const cambios =
        clase === "servicios"
          ? { nombre: peligro, requisitos: peligro }
          : { lugar: peligro, impartidor: peligro };
      expect(
        (
          await request(app)
            .post(base + "/nuevo")
            .set("Cookie", s.cookie)
            .set("Origin", config.origin)
            .type("form")
            .send(form(clase, { ...cambios, _csrf: s.csrf }))
        ).status,
      ).toBe(303);
      const item = (await request(app).get(ruta(clase))).body.data[0];
      for (const path of [
        base,
        `/iglesias/${own}/${clase}`,
        `${base}/${item.id}/editar`,
      ]) {
        const r = await request(app).get(path).set("Cookie", s.cookie);
        expect(r.status).toBe(200);
        expect(r.text).toContain("&lt;script&gt;");
        expect(r.text).not.toContain(peligro);
      }
      const invalid = await request(app)
        .post(base + "/nuevo")
        .set("Cookie", s.cookie)
        .set("Origin", config.origin)
        .type("form")
        .send(form(clase, { ...cambios, _csrf: s.csrf, horario1: "25:00" }));
      expect(invalid.status).toBe(422);
      expect(invalid.text).toContain("&lt;script&gt;");
      expect(invalid.text).toContain('value="25:00"');
      const obsoleto = await request(app)
        .post(`${base}/${item.id}/editar`)
        .set("Cookie", s.cookie)
        .set("Origin", config.origin)
        .type("form")
        .send(
          form(clase, {
            ...cambios,
            _csrf: s.csrf,
            version: "2",
            importe: "99.99",
          }),
        );
      expect(obsoleto.status).toBe(409);
      expect(obsoleto.text).toContain('value="99.99"');
      expect(obsoleto.text).toContain('name="version" value="2"');
      expect(obsoleto.text).toContain("Abrir versión actual");
      expect((await request(app).get(ruta(clase))).body.data[0].version).toBe(
        1,
      );
    });
  }
  it("JSON inválido y entradas grandes no producen altas ni filtran errores internos", async () => {
    const t = await token();
    expect(
      (
        await request(app)
          .post(ruta("servicios"))
          .auth(t, { type: "bearer" })
          .set("Content-Type", "application/json")
          .send('{"nombre":')
      ).status,
    ).toBe(400);
    expect(
      (await alta("platicas", t, { ...platica, lugar: "x".repeat(20000) }))
        .status,
    ).toBe(413);
    expect(await db.cambioOferta.count()).toBe(0);
  });
});

describe("Migración aditiva e integridad PostgreSQL", () => {
  it("actualiza esquema previo sin perder iglesia, cuenta, patrimonio ni índice del caso", async () => {
    const pg = new Client({ connectionString: process.env.DATABASE_URL });
    await pg.connect();
    try {
      await pg.query("BEGIN");
      const schema = "oferta_" + randomUUID().replaceAll("-", "");
      await pg.query(`CREATE SCHEMA "${schema}"`);
      await pg.query(`SET LOCAL search_path TO "${schema}"`);
      for (const folder of [
        "202611010001_referencia_iglesias",
        "202611010002_identidad",
        "202611010003_catalogos",
        "202611020001_patrimonio",
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
        `INSERT INTO "ObjetoPatrimonial" (id,"iglesiaId",descripcion,"tipoId","anioExacto",material,conservacion,"ubicacionInterna","catalogadoInah") VALUES ($1,$1,'Previa',$2,1720,'Prueba','Prueba','Prueba',true)`,
        [own, "30000000-0000-4000-8000-000000000001"],
      );
      const antes = (
        await pg.query(`SELECT parametros FROM "CriterioPatrimonio"`)
      ).rows;
      await pg.query(
        readFileSync(
          "prisma/migrations/202611020002_servicios/migration.sql",
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
        (await pg.query(`SELECT "anioExacto" FROM "ObjetoPatrimonial"`)).rows[0]
          .anioExacto,
      ).toBe(1720);
      expect(
        (await pg.query(`SELECT parametros FROM "CriterioPatrimonio"`)).rows,
      ).toEqual(antes);
      expect(
        (await pg.query(`SELECT count(*)::int AS n FROM "TipoServicio"`))
          .rows[0].n,
      ).toBe(7);
      expect(
        (await pg.query(`SELECT count(*)::int AS n FROM "TipoPlatica"`)).rows[0]
          .n,
      ).toBe(4);
    } finally {
      await pg.query("ROLLBACK");
      await pg.end();
    }
  });
  it("FK, CHECK y claves de horarios impiden contradicciones y borrado de historia", async () => {
    const { horarios: _h, ...s } = servicio;
    void _h;
    for (const cambio of [
      { importe: null },
      { modalidad: "GRATUITO" as const },
      { tipoId: randomUUID() },
      { duracionMinutos: 0 },
      { nombre: " " },
      { version: 0 },
    ])
      await expect(
        db.servicioOfrecido.create({
          data: { ...s, iglesiaId: own, ...cambio },
        }),
      ).rejects.toThrow();
    const { horarios: _p, ...p } = platica;
    void _p;
    for (const cambio of [
      { importe: "-1" },
      { sesiones: 0 },
      { cupo: -1 },
      { tipoId: randomUUID() },
      { lugar: " " },
    ])
      await expect(
        db.platica.create({ data: { ...p, iglesiaId: own, ...cambio } }),
      ).rejects.toThrow();
    const t = await token(),
      creado = (await alta("servicios", t)).body;
    await expect(
      db.horarioServicio.create({
        data: { servicioId: creado.id, diaSemana: 8, horaLocal: "10:00" },
      }),
    ).rejects.toThrow();
    await expect(
      db.horarioServicio.create({
        data: { servicioId: creado.id, diaSemana: 1, horaLocal: "24:00" },
      }),
    ).rejects.toThrow();
    await expect(
      db.horarioServicio.create({
        data: { servicioId: creado.id, ...servicio.horarios[0] },
      }),
    ).rejects.toThrow();
    await expect(
      db.servicioOfrecido.delete({ where: { id: creado.id } }),
    ).rejects.toThrow();
    const charla = (await alta("platicas", t)).body;
    await expect(
      db.platica.delete({ where: { id: charla.id } }),
    ).rejects.toThrow();
    await expect(db.iglesia.delete({ where: { id: own } })).rejects.toThrow();
  });
});
