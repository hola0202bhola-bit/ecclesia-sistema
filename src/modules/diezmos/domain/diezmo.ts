import type { Principal } from "../../../shared/domain/personal.js";
export type { Principal };
export class ErrorDiezmo extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
// El texto decimal nunca pasa por Number: cada operación monetaria usa bigint.
export function centavos(importe: string): bigint {
  if (!/^(0|[1-9]\d{0,8})\.\d{2}(?![\s\S])/.test(importe))
    throw new ErrorDiezmo(
      422,
      "IMPORTE_INVALIDO",
      "Use un importe de 0.00 a 999999999.99 con dos decimales",
    );
  return BigInt(importe.replace(".", ""));
}
export function decimal(c: bigint): string {
  return `${c / 100n}.${(c % 100n).toString().padStart(2, "0")}`;
}
export interface ConsultaDiezmos {
  desde: string;
  hasta: string;
  periodo: "DIA" | "SEMANA" | "MES";
  desglose: "NINGUNO" | "HORARIO" | "SACERDOTE" | "HORARIO_SACERDOTE";
  horarioId?: string;
  sacerdoteId?: string;
}
export interface Captura {
  id: string;
  celebracionId: string;
  iglesiaId: string;
  importe: string;
  importeCentavos: string;
  moneda: "MXN";
  version: number;
}
export interface CambioDiezmo {
  id: string;
  actorId: string;
  instante: string;
  anteriorCentavos: string | null;
  nuevoCentavos: string;
  version: number;
}
export interface FilaMisa {
  celebracionId: string;
  fechaLocal: string;
  horaLocal: string;
  zonaIana: string;
  horarioId: string;
  horario: string;
  sacerdoteId: string;
  sacerdote: string;
  diezmo: Captura | null;
}
function periodoDe(fecha: string, periodo: ConsultaDiezmos["periodo"]) {
  if (periodo === "MES") return fecha.slice(0, 7);
  if (periodo === "DIA") return fecha;
  // Aritmética de calendario civil; no convierte a UTC los hechos almacenados.
  const d = new Date(fecha + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
export function resumen(filas: FilaMisa[]) {
  const registradas = filas.filter((f) => f.diezmo !== null);
  const montos = registradas.map((f) => BigInt(f.diezmo!.importeCentavos));
  const total = montos.reduce((a, b) => a + b, 0n);
  const extremo = (mayor: boolean) => {
    if (!montos.length)
      return { importeCentavos: null, celebraciones: [] as string[] };
    const valor = montos.reduce((a, b) => ((mayor ? a > b : a < b) ? a : b));
    return {
      importeCentavos: valor.toString(),
      celebraciones: registradas
        .filter((f) => BigInt(f.diezmo!.importeCentavos) === valor)
        .map((f) => f.celebracionId),
    };
  };
  return {
    celebradas: filas.length,
    registradas: registradas.length,
    pendientes: filas.length - registradas.length,
    totalCentavos: total.toString(),
    total: decimal(total),
    // Fracción exacta de centavos por misa: no redondear ni sumar promedios.
    promedio: registradas.length
      ? {
          numeradorCentavos: total.toString(),
          divisorMisas: registradas.length,
        }
      : null,
    maximo: extremo(true),
    minimo: extremo(false),
  };
}
export function reporte(filas: FilaMisa[], q: ConsultaDiezmos) {
  const grupos = new Map<
    string,
    {
      periodo: string;
      horarioId: string | null;
      sacerdoteId: string | null;
      horario: string | null;
      sacerdote: string | null;
      filas: FilaMisa[];
    }
  >();
  for (const fila of filas) {
    const periodo = periodoDe(fila.fechaLocal, q.periodo);
    const horarioId = q.desglose.includes("HORARIO") ? fila.horarioId : null;
    const sacerdoteId = q.desglose.includes("SACERDOTE")
      ? fila.sacerdoteId
      : null;
    const clave = JSON.stringify([periodo, horarioId, sacerdoteId]);
    if (!grupos.has(clave))
      grupos.set(clave, {
        periodo,
        horarioId,
        sacerdoteId,
        horario: horarioId ? fila.horario : null,
        sacerdote: sacerdoteId ? fila.sacerdote : null,
        filas: [],
      });
    grupos.get(clave)!.filas.push(fila);
  }
  return {
    consulta: q,
    moneda: "MXN" as const,
    resumen: resumen(filas),
    grupos: [...grupos.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, { filas: datos, ...grupo }]) => ({
        ...grupo,
        ...resumen(datos),
      })),
    misas: filas,
  };
}
export interface RepositorioDiezmos {
  misas(iglesiaId: string, q: ConsultaDiezmos): Promise<FilaMisa[]>;
  guardar(
    iglesiaId: string,
    celebracionId: string,
    actorId: string,
    importe: bigint,
    version?: number,
  ): Promise<Captura>;
  ficha(
    iglesiaId: string,
    celebracionId: string,
  ): Promise<{ captura: Captura; historial: CambioDiezmo[] }>;
  consultar(iglesiaId: string, celebracionId: string): Promise<Captura>;
  historial(iglesiaId: string, celebracionId: string): Promise<CambioDiezmo[]>;
}
