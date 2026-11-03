import { Prisma, type PrismaClient } from "@prisma/client";
import {
  ErrorAgenda,
  ocurrencias,
  instante,
  sumarDias,
  traslapa,
  type RepositorioAgenda,
  type DatosHorario,
  type DatosCelebracion,
  type Edicion,
  type Semana,
} from "../domain/agenda.js";
const ausente = () =>
  new ErrorAgenda(404, "NO_ENCONTRADO", "Iglesia o recurso no disponible");
const conflicto = () =>
  new ErrorAgenda(
    409,
    "TRASLAPE",
    "El sacerdote tiene otra misa en ese intervalo",
  );
const padreSelect = { id: true, nombre: true, version: true } as const;
export class PrismaRepositorioAgenda implements RepositorioAgenda {
  constructor(private readonly db: PrismaClient) {}
  private escritura<T>(
    operacion: (tx: Prisma.TransactionClient) => Promise<T>,
    opciones = { timeout: 15000 },
  ) {
    return this.db.$transaction(operacion, {
      ...opciones,
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    });
  }
  private async iglesia(
    tx: Prisma.TransactionClient,
    id: string,
    bloquear = false,
  ) {
    if (bloquear) {
      // Orden único: iglesia, después mutex de agenda. Lecturas tras el lock usan READ COMMITTED.
      await tx.$queryRaw`SELECT id FROM "Iglesia" WHERE id=${id}::uuid FOR UPDATE`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(831621)`;
    }
    const i = await tx.iglesia.findFirst({ where: { id, cerradaDesde: null } });
    if (!i) throw ausente();
    return i;
  }
  private async asignado(
    tx: Prisma.TransactionClient,
    iglesiaId: string,
    sacerdoteId: string,
  ) {
    const p = await tx.asignacionSacerdote.findUnique({
      where: { iglesiaId_sacerdoteId: { iglesiaId, sacerdoteId } },
    });
    if (!p) throw ausente();
  }
  private audit(
    tx: Prisma.TransactionClient,
    iglesiaId: string,
    actorId: string,
    recursoId: string,
    antes: unknown,
    despues: unknown,
  ) {
    return tx.cambioAgenda.create({
      data: {
        iglesiaId,
        actorId,
        recursoId,
        antes:
          antes === null ? Prisma.JsonNull : JSON.parse(JSON.stringify(antes)),
        despues: JSON.parse(JSON.stringify(despues)),
      },
    });
  }
  sacerdotes(iglesiaId: string) {
    return this.db.$transaction(async (tx) => {
      await this.iglesia(tx, iglesiaId);
      return tx.sacerdote.findMany({
        where: { asignaciones: { some: { iglesiaId } } },
        select: padreSelect,
        orderBy: { id: "asc" },
      });
    });
  }
  registrar(iglesiaId: string, actorId: string, nombre: string) {
    return this.escritura(async (tx) => {
      await this.iglesia(tx, iglesiaId, true);
      const p = await tx.sacerdote.create({
        data: { nombre, asignaciones: { create: { iglesiaId } } },
        select: padreSelect,
      });
      await this.audit(tx, iglesiaId, actorId, p.id, null, p);
      return p;
    });
  }
  vincular(iglesiaId: string, actorId: string, sacerdoteId: string) {
    return this.escritura(async (tx) => {
      await this.iglesia(tx, iglesiaId, true);
      const p = await tx.sacerdote.findUnique({
        where: { id: sacerdoteId },
        select: padreSelect,
      });
      if (!p) throw ausente();
      if (
        await tx.asignacionSacerdote.findUnique({
          where: { iglesiaId_sacerdoteId: { iglesiaId, sacerdoteId } },
        })
      )
        throw new ErrorAgenda(
          409,
          "YA_ASIGNADO",
          "El sacerdote ya atiende esta iglesia",
        );
      await tx.asignacionSacerdote.create({ data: { iglesiaId, sacerdoteId } });
      await this.audit(tx, iglesiaId, actorId, p.id, null, {
        asignacion: iglesiaId,
      });
      return p;
    });
  }
  renombrar(iglesiaId: string, actorId: string, e: Edicion, nombre: string) {
    return this.escritura(async (tx) => {
      await this.iglesia(tx, iglesiaId, true);
      await this.asignado(tx, iglesiaId, e.id);
      const antes = await tx.sacerdote.findUniqueOrThrow({
        where: { id: e.id },
      });
      this.version(antes.version, e.version);
      if (
        (await tx.asignacionSacerdote.count({ where: { sacerdoteId: e.id } })) >
        1
      )
        throw new ErrorAgenda(
          409,
          "IDENTIDAD_COMPARTIDA_PC10",
          "Identidad compartida: su modificación queda pendiente PC-10",
        );
      const p = await tx.sacerdote.update({
        where: { id: e.id, version: e.version },
        data: { nombre, version: { increment: 1 } },
        select: padreSelect,
      });
      await this.audit(tx, iglesiaId, actorId, p.id, antes, p);
      return p;
    });
  }
  private version(actual: number, esperada: number) {
    if (actual !== esperada)
      throw new ErrorAgenda(
        409,
        "VERSION_OBSOLETA",
        "El registro cambió. Conserve sus datos y abra la versión actual para comparar.",
      );
  }
  horarios(iglesiaId: string) {
    return this.db.$transaction(async (tx) => {
      await this.iglesia(tx, iglesiaId);
      return tx.horarioMisa.findMany({
        where: { iglesiaId },
        orderBy: { id: "asc" },
      });
    });
  }
  private async conflictos(
    tx: Prisma.TransactionClient,
    sacerdoteId: string,
    intervalos: { inicio: Date; fin: Date }[],
    excluirHorario?: string,
    excluirOcurrencia?: string,
  ) {
    const planes = await tx.ocurrenciaMisa.findMany({
      where: {
        sacerdoteId,
        ...(excluirHorario ? { horarioId: { not: excluirHorario } } : {}),
        ...(excluirOcurrencia ? { id: { not: excluirOcurrencia } } : {}),
      },
      select: { inicio: true, fin: true },
    });
    const hechos = await tx.celebracionMisa.findMany({
      where: {
        oficianteId: sacerdoteId,
        ...(excluirOcurrencia
          ? { ocurrenciaId: { not: excluirOcurrencia } }
          : {}),
      },
      select: { inicio: true, fin: true },
    });
    if (
      intervalos.some((a) => [...planes, ...hechos].some((b) => traslapa(a, b)))
    )
      throw conflicto();
  }
  guardar(
    iglesiaId: string,
    actorId: string,
    datos: DatosHorario,
    e?: Edicion,
  ) {
    return this.escritura(
      async (tx) => {
        const iglesia = await this.iglesia(tx, iglesiaId, true);
        await this.asignado(tx, iglesiaId, datos.sacerdoteId);
        const antes = e
          ? await tx.horarioMisa.findFirst({ where: { id: e.id, iglesiaId } })
          : null;
        if (e) {
          if (!antes) throw ausente();
          this.version(antes.version, e.version);
          if (
            await tx.celebracionMisa.count({
              where: { ocurrencia: { horarioId: e.id } },
            })
          )
            throw new ErrorAgenda(
              409,
              "HISTORICO_PC12",
              "Horario con celebraciones: conserve el hecho; correcciones pendientes PC-12",
            );
        }
        if (!iglesia.zonaIana)
          throw new ErrorAgenda(
            422,
            "ZONA_REQUERIDA",
            "Configure la zona IANA de la iglesia antes de programar",
          );
        const instantes = ocurrencias(datos, iglesia.zonaIana);
        if (datos.activo)
          await this.conflictos(tx, datos.sacerdoteId, instantes, e?.id);
        if (e)
          await tx.ocurrenciaMisa.deleteMany({ where: { horarioId: e.id } });
        const despues = e
          ? await tx.horarioMisa.update({
              where: { id: e.id, version: e.version },
              data: {
                ...datos,
                zonaIana: iglesia.zonaIana,
                version: { increment: 1 },
              },
            })
          : await tx.horarioMisa.create({
              data: { ...datos, iglesiaId, zonaIana: iglesia.zonaIana },
            });
        if (datos.activo)
          await tx.ocurrenciaMisa.createMany({
            data: instantes.map((o) => ({
              ...o,
              horarioId: despues.id,
              iglesiaId,
              sacerdoteId: datos.sacerdoteId,
              horaLocal: datos.horaLocal,
              zonaIana: iglesia.zonaIana!,
            })),
          });
        await this.audit(tx, iglesiaId, actorId, despues.id, antes, despues);
        return despues;
      },
      { timeout: 15000 },
    );
  }
  semana(iglesiaId: string, s: Semana, sacerdoteId?: string) {
    return this.db.$transaction(
      async (tx) => {
        await this.iglesia(tx, iglesiaId);
        if (sacerdoteId) await this.asignado(tx, iglesiaId, sacerdoteId);
        // Agenda interna: la semana se define por fechas locales de cada iglesia.
        return tx.ocurrenciaMisa.findMany({
          where: {
            ...(sacerdoteId ? { sacerdoteId } : { iglesiaId }),
            iglesia: { cerradaDesde: null },
            fechaLocal: { gte: s.desde, lt: sumarDias(s.desde, 7) },
          },
          include: {
            iglesia: { select: { nombre: true } },
            sacerdote: { select: { nombre: true } },
            horario: {
              select: { tipo: true, idioma: true, duracionMinutos: true },
            },
          },
          orderBy: [{ inicio: "asc" }, { id: "asc" }],
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }
  celebraciones(iglesiaId: string) {
    return this.db.$transaction(async (tx) => {
      await this.iglesia(tx, iglesiaId);
      return tx.celebracionMisa.findMany({
        where: { iglesiaId },
        orderBy: [{ inicio: "desc" }, { id: "asc" }],
      });
    });
  }
  celebrar(iglesiaId: string, actorId: string, datos: DatosCelebracion) {
    return this.escritura(async (tx) => {
      await this.iglesia(tx, iglesiaId, true);
      await this.asignado(tx, iglesiaId, datos.oficianteId);
      const o = await tx.ocurrenciaMisa.findFirst({
        where: { id: datos.ocurrenciaId, iglesiaId },
        include: { horario: true, celebracion: true },
      });
      if (!o) throw ausente();
      if (o.celebracion)
        throw new ErrorAgenda(
          409,
          "YA_CELEBRADA",
          "Esta ocurrencia ya tiene un hecho registrado",
        );
      if (datos.fechaLocal !== o.fechaLocal)
        throw new ErrorAgenda(
          422,
          "FECHA_NO_PROGRAMADA",
          "Solo se registran hechos del día local programado; misas extraordinarias pendientes PC-12",
        );
      if (datos.oficianteId !== o.sacerdoteId && !datos.motivo)
        throw new ErrorAgenda(
          422,
          "MOTIVO_REQUERIDO",
          "La sustitución requiere motivo",
        );
      const inicio = instante(datos.fechaLocal, datos.horaLocal, o.zonaIana),
        fin = new Date(inicio.getTime() + o.horario.duracionMinutos * 60000);
      if (inicio > new Date())
        throw new ErrorAgenda(
          422,
          "HECHO_FUTURO",
          "Una misa celebrada no puede estar en el futuro",
        );
      await this.conflictos(
        tx,
        datos.oficianteId,
        [{ inicio, fin }],
        undefined,
        o.id,
      );
      const c = await tx.celebracionMisa.create({
        data: {
          ocurrenciaId: o.id,
          iglesiaId,
          previstoId: o.sacerdoteId,
          oficianteId: datos.oficianteId,
          fechaLocal: datos.fechaLocal,
          horaLocal: datos.horaLocal,
          zonaIana: o.zonaIana,
          inicio,
          fin,
          actorId,
          motivo: datos.motivo ?? null,
        },
      });
      await this.audit(tx, iglesiaId, actorId, c.id, null, c);
      return c;
    });
  }
}
