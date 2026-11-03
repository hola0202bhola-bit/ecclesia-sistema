import { Prisma, type PrismaClient, type Diezmo } from "@prisma/client";
import {
  ErrorDiezmo,
  decimal,
  type RepositorioDiezmos,
  type ConsultaDiezmos,
  type Captura,
} from "../domain/diezmo.js";
const ausente = () =>
  new ErrorDiezmo(
    404,
    "NO_ENCONTRADO",
    "Iglesia, celebración o diezmo no disponible",
  );
const conflicto = () =>
  new ErrorDiezmo(
    409,
    "CONFLICTO",
    "Existe una captura o cambió la versión. Consulte la actual antes de corregir",
  );
function captura(d: Diezmo): Captura {
  return {
    id: d.id,
    iglesiaId: d.iglesiaId,
    celebracionId: d.celebracionId,
    importeCentavos: d.importeCentavos.toString(),
    importe: decimal(d.importeCentavos),
    moneda: "MXN",
    version: d.version,
  };
}
export class PrismaRepositorioDiezmos implements RepositorioDiezmos {
  constructor(private readonly db: PrismaClient) {}
  private async iglesia(
    tx: Prisma.TransactionClient,
    id: string,
    bloquear = false,
  ) {
    if (bloquear)
      await tx.$queryRaw`SELECT id FROM "Iglesia" WHERE id=${id}::uuid FOR UPDATE`;
    if (
      !(await tx.iglesia.findFirst({
        where: { id, cerradaDesde: null },
        select: { id: true },
      }))
    )
      throw ausente();
  }
  misas(iglesiaId: string, q: ConsultaDiezmos) {
    return this.db.$transaction(
      async (tx) => {
        await this.iglesia(tx, iglesiaId);
        const filas = await tx.celebracionMisa.findMany({
          where: {
            iglesiaId,
            fechaLocal: { gte: q.desde, lte: q.hasta },
            oficianteId: q.sacerdoteId,
            ocurrencia: { horarioId: q.horarioId },
          },
          select: {
            id: true,
            fechaLocal: true,
            horaLocal: true,
            zonaIana: true,
            oficianteId: true,
            oficiante: { select: { nombre: true } },
            ocurrencia: {
              select: {
                horarioId: true,
                horaLocal: true,
                horario: { select: { diaSemana: true, tipo: true } },
              },
            },
            diezmo: true,
          },
          orderBy: [{ fechaLocal: "asc" }, { horaLocal: "asc" }, { id: "asc" }],
          take: 10001,
        });
        if (filas.length > 10000)
          throw new ErrorDiezmo(
            422,
            "PERIODO_EXTENSO",
            "Más de 10000 misas: reduzca fechas o filtre horario/padre; no se muestran totales parciales",
          );
        return filas.map((f) => ({
          celebracionId: f.id,
          fechaLocal: f.fechaLocal,
          horaLocal: f.horaLocal,
          zonaIana: f.zonaIana,
          horarioId: f.ocurrencia.horarioId,
          horario: `Día ${f.ocurrencia.horario.diaSemana} · ${f.ocurrencia.horaLocal} · ${f.ocurrencia.horario.tipo}`,
          sacerdoteId: f.oficianteId,
          sacerdote: f.oficiante.nombre,
          diezmo: f.diezmo ? captura(f.diezmo) : null,
        }));
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }
  async guardar(
    iglesiaId: string,
    celebracionId: string,
    actorId: string,
    importeCentavos: bigint,
    version?: number,
  ) {
    try {
      return await this.db.$transaction(
        async (tx) => {
          // Comparte el bloqueo de iglesia con agenda/edición de iglesia; relee tras adquirirlo.
          await this.iglesia(tx, iglesiaId, true);
          if (
            !(await tx.usuario.findFirst({
              where: { id: actorId, iglesiaId, rol: "TESORERO", activo: true },
              select: { id: true },
            }))
          )
            throw new ErrorDiezmo(
              403,
              "SIN_AMBITO",
              "Tesorero activo de esta iglesia requerido",
            );
          const hecho = await tx.celebracionMisa.findFirst({
            where: { id: celebracionId, iglesiaId },
            select: { fin: true },
          });
          if (!hecho) throw ausente();
          if (hecho.fin > new Date())
            throw new ErrorDiezmo(
              422,
              "MISA_NO_FINALIZADA",
              "Espere a que termine la misa celebrada",
            );
          const antes = await tx.diezmo.findFirst({
            where: { iglesiaId, celebracionId },
          });
          if (version === undefined && antes) throw conflicto();
          if (version !== undefined && !antes) throw ausente();
          if (antes && antes.version !== version) throw conflicto();
          let nuevo: Diezmo;
          if (antes) {
            const cambio = await tx.diezmo.updateMany({
              where: { id: antes.id, iglesiaId, version },
              data: { importeCentavos, version: { increment: 1 } },
            });
            if (cambio.count !== 1) throw conflicto();
            nuevo = { ...antes, importeCentavos, version: antes.version + 1 };
          } else
            nuevo = await tx.diezmo.create({
              data: { iglesiaId, celebracionId, importeCentavos },
            });
          await tx.correccionDiezmo.create({
            data: {
              iglesiaId,
              diezmoId: nuevo.id,
              actorId,
              anteriorCentavos: antes?.importeCentavos ?? null,
              nuevoCentavos: importeCentavos,
              version: nuevo.version,
            },
          });
          return captura(nuevo);
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
          timeout: 15000,
        },
      );
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      )
        throw conflicto();
      throw e;
    }
  }
  consultar(iglesiaId: string, celebracionId: string) {
    return this.db.$transaction(async (tx) => {
      await this.iglesia(tx, iglesiaId);
      const d = await tx.diezmo.findFirst({
        where: { iglesiaId, celebracionId },
      });
      if (!d) throw ausente();
      return captura(d);
    });
  }
  historial(iglesiaId: string, celebracionId: string) {
    return this.ficha(iglesiaId, celebracionId).then((f) => f.historial);
  }
  ficha(iglesiaId: string, celebracionId: string) {
    return this.db.$transaction(
      async (tx) => {
        await this.iglesia(tx, iglesiaId);
        const d = await tx.diezmo.findFirst({
          where: { iglesiaId, celebracionId },
        });
        if (!d) throw ausente();
        const cambios = await tx.correccionDiezmo.findMany({
          where: { iglesiaId, diezmoId: d.id },
          orderBy: { version: "asc" },
        });
        return {
          captura: captura(d),
          historial: cambios.map((c) => ({
            id: c.id,
            actorId: c.actorId,
            instante: c.instante.toISOString(),
            anteriorCentavos: c.anteriorCentavos?.toString() ?? null,
            nuevoCentavos: c.nuevoCentavos.toString(),
            version: c.version,
          })),
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }
}
