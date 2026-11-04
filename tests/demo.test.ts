import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  readFileSync,
  readdirSync,
  mkdtempSync,
  cpSync,
  appendFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import bcrypt from "bcryptjs";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  cargarDemo,
  generarAccesos,
  fuentesDemo,
  validarDestino,
  idDemo,
  periodoDemo,
} from "../prisma/demo/carga.js";
import { instante, traslapa } from "../src/modules/agenda/domain/agenda.js";
import { verificaClave } from "../src/modules/solicitudes/infrastructure/seguridad.js";
import { createApp } from "../src/composition/app.js";

// El arnés crea esta segunda base en SU clúster temporal; nunca usa la URL del usuario.
const destino = process.env.ECCLESIA_DEMO_TEST_URL!;
if (!destino || !process.env.TEST_JWT_SECRET)
  throw new Error(
    "Ejecutar CT20 con npm test (PostgreSQL temporal obligatorio)",
  );
validarDestino(destino, "SOLO_DEMO_LOCAL");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: destino }),
});
const referencia = new Date("2026-11-03T18:00:00.000Z");
const accesos = generarAccesos();
const cargar = () =>
  cargarDemo(db, destino, "SOLO_DEMO_LOCAL", referencia, accesos);
beforeAll(async () => {
  await db.$connect();
});
afterAll(async () => {
  await db.$disconnect();
});
describe("CT20 PostgreSQL real, carga de demostración aislada", () => {
  it("rechaza producción, destino ajeno y confirmación ausente antes de escribir", async () => {
    for (const u of [
      destino.replace("127.0.0.1", "example.com"),
      destino.replace("ecclesia_demo_test", "produccion"),
      destino + "?schema=public",
    ])
      expect(() => validarDestino(u, "SOLO_DEMO_LOCAL")).toThrow();
    expect(() => validarDestino(destino, "")).toThrow();
    await expect(
      cargarDemo(
        db,
        destino.replace("ecclesia_demo_test", "ecclesia_demo"),
        "SOLO_DEMO_LOCAL",
        referencia,
        accesos,
      ),
    ).rejects.toThrow("Conexión demo distinta");
    expect(await db.cargaDemo.count()).toBe(0);
  });
  it("procedencia y hashes originales INEGI, jerarquía en ocho municipios y tres estados", () => {
    const s = fuentesDemo();
    expect(s.base.estados).toHaveLength(32);
    expect(s.base.municipios).toHaveLength(2478);
    expect(new Set(s.localidades.map((l) => l.cve_ent)).size).toBe(3);
    expect(new Set(s.localidades.map((l) => l.cve_ent + l.cve_mun)).size).toBe(
      8,
    );
    const temp = mkdtempSync(join(tmpdir(), "ct20-fuentes-"));
    try {
      cpSync(
        fileURLToPath(new URL("../prisma/demo/fuentes", import.meta.url)),
        temp,
        { recursive: true },
      );
      appendFileSync(join(temp, "211140001.json"), " ");
      expect(() => fuentesDemo(temp)).toThrow("Hash INEGI demo incorrecto");
    } finally {
      rmSync(temp, { recursive: true });
    }
  });
  it("base no vacía: rechaza sin modificar usuarios ni importar geografía", async () => {
    await db.usuario.create({
      data: {
        id: idDemo("ajeno", 0),
        identificador: "usuario-previo",
        rol: "COORDINACION",
        passwordHash: await bcrypt.hash(accesos.usuarios[0].password, 12),
      },
    });
    const antes = await db.usuario.findMany();
    await expect(cargar()).rejects.toThrow("Base no vacía");
    expect(await db.usuario.findMany()).toEqual(antes);
    expect(await db.estado.count()).toBe(0);
    await db.usuario.delete({ where: { id: idDemo("ajeno", 0) } });
  });
  it("fallo tardío revierte toda la carga, incluidos hashes, catálogos e historial", async () => {
    await db.$executeRawUnsafe(
      `CREATE FUNCTION fallo_demo() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'CT20 rollback'; END $$`,
    );
    await db.$executeRawUnsafe(
      `CREATE TRIGGER fallo_demo BEFORE INSERT ON "SolicitudEspacio" FOR EACH ROW EXECUTE FUNCTION fallo_demo()`,
    );
    try {
      await expect(cargar()).rejects.toThrow();
    } finally {
      await db.$executeRawUnsafe(
        'DROP TRIGGER fallo_demo ON "SolicitudEspacio"',
      );
      await db.$executeRawUnsafe("DROP FUNCTION fallo_demo()");
    }
    for (const count of [
      await db.estado.count(),
      await db.iglesia.count(),
      await db.usuario.count(),
      await db.ocurrenciaMisa.count(),
      await db.diezmo.count(),
      await db.cargaDemo.count(),
    ])
      expect(count).toBe(0);
  }, 120000);
  it("dos cargas concurrentes son idempotentes: una crea y la otra conserva", async () => {
    const resultados = await Promise.all([cargar(), cargar()]);
    expect(resultados.map((r) => r.creada).sort()).toEqual([false, true]);
    expect(await db.cargaDemo.count()).toBe(1);
  }, 120000);
  it("distribución por iglesia, municipio y tipo; 120 objetos con antigüedades válidas", async () => {
    const iglesias = await db.iglesia.findMany({
      include: { localidad: true, objetos: true, tipo: true },
    });
    expect(iglesias).toHaveLength(40);
    expect(new Set(iglesias.map((i) => i.estadoClave)).size).toBe(3);
    expect(
      new Set(iglesias.map((i) => i.estadoClave + i.municipioClave)).size,
    ).toBe(8);
    expect(new Set(iglesias.map((i) => i.tipo.nombre))).toEqual(
      new Set([
        "Catedral",
        "Basílica",
        "Parroquia",
        "Templo",
        "Capilla",
        "Santuario",
      ]),
    );
    const porMunicipio = new Map<string, number>();
    for (const i of iglesias) {
      expect(i.nombre).toContain("ficticia");
      expect(i.localidad.clave).toBe(
        i.estadoClave + i.municipioClave + i.localidadClave,
      );
      porMunicipio.set(
        i.localidad.clave,
        (porMunicipio.get(i.localidad.clave) ?? 0) + 1,
      );
      expect(i.objetos).toHaveLength(3);
      for (const o of i.objetos) expect(o.descripcion).toContain("ficticio");
    }
    expect([...porMunicipio.values()]).toEqual(Array(8).fill(5));
    const objetos = iglesias.flatMap((i) => i.objetos);
    expect(
      objetos.filter((o) => referencia.getUTCFullYear() - o.anioExacto! >= 200),
    ).toHaveLength(15);
    expect(
      objetos.filter((o) => referencia.getUTCFullYear() - o.anioExacto! >= 300),
    ).toHaveLength(5);
  });
  it("cada iglesia ofrece cuatro servicios con costo/horario y dos tipos de pláticas relacionados", async () => {
    const iglesias = await db.iglesia.findMany({
      include: {
        servicios: { include: { tipo: true, horarios: true } },
        platicas: { include: { horarios: true } },
      },
    });
    for (const i of iglesias) {
      expect(i.servicios).toHaveLength(4);
      expect(new Set(i.servicios.map((s) => s.tipo.nombre))).toEqual(
        new Set(["Bautizo", "Primera comunión", "Confirmación", "Matrimonio"]),
      );
      for (const s of i.servicios) {
        expect(s.importe!.gt(0)).toBe(true);
        expect(s.horarios.length).toBeGreaterThan(0);
        expect(s.moneda).toBe("MXN");
      }
      expect(new Set(i.platicas.map((p) => p.tipoId)).size).toBe(2);
      for (const p of i.platicas) {
        expect(p.horarios).toHaveLength(1);
        expect(p.impartidor).toContain("ficticia");
      }
    }
  });
  it("misas los siete días: recurrencias, vigencias y zona coinciden con las ocurrencias", async () => {
    const p = periodoDemo(referencia);
    const iglesias = await db.iglesia.findMany({
      include: { horariosMisa: { include: { ocurrencias: true } } },
    });
    for (const i of iglesias) {
      expect(new Set(i.horariosMisa.map((h) => h.diaSemana))).toEqual(
        new Set([1, 2, 3, 4, 5, 6, 7]),
      );
      for (const h of i.horariosMisa) {
        expect(h.desde).toBe(p.desde);
        expect(h.hasta).toBe(p.hasta);
        expect(h.ocurrencias).toHaveLength(8);
        for (const o of h.ocurrencias) {
          expect(o.iglesiaId).toBe(i.id);
          expect(o.sacerdoteId).toBe(h.sacerdoteId);
          expect(o.zonaIana).toBe(i.zonaIana);
          expect(o.inicio).toEqual(
            instante(o.fechaLocal, h.horaLocal, o.zonaIana),
          );
          expect(o.fin.getTime() - o.inicio.getTime()).toBe(3600000);
          expect(
            ((new Date(o.fechaLocal + "T00:00:00Z").getUTCDay() + 6) % 7) + 1,
          ).toBe(h.diaSemana);
        }
      }
    }
  });
  it("quince sacerdotes, al menos tres compartidos, sin traslapes entre iglesias", async () => {
    const padres = await db.sacerdote.findMany({
      include: {
        asignaciones: true,
        ocurrencias: { orderBy: { inicio: "asc" } },
      },
    });
    expect(padres).toHaveLength(15);
    expect(
      padres.filter((p) => p.asignaciones.length > 1).length,
    ).toBeGreaterThanOrEqual(3);
    for (const p of padres)
      for (let j = 1; j < p.ocurrencias.length; j++)
        expect(traslapa(p.ocurrencias[j - 1], p.ocurrencias[j])).toBe(false);
  });
  it("cuatro semanas completas en seis iglesias: diezmos exactos y celebraciones concluidas con actor propio", async () => {
    const iglesias = await db.iglesia.findMany({
      where: { celebraciones: { some: {} } },
      include: {
        celebraciones: {
          include: {
            ocurrencia: true,
            actor: true,
            diezmo: { include: { correcciones: { include: { actor: true } } } },
          },
        },
      },
    });
    expect(iglesias).toHaveLength(6);
    for (const i of iglesias) {
      expect(i.celebraciones).toHaveLength(28);
      expect(new Set(i.celebraciones.map((c) => c.fechaLocal)).size).toBe(28);
      for (const c of i.celebraciones) {
        expect(c.fin.getTime()).toBeLessThan(c.registradoEn.getTime());
        expect(c.registradoEn.getTime()).toBeLessThan(referencia.getTime());
        expect(c.fechaLocal).toBe(c.ocurrencia.fechaLocal);
        expect(c.inicio).toEqual(c.ocurrencia.inicio);
        expect(c.actor.iglesiaId).toBe(i.id);
        expect(c.actor.rol).toBe("ADMIN_IGLESIA");
        const d = c.diezmo!;
        expect(d.iglesiaId).toBe(i.id);
        expect(d.importeCentavos).toBeGreaterThan(0n);
        expect(d.correcciones).toHaveLength(1);
        const a = d.correcciones[0];
        expect(a.anteriorCentavos).toBeNull();
        expect(a.nuevoCentavos).toBe(d.importeCentavos);
        expect(a.actor.rol).toBe("TESORERO");
        expect(a.actor.iglesiaId).toBe(i.id);
      }
    }
  });
  it("doce solicitudes cubren los siete estados, vigencias y cadena de auditoría sin contactos ni secretos", async () => {
    const solicitudes = await db.solicitudEspacio.findMany({
      include: { cambios: { orderBy: { version: "asc" } } },
    });
    expect(solicitudes).toHaveLength(12);
    expect(new Set(solicitudes.map((s) => s.estado))).toEqual(
      new Set([
        "REGISTRADA",
        "COTIZADA",
        "SIN_LUGAR",
        "ACEPTADA",
        "RECHAZADA",
        "VENCIDA",
        "CANCELADA",
      ]),
    );
    for (const s of solicitudes) {
      const clave = accesos.solicitudes.find((a) => a.folio === s.folio)!;
      expect(verificaClave(clave.clave, s.claveHash)).toBe(true);
      expect(s.cambios.map((c) => c.version)).toEqual(
        Array.from({ length: s.version }, (_, j) => j + 1),
      );
      expect(s.cambios.at(-1)!.despues).toMatchObject({
        estado: s.estado,
        version: s.version,
      });
      if (s.emitida)
        expect(s.vence!.getTime() - s.emitida.getTime()).toBe(360 * 3600000);
      if (s.estado === "COTIZADA")
        expect(s.vence!.getTime()).toBeGreaterThan(referencia.getTime());
      if (s.estado === "VENCIDA")
        expect(s.vence!.getTime()).toBeLessThan(referencia.getTime());
      if (["ACEPTADA", "RECHAZADA"].includes(s.estado))
        expect(s.decisionEn!.getTime()).toBeLessThan(s.vence!.getTime());
      const audit = JSON.stringify(s.cambios);
      expect(audit).not.toContain(s.contacto);
      expect(audit).not.toContain(s.claveHash);
      expect(audit).not.toContain(clave.clave);
      for (const c of s.cambios.filter((c) => c.actor === "PERSONAL"))
        expect(c.actorId).toBe(
          idDemo(
            "ADMIN_IGLESIA",
            Array.from({ length: 6 }, (_, j) => idDemo("iglesia", j)).indexOf(
              s.iglesiaId,
            ),
          ),
        );
    }
  });
  it("usuarios por rol, hashes seguros y HTTP real: acceso propio, 401/403 ajeno y seguimiento privado", async () => {
    const usuarios = await db.usuario.findMany();
    expect(new Set(usuarios.map((u) => u.rol))).toEqual(
      new Set(["COORDINACION", "ADMIN_IGLESIA", "TESORERO"]),
    );
    expect(new Set(usuarios.map((u) => u.passwordHash)).size).toBe(13);
    for (const u of usuarios) {
      expect(bcrypt.getRounds(u.passwordHash)).toBe(12);
      expect(
        await bcrypt.compare(
          accesos.usuarios.find((a) => a.id === u.id)!.password,
          u.passwordHash,
        ),
      ).toBe(true);
    }
    const app = createApp(
      db,
      {
        secret: process.env.TEST_JWT_SECRET!,
        issuer: "ecclesia-personal",
        audience: "ecclesia-api",
        origin: "http://127.0.0.1:3000",
      },
      2026,
      () => referencia,
    );
    const u = accesos.usuarios.find(
      (u) => u.rol === "TESORERO" && u.iglesiaId === idDemo("iglesia", 0),
    )!;
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ identificador: u.identificador, password: u.password });
    expect(login.status).toBe(200);
    const token = login.body.accessToken;
    // Listado privado de celebraciones es del administrador; reportes del tesorero.
    const reporte = (i: number) =>
      `/api/v1/iglesias/${idDemo("iglesia", i)}/reportes/diezmos?desde=2026-10-05&hasta=2026-11-01&periodo=DIA`;
    expect((await request(app).get(reporte(0))).status).toBe(401);
    expect(
      (await request(app).get(reporte(0)).auth(token, { type: "bearer" }))
        .status,
    ).toBe(200);
    expect(
      (await request(app).get(reporte(1)).auth(token, { type: "bearer" }))
        .status,
    ).toBe(403);
    const s = accesos.solicitudes[1];
    expect(
      (
        await request(app)
          .get("/api/v1/solicitudes/" + s.folio)
          .set("X-Solicitud-Clave", s.clave)
      ).body.estado,
    ).toBe("COTIZADA");
    const publico = await request(app).get(
      `/api/v1/iglesias/${idDemo("iglesia", 1)}/ofertas-espacio`,
    );
    expect(publico.status).toBe(200);
    expect(JSON.stringify(publico.body)).not.toContain("precio");
  }, 15000);
  it("RF02 ficha integrada muestra relaciones públicas, límites y ningún dato privado", async () => {
    const app = createApp(
      db,
      {
        secret: process.env.TEST_JWT_SECRET!,
        issuer: "ecclesia-personal",
        audience: "ecclesia-api",
      },
      2026,
      () => referencia,
    );
    const r = await request(app).get("/iglesias/" + idDemo("iglesia", 1));
    expect(r.status).toBe(200);
    for (const texto of [
      "Patrimonio e índice",
      "Bautizo",
      "Primera comunión",
      "Confirmación",
      "Matrimonio",
      "Pláticas prebautismales",
      "Próximas misas y sacerdotes",
      "Sacerdote ficticio CT20 2",
      "Espacios funerarios",
      "America/Mexico_City",
      "Heroica Puebla",
      "Se muestran hasta cinco",
    ])
      expect(r.text).toContain(texto);
    for (const s of accesos.solicitudes)
      expect(r.text.includes(s.clave)).toBe(false);
    expect(r.text).not.toContain("solicitante2@example.invalid");
    expect(r.text).not.toContain("Cotización ficticia");
    expect(r.headers["cache-control"]).toBe("no-store");
    expect(r.text).not.toContain("2026-11-03 07:00");
    expect(r.text).toContain("2026-11-04 07:00");
  });
  it("RF02 ficha cerrada devuelve 404 y textos relacionados se escapan en HTML", async () => {
    const app = createApp(
      db,
      {
        secret: process.env.TEST_JWT_SECRET!,
        issuer: "ecclesia-personal",
        audience: "ecclesia-api",
      },
      2026,
      () => referencia,
    );
    const servicio = await db.servicioOfrecido.findFirstOrThrow({
      where: { iglesiaId: idDemo("iglesia", 0) },
    });
    await db.servicioOfrecido.update({
      where: { id: servicio.id },
      data: { nombre: "<script>prueba CT20</script>" },
    });
    const r = await request(app).get("/iglesias/" + idDemo("iglesia", 0));
    expect(r.status).toBe(200);
    expect(r.text).toContain("&lt;script&gt;prueba CT20&lt;/script&gt;");
    expect(r.text).not.toContain("<script>");
    await db.servicioOfrecido.update({
      where: { id: servicio.id },
      data: { nombre: servicio.nombre },
    });
    await db.iglesia.update({
      where: { id: idDemo("iglesia", 9) },
      data: { cerradaDesde: referencia },
    });
    expect(
      (await request(app).get("/iglesias/" + idDemo("iglesia", 9))).status,
    ).toBe(404);
    await db.iglesia.update({
      where: { id: idDemo("iglesia", 9) },
      data: { cerradaDesde: null },
    });
  });
  it("repetir conserva edición de usuario, sesiones e historial y no regenera credenciales", async () => {
    await db.iglesia.update({
      where: { id: idDemo("iglesia", 0) },
      data: { nombre: "Edición propia conservada" },
    });
    const antes = await db.usuario.findMany({ orderBy: { id: "asc" } });
    const audit = await db.cambioSolicitud.findMany({ orderBy: { id: "asc" } });
    const sesiones = await db.sesion.findMany({ orderBy: { id: "asc" } });
    expect(sesiones.length).toBeGreaterThan(0);
    expect((await cargar()).creada).toBe(false);
    expect(
      (
        await db.iglesia.findUniqueOrThrow({
          where: { id: idDemo("iglesia", 0) },
        })
      ).nombre,
    ).toBe("Edición propia conservada");
    expect(await db.usuario.findMany({ orderBy: { id: "asc" } })).toEqual(
      antes,
    );
    expect(
      await db.cambioSolicitud.findMany({ orderBy: { id: "asc" } }),
    ).toEqual(audit);
    expect(await db.sesion.findMany({ orderBy: { id: "asc" } })).toEqual(
      sesiones,
    );
    await expect(
      cargarDemo(
        db,
        destino,
        "SOLO_DEMO_LOCAL",
        new Date("2026-11-04T18:00:00Z"),
        accesos,
      ),
    ).rejects.toThrow("otra referencia");
  });
  it("actualiza las ocho migraciones anteriores conservando identidad y criterio exacto", async () => {
    const c = new Client({ connectionString: destino });
    await c.connect();
    try {
      await c.query("CREATE SCHEMA ct20_upgrade");
      await c.query("SET search_path TO ct20_upgrade");
      const migraciones = readdirSync("prisma/migrations")
        .filter((f) => /^\d/.test(f))
        .sort();
      expect(migraciones).toHaveLength(11);
      for (const m of migraciones.slice(0, 8))
        await c.query(
          readFileSync(`prisma/migrations/${m}/migration.sql`, "utf8"),
        );
      await c.query(
        'INSERT INTO "Usuario" (id, identificador, "passwordHash", rol) VALUES ($1,$2,$3,$4)',
        [
          idDemo("previo", 1),
          "previo",
          (await db.usuario.findFirstOrThrow()).passwordHash,
          "COORDINACION",
        ],
      );
      const antes = (await c.query('SELECT * FROM "CriterioPatrimonio"')).rows;
      await c.query(
        readFileSync(
          `prisma/migrations/${migraciones[8]}/migration.sql`,
          "utf8",
        ),
      );
      expect(
        (await c.query('SELECT * FROM "CriterioPatrimonio"')).rows,
      ).toEqual(antes);
      expect(
        (await c.query('SELECT identificador FROM "Usuario"')).rows,
      ).toEqual([{ identificador: "previo" }]);
      expect((await c.query('SELECT * FROM "CargaDemo"')).rows).toEqual([]);
    } finally {
      await c.query("DROP SCHEMA IF EXISTS ct20_upgrade CASCADE");
      await c.end();
    }
  });
});
