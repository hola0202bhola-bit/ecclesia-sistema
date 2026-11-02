export type { Principal } from "../../../shared/domain/personal.js";

// Nombres de P078/P079; ampliación del catálogo general pendiente PC-22.
export const tiposServicio = [
  "Bautizo",
  "Primera comunión",
  "Confirmación",
  "Matrimonio",
  "Misa de XV años",
  "Bendición",
  "Otro servicio",
].map((nombre, i) => ({
  id: `40000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
  nombre,
}));
export const tiposPlatica = [
  "Pláticas prebautismales",
  "Catecismo para la primera comunión",
  "Pláticas de confirmación",
  "Pláticas prematrimoniales",
].map((nombre, i) => ({
  id: `50000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
  nombre,
}));
export const dias = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
export interface Horario {
  diaSemana: number;
  horaLocal: string;
}
export interface DatosServicio {
  tipoId: string;
  nombre: string;
  modalidad: "FIJO" | "GRATUITO" | "DONATIVO";
  importe: string | null;
  moneda: string;
  requisitos: string;
  duracionMinutos: number;
  requiereCita: boolean;
  horarios: Horario[];
}
export interface DatosPlatica {
  tipoId: string;
  sesiones: number;
  importe: string;
  moneda: string;
  cupo: number;
  lugar: string;
  impartidor: string;
  horarios: Horario[];
}
export type Servicio = DatosServicio & { id: string; version: number };
export type Platica = DatosPlatica & { id: string; version: number };
export interface Pagina {
  page: number;
  pageSize: number;
}
export interface Consulta<T> {
  iglesia: { id: string; nombre: string };
  data: T[];
  meta: Pagina & { total: number };
}
export interface Edicion {
  id: string;
  version: number;
}
export class ErrorOferta extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
export function validarServicio(datos: DatosServicio) {
  if (!tiposServicio.some((t) => t.id === datos.tipoId))
    throw new ErrorOferta(
      422,
      "TIPO_INVALIDO",
      "Tipo de servicio no disponible",
    );
  if (
    (datos.modalidad === "FIJO" &&
      (datos.importe === null || !/[1-9]/.test(datos.importe))) ||
    (datos.modalidad !== "FIJO" && datos.importe !== null)
  )
    throw new ErrorOferta(
      422,
      "APORTACION_INVALIDA",
      "Costo fijo requiere importe positivo; gratuito y donativo voluntario requieren importe vacío",
    );
}
export function validarPlatica(datos: DatosPlatica) {
  if (!tiposPlatica.some((t) => t.id === datos.tipoId))
    throw new ErrorOferta(
      422,
      "TIPO_INVALIDO",
      "Tipo de plática no disponible",
    );
}
export interface RepositorioOferta {
  servicios(iglesiaId: string, pagina: Pagina): Promise<Consulta<Servicio>>;
  platicas(iglesiaId: string, pagina: Pagina): Promise<Consulta<Platica>>;
  servicio(iglesiaId: string, id: string): Promise<Servicio>;
  platica(iglesiaId: string, id: string): Promise<Platica>;
  guardarServicio(
    iglesiaId: string,
    actorId: string,
    datos: Partial<DatosServicio>,
    edicion?: Edicion,
  ): Promise<Servicio>;
  guardarPlatica(
    iglesiaId: string,
    actorId: string,
    datos: Partial<DatosPlatica>,
    edicion?: Edicion,
  ): Promise<Platica>;
}
