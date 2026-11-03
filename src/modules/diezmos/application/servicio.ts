import {
  ErrorDiezmo,
  centavos,
  reporte,
  type ConsultaDiezmos,
  type Principal,
  type RepositorioDiezmos,
} from "../domain/diezmo.js";
export class ServicioDiezmos {
  constructor(private readonly repo: RepositorioDiezmos) {}
  autorizar(id: string, actor?: Principal, escritura = false) {
    if (!actor) throw new ErrorDiezmo(401, "NO_AUTENTICADO", "Inicie sesión");
    if (
      actor.iglesiaId !== id ||
      (escritura
        ? actor.rol !== "TESORERO"
        : !["ADMIN_IGLESIA", "TESORERO"].includes(actor.rol))
    )
      throw new ErrorDiezmo(
        403,
        "SIN_AMBITO",
        escritura
          ? "Solo el tesorero de esta iglesia registra o corrige diezmos"
          : "Reporte privado del personal de esta iglesia",
      );
    return actor;
  }
  async reporte(id: string, q: ConsultaDiezmos, actor?: Principal) {
    this.autorizar(id, actor);
    return reporte(await this.repo.misas(id, q), q);
  }
  guardar(
    id: string,
    celebracion: string,
    importe: string,
    actor?: Principal,
    version?: number,
  ) {
    return this.repo.guardar(
      id,
      celebracion,
      this.autorizar(id, actor, true).id,
      centavos(importe),
      version,
    );
  }
  ficha(id: string, celebracion: string, actor?: Principal) {
    this.autorizar(id, actor, true);
    return this.repo.ficha(id, celebracion);
  }
  consultar(id: string, celebracion: string, actor?: Principal) {
    this.autorizar(id, actor, true);
    return this.repo.consultar(id, celebracion);
  }
  historial(id: string, celebracion: string, actor?: Principal) {
    this.autorizar(id, actor, true);
    return this.repo.historial(id, celebracion);
  }
}
