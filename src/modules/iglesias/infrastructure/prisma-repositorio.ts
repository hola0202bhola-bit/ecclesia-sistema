import {
  Prisma,
  type Iglesia as FilaIglesia,
  type PrismaClient,
} from "@prisma/client";
import {
  ErrorIglesias,
  normalizar,
  type DatosIglesia,
  type Filtros,
  type Iglesia,
  type RepositorioIglesias,
} from "../domain/iglesia.js";

function publica(row: FilaIglesia): Iglesia {
  const { nombreBusqueda: _busqueda, ...datos } = row;
  void _busqueda;
  return Object.fromEntries(
    Object.entries({
      ...datos,
      cerradaDesde: row.cerradaDesde?.toISOString() ?? null,
    }).filter(([key, value]) => value !== null || key === "cerradaDesde"),
  ) as unknown as Iglesia;
}
function fallo(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  )
    throw new ErrorIglesias(
      422,
      "REFERENCIA_INVALIDA",
      "Tipo o combinación geográfica no existe en catálogo cargado",
    );
  throw error;
}
export class PrismaRepositorioIglesias implements RepositorioIglesias {
  constructor(private readonly db: PrismaClient) {}
  async listar(f: Filtros) {
    const where: Prisma.IglesiaWhereInput = {
      cerradaDesde: null,
      estadoClave: f.estadoClave,
      municipioClave: f.municipioClave,
      localidadClave: f.localidadClave,
      tipoId: f.tipoId,
      nombreBusqueda:
        f.nombre === undefined ? undefined : { contains: normalizar(f.nombre) },
      capacidad: { gte: f.capacidadMin, lte: f.capacidadMax },
    };
    const [rows, total] = await this.db.$transaction(
      [
        this.db.iglesia.findMany({
          where,
          orderBy: [{ nombreBusqueda: "asc" }, { id: "asc" }],
          skip: (f.page - 1) * f.pageSize,
          take: f.pageSize,
        }),
        this.db.iglesia.count({ where }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
    return {
      data: rows.map(publica),
      meta: { page: f.page, pageSize: f.pageSize, total },
    };
  }
  async obtener(id: string) {
    const row = await this.db.iglesia.findUnique({ where: { id } });
    return row ? publica(row) : null;
  }
  async crear(datos: DatosIglesia) {
    try {
      return publica(
        await this.db.iglesia.create({
          data: { ...datos, nombreBusqueda: normalizar(datos.nombre) },
        }),
      );
    } catch (error) {
      fallo(error);
    }
  }
  async editar(id: string, version: number, datos: Partial<DatosIglesia>) {
    try {
      return await this.db.$transaction(async (tx) => {
        const updated = await tx.iglesia.updateMany({
          where: { id, version, cerradaDesde: null },
          data: {
            ...datos,
            nombreBusqueda:
              datos.nombre === undefined ? undefined : normalizar(datos.nombre),
            version: { increment: 1 },
          },
        });
        if (updated.count !== 1)
          throw new ErrorIglesias(
            409,
            "VERSION_OBSOLETA",
            "El recurso cambió; vuelva a consultarlo",
          );
        return publica(await tx.iglesia.findUniqueOrThrow({ where: { id } }));
      });
    } catch (error) {
      fallo(error);
    }
  }
}
