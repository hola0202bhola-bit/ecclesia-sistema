import { Prisma, type PrismaClient } from "@prisma/client";
import {
  ErrorOferta,
  validarServicio,
  validarPlatica,
  type RepositorioOferta,
  type DatosServicio,
  type DatosPlatica,
  type Servicio,
  type Platica,
  type Pagina,
  type Edicion,
} from "../domain/oferta.js";
const horarios = {
  select: { diaSemana: true, horaLocal: true },
  orderBy: [{ diaSemana: "asc" as const }, { horaLocal: "asc" as const }],
};
// Proyección explícita: auditoría, actor y relaciones privadas nunca salen por HTTP.
const servicioSelect = {
  id: true,
  version: true,
  tipoId: true,
  nombre: true,
  modalidad: true,
  importe: true,
  moneda: true,
  requisitos: true,
  duracionMinutos: true,
  requiereCita: true,
  horarios,
} as const;
const platicaSelect = {
  id: true,
  version: true,
  tipoId: true,
  sesiones: true,
  importe: true,
  moneda: true,
  cupo: true,
  lugar: true,
  impartidor: true,
  horarios,
} as const;
type FilaServicio = Prisma.ServicioOfrecidoGetPayload<{
  select: typeof servicioSelect;
}>;
type FilaPlatica = Prisma.PlaticaGetPayload<{ select: typeof platicaSelect }>;
const servicioDto = (v: FilaServicio): Servicio => ({
  ...v,
  importe: v.importe?.toFixed(2) ?? null,
});
const platicaDto = (v: FilaPlatica): Platica => ({
  ...v,
  importe: v.importe.toFixed(2),
});
const noDisponible = () =>
  new ErrorOferta(404, "NO_ENCONTRADO", "Iglesia o recurso no disponible");
export class PrismaRepositorioOferta implements RepositorioOferta {
  constructor(private readonly db: PrismaClient) {}
  private async iglesia(
    tx: Prisma.TransactionClient,
    id: string,
    bloquear = false,
  ) {
    if (bloquear) {
      const rows = await tx.$queryRaw<
        { id: string; nombre: string; cerradaDesde: Date | null }[]
      >`SELECT id, nombre, "cerradaDesde" FROM "Iglesia" WHERE id = ${id}::uuid FOR UPDATE`;
      if (!rows.length || rows[0].cerradaDesde) throw noDisponible();
      return { id: rows[0].id, nombre: rows[0].nombre };
    }
    const i = await tx.iglesia.findFirst({
      where: { id, cerradaDesde: null },
      select: { id: true, nombre: true },
    });
    if (!i) throw noDisponible();
    return i;
  }
  servicios(iglesiaId: string, pagina: Pagina) {
    return this.db.$transaction(
      async (tx) => {
        const iglesia = await this.iglesia(tx, iglesiaId);
        const data = await tx.servicioOfrecido.findMany({
          where: { iglesiaId },
          select: servicioSelect,
          orderBy: { id: "asc" },
          skip: (pagina.page - 1) * pagina.pageSize,
          take: pagina.pageSize,
        });
        return {
          iglesia,
          data: data.map(servicioDto),
          meta: {
            ...pagina,
            total: await tx.servicioOfrecido.count({ where: { iglesiaId } }),
          },
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }
  platicas(iglesiaId: string, pagina: Pagina) {
    return this.db.$transaction(
      async (tx) => {
        const iglesia = await this.iglesia(tx, iglesiaId);
        const data = await tx.platica.findMany({
          where: { iglesiaId },
          select: platicaSelect,
          orderBy: { id: "asc" },
          skip: (pagina.page - 1) * pagina.pageSize,
          take: pagina.pageSize,
        });
        return {
          iglesia,
          data: data.map(platicaDto),
          meta: {
            ...pagina,
            total: await tx.platica.count({ where: { iglesiaId } }),
          },
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }
  async servicio(iglesiaId: string, id: string) {
    const fila = await this.db.servicioOfrecido.findFirst({
      where: { id, iglesiaId, iglesia: { cerradaDesde: null } },
      select: servicioSelect,
    });
    if (!fila) throw noDisponible();
    return servicioDto(fila);
  }
  async platica(iglesiaId: string, id: string) {
    const fila = await this.db.platica.findFirst({
      where: { id, iglesiaId, iglesia: { cerradaDesde: null } },
      select: platicaSelect,
    });
    if (!fila) throw noDisponible();
    return platicaDto(fila);
  }
  private version(antes: { version: number } | null, edicion?: Edicion) {
    if (edicion && !antes) throw noDisponible();
    if (edicion && antes!.version !== edicion.version)
      throw new ErrorOferta(
        409,
        "VERSION_OBSOLETA",
        "El registro cambió. Conserve sus datos y abra la versión actual para comparar.",
      );
  }
  guardarServicio(
    iglesiaId: string,
    actorId: string,
    cambios: Partial<DatosServicio>,
    edicion?: Edicion,
  ) {
    return this.db.$transaction(async (tx) => {
      await this.iglesia(tx, iglesiaId, true);
      const fila = edicion
        ? await tx.servicioOfrecido.findFirst({
            where: { id: edicion.id, iglesiaId },
            select: servicioSelect,
          })
        : null;
      this.version(fila, edicion);
      const antes = fila ? servicioDto(fila) : null;
      const datos = { ...antes, ...cambios } as DatosServicio;
      validarServicio(datos);
      const {
        horarios: hs,
        tipoId,
        nombre,
        modalidad,
        importe,
        moneda,
        requisitos,
        duracionMinutos,
        requiereCita,
      } = datos;
      const campos = {
        tipoId,
        nombre,
        modalidad,
        importe,
        moneda,
        requisitos,
        duracionMinutos,
        requiereCita,
      };
      const despues = servicioDto(
        edicion
          ? await tx.servicioOfrecido.update({
              where: { id: edicion.id, iglesiaId, version: edicion.version },
              data: {
                ...campos,
                version: { increment: 1 },
                horarios: { deleteMany: {}, create: hs },
              },
              select: servicioSelect,
            })
          : await tx.servicioOfrecido.create({
              data: { ...campos, iglesiaId, horarios: { create: hs } },
              select: servicioSelect,
            }),
      );
      await tx.cambioOferta.create({
        data: {
          servicioId: despues.id,
          actorId,
          antes: antes ? JSON.parse(JSON.stringify(antes)) : Prisma.JsonNull,
          despues: JSON.parse(JSON.stringify(despues)),
        },
      });
      return despues;
    });
  }
  guardarPlatica(
    iglesiaId: string,
    actorId: string,
    cambios: Partial<DatosPlatica>,
    edicion?: Edicion,
  ) {
    return this.db.$transaction(async (tx) => {
      await this.iglesia(tx, iglesiaId, true);
      const fila = edicion
        ? await tx.platica.findFirst({
            where: { id: edicion.id, iglesiaId },
            select: platicaSelect,
          })
        : null;
      this.version(fila, edicion);
      const antes = fila ? platicaDto(fila) : null;
      const datos = { ...antes, ...cambios } as DatosPlatica;
      validarPlatica(datos);
      const {
        horarios: hs,
        tipoId,
        sesiones,
        importe,
        moneda,
        cupo,
        lugar,
        impartidor,
      } = datos;
      const campos = {
        tipoId,
        sesiones,
        importe,
        moneda,
        cupo,
        lugar,
        impartidor,
      };
      const despues = platicaDto(
        edicion
          ? await tx.platica.update({
              where: { id: edicion.id, iglesiaId, version: edicion.version },
              data: {
                ...campos,
                version: { increment: 1 },
                horarios: { deleteMany: {}, create: hs },
              },
              select: platicaSelect,
            })
          : await tx.platica.create({
              data: { ...campos, iglesiaId, horarios: { create: hs } },
              select: platicaSelect,
            }),
      );
      await tx.cambioOferta.create({
        data: {
          platicaId: despues.id,
          actorId,
          antes: antes ? JSON.parse(JSON.stringify(antes)) : Prisma.JsonNull,
          despues: JSON.parse(JSON.stringify(despues)),
        },
      });
      return despues;
    });
  }
}
