export const normalizar = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX");

export interface DatosIglesia {
  nombre: string;
  tipoId: string;
  estadoClave: string;
  municipioClave: string;
  localidadClave: string;
  direccion: string;
  capacidad?: number;
  anioConstruccion?: number;
  contacto?: string;
  latitud?: number;
  longitud?: number;
  zonaIana?: string;
}
export interface Iglesia extends DatosIglesia {
  id: string;
  version: number;
  cerradaDesde: string | null;
}
export interface Filtros {
  estadoClave: string;
  municipioClave?: string;
  localidadClave?: string;
  tipoId?: string;
  nombre?: string;
  capacidadMin?: number;
  capacidadMax?: number;
  page: number;
  pageSize: number;
}
export type { Principal } from "../../../shared/domain/personal.js";
export interface RepositorioIglesias {
  listar(
    filtros: Filtros,
    incluirCerradas?: boolean,
  ): Promise<{
    data: Iglesia[];
    meta: { page: number; pageSize: number; total: number };
  }>;
  cambiarCierre(
    id: string,
    version: number,
    cerrar: boolean,
    motivo: string,
    actorId: string,
  ): Promise<Iglesia>;
  historial(id: string): Promise<
    {
      fecha: Date;
      motivo: string;
      actorId: string;
      antes: Date | null;
      despues: Date | null;
      version: number;
    }[]
  >;
  obtener(id: string): Promise<Iglesia | null>;
  crear(datos: DatosIglesia): Promise<Iglesia>;
  editar(
    id: string,
    version: number,
    datos: Partial<DatosIglesia>,
  ): Promise<Iglesia>;
}
export class ErrorIglesias extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
