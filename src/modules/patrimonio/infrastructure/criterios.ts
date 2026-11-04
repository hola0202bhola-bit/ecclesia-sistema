import { Prisma, type PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { ErrorPatrimonio, type Criterios } from "../domain/patrimonio.js";
import type {
  RepositorioCriterios,
  VersionCriterio,
} from "../domain/criterios.js";
export class PrismaRepositorioCriterios implements RepositorioCriterios {
  constructor(private readonly db: PrismaClient) {}
  listar() {
    return this.db.$transaction(
      async (tx) => ({
        versiones: (await tx.criterioPatrimonio.findMany({
          orderBy: [{ creadoEn: "desc" }, { id: "asc" }],
        })) as unknown as VersionCriterio[],
        activo: await tx.configuracionIndice.findUniqueOrThrow({
          where: { id: "global" },
          select: { criterioId: true, version: true },
        }),
        historial: await tx.cambioCriterio.findMany({
          orderBy: [{ fecha: "desc" }, { id: "asc" }],
          take: 100,
        }),
      }),
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }
  crear(
    nombre: string,
    parametros: Omit<Criterios, "id">,
    motivo: string,
    actorId: string,
  ) {
    return this.db.$transaction(async (tx) => {
      const id = randomUUID();
      const version = await tx.criterioPatrimonio.create({
        data: {
          id,
          nombre,
          parametros: { ...parametros, id } as unknown as Prisma.InputJsonValue,
        },
      });
      await tx.cambioCriterio.create({
        data: { criterioId: id, actorId, motivo, tipo: "CREACION" },
      });
      return version as unknown as VersionCriterio;
    });
  }
  activar(id: string, version: number, motivo: string, actorId: string) {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "ConfiguracionIndice" WHERE id='global' FOR UPDATE`;
      const antes = await tx.configuracionIndice.findUniqueOrThrow({
        where: { id: "global" },
      });
      if (antes.version !== version)
        throw new ErrorPatrimonio(
          409,
          "VERSION_OBSOLETA",
          "Los criterios activos cambiaron; vuelva a consultar",
        );
      if (!(await tx.criterioPatrimonio.findUnique({ where: { id } })))
        throw new ErrorPatrimonio(
          404,
          "NO_ENCONTRADO",
          "Versión de criterios no encontrada",
        );
      if (antes.criterioId === id)
        throw new ErrorPatrimonio(
          409,
          "YA_ACTIVO",
          "Esta versión ya está activa",
        );
      const despues = await tx.configuracionIndice.update({
        where: { id: "global", version },
        data: { criterioId: id, version: { increment: 1 } },
        select: { criterioId: true, version: true },
      });
      await tx.cambioCriterio.create({
        data: {
          criterioId: id,
          actorId,
          motivo,
          tipo: "ACTIVACION",
          anterior: antes.criterioId,
          version: despues.version,
        },
      });
      return despues;
    });
  }
}
