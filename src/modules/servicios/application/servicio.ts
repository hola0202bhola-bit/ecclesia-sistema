import {
  ErrorOferta,
  type Principal,
  type RepositorioOferta,
  type Pagina,
  type DatosServicio,
  type DatosPlatica,
  type Edicion,
} from "../domain/oferta.js";

export class ServicioOferta {
  constructor(private readonly repo: RepositorioOferta) {}
  autorizar(iglesiaId: string, actor?: Principal) {
    if (!actor) throw new ErrorOferta(401, "NO_AUTENTICADO", "Inicie sesión");
    if (actor.rol !== "ADMIN_IGLESIA" || actor.iglesiaId !== iglesiaId)
      throw new ErrorOferta(
        403,
        "SIN_AMBITO",
        "Solo el administrador de esta iglesia gestiona su oferta: P093",
      );
    return actor;
  }
  servicios(id: string, pagina: Pagina) {
    return this.repo.servicios(id, pagina);
  }
  platicas(id: string, pagina: Pagina) {
    return this.repo.platicas(id, pagina);
  }
  servicio(id: string, recursoId: string, actor?: Principal) {
    this.autorizar(id, actor);
    return this.repo.servicio(id, recursoId);
  }
  platica(id: string, recursoId: string, actor?: Principal) {
    this.autorizar(id, actor);
    return this.repo.platica(id, recursoId);
  }
  guardarServicio(
    id: string,
    datos: Partial<DatosServicio>,
    actor?: Principal,
    edicion?: Edicion,
  ) {
    return this.repo.guardarServicio(
      id,
      this.autorizar(id, actor).id,
      datos,
      edicion,
    );
  }
  guardarPlatica(
    id: string,
    datos: Partial<DatosPlatica>,
    actor?: Principal,
    edicion?: Edicion,
  ) {
    return this.repo.guardarPlatica(
      id,
      this.autorizar(id, actor).id,
      datos,
      edicion,
    );
  }
}
