import type { Principal } from "../../../shared/domain/personal.js";
export type { Principal };
export class ErrorAgenda extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
export interface Sacerdote {
  id: string;
  nombre: string;
  version: number;
}
export interface DatosHorario {
  sacerdoteId: string;
  diaSemana: number;
  horaLocal: string;
  tipo: "DIARIA" | "DOMINICAL" | "ESPECIAL";
  idioma: string;
  duracionMinutos: number;
  desde: string;
  hasta: string;
  activo: boolean;
}
export type Horario = DatosHorario & {
  id: string;
  iglesiaId: string;
  zonaIana: string;
  version: number;
};
export interface Ocurrencia {
  id: string;
  horarioId: string;
  iglesiaId: string;
  sacerdoteId: string;
  fechaLocal: string;
  horaLocal: string;
  zonaIana: string;
  inicio: Date;
  fin: Date;
  iglesia: { nombre: string };
  sacerdote: { nombre: string };
  horario: { tipo: string; idioma: string; duracionMinutos: number };
}
export interface Celebracion {
  id: string;
  ocurrenciaId: string;
  iglesiaId: string;
  previstoId: string;
  oficianteId: string;
  fechaLocal: string;
  horaLocal: string;
  zonaIana: string;
  inicio: Date;
  fin: Date;
  actorId: string;
  registradoEn: Date;
  motivo: string | null;
}
export interface DatosCelebracion {
  ocurrenciaId: string;
  oficianteId: string;
  fechaLocal: string;
  horaLocal: string;
  motivo?: string;
}
export interface Edicion {
  id: string;
  version: number;
}
export interface Semana {
  desde: string;
}
export interface RepositorioAgenda {
  sacerdotes(iglesiaId: string): Promise<Sacerdote[]>;
  registrar(
    iglesiaId: string,
    actorId: string,
    nombre: string,
  ): Promise<Sacerdote>;
  vincular(
    iglesiaId: string,
    actorId: string,
    sacerdoteId: string,
  ): Promise<Sacerdote>;
  renombrar(
    iglesiaId: string,
    actorId: string,
    edicion: Edicion,
    nombre: string,
  ): Promise<Sacerdote>;
  horarios(iglesiaId: string): Promise<Horario[]>;
  guardar(
    iglesiaId: string,
    actorId: string,
    datos: DatosHorario,
    edicion?: Edicion,
  ): Promise<Horario>;
  semana(
    iglesiaId: string,
    semana: Semana,
    sacerdoteId?: string,
  ): Promise<Ocurrencia[]>;
  celebraciones(iglesiaId: string): Promise<Celebracion[]>;
  celebrar(
    iglesiaId: string,
    actorId: string,
    datos: DatosCelebracion,
  ): Promise<Celebracion>;
}
const formatos = new Map<string, Intl.DateTimeFormat>();
function formato(zona: string) {
  let f = formatos.get(zona);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat("sv-SE", {
        timeZone: zona,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });
    } catch {
      throw new ErrorAgenda(
        422,
        "ZONA_INVALIDA",
        "Configure una zona IANA válida en la iglesia",
      );
    }
    formatos.set(zona, f);
  }
  return f;
}
function local(ms: number, zona: string) {
  return formato(zona).format(new Date(ms)).replace(" ", "T");
}
// Roundtrip estricto. Detecta tanto huecos como las dos ocurrencias de una hora ambigua.
export function instante(fecha: string, hora: string, zona: string): Date {
  const pared = Date.parse(`${fecha}T${hora}:00Z`),
    candidatos = new Set<number>();
  for (let h = -36; h <= 36; h += 6) {
    const muestra = pared + h * 3600000;
    const offset = Date.parse(local(muestra, zona) + ":00Z") - muestra;
    const ms = pared - offset;
    if (Number.isFinite(ms) && local(ms, zona) === `${fecha}T${hora}`)
      candidatos.add(ms);
  }
  if (candidatos.size !== 1)
    throw new ErrorAgenda(
      422,
      "HORA_LOCAL_INVALIDA",
      "Hora local inexistente o ambigua por cambio de horario; elija otra hora",
    );
  return new Date([...candidatos][0]);
}
export function sumarDias(fecha: string, dias: number) {
  return new Date(Date.parse(fecha + "T00:00:00Z") + dias * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function ocurrencias(datos: DatosHorario, zona: string) {
  const dias = (Date.parse(datos.hasta) - Date.parse(datos.desde)) / 86400000;
  if (dias < 0 || dias > 365)
    throw new ErrorAgenda(
      422,
      "VIGENCIA_INVALIDA",
      "La vigencia debe cubrir de 1 a 366 días",
    );
  const [h, m] = datos.horaLocal.split(":").map(Number);
  if (h * 60 + m + datos.duracionMinutos > 1440)
    throw new ErrorAgenda(
      422,
      "MEDIANOCHE_PENDIENTE",
      "Este incremento no programa misas que cruzan medianoche local",
    );
  const resultado: { fechaLocal: string; inicio: Date; fin: Date }[] = [];
  for (let i = 0; i <= dias; i++) {
    const fechaLocal = sumarDias(datos.desde, i);
    if (
      ((new Date(fechaLocal + "T00:00:00Z").getUTCDay() + 6) % 7) + 1 !==
      datos.diaSemana
    )
      continue;
    const inicio = instante(fechaLocal, datos.horaLocal, zona);
    resultado.push({
      fechaLocal,
      inicio,
      fin: new Date(inicio.getTime() + datos.duracionMinutos * 60000),
    });
  }
  if (!resultado.length)
    throw new ErrorAgenda(
      422,
      "SIN_OCURRENCIAS",
      "La vigencia no incluye el día semanal elegido",
    );
  return resultado;
}
export function traslapa(
  a: { inicio: Date; fin: Date },
  b: { inicio: Date; fin: Date },
) {
  return a.inicio < b.fin && b.inicio < a.fin;
}
