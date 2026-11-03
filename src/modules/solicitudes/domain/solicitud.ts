import type { Principal } from "../../../shared/domain/personal.js";
export type { Principal };
export const tipos = ["CRIPTA", "NICHO", "COLUMBARIO", "OSARIO"] as const;
export type TipoEspacio = (typeof tipos)[number];
export type EstadoSolicitud =
  | "REGISTRADA"
  | "COTIZADA"
  | "SIN_LUGAR"
  | "ACEPTADA"
  | "RECHAZADA"
  | "VENCIDA"
  | "CANCELADA";
export class ErrorSolicitud extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
export const conflicto = () =>
  new ErrorSolicitud(
    409,
    "CONFLICTO",
    "El estado o la versión cambió. Consulte de nuevo antes de decidir",
  );
export const accesoInvalido = () =>
  new ErrorSolicitud(404, "SEGUIMIENTO_INVALIDO", "Folio o clave no válidos");
export function venceEn(emision: Date): Date {
  return new Date(emision.getTime() + 15 * 86400000);
}
export function vencida(
  estado: EstadoSolicitud,
  vence: Date | null,
  ahora: Date,
) {
  return (
    estado === "COTIZADA" &&
    vence !== null &&
    ahora.getTime() >= vence.getTime()
  );
}
export function transicion(
  estado: EstadoSolicitud,
  accion: Decision["accion"],
): EstadoSolicitud {
  if (accion === "CANCELAR" && !["ACEPTADA", "CANCELADA"].includes(estado))
    return "CANCELADA";
  if (estado === "COTIZADA" && accion === "ACEPTAR") return "ACEPTADA";
  if (estado === "COTIZADA" && accion === "RECHAZAR") return "RECHAZADA";
  throw conflicto();
}
export function precioCentavos(precio: string): bigint {
  if (!/^(0|[1-9]\d{0,8})\.\d{2}(?![\s\S])/.test(precio))
    throw new ErrorSolicitud(
      422,
      "PRECIO_INVALIDO",
      "Use de 0.00 a 999999999.99 con dos decimales",
    );
  return BigInt(precio.replace(".", ""));
}
export function precioDecimal(c: bigint) {
  return `${c / 100n}.${(c % 100n).toString().padStart(2, "0")}`;
}
export interface ContactoSolicitud {
  tipo: TipoEspacio;
  nombre: string;
  contacto: string;
  peticionId: string;
}
export interface AccesoSolicitud {
  folio: string;
  clave: string;
}
export interface Decision {
  accion: "ACEPTAR" | "RECHAZAR" | "CANCELAR";
  version: number;
}
export type Revision =
  | { resultado: "SIN_LUGAR"; version: number }
  | {
      resultado: "COTIZAR";
      version: number;
      precio: string;
      condiciones: string;
    };
export interface Espacio {
  tipo: TipoEspacio;
  activo: boolean;
  version: number;
}
export interface Seguimiento {
  folio: string;
  iglesiaId: string;
  tipo: TipoEspacio;
  estado: EstadoSolicitud;
  version: number;
  creada: string;
  decisionEn: string | null;
  cotizacion: {
    precio: string;
    moneda: "MXN";
    condiciones: string;
    emitida: string;
    vence: string;
  } | null;
}
export interface FichaSolicitud extends Seguimiento {
  id: string;
  nombre: string;
  contacto: string;
  historial: {
    version: number;
    actor: string;
    actorId: string | null;
    instante: string;
    antes: unknown;
    despues: unknown;
  }[];
}
export interface CredencialesSolicitud {
  generar(): { folio: string; clave: string; claveHash: string };
}
export interface RepositorioSolicitudes {
  espacios(iglesiaId: string, privados?: boolean): Promise<Espacio[]>;
  espacio(
    iglesiaId: string,
    tipo: TipoEspacio,
    activo: boolean,
    version: number,
    actorId: string,
  ): Promise<Espacio>;
  crear(
    iglesiaId: string,
    datos: ContactoSolicitud,
    credenciales: { folio: string; claveHash: string },
  ): Promise<void>;
  seguimiento(
    acceso: AccesoSolicitud,
    decision?: Decision,
  ): Promise<Seguimiento>;
  ficha(
    iglesiaId: string,
    id: string,
    actorId: string,
    revision?: Revision,
  ): Promise<FichaSolicitud>;
  lista(
    iglesiaId: string,
    actorId: string,
    pagina: number,
  ): Promise<{
    data: (Seguimiento & { id: string })[];
    total: number;
    pagina: number;
  }>;
  limitar(clave: string, maximo: number, ventanaMs: number): Promise<void>;
}
