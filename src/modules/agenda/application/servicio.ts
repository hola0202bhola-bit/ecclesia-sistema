import {
  ErrorAgenda,
  type Principal,
  type RepositorioAgenda,
  type DatosHorario,
  type DatosCelebracion,
  type Edicion,
  type Semana,
} from "../domain/agenda.js";
export class ServicioAgenda {
  constructor(private readonly repo: RepositorioAgenda) {}
  autorizar(id: string, actor?: Principal) {
    if (!actor) throw new ErrorAgenda(401, "NO_AUTENTICADO", "Inicie sesión");
    if (actor.rol !== "ADMIN_IGLESIA" || actor.iglesiaId !== id)
      throw new ErrorAgenda(
        403,
        "SIN_AMBITO",
        "Solo el administrador de esta iglesia gestiona padres y misas: P093",
      );
    return actor;
  }
  sacerdotes(id: string, actor?: Principal) {
    this.autorizar(id, actor);
    return this.repo.sacerdotes(id);
  }
  registrar(id: string, nombre: string, actor?: Principal) {
    return this.repo.registrar(id, this.autorizar(id, actor).id, nombre);
  }
  vincular(id: string, padre: string, actor?: Principal) {
    return this.repo.vincular(id, this.autorizar(id, actor).id, padre);
  }
  renombrar(id: string, e: Edicion, nombre: string, actor?: Principal) {
    return this.repo.renombrar(id, this.autorizar(id, actor).id, e, nombre);
  }
  horarios(id: string, actor?: Principal) {
    this.autorizar(id, actor);
    return this.repo.horarios(id);
  }
  guardar(id: string, datos: DatosHorario, actor?: Principal, e?: Edicion) {
    return this.repo.guardar(id, this.autorizar(id, actor).id, datos, e);
  }
  semana(id: string, s: Semana) {
    return this.repo.semana(id, s);
  }
  agenda(id: string, padre: string, s: Semana, actor?: Principal) {
    this.autorizar(id, actor);
    return this.repo.semana(id, s, padre);
  }
  celebraciones(id: string, actor?: Principal) {
    this.autorizar(id, actor);
    return this.repo.celebraciones(id);
  }
  celebrar(id: string, datos: DatosCelebracion, actor?: Principal) {
    return this.repo.celebrar(id, this.autorizar(id, actor).id, datos);
  }
}
