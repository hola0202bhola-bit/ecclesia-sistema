import {
  ErrorPatrimonio,
  type Criterios,
  type Principal,
} from "../domain/patrimonio.js";
import {
  validarCriterios,
  type RepositorioCriterios,
} from "../domain/criterios.js";
export class ServicioCriterios {
  constructor(private readonly repo: RepositorioCriterios) {}
  autorizar(actor?: Principal) {
    if (!actor)
      throw new ErrorPatrimonio(401, "NO_AUTENTICADO", "Inicie sesión");
    if (actor.rol !== "COORDINACION")
      throw new ErrorPatrimonio(
        403,
        "SIN_PERMISO",
        "Criterios reservados a Coordinación",
      );
    return actor;
  }
  listar(actor?: Principal) {
    this.autorizar(actor);
    return this.repo.listar();
  }
  private motivo(m: string) {
    if (m.trim().length < 5 || m.trim().length > 500)
      throw new ErrorPatrimonio(
        422,
        "MOTIVO_INVALIDO",
        "Indique un motivo de 5 a 500 caracteres",
      );
  }
  crear(
    nombre: string,
    parametros: Omit<Criterios, "id">,
    motivo: string,
    actor?: Principal,
  ) {
    const a = this.autorizar(actor);
    this.motivo(motivo);
    if (!nombre.trim() || nombre.length > 120)
      throw new ErrorPatrimonio(
        422,
        "NOMBRE_INVALIDO",
        "Nombre de versión inválido",
      );
    validarCriterios(parametros);
    return this.repo.crear(nombre.trim(), parametros, motivo.trim(), a.id);
  }
  activar(id: string, version: number, motivo: string, actor?: Principal) {
    const a = this.autorizar(actor);
    this.motivo(motivo);
    if (!Number.isInteger(version) || version < 1 || version > 2147483646)
      throw new ErrorPatrimonio(422, "VERSION_INVALIDA", "Versión inválida");
    return this.repo.activar(id, version, motivo.trim(), a.id);
  }
}
