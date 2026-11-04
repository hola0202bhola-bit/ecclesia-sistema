import { ErrorIglesias } from "../domain/iglesia.js";
import type {
  AmbitoLocalidades,
  FuenteLocalidades,
  Principal,
  RepositorioImportacion,
} from "../domain/importacion.js";

export class ServicioImportacion {
  constructor(
    private readonly repo: RepositorioImportacion,
    private readonly fuentes: FuenteLocalidades,
  ) {}
  autorizar(actor?: Principal) {
    if (!actor) throw new ErrorIglesias(401, "NO_AUTENTICADO", "Inicie sesión");
    if (actor.rol !== "COORDINACION")
      throw new ErrorIglesias(
        403,
        "SIN_PERMISO",
        "Catálogo reservado a Coordinación",
      );
    return actor;
  }
  listar(actor?: Principal) {
    this.autorizar(actor);
    return this.repo.listar();
  }
  obtener(id: string, actor?: Principal) {
    this.autorizar(actor);
    return this.repo.obtener(id);
  }
  original(id: string, actor?: Principal) {
    this.autorizar(actor);
    return this.repo.original(id);
  }
  async preparar(ambito: AmbitoLocalidades, actor?: Principal) {
    const a = this.autorizar(actor);
    if (
      !/^(0[1-9]|[12]\d|3[0-2])$/.test(ambito.estadoClave) ||
      !/^\d{3}$/.test(ambito.municipioClave) ||
      ambito.municipioClave === "000" ||
      !["INEGI", "SNAPSHOT"].includes(ambito.origen)
    )
      throw new ErrorIglesias(
        422,
        "AMBITO_INVALIDO",
        "Seleccione estado y municipio del catálogo",
      );
    await this.repo.verificarAmbito(ambito);
    // La red se consulta antes de abrir cualquier transacción/bloqueo de escritura.
    return this.repo.preparar(
      ambito,
      await this.fuentes.descargar(ambito),
      a.id,
    );
  }
  private motivo(motivo: string) {
    if (motivo.trim().length < 5 || motivo.trim().length > 500)
      throw new ErrorIglesias(
        422,
        "MOTIVO_INVALIDO",
        "Indique un motivo de 5 a 500 caracteres",
      );
    return motivo.trim();
  }
  aplicar(id: string, motivo: string, actor?: Principal) {
    const a = this.autorizar(actor);
    return this.repo.aplicar(id, this.motivo(motivo), a.id);
  }
  revertir(id: string, motivo: string, actor?: Principal) {
    const a = this.autorizar(actor);
    return this.repo.revertir(id, this.motivo(motivo), a.id);
  }
}
