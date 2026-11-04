import { createHash } from "node:crypto";
import {
  Prisma,
  type PrismaClient,
  type ImportacionLocalidades as Lote,
} from "@prisma/client";
import { z } from "zod";
import { ErrorIglesias } from "../domain/iglesia.js";
import type {
  AmbitoLocalidades,
  DiferenciasLocalidades,
  FilaLocalidad,
  FuenteLocalidades,
  ImportacionLocalidades,
  RepositorioImportacion,
} from "../domain/importacion.js";
import { MAX_BYTES_INEGI } from "./descarga-inegi.js";

const hash = (v: string) => createHash("sha256").update(v).digest("hex");
const huella = (v: FilaLocalidad[]) => hash(JSON.stringify(v));
const fila = z
  .object({
    cvegeo: z.string().regex(/^\d{9}$/),
    cve_ent: z.string().regex(/^(0[1-9]|[12]\d|3[0-2])$/),
    cve_mun: z
      .string()
      .regex(/^\d{3}$/)
      .refine((v) => v !== "000"),
    cve_loc: z
      .string()
      .regex(/^\d{4}$/)
      .refine((v) => v !== "0000"),
    nomgeo: z.string().trim().min(1).max(200),
    estatus: z.literal(1),
    periodo: z.iso.date(),
  })
  .refine((v) => v.cvegeo === v.cve_ent + v.cve_mun + v.cve_loc);

export function validarLocalidades(
  a: AmbitoLocalidades,
  f: Awaited<ReturnType<FuenteLocalidades["descargar"]>>,
) {
  if (
    f.fuente !==
      "https://gaia.inegi.org.mx/wscatgeo/v2/localidades/" +
        a.estadoClave +
        a.municipioClave ||
    !Number.isFinite(Date.parse(f.consulta)) ||
    Date.parse(f.consulta) > Date.now() + 60000 ||
    Buffer.byteLength(f.original) > MAX_BYTES_INEGI
  )
    throw new ErrorIglesias(
      422,
      "FUENTE_INVALIDA",
      "Fuente, fecha o tamaño INEGI inválidos",
    );
  let json: unknown;
  try {
    json = JSON.parse(f.original);
  } catch {
    throw new ErrorIglesias(
      422,
      "FUENTE_INVALIDA",
      "INEGI no devolvió JSON válido",
    );
  }
  const contenido = z
    .object({
      datos: z.array(fila).min(1).max(5000),
      numReg: z.number().int().positive(),
      metadatos: z.object({
        Fuente_informacion_estadistica: z.string().min(1).max(500),
      }),
    })
    .parse(json);
  if (
    contenido.numReg !== contenido.datos.length ||
    new Set(contenido.datos.map((v) => v.cvegeo)).size !== contenido.numReg ||
    contenido.datos.some(
      (v) => v.cve_ent !== a.estadoClave || v.cve_mun !== a.municipioClave,
    )
  )
    throw new ErrorIglesias(
      422,
      "JERARQUIA_INVALIDA",
      "Conteo, duplicados o jerarquía INEGI incompatibles; no se importó nada",
    );
  return contenido.datos
    .map((v) => ({
      clave: v.cvegeo,
      estadoClave: v.cve_ent,
      municipioClave: v.cve_mun,
      localidadClave: v.cve_loc,
      nombre: v.nomgeo,
      fuente: f.fuente,
      consulta: f.consulta,
    }))
    .sort((x, y) => x.clave.localeCompare(y.clave));
}
function diferencias(
  antes: FilaLocalidad[],
  nuevas: FilaLocalidad[],
): DiferenciasLocalidades {
  const mapa = new Map(antes.map((v) => [v.clave, v]));
  const claves = new Set(nuevas.map((v) => v.clave));
  return {
    altas: nuevas.filter((v) => !mapa.has(v.clave)),
    cambios: nuevas
      .filter(
        (v) => mapa.has(v.clave) && mapa.get(v.clave)!.nombre !== v.nombre,
      )
      .map((despues) => ({ antes: mapa.get(despues.clave)!, despues })),
    sinCambio: nuevas.filter((v) => mapa.get(v.clave)?.nombre === v.nombre)
      .length,
    ausentesConservadas: antes.filter((v) => !claves.has(v.clave)),
  };
}
function salida(l: Lote): ImportacionLocalidades {
  const contenido = JSON.parse(l.original);
  const {
    original: _,
    antes: _a,
    huellaAntes: _h,
    huellaDespues: _d,
    ...publico
  } = l;
  void _;
  void _a;
  void _h;
  void _d;
  return {
    ...publico,
    metadatos: contenido.metadatos.Fuente_informacion_estadistica,
    periodos: [
      ...new Set<string>(
        contenido.datos.map((v: { periodo: string }) => v.periodo),
      ),
    ].sort(),
    origen: l.origen as AmbitoLocalidades["origen"],
    diferencias: l.diferencias as unknown as DiferenciasLocalidades,
  };
}
const conflicto = () =>
  new ErrorIglesias(
    409,
    "CATALOGO_CAMBIO",
    "El catálogo cambió. Consulte de nuevo y revise las diferencias antes de confirmar.",
  );
export class PrismaRepositorioImportacion implements RepositorioImportacion {
  constructor(private readonly db: PrismaClient) {}
  async verificarAmbito(a: AmbitoLocalidades) {
    if (
      !(await this.db.municipio.findUnique({
        where: {
          estadoClave_codigo: {
            estadoClave: a.estadoClave,
            codigo: a.municipioClave,
          },
        },
      }))
    )
      throw new ErrorIglesias(
        422,
        "MUNICIPIO_NO_CARGADO",
        "El municipio no existe en el snapshot cargado. No se inventan padres geográficos.",
      );
  }
  async listar() {
    // El listado omite originales y diferencias voluminosas; el detalle las entrega.
    const rows = await this.db.importacionLocalidades.findMany({
      orderBy: [{ creadoEn: "desc" }, { id: "desc" }],
      take: 20,
      omit: {
        original: true,
        antes: true,
        diferencias: true,
        huellaAntes: true,
        huellaDespues: true,
      },
    });
    return rows.map((l) => ({
      ...l,
      origen: l.origen as AmbitoLocalidades["origen"],
    }));
  }
  private async lote(tx: Prisma.TransactionClient, id: string) {
    const l = await tx.importacionLocalidades.findUnique({ where: { id } });
    if (!l)
      throw new ErrorIglesias(
        404,
        "IMPORTACION_NO_ENCONTRADA",
        "Importación no encontrada",
      );
    return l;
  }
  async obtener(id: string) {
    return salida(await this.lote(this.db, id));
  }
  async original(id: string) {
    return (await this.lote(this.db, id)).original;
  }
  private filas(
    tx: Prisma.TransactionClient,
    a: Pick<AmbitoLocalidades, "estadoClave" | "municipioClave">,
  ) {
    return tx.localidad.findMany({
      where: { estadoClave: a.estadoClave, municipioClave: a.municipioClave },
      orderBy: { clave: "asc" },
    });
  }
  private async bloquear(tx: Prisma.TransactionClient) {
    // Orden único; bloquea también seed/SQL concurrente. Las lecturas siguen disponibles.
    await tx.$executeRaw`SET LOCAL lock_timeout = '5s'`;
    await tx.$executeRaw`LOCK TABLE "Localidad", "ImportacionLocalidades" IN SHARE ROW EXCLUSIVE MODE`;
  }
  async preparar(
    a: AmbitoLocalidades,
    f: Awaited<ReturnType<FuenteLocalidades["descargar"]>>,
    actorId: string,
  ) {
    const nuevas = validarLocalidades(a, f);
    const sha256 = hash(f.original);
    return this.db.$transaction(
      async (tx) => {
        await this.bloquear(tx);
        const antes = await this.filas(tx, a);
        const huellaAntes = huella(antes);
        const existente = await tx.importacionLocalidades.findFirst({
          where: {
            estadoClave: a.estadoClave,
            municipioClave: a.municipioClave,
            sha256,
            huellaAntes,
            estado: "PREVIA",
          },
        });
        if (existente) return salida(existente);
        return salida(
          await tx.importacionLocalidades.create({
            data: {
              ...a,
              ...f,
              actorId,
              sha256,
              antes: antes as unknown as Prisma.InputJsonValue,
              huellaAntes,
              diferencias: diferencias(
                antes,
                nuevas,
              ) as unknown as Prisma.InputJsonValue,
            },
          }),
        );
      },
      { timeout: 60000 },
    );
  }
  async aplicar(id: string, motivo: string, actorId: string) {
    return this.db.$transaction(
      async (tx) => {
        await this.bloquear(tx);
        const l = await this.lote(tx, id);
        if (l.estado === "APLICADA") return salida(l);
        if (l.estado !== "PREVIA") throw conflicto();
        if (
          huella(await this.filas(tx, l)) !== l.huellaAntes ||
          hash(l.original) !== l.sha256
        )
          throw conflicto();
        const nuevas = validarLocalidades(
          { ...l, origen: l.origen as AmbitoLocalidades["origen"] },
          l,
        );
        const diff = diferencias(await this.filas(tx, l), nuevas);
        for (const alta of diff.altas)
          await tx.localidad.create({ data: alta });
        for (const c of diff.cambios)
          await tx.localidad.update({
            where: { clave: c.despues.clave },
            data: {
              nombre: c.despues.nombre,
              fuente: l.fuente,
              consulta: l.consulta,
            },
          });
        const max = await tx.importacionLocalidades.aggregate({
          where: {
            estadoClave: l.estadoClave,
            municipioClave: l.municipioClave,
          },
          _max: { revision: true },
        });
        return salida(
          await tx.importacionLocalidades.update({
            where: { id },
            data: {
              estado: "APLICADA",
              motivo,
              aplicadoPor: actorId,
              aplicadaEn: new Date(),
              revision: (max._max.revision ?? 0) + 1,
              huellaDespues: huella(await this.filas(tx, l)),
            },
          }),
        );
      },
      { timeout: 60000 },
    );
  }
  async revertir(id: string, motivo: string, actorId: string) {
    return this.db.$transaction(
      async (tx) => {
        await this.bloquear(tx);
        const l = await this.lote(tx, id);
        if (l.estado === "REVERTIDA") return salida(l);
        if (
          l.estado !== "APLICADA" ||
          huella(await this.filas(tx, l)) !== l.huellaDespues ||
          (await tx.importacionLocalidades.count({
            where: {
              estadoClave: l.estadoClave,
              municipioClave: l.municipioClave,
              estado: "APLICADA",
              revision: { gt: l.revision! },
            },
          }))
        )
          throw conflicto();
        const antes = l.antes as unknown as FilaLocalidad[];
        const previas = new Set(antes.map((v) => v.clave));
        const altas = (await this.filas(tx, l)).filter(
          (v) => !previas.has(v.clave),
        );
        for (const alta of altas) {
          if (
            await tx.iglesia.count({
              where: {
                estadoClave: alta.estadoClave,
                municipioClave: alta.municipioClave,
                localidadClave: alta.localidadClave,
              },
            })
          )
            throw new ErrorIglesias(
              409,
              "LOCALIDAD_EN_USO",
              "No se puede revertir: una localidad añadida tiene iglesias. Se conserva todo el catálogo y su historia.",
            );
          await tx.localidad.delete({ where: { clave: alta.clave } });
        }
        for (const v of antes)
          await tx.localidad.update({
            where: { clave: v.clave },
            data: { nombre: v.nombre, fuente: v.fuente, consulta: v.consulta },
          });
        return salida(
          await tx.importacionLocalidades.update({
            where: { id },
            data: {
              estado: "REVERTIDA",
              motivoReversion: motivo,
              revertidaPor: actorId,
              revertidaEn: new Date(),
            },
          }),
        );
      },
      { timeout: 60000 },
    );
  }
}
