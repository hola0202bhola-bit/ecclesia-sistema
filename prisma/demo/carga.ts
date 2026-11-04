import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import {
  Prisma,
  type PrismaClient,
  type EstadoSolicitud,
} from "@prisma/client";
import { z } from "zod";
import { cargarFuentes } from "../../src/modules/iglesias/infrastructure/fuentes-inegi.js";
import { normalizar } from "../../src/modules/iglesias/domain/iglesia.js";
import {
  ocurrencias,
  sumarDias,
} from "../../src/modules/agenda/domain/agenda.js";
import {
  ClavesSolicitud,
  hashClave,
} from "../../src/modules/solicitudes/infrastructure/seguridad.js";
import {
  venceEn,
  transicion,
} from "../../src/modules/solicitudes/domain/solicitud.js";

export const VERSION_DEMO = "ct20-v1";
export const LOCALIDADES = [
  "210190001",
  "211140001",
  "211190001",
  "290050001",
  "290330001",
  "290430001",
  "300870001",
  "301930001",
];
export const idDemo = (grupo: string, n: number) => {
  const h = createHash("sha256")
    .update(`${VERSION_DEMO}:${grupo}:${n}`)
    .digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const catalogId = (prefijo: string, n: number) =>
  `${prefijo}0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const hash = (raw: Buffer | string) =>
  createHash("sha256").update(raw).digest("hex");
const root = fileURLToPath(new URL("../fuentes", import.meta.url));
const demoRoot = fileURLToPath(new URL("./fuentes", import.meta.url));
export function fuentesDemo(folder = demoRoot) {
  const base = cargarFuentes(root);
  const manifestRaw = readFileSync(join(folder, "manifest.json"));
  const manifest = z
    .strictObject({
      version: z.literal("inegi-demo-2026-11-03"),
      consulta: z.literal("2026-11-03"),
      alcance: z.string().min(1),
      archivos: z
        .array(
          z.strictObject({
            archivo: z.string(),
            fuente: z.url(),
            sha256: z.string().regex(/^[a-f0-9]{64}$/),
            registros: z.literal(1),
          }),
        )
        .length(8),
    })
    .parse(JSON.parse(manifestRaw.toString("utf8").replace(/^\uFEFF/, "")));
  const localidades = LOCALIDADES.map((clave) => {
    const entries = manifest.archivos.filter(
      (e) => e.archivo === clave + ".json",
    );
    if (
      entries.length !== 1 ||
      entries[0].fuente !==
        "https://gaia.inegi.org.mx/wscatgeo/v2/localidades/" + clave
    )
      throw new Error("Procedencia INEGI demo inválida");
    const entry = entries[0];
    const raw = readFileSync(join(folder, entry.archivo));
    if (hash(raw) !== entry.sha256)
      throw new Error("Hash INEGI demo incorrecto");
    const row = z
      .object({
        datos: z
          .array(
            z.object({
              cvegeo: z.string(),
              cve_ent: z.string(),
              cve_mun: z.string(),
              cve_loc: z.string(),
              nomgeo: z.string().min(1),
            }),
          )
          .length(1),
        numReg: z.literal(1),
        metadatos: z.object({
          Fuente_informacion_estadistica: z.string().min(1),
        }),
      })
      .parse(JSON.parse(raw.toString("utf8"))).datos[0];
    if (
      row.cvegeo !== clave ||
      row.cve_ent + row.cve_mun + row.cve_loc !== clave ||
      !base.municipios.some((m) => m.cvegeo === row.cve_ent + row.cve_mun)
    )
      throw new Error("Jerarquía INEGI demo inválida");
    return { ...row, fuente: entry.fuente };
  });
  return {
    base,
    localidades,
    manifest,
    sha256: hash(base.sha256 + hash(manifestRaw)),
  };
}
export function validarDestino(url: string, confirmacion: string) {
  const u = new URL(url);
  if (
    !["postgres:", "postgresql:"].includes(u.protocol) ||
    !["127.0.0.1", "localhost", "[::1]"].includes(u.hostname) ||
    !["/ecclesia_demo", "/ecclesia_demo_test"].includes(u.pathname) ||
    u.search ||
    confirmacion !== "SOLO_DEMO_LOCAL"
  )
    throw new Error(
      "CT20 requiere base local exclusiva ecclesia_demo y confirmación SOLO_DEMO_LOCAL",
    );
}
export function generarAccesos() {
  const cuenta = (
    rol: "COORDINACION" | "ADMIN_IGLESIA" | "TESORERO",
    n: number,
  ) => ({
    id: idDemo(rol, n),
    identificador: `demo-${rol.toLowerCase()}-${n + 1}`,
    rol,
    iglesiaId: rol === "COORDINACION" ? null : idDemo("iglesia", n),
    password: randomBytes(24).toString("base64url"),
  });
  return {
    usuarios: [
      cuenta("COORDINACION", 0),
      ...Array.from({ length: 6 }, (_, i) => cuenta("ADMIN_IGLESIA", i)),
      ...Array.from({ length: 6 }, (_, i) => cuenta("TESORERO", i)),
    ],
    solicitudes: Array.from({ length: 12 }, () =>
      new ClavesSolicitud().generar(),
    ),
  };
}
export type AccesosDemo = ReturnType<typeof generarAccesos>;
const accesosInput = z.object({
  usuarios: z
    .array(
      z.object({
        id: z.uuid(),
        identificador: z.string(),
        rol: z.enum(["COORDINACION", "ADMIN_IGLESIA", "TESORERO"]),
        iglesiaId: z.uuid().nullable(),
        password: z.string().min(32).max(72),
      }),
    )
    .length(13),
  solicitudes: z
    .array(
      z.object({
        folio: z.string().regex(/^[A-F0-9]{24}$/),
        clave: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
        claveHash: z.string().regex(/^[a-f0-9]{64}$/),
      }),
    )
    .length(12),
});
export function periodoDemo(referencia: Date) {
  if (!Number.isFinite(referencia.getTime()))
    throw new Error("Referencia demo inválida");
  const fecha = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Mexico_City",
  }).format(referencia);
  const dia = new Date(fecha + "T00:00:00Z").getUTCDay();
  const lunes = sumarDias(fecha, -((dia + 6) % 7));
  return {
    desde: sumarDias(lunes, -28),
    finHistorico: sumarDias(lunes, -1),
    hasta: sumarDias(lunes, 27),
  };
}

// Solo el ejecutor local proporciona el destino. No lee DATABASE_URL ni .env.
export async function cargarDemo(
  db: PrismaClient,
  destino: string,
  confirmacion: string,
  referencia: Date,
  accesos: AccesosDemo,
) {
  validarDestino(destino, confirmacion);
  const source = fuentesDemo(); // Verificar todos los bytes antes de escribir.
  const periodo = periodoDemo(referencia);
  accesosInput.parse(accesos);
  for (const s of accesos.solicitudes)
    if (hashClave(s.clave) !== s.claveHash)
      throw new Error("Verificador demo inválido");
  // La identidad de la conexión real debe coincidir con el destino validado.
  const [conexion] = await db.$queryRaw<
    { nombre: string }[]
  >`SELECT current_database() AS nombre`;
  if (conexion.nombre !== new URL(destino).pathname.slice(1))
    throw new Error("Conexión demo distinta del destino");
  return db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(202620)`;
      const previa = await tx.cargaDemo.findUnique({
        where: { id: VERSION_DEMO },
      });
      if (previa) {
        if (
          previa.fuentes !== source.sha256 ||
          previa.referencia.getTime() !== referencia.getTime()
        )
          throw new Error(
            "Demo ya cargada con otra referencia o fuentes; crear otra carpeta demo",
          );
        return { creada: false, referencia: previa.referencia, periodo };
      }
      // Impide carreras con escrituras ajenas entre la comprobación y la carga.
      await tx.$executeRawUnsafe(
        'LOCK TABLE "Iglesia", "Usuario", "Sacerdote", "Estado", "Municipio", "Localidad", "CatalogoVersion", "CargaDemo" IN SHARE ROW EXCLUSIVE MODE',
      );
      if (
        (await tx.iglesia.count()) ||
        (await tx.usuario.count()) ||
        (await tx.sacerdote.count()) ||
        (await tx.estado.count()) ||
        (await tx.municipio.count()) ||
        (await tx.localidad.count()) ||
        (await tx.catalogoVersion.count()) ||
        (await tx.cargaDemo.count())
      )
        throw new Error(
          "Base no vacía: CT20 no mezcla ni sobrescribe datos existentes (tampoco seed mínimo)",
        );
      await tx.estado.createMany({
        data: source.base.estados.map((e) => ({
          clave: e.cvegeo,
          nombre: e.nomgeo,
        })),
      });
      await tx.municipio.createMany({
        data: source.base.municipios.map((m) => ({
          clave: m.cvegeo,
          estadoClave: m.cve_ent,
          codigo: m.cve_mun,
          nombre: m.nomgeo,
        })),
      });
      await tx.localidad.createMany({
        data: source.localidades.map((l) => ({
          clave: l.cvegeo,
          estadoClave: l.cve_ent,
          municipioClave: l.cve_mun,
          localidadClave: l.cve_loc,
          nombre: l.nomgeo,
          fuente: l.fuente,
          consulta: source.manifest.consulta,
        })),
      });
      await tx.catalogoVersion.createMany({
        data: [
          {
            version: source.base.manifest.version,
            consulta: source.base.manifest.consulta,
            sha256: source.base.sha256,
            manifest: source.base.manifest,
          },
          {
            version: source.manifest.version,
            consulta: source.manifest.consulta,
            sha256: hash(readFileSync(join(demoRoot, "manifest.json"))),
            manifest: source.manifest,
          },
        ],
      });
      const tipos = [
        "Catedral",
        "Basílica",
        "Parroquia",
        "Templo",
        "Capilla",
        "Santuario",
      ];
      // Las migraciones iniciales pueden contener tipos; no se modifican.
      for (const [n, nombre] of tipos.entries()) {
        const id = catalogId("1", n + 1);
        const actual = await tx.tipoIglesia.findUnique({ where: { id } });
        if (actual && actual.nombre !== nombre)
          throw new Error("Catálogo de tipos modificado");
        if (!actual) await tx.tipoIglesia.create({ data: { id, nombre } });
      }
      await tx.iglesia.createMany({
        data: Array.from({ length: 40 }, (_, i) => {
          const l = source.localidades[i % 8];
          const nombre = `CT20 Iglesia ${String(i + 1).padStart(2, "0")} (${tipos[i % 6]}, ficticia)`;
          return {
            id: idDemo("iglesia", i),
            nombre,
            nombreBusqueda: normalizar(nombre),
            tipoId: catalogId("1", (i % 6) + 1),
            estadoClave: l.cve_ent,
            municipioClave: l.cve_mun,
            localidadClave: l.cve_loc,
            direccion: `Calle ficticia CT20 ${i + 1}, domicilio de demostración`,
            contacto: `iglesia${i + 1}@example.invalid (ficticio)`,
            capacidad: 80 + i * 10,
            anioConstruccion: referencia.getUTCFullYear() - 100 - i,
            zonaIana: "America/Mexico_City",
          };
        }),
      });
      for (const u of accesos.usuarios) {
        const { password, ...datos } = u;
        await tx.usuario.create({
          data: { ...datos, passwordHash: await bcrypt.hash(password, 12) },
        });
      }
      await tx.objetoPatrimonial.createMany({
        data: Array.from({ length: 120 }, (_, n) => ({
          id: idDemo("objeto", n),
          iglesiaId: idDemo("iglesia", n % 40),
          descripcion: `CT20 Objeto ${n + 1} (ficticio; sin registro INAH real)`,
          tipoId: catalogId("3", (n % 12) + 1),
          anioExacto:
            referencia.getUTCFullYear() - (n < 5 ? 320 : n < 15 ? 220 : 80),
          material: "Madera ficticia",
          conservacion: "Estado de demostración ficticio",
          ubicacionInterna: "Sala CT20 ficticia",
          catalogadoInah: n % 9 === 0,
          condicion: n >= 116 ? "PRESTADO" : "VIGENTE",
        })),
      });
      const nombres = [
        "Bautizo",
        "Primera comunión",
        "Confirmación",
        "Matrimonio",
      ];
      for (let i = 0; i < 40; i++) {
        for (let j = 0; j < 4; j++)
          await tx.servicioOfrecido.create({
            data: {
              id: idDemo("servicio", i * 4 + j),
              iglesiaId: idDemo("iglesia", i),
              tipoId: catalogId("4", j + 1),
              nombre: nombres[j] + " (costo ficticio CT20)",
              modalidad: "FIJO",
              importe: `${100 + i * 5 + j * 20}.10`,
              moneda: "MXN",
              requisitos:
                "Requisitos ficticios para demostración; consultar a la iglesia antes de cualquier trámite real",
              duracionMinutos: 60,
              requiereCita: true,
              horarios: { create: [{ diaSemana: j + 2, horaLocal: "12:00" }] },
            },
          });
        for (let j = 0; j < 2; j++)
          await tx.platica.create({
            data: {
              id: idDemo("platica", i * 2 + j),
              iglesiaId: idDemo("iglesia", i),
              tipoId: catalogId("5", j === 0 ? 1 : 4),
              sesiones: 2 + j,
              importe: "50.10",
              moneda: "MXN",
              cupo: 20,
              lugar: "Salón ficticio CT20",
              impartidor: `Persona ficticia CT20 ${i + 1}`,
              horarios: { create: [{ diaSemana: j + 1, horaLocal: "16:00" }] },
            },
          });
      }
      await tx.sacerdote.createMany({
        data: Array.from({ length: 15 }, (_, i) => ({
          id: idDemo("padre", i),
          nombre: `Sacerdote ficticio CT20 ${i + 1}`,
        })),
      });
      for (let i = 0; i < 40; i++) {
        const iglesiaId = idDemo("iglesia", i),
          sacerdoteId = idDemo("padre", i % 15);
        await tx.asignacionSacerdote.create({
          data: { iglesiaId, sacerdoteId },
        });
        // Cada sacerdote atiende 2–3 iglesias en franjas distintas, con una hora de margen.
        const horaLocal = ["07:00", "09:00", "11:00"][Math.floor(i / 15)];
        for (let diaSemana = 1; diaSemana <= 7; diaSemana++) {
          const horarioId = idDemo("horario", i * 7 + diaSemana);
          const datos = {
            sacerdoteId,
            diaSemana,
            horaLocal,
            tipo:
              diaSemana === 7 ? ("DOMINICAL" as const) : ("DIARIA" as const),
            idioma: "Español",
            duracionMinutos: 60,
            desde: periodo.desde,
            hasta: periodo.hasta,
            activo: true,
          };
          await tx.horarioMisa.create({
            data: {
              id: horarioId,
              iglesiaId,
              zonaIana: "America/Mexico_City",
              ...datos,
            },
          });
          for (const o of ocurrencias(datos, "America/Mexico_City")) {
            const n = i * 1000 + Number(o.fechaLocal.replaceAll("-", ""));
            const ocurrenciaId = idDemo("ocurrencia", n);
            await tx.ocurrenciaMisa.create({
              data: {
                id: ocurrenciaId,
                horarioId,
                iglesiaId,
                sacerdoteId,
                horaLocal,
                zonaIana: "America/Mexico_City",
                ...o,
              },
            });
            if (i < 6 && o.fechaLocal <= periodo.finHistorico) {
              const celebracionId = idDemo("celebracion", n),
                diezmoId = idDemo("diezmo", n);
              const registradoEn = new Date(o.fin.getTime() + 60000);
              await tx.celebracionMisa.create({
                data: {
                  id: celebracionId,
                  ocurrenciaId,
                  iglesiaId,
                  previstoId: sacerdoteId,
                  oficianteId: sacerdoteId,
                  actorId: idDemo("ADMIN_IGLESIA", i),
                  registradoEn,
                  horaLocal,
                  zonaIana: "America/Mexico_City",
                  ...o,
                },
              });
              const importeCentavos = BigInt(
                10000 + i * 1000 + diaSemana * 110,
              );
              await tx.diezmo.create({
                data: {
                  id: diezmoId,
                  iglesiaId,
                  celebracionId,
                  importeCentavos,
                },
              });
              await tx.correccionDiezmo.create({
                data: {
                  id: idDemo("captura", n),
                  iglesiaId,
                  diezmoId,
                  actorId: idDemo("TESORERO", i),
                  instante: new Date(registradoEn.getTime() + 60000),
                  anteriorCentavos: null,
                  nuevoCentavos: importeCentavos,
                  version: 1,
                },
              });
            }
          }
        }
      }
      const estados: EstadoSolicitud[] = [
        "REGISTRADA",
        "COTIZADA",
        "SIN_LUGAR",
        "ACEPTADA",
        "RECHAZADA",
        "VENCIDA",
        "CANCELADA",
        "REGISTRADA",
        "COTIZADA",
        "SIN_LUGAR",
        "ACEPTADA",
        "CANCELADA",
      ];
      const espacios = ["CRIPTA", "NICHO", "COLUMBARIO", "OSARIO"] as const;
      for (let i = 0; i < 6; i++)
        for (const tipo of espacios)
          await tx.ofertaFuneraria.create({
            data: { iglesiaId: idDemo("iglesia", i), tipo },
          });
      for (const [n, estadoFinal] of estados.entries()) {
        const id = idDemo("solicitud", n),
          iglesiaId = idDemo("iglesia", n % 6),
          tipo = espacios[n % 4];
        const { folio, claveHash } = accesos.solicitudes[n];
        const cotizada = [
          "COTIZADA",
          "ACEPTADA",
          "RECHAZADA",
          "VENCIDA",
        ].includes(estadoFinal);
        const creada = new Date(
          referencia.getTime() -
            (estadoFinal === "VENCIDA" ? 20 : 2) * 86400000,
        );
        const emitida = cotizada ? new Date(creada.getTime() + 3600000) : null;
        const vence = emitida ? venceEn(emitida) : null;
        const cadena: EstadoSolicitud[] = ["REGISTRADA"];
        if (cotizada) cadena.push("COTIZADA");
        if (estadoFinal === "SIN_LUGAR") cadena.push("SIN_LUGAR");
        if (["ACEPTADA", "RECHAZADA", "CANCELADA"].includes(estadoFinal))
          cadena.push(
            transicion(
              cadena.at(-1)!,
              estadoFinal === "ACEPTADA"
                ? "ACEPTAR"
                : estadoFinal === "RECHAZADA"
                  ? "RECHAZAR"
                  : "CANCELAR",
            ),
          );
        if (estadoFinal === "VENCIDA") cadena.push("VENCIDA");
        const decisionEn = ["ACEPTADA", "RECHAZADA", "CANCELADA"].includes(
          estadoFinal,
        )
          ? new Date(creada.getTime() + 7200000)
          : null;
        await tx.solicitudEspacio.create({
          data: {
            id,
            iglesiaId,
            tipo,
            folio,
            claveHash,
            peticionId: idDemo("peticion", n),
            nombre: `Solicitante ficticio CT20 ${n + 1}`,
            contacto: `solicitante${n + 1}@example.invalid`,
            creada,
            estado: estadoFinal,
            version: cadena.length,
            emitida,
            vence,
            decisionEn,
            precioCentavos: cotizada ? BigInt(500010 + n * 10000) : null,
            condiciones: cotizada
              ? "Cotización ficticia CT20, sin reserva, pago ni contrato real"
              : null,
          },
        });
        let antes: Prisma.InputJsonObject | null = null;
        for (const [j, estado] of cadena.entries()) {
          const despues = { estado, version: j + 1, tipo };
          const personal = estado === "COTIZADA" || estado === "SIN_LUGAR";
          await tx.cambioSolicitud.create({
            data: {
              id: idDemo("cambio-solicitud", n * 10 + j),
              solicitudId: id,
              iglesiaId,
              version: j + 1,
              actor: personal
                ? "PERSONAL"
                : estado === "VENCIDA"
                  ? "SISTEMA"
                  : "SOLICITANTE",
              actorId: personal ? idDemo("ADMIN_IGLESIA", n % 6) : null,
              instante:
                estado === "VENCIDA"
                  ? vence!
                  : j === 0
                    ? creada
                    : personal
                      ? new Date(creada.getTime() + 3600000)
                      : decisionEn!,
              antes: antes ?? Prisma.JsonNull,
              despues,
            },
          });
          antes = despues;
        }
      }
      await tx.cargaDemo.create({
        data: { id: VERSION_DEMO, referencia, fuentes: source.sha256 },
      });
      return { creada: true, referencia, periodo };
    },
    { timeout: 120000 },
  );
}
