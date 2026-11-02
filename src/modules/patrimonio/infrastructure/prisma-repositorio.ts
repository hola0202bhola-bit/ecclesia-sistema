import { Prisma, type PrismaClient } from "@prisma/client";
import {
  ErrorPatrimonio,
  validarCambioCondicion,
  type Criterios,
  type DatosObjeto,
  type Condicion,
  type FiltrosPatrimonio,
  type RepositorioPatrimonio,
} from "../domain/patrimonio.js";

export class PrismaRepositorioPatrimonio implements RepositorioPatrimonio {
  constructor(private readonly db: PrismaClient) {}
  private async criterios(tx: Prisma.TransactionClient): Promise<Criterios> {
    const fila = await tx.criterioPatrimonio.findUniqueOrThrow({
      where: { id: "caso-v1" },
    });
    return fila.parametros as unknown as Criterios;
  }
  leer(iglesiaId: string) {
    return this.db.$transaction(
      async (tx) => {
        const iglesia = await tx.iglesia.findUnique({
          where: { id: iglesiaId },
          include: { objetos: { orderBy: { id: "asc" } } },
        });
        return iglesia
          ? { iglesia, criterios: await this.criterios(tx) }
          : null;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }
  ranking(f: FiltrosPatrimonio) {
    return this.db.$transaction(
      async (tx) => ({
        iglesias: await tx.iglesia.findMany({
          where: {
            cerradaDesde: null,
            estadoClave: f.estadoClave,
            municipioClave: f.municipioClave,
            localidadClave: f.localidadClave,
            objetos: { some: {} },
          },
          include: { objetos: { orderBy: { id: "asc" } } },
        }),
        criterios: await this.criterios(tx),
      }),
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }
  private async iglesia(tx: Prisma.TransactionClient, id: string) {
    // Serializa con edición/cierre de la iglesia y con capturas patrimoniales.
    const rows = await tx.$queryRaw<
      { cerradaDesde: Date | null }[]
    >`SELECT "cerradaDesde" FROM "Iglesia" WHERE id = ${id}::uuid FOR UPDATE`;
    if (!rows.length || rows[0].cerradaDesde)
      throw new ErrorPatrimonio(404, "NO_ENCONTRADA", "Iglesia no disponible");
  }
  async guardar(
    iglesiaId: string,
    actorId: string,
    datos: DatosObjeto,
    edicion?: { id: string; version: number },
  ) {
    return this.db.$transaction(async (tx) => {
      await this.iglesia(tx, iglesiaId);
      const antes = edicion
        ? await tx.objetoPatrimonial.findFirst({
            where: { id: edicion.id, iglesiaId },
          })
        : null;
      if (edicion && !antes)
        throw new ErrorPatrimonio(
          404,
          "OBJETO_NO_ENCONTRADO",
          "Objeto no disponible",
        );
      if (edicion && antes!.version !== edicion.version)
        throw new ErrorPatrimonio(
          409,
          "VERSION_OBSOLETA",
          "El objeto cambió; vuelva a consultarlo",
        );
      const despues = edicion
        ? await tx.objetoPatrimonial.update({
            where: { id: edicion.id, iglesiaId, version: edicion.version },
            data: { ...datos, version: { increment: 1 } },
          })
        : await tx.objetoPatrimonial.create({ data: { ...datos, iglesiaId } });
      await tx.cambioPatrimonio.create({
        data: {
          objetoId: despues.id,
          actorId,
          antes: antes ? JSON.parse(JSON.stringify(antes)) : Prisma.JsonNull,
          despues: JSON.parse(JSON.stringify(despues)),
        },
      });
      return despues;
    });
  }
  async condicion(
    iglesiaId: string,
    actorId: string,
    objetoId: string,
    version: number,
    condicion: Condicion,
  ) {
    return this.db.$transaction(async (tx) => {
      await this.iglesia(tx, iglesiaId);
      const antes = await tx.objetoPatrimonial.findFirst({
        where: { id: objetoId, iglesiaId },
      });
      if (!antes)
        throw new ErrorPatrimonio(
          404,
          "OBJETO_NO_ENCONTRADO",
          "Objeto no disponible",
        );
      if (antes.version !== version)
        throw new ErrorPatrimonio(
          409,
          "VERSION_OBSOLETA",
          "El objeto cambió; vuelva a consultarlo",
        );
      validarCambioCondicion(antes.condicion, condicion);
      const despues = await tx.objetoPatrimonial.update({
        where: { id: objetoId, iglesiaId, version },
        data: { condicion, version: { increment: 1 } },
      });
      await tx.cambioPatrimonio.create({
        data: {
          objetoId,
          actorId,
          antes: JSON.parse(JSON.stringify(antes)),
          despues: JSON.parse(JSON.stringify(despues)),
        },
      });
      return despues;
    });
  }
}
