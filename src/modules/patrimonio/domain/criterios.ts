import { tiposObjeto, ErrorPatrimonio, type Criterios } from "./patrimonio.js";
export interface VersionCriterio {
  id: string;
  nombre: string;
  parametros: Criterios;
  creadoEn: Date;
}
export interface EstadoCriterios {
  versiones: VersionCriterio[];
  activo: { criterioId: string; version: number };
  historial: {
    fecha: Date;
    criterioId: string;
    anterior: string | null;
    actorId: string;
    motivo: string;
    tipo: string;
    version: number | null;
  }[];
}
export interface RepositorioCriterios {
  listar(): Promise<EstadoCriterios>;
  crear(
    nombre: string,
    parametros: Omit<Criterios, "id">,
    motivo: string,
    actorId: string,
  ): Promise<VersionCriterio>;
  activar(
    id: string,
    version: number,
    motivo: string,
    actorId: string,
  ): Promise<{ criterioId: string; version: number }>;
}
export function validarCriterios(c: Omit<Criterios, "id">) {
  const entero = (n: number, max: number) =>
    Number.isInteger(n) && n >= 0 && n <= max;
  const orden = (a: number[]) => a.every((n, i) => i === 0 || n > a[i - 1]);
  if (
    c.tramos.length < 1 ||
    c.tramos.length > 12 ||
    c.tramos[0].desde !== 0 ||
    !orden(c.tramos.map((t) => t.desde)) ||
    c.tramos.some((t) => !entero(t.desde, 9999) || !entero(t.puntos, 1000)) ||
    Object.keys(c.factoresDecimas).length !== tiposObjeto.length ||
    tiposObjeto.some((t) => !entero(c.factoresDecimas[t.id], 1000)) ||
    !entero(c.bonoInahDecimas, 10000) ||
    c.distinciones.length < 1 ||
    c.distinciones.length > 8 ||
    !orden(c.distinciones.map((d) => d.desdeDecimas)) ||
    new Set(c.distinciones.map((d) => d.nombre)).size !==
      c.distinciones.length ||
    c.distinciones.some(
      (d) =>
        !entero(d.desdeDecimas, 1000000) ||
        d.nombre.trim().length < 1 ||
        d.nombre.length > 100,
    )
  )
    throw new ErrorPatrimonio(
      422,
      "CRITERIOS_INVALIDOS",
      "Revise rangos ascendentes, factores completos, puntos y distinciones únicas",
    );
}
