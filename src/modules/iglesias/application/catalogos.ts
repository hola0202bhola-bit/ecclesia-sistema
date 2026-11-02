import type {
  ConsultaCatalogo,
  RepositorioCatalogos,
} from "../domain/catalogos.js";
export class ServicioCatalogos {
  constructor(private readonly repo: RepositorioCatalogos) {}
  consultar(filtro: ConsultaCatalogo) {
    return this.repo.consultar(filtro);
  }
}
