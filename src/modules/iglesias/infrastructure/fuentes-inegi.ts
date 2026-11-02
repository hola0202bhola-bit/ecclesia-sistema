import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
const estado = z.string().regex(/^(0[1-9]|[12]\d|3[0-2])$/);
const municipio = z
  .string()
  .regex(/^\d{3}$/)
  .refine((v) => v !== "000");
const nombre = z.string().trim().min(1).max(200);
const estadoRow = z
  .object({ cvegeo: estado, cve_ent: estado, nomgeo: nombre })
  .refine((v) => v.cvegeo === v.cve_ent);
const municipioRow = z
  .object({
    cvegeo: z.string(),
    cve_ent: estado,
    cve_mun: municipio,
    nomgeo: nombre,
  })
  .refine((v) => v.cvegeo === v.cve_ent + v.cve_mun);
const localidadRow = z
  .object({
    cvegeo: z.string(),
    cve_ent: estado,
    cve_mun: municipio,
    cve_loc: z
      .string()
      .regex(/^\d{4}$/)
      .refine((v) => v !== "0000"),
    nomgeo: nombre,
  })
  .refine((v) => v.cvegeo === v.cve_ent + v.cve_mun + v.cve_loc);
const manifestInput = z.strictObject({
  version: z.string().min(1).max(100),
  consulta: z.iso.date(),
  alcance: z.string().min(1),
  archivos: z
    .array(
      z.strictObject({
        archivo: z.string(),
        fuente: z.url(),
        sha256: z.string().regex(/^[a-f0-9]{64}$/),
        registros: z.number().int().positive(),
      }),
    )
    .length(34),
});
const hash = (raw: Buffer) => createHash("sha256").update(raw).digest("hex");
export function cargarFuentes(folder: string) {
  const rawManifest = readFileSync(join(folder, "manifest.json"));
  const manifest = manifestInput.parse(
    JSON.parse(rawManifest.toString("utf8").replace(/^\uFEFF/, "")),
  );
  const archivos = manifest.archivos;
  const expected = [
    ["inegi-estados.json", "mgee/"],
    ...Array.from({ length: 32 }, (_, i) => {
      const clave = String(i + 1).padStart(2, "0");
      return [`inegi-municipios-${clave}.json`, `mgem/${clave}`];
    }),
    ["inegi-localidad.json", "localidades/211140001"],
  ];
  for (const [archivo, url] of expected) {
    const entry = archivos.filter((v) => v.archivo === archivo);
    if (
      entry.length !== 1 ||
      entry[0].fuente !== "https://gaia.inegi.org.mx/wscatgeo/v2/" + url
    )
      throw new Error("Fuente INEGI inesperada o duplicada");
  }
  function leer<T extends z.ZodType>(file: string, row: T): z.output<T>[] {
    const entry = archivos.find((v) => v.archivo === file)!;
    const raw = readFileSync(join(folder, file));
    if (hash(raw) !== entry.sha256)
      throw new Error("Hash INEGI incorrecto: " + file);
    const result = z
      .object({
        datos: z.array(row),
        numReg: z.number().int().positive(),
        metadatos: z.object({
          Fuente_informacion_estadistica: z.string().min(1),
        }),
      })
      .parse(JSON.parse(raw.toString("utf8")));
    if (
      result.numReg !== result.datos.length ||
      result.numReg !== entry.registros
    )
      throw new Error("Conteo INEGI incorrecto: " + file);
    return result.datos as z.output<T>[];
  }
  const estados = leer("inegi-estados.json", estadoRow);
  if (
    estados.length !== 32 ||
    new Set(estados.map((v) => v.cvegeo)).size !== 32
  )
    throw new Error("Se requieren 32 estados únicos");
  const municipios = estados.flatMap((e) => {
    const rows = leer(`inegi-municipios-${e.cvegeo}.json`, municipioRow);
    if (rows.some((v) => v.cve_ent !== e.cvegeo))
      throw new Error("Municipio fuera del estado");
    return rows;
  });
  if (new Set(municipios.map((v) => v.cvegeo)).size !== municipios.length)
    throw new Error("Municipios duplicados");
  const localidades = leer("inegi-localidad.json", localidadRow);
  if (
    localidades.length !== 1 ||
    localidades[0].cvegeo !== "211140001" ||
    localidades.some(
      (v) => !municipios.some((m) => m.cvegeo === v.cve_ent + v.cve_mun),
    )
  )
    throw new Error("Localidad fuera del alcance verificado");
  return {
    estados,
    municipios,
    localidades,
    manifest,
    sha256: hash(rawManifest),
  };
}

export async function importarFuentes(
  db: PrismaClient,
  source: ReturnType<typeof cargarFuentes>,
) {
  await db.$transaction(
    async (tx) => {
      for (const estado of source.estados)
        await tx.estado.upsert({
          where: { clave: estado.cvegeo },
          update: { nombre: estado.nomgeo },
          create: { clave: estado.cvegeo, nombre: estado.nomgeo },
        });
      for (const municipio of source.municipios)
        await tx.municipio.upsert({
          where: { clave: municipio.cvegeo },
          update: { nombre: municipio.nomgeo },
          create: {
            clave: municipio.cvegeo,
            estadoClave: municipio.cve_ent,
            codigo: municipio.cve_mun,
            nombre: municipio.nomgeo,
          },
        });
      for (const loc of source.localidades) {
        const fuente = source.manifest.archivos.find(
          (v) => v.archivo === "inegi-localidad.json",
        )!.fuente;
        const datos = {
          nombre: loc.nomgeo,
          fuente,
          consulta: source.manifest.consulta,
        };
        await tx.localidad.upsert({
          where: { clave: loc.cvegeo },
          update: datos,
          create: {
            clave: loc.cvegeo,
            estadoClave: loc.cve_ent,
            municipioClave: loc.cve_mun,
            localidadClave: loc.cve_loc,
            ...datos,
          },
        });
      }
      const previa = await tx.catalogoVersion.findUnique({
        where: { version: source.manifest.version },
      });
      if (previa && previa.sha256 !== source.sha256)
        throw new Error("Versión INEGI ya usada con otro manifest");
      await tx.catalogoVersion.upsert({
        where: { version: source.manifest.version },
        update: {},
        create: {
          version: source.manifest.version,
          consulta: source.manifest.consulta,
          sha256: source.sha256,
          manifest: source.manifest,
        },
      });
    },
    { timeout: 60000 },
  );
}
