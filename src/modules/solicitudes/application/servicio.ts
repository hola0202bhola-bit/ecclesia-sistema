import {
  ErrorSolicitud,
  precioCentavos,
  type Principal,
  type TipoEspacio,
  type ContactoSolicitud,
  type AccesoSolicitud,
  type Decision,
  type Revision,
  type RepositorioSolicitudes,
  type CredencialesSolicitud,
} from "../domain/solicitud.js";
export class ServicioSolicitudes {
  constructor(
    private readonly repo: RepositorioSolicitudes,
    private readonly claves: CredencialesSolicitud,
  ) {}
  autorizar(id: string, actor?: Principal) {
    if (!actor)
      throw new ErrorSolicitud(401, "NO_AUTENTICADO", "Inicie sesión");
    if (actor.iglesiaId !== id || actor.rol !== "ADMIN_IGLESIA")
      throw new ErrorSolicitud(
        403,
        "SIN_AMBITO",
        "Solo el administrador de esta iglesia gestiona solicitudes y espacios",
      );
    return actor;
  }
  espacios(id: string, actor?: Principal, privados = false) {
    if (privados) this.autorizar(id, actor);
    return this.repo.espacios(id, privados);
  }
  espacio(
    id: string,
    tipo: TipoEspacio,
    activo: boolean,
    version: number,
    actor?: Principal,
  ) {
    return this.repo.espacio(
      id,
      tipo,
      activo,
      version,
      this.autorizar(id, actor).id,
    );
  }
  async crear(id: string, d: ContactoSolicitud) {
    const { clave, ...credenciales } = this.claves.generar();
    await this.repo.crear(id, d, credenciales);
    return { folio: credenciales.folio, clave };
  }
  seguimiento(acceso: AccesoSolicitud, decision?: Decision) {
    return this.repo.seguimiento(acceso, decision);
  }
  ficha(iglesiaId: string, id: string, actor?: Principal, revision?: Revision) {
    const personal = this.autorizar(iglesiaId, actor);
    if (revision?.resultado === "COTIZAR") precioCentavos(revision.precio);
    return this.repo.ficha(iglesiaId, id, personal.id, revision);
  }
  lista(id: string, pagina: number, actor?: Principal) {
    return this.repo.lista(id, this.autorizar(id, actor).id, pagina);
  }
  limitar(clave: string, maximo: number, ventanaMs: number) {
    return this.repo.limitar(clave, maximo, ventanaMs);
  }
}
