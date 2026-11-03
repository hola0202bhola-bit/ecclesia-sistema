import {
  Prisma,
  type PrismaClient,
  type SolicitudEspacio,
  type EstadoSolicitud,
  type ActorSolicitud,
} from "@prisma/client";
import {
  ErrorSolicitud,
  accesoInvalido,
  conflicto,
  venceEn,
  vencida,
  transicion,
  precioCentavos,
  precioDecimal,
  tipos,
  type TipoEspacio,
  type RepositorioSolicitudes,
  type ContactoSolicitud,
  type AccesoSolicitud,
  type Decision,
  type Revision,
  type Seguimiento,
} from "../domain/solicitud.js";
import { verificaClave } from "./seguridad.js";
const ausente = () =>
  new ErrorSolicitud(
    404,
    "NO_ENCONTRADO",
    "Iglesia, espacio o solicitud no disponible",
  );
function vista(s: SolicitudEspacio): Seguimiento {
  return {
    folio: s.folio,
    iglesiaId: s.iglesiaId,
    tipo: s.tipo,
    estado: s.estado,
    version: s.version,
    creada: s.creada.toISOString(),
    decisionEn: s.decisionEn?.toISOString() ?? null,
    cotizacion:
      s.precioCentavos !== null
        ? {
            precio: precioDecimal(s.precioCentavos),
            moneda: "MXN",
            condiciones: s.condiciones!,
            emitida: s.emitida!.toISOString(),
            vence: s.vence!.toISOString(),
          }
        : null,
  };
}
// Proyección deliberada: auditoría sin nombre/contacto, folio, clave ni verificador.
function snapshot(s: SolicitudEspacio): Prisma.InputJsonObject {
  return {
    estado: s.estado,
    version: s.version,
    tipo: s.tipo,
    precioCentavos: s.precioCentavos?.toString() ?? null,
    condiciones: s.condiciones,
    emitida: s.emitida?.toISOString() ?? null,
    vence: s.vence?.toISOString() ?? null,
    decisionEn: s.decisionEn?.toISOString() ?? null,
  };
}
export class PrismaRepositorioSolicitudes implements RepositorioSolicitudes {
  constructor(
    private readonly db: PrismaClient,
    private readonly reloj: () => Date = () => new Date(),
  ) {}
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
  private async personal(
    tx: Prisma.TransactionClient,
    iglesiaId: string,
    actorId: string,
  ) {
    if (
      !(await tx.usuario.findFirst({
        where: { id: actorId, iglesiaId, rol: "ADMIN_IGLESIA", activo: true },
        select: { id: true },
      }))
    )
      throw new ErrorSolicitud(
        403,
        "SIN_AMBITO",
        "Administrador activo de esta iglesia requerido",
      );
  }
  async espacios(iglesiaId: string, privados = false) {
    return this.db.$transaction(
      async (tx) => {
        await this.iglesia(tx, iglesiaId);
        const filas = await tx.ofertaFuneraria.findMany({
          where: { iglesiaId, ...(privados ? {} : { activo: true }) },
          select: { tipo: true, activo: true, version: true },
          orderBy: { tipo: "asc" },
        });
        return privados
          ? tipos.map(
              (tipo) =>
                filas.find((f) => f.tipo === tipo) ?? {
                  tipo,
                  activo: false,
                  version: 0,
                },
            )
          : filas;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }
  async espacio(
    iglesiaId: string,
    tipo: TipoEspacio,
    activo: boolean,
    version: number,
    actorId: string,
  ) {
    return this.db.$transaction(async (tx) => {
      await this.iglesia(tx, iglesiaId, true);
      await this.personal(tx, iglesiaId, actorId);
      const antes = await tx.ofertaFuneraria.findUnique({
        where: { iglesiaId_tipo: { iglesiaId, tipo } },
      });
      if ((antes?.version ?? 0) !== version) throw conflicto();
      const despues = antes
        ? await tx.ofertaFuneraria.update({
            where: { iglesiaId_tipo: { iglesiaId, tipo } },
            data: { activo, version: { increment: 1 } },
          })
        : await tx.ofertaFuneraria.create({
            data: { iglesiaId, tipo, activo },
          });
      await tx.cambioEspacio.create({
        data: {
          iglesiaId,
          tipo,
          actorId,
          instante: this.reloj(),
          version: despues.version,
          antes: antes ? { activo: antes.activo, version: antes.version } : {},
          despues: { activo, version: despues.version },
        },
      });
      return { tipo, activo, version: despues.version };
    });
  }
  async crear(
    iglesiaId: string,
    d: ContactoSolicitud,
    credenciales: { folio: string; claveHash: string },
  ) {
    try {
      await this.db.$transaction(async (tx) => {
        await this.iglesia(tx, iglesiaId, true);
        if (
          !(await tx.ofertaFuneraria.findFirst({
            where: { iglesiaId, tipo: d.tipo, activo: true },
            select: { tipo: true },
          }))
        )
          throw ausente();
        const creada = this.reloj();
        const s = await tx.solicitudEspacio.create({
          data: { iglesiaId, ...d, ...credenciales, creada },
        });
        await tx.cambioSolicitud.create({
          data: {
            solicitudId: s.id,
            iglesiaId,
            actor: "SOLICITANTE",
            instante: creada,
            antes: {},
            despues: snapshot(s),
            version: 1,
          },
        });
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      )
        throw new ErrorSolicitud(
          409,
          "SOLICITUD_DUPLICADA",
          "El envío ya se registró o hubo una colisión. Conserve el comprobante original; para otra solicitud abra un formulario nuevo",
        );
      throw e;
    }
  }
  private async cambiar(
    tx: Prisma.TransactionClient,
    s: SolicitudEspacio,
    data: Prisma.SolicitudEspacioUpdateInput,
    actor: ActorSolicitud,
    instante: Date,
    actorId?: string,
  ) {
    const despues = await tx.solicitudEspacio.update({
      where: { id: s.id },
      data: { ...data, version: { increment: 1 } },
    });
    await tx.cambioSolicitud.create({
      data: {
        solicitudId: s.id,
        iglesiaId: s.iglesiaId,
        actor,
        actorId,
        instante,
        antes: snapshot(s),
        despues: snapshot(despues),
        version: despues.version,
      },
    });
    return despues;
  }
  private async expirar(
    tx: Prisma.TransactionClient,
    s: SolicitudEspacio,
    ahora: Date,
  ) {
    return vencida(s.estado, s.vence, ahora)
      ? this.cambiar(tx, s, { estado: "VENCIDA" }, "SISTEMA", ahora)
      : s;
  }
  async seguimiento(acceso: AccesoSolicitud, decision?: Decision) {
    // Misma respuesta y comparación de longitud fija para folio inexistente y clave incorrecta.
    const encontrada = await this.db.solicitudEspacio.findUnique({
      where: { folio: acceso.folio },
    });
    if (!verificaClave(acceso.clave, encontrada?.claveHash))
      throw accesoInvalido();
    const resultado = await this.db.$transaction(async (tx) => {
      const iglesiaId = encontrada!.iglesiaId;
      await this.iglesia(tx, iglesiaId, true);
      let s = (await tx.solicitudEspacio.findUnique({
        where: { folio: acceso.folio },
      }))!;
      const ahora = this.reloj(); // Después del bloqueo: la espera no prolonga la vigencia.
      s = await this.expirar(tx, s, ahora);
      if (decision) {
        // Retornar el conflicto permite COMMIT del vencimiento y de su auditoría.
        if (decision.version !== s.version) return { error: conflicto() };
        let estado: EstadoSolicitud;
        try {
          estado = transicion(s.estado, decision.accion);
        } catch {
          return { error: conflicto() };
        }
        s = await this.cambiar(
          tx,
          s,
          { estado, decisionEn: ahora },
          "SOLICITANTE",
          ahora,
        );
      }
      return { data: vista(s) };
    });
    if (resultado.error) throw resultado.error;
    return resultado.data!;
  }
  async ficha(
    iglesiaId: string,
    id: string,
    actorId: string,
    revision?: Revision,
  ) {
    const resultado = await this.db.$transaction(async (tx) => {
      await this.iglesia(tx, iglesiaId, true);
      await this.personal(tx, iglesiaId, actorId);
      let s = await tx.solicitudEspacio.findFirst({ where: { id, iglesiaId } });
      if (!s) throw ausente();
      const ahora = this.reloj();
      s = await this.expirar(tx, s, ahora);
      if (revision) {
        if (revision.version !== s.version || s.estado !== "REGISTRADA")
          return { error: conflicto() };
        s = await this.cambiar(
          tx,
          s,
          revision.resultado === "SIN_LUGAR"
            ? { estado: "SIN_LUGAR" }
            : {
                estado: "COTIZADA",
                precioCentavos: precioCentavos(revision.precio),
                condiciones: revision.condiciones,
                emitida: ahora,
                vence: venceEn(ahora),
              },
          "PERSONAL",
          ahora,
          actorId,
        );
      }
      const historial = await tx.cambioSolicitud.findMany({
        where: { solicitudId: id, iglesiaId },
        orderBy: { version: "asc" },
        select: {
          version: true,
          actor: true,
          actorId: true,
          instante: true,
          antes: true,
          despues: true,
        },
      });
      return {
        data: {
          ...vista(s),
          id: s.id,
          nombre: s.nombre,
          contacto: s.contacto,
          historial: historial.map((h) => ({
            ...h,
            instante: h.instante.toISOString(),
          })),
        },
      };
    });
    if (resultado.error) throw resultado.error;
    return resultado.data!;
  }
  lista(iglesiaId: string, actorId: string, pagina: number) {
    return this.db.$transaction(async (tx) => {
      await this.iglesia(tx, iglesiaId, true);
      await this.personal(tx, iglesiaId, actorId);
      const filas = await tx.solicitudEspacio.findMany({
        where: { iglesiaId },
        orderBy: [{ creada: "desc" }, { id: "asc" }],
        skip: (pagina - 1) * 25,
        take: 25,
      });
      const ahora = this.reloj(),
        data = [];
      for (const fila of filas)
        data.push({
          ...vista(await this.expirar(tx, fila, ahora)),
          id: fila.id,
        });
      return {
        data,
        total: await tx.solicitudEspacio.count({ where: { iglesiaId } }),
        pagina,
      };
    });
  }
  async limitar(clave: string, maximo: number, ventanaMs: number) {
    const ahora = this.reloj(),
      vence = new Date(ahora.getTime() + ventanaMs);
    const cantidad = await this.db.$transaction(async (tx) => {
      await tx.limiteSolicitud.deleteMany({ where: { vence: { lte: ahora } } });
      const filas = await tx.$queryRaw<
        { cantidad: number }[]
      >`INSERT INTO "LimiteSolicitud" (clave,cantidad,vence)
    VALUES (${clave},1,${vence})
    ON CONFLICT (clave) DO UPDATE SET cantidad = LEAST("LimiteSolicitud".cantidad + 1, ${maximo + 1})
    RETURNING cantidad`;
      return filas[0].cantidad;
    });
    if (cantidad > maximo)
      throw new ErrorSolicitud(
        429,
        "DEMASIADOS_INTENTOS",
        "Demasiados intentos. Espere antes de volver a intentar",
      );
  }
}
