export interface ConsultaCatalogo {
  estadoClave?: string;
  municipioClave?: string;
}
export interface Catalogos {
  estados: { clave: string; nombre: string }[];
  municipios: {
    clave: string;
    estadoClave: string;
    codigo: string;
    nombre: string;
  }[];
  localidades: {
    clave: string;
    estadoClave: string;
    municipioClave: string;
    localidadClave: string;
    nombre: string;
    fuente: string;
    consulta: string;
  }[];
  tipos: { id: string; nombre: string }[];
  versiones: { version: string; consulta: string; sha256: string }[];
}
export interface RepositorioCatalogos {
  consultar(filtro: ConsultaCatalogo): Promise<Catalogos>;
}
