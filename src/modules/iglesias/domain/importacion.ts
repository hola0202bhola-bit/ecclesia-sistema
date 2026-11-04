import type { Principal } from "../../../shared/domain/personal.js";

export interface AmbitoLocalidades {
  estadoClave: string;
  municipioClave: string;
  origen: "INEGI" | "SNAPSHOT";
}
export interface FuenteLocalidades {
  descargar(ambito: AmbitoLocalidades): Promise<{
    fuente: string;
    consulta: string;
    original: string;
  }>;
}
export interface FilaLocalidad {
  clave: string;
  estadoClave: string;
  municipioClave: string;
  localidadClave: string;
  nombre: string;
  fuente: string;
  consulta: string;
}
export interface DiferenciasLocalidades {
  altas: FilaLocalidad[];
  cambios: { antes: FilaLocalidad; despues: FilaLocalidad }[];
  sinCambio: number;
  ausentesConservadas: FilaLocalidad[];
}
export interface ImportacionLocalidades extends AmbitoLocalidades {
  id: string;
  estado: string;
  actorId: string;
  fuente: string;
  consulta: string;
  sha256: string;
  diferencias: DiferenciasLocalidades;
  creadoEn: Date;
  motivo: string | null;
  motivoReversion: string | null;
  revertidaPor: string | null;
  metadatos?: string;
  periodos?: string[];
}
export interface RepositorioImportacion {
  listar(): Promise<Omit<ImportacionLocalidades, "diferencias">[]>;
  obtener(id: string): Promise<ImportacionLocalidades>;
  original(id: string): Promise<string>;
  verificarAmbito(ambito: AmbitoLocalidades): Promise<void>;
  preparar(
    ambito: AmbitoLocalidades,
    fuente: Awaited<ReturnType<FuenteLocalidades["descargar"]>>,
    actorId: string,
  ): Promise<ImportacionLocalidades>;
  aplicar(
    id: string,
    motivo: string,
    actorId: string,
  ): Promise<ImportacionLocalidades>;
  revertir(
    id: string,
    motivo: string,
    actorId: string,
  ): Promise<ImportacionLocalidades>;
}
export type { Principal };
