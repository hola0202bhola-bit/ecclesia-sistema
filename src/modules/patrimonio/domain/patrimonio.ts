export type { Principal } from "../../../shared/domain/personal.js";

// Tipos escritos en P072; IDs estables de catálogo, no categorías inferidas.
export const tiposObjeto = [
  "Imagen de santo",
  "Imagen de virgen",
  "Imagen de cristo",
  "Retablo",
  "Pintura",
  "Mural",
  "Órgano",
  "Piano",
  "Orfebrería",
  "Mobiliario litúrgico",
  "Documento",
  "Otra pieza",
].map((nombre, i) => ({
  id: `30000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
  nombre,
  factorDecimas: [15, 15, 15, 13, 13, 13, 12, 12, 10, 10, 10, 8][i],
}));
export const condiciones = ["VIGENTE", "PERDIDO", "PRESTADO", "BAJA"] as const;
export type Condicion = (typeof condiciones)[number];
export interface DatosObjeto {
  descripcion: string;
  tipoId: string;
  anioExacto: number | null;
  siglo: number | null;
  material: string;
  conservacion: string;
  ubicacionInterna: string;
  catalogadoInah: boolean;
}
export interface Objeto extends DatosObjeto {
  id: string;
  iglesiaId: string;
  condicion: Condicion;
  version: number;
}
export interface Criterios {
  id: string;
  tramos: { desde: number; puntos: number }[];
  factoresDecimas: Record<string, number>;
  bonoInahDecimas: number;
  distinciones: { desdeDecimas: number; nombre: string }[];
}
export const criteriosCaso: Criterios = {
  id: "caso-v1",
  tramos: [
    { desde: 0, puntos: 1 },
    { desde: 50, puntos: 2 },
    { desde: 100, puntos: 4 },
    { desde: 200, puntos: 7 },
    { desde: 300, puntos: 10 },
  ],
  factoresDecimas: Object.fromEntries(
    tiposObjeto.map((t) => [t.id, t.factorDecimas]),
  ),
  bonoInahDecimas: 50,
  distinciones: [
    { desdeDecimas: 80, nombre: "Valor patrimonial" },
    { desdeDecimas: 200, nombre: "Alto valor patrimonial" },
    { desdeDecimas: 400, nombre: "Patrimonio sobresaliente" },
  ],
};
export class ErrorPatrimonio extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
export function validarCambioCondicion(actual: Condicion, destino: Condicion) {
  if (destino === "VIGENTE" || actual !== "VIGENTE")
    throw new ErrorPatrimonio(
      422,
      "PC06_PENDIENTE",
      "Solo se admite pasar de vigente a perdido, prestado o baja; reactivación pendiente",
    );
}
export function anioObjeto(
  objeto: Pick<DatosObjeto, "anioExacto" | "siglo">,
): number {
  if ((objeto.anioExacto === null) === (objeto.siglo === null))
    throw new ErrorPatrimonio(
      422,
      "FECHA_INVALIDA",
      "Indique año exacto o siglo, exclusivamente",
    );
  return objeto.anioExacto ?? (objeto.siglo! - 1) * 100 + 50;
}
export function validarObjeto(datos: DatosObjeto, referencia: number) {
  const anio = anioObjeto(datos);
  if (!Number.isInteger(anio) || anio < 1 || anio > referencia)
    throw new ErrorPatrimonio(
      422,
      "PC05_PENDIENTE",
      "Año desconocido o futuro fuera del alcance actual",
    );
  if (!tiposObjeto.some((t) => t.id === datos.tipoId))
    throw new ErrorPatrimonio(
      422,
      "TIPO_INVALIDO",
      "Tipo de objeto no disponible",
    );
}
export const decimal = (decimas: number) =>
  `${Math.trunc(decimas / 10)}.${decimas % 10}`;
export function distincion(decimas: number, criterios: Criterios) {
  return (
    criterios.distinciones.findLast((d) => decimas >= d.desdeDecimas)?.nombre ??
    null
  );
}
// P071–074: enteros en décimas; sin reloj, ORM, redondeo ni E/S ocultos.
export function calcularIndice(
  objetos: Objeto[],
  criterios: Criterios,
  referencia: number,
) {
  let totalDecimas = 0;
  const aportaciones = objetos.map((objeto) => {
    validarObjeto(objeto, referencia);
    const antiguedad = referencia - anioObjeto(objeto);
    const base = criterios.tramos.findLast(
      (t) => antiguedad >= t.desde,
    )!.puntos;
    const puntos =
      objeto.condicion === "VIGENTE"
        ? base * criterios.factoresDecimas[objeto.tipoId] +
          (objeto.catalogadoInah ? criterios.bonoInahDecimas : 0)
        : 0;
    totalDecimas += puntos;
    return { objetoId: objeto.id, antiguedad, puntos: decimal(puntos) };
  });
  return {
    indice: decimal(totalDecimas),
    distincion: distincion(totalDecimas, criterios),
    referencia,
    criterioId: criterios.id,
    aportaciones,
  };
}
export interface Pagina {
  page: number;
  pageSize: number;
}
export interface FiltrosPatrimonio extends Pagina {
  estadoClave?: string;
  municipioClave?: string;
  localidadClave?: string;
  tipoObjetoId?: string;
  antiguedadMin?: number;
}
export interface IglesiaPatrimonio {
  id: string;
  nombre: string;
  estadoClave: string;
  municipioClave: string;
  localidadClave: string;
  cerradaDesde: Date | null;
  objetos: Objeto[];
}
export interface RepositorioPatrimonio {
  leer(
    iglesiaId: string,
  ): Promise<{ iglesia: IglesiaPatrimonio; criterios: Criterios } | null>;
  ranking(
    filtros: FiltrosPatrimonio,
  ): Promise<{ iglesias: IglesiaPatrimonio[]; criterios: Criterios }>;
  guardar(
    iglesiaId: string,
    actorId: string,
    datos: DatosObjeto,
    edicion?: { id: string; version: number },
  ): Promise<Objeto>;
  condicion(
    iglesiaId: string,
    actorId: string,
    objetoId: string,
    version: number,
    condicion: Condicion,
  ): Promise<Objeto>;
}
