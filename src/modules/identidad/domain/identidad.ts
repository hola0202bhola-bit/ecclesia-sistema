import type { Principal } from "../../../shared/domain/personal.js";
export interface Usuario extends Principal {
  identificador: string;
  activo: boolean;
}
export interface Cuenta extends Usuario {
  passwordHash: string;
}
export interface AltaUsuario {
  identificador: string;
  password: string;
  rol: Principal["rol"];
  iglesiaId?: string;
}
export interface Sesion {
  id: string;
  usuario: Usuario;
  csrf: string;
  vence: Date;
}
export interface RepositorioIdentidad {
  buscar(identificador: string): Promise<Cuenta | null>;
  crear(
    datos: Omit<AltaUsuario, "password"> & { passwordHash: string },
    inicial?: boolean,
  ): Promise<Usuario>;
  listar(
    page: number,
    pageSize: number,
  ): Promise<{
    data: Usuario[];
    meta: { page: number; pageSize: number; total: number };
  }>;
  crearSesion(
    usuarioId: string,
    vence: Date,
  ): Promise<{ id: string; csrf: string }>;
  sesion(id: string): Promise<Sesion | null>;
  salir(id: string): Promise<void>;
}
export interface Credenciales {
  hash(password: string): Promise<string>;
  verificar(password: string, hash: string): Promise<boolean>;
  emitir(usuario: Usuario, sesionId: string): string;
}
export class ErrorIdentidad extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
export function esCoordinacion(principal?: Principal) {
  if (principal?.rol !== "COORDINACION")
    throw new ErrorIdentidad(403, "PROHIBIDO", "Requiere Coordinación");
}
