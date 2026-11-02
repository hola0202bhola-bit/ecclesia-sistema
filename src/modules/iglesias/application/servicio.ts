import {
  ErrorIglesias,
  type DatosIglesia,
  type Filtros,
  type Principal,
  type RepositorioIglesias,
} from "../domain/iglesia.js";

export class ServicioIglesias {
  constructor(
    private readonly repo: RepositorioIglesias,
    private readonly anioActual: number,
  ) {}
  listar(filtros: Filtros) {
    return this.repo.listar(filtros);
  }
  async ficha(id: string) {
    const iglesia = await this.repo.obtener(id);
    if (!iglesia || iglesia.cerradaDesde)
      throw new ErrorIglesias(404, "NO_ENCONTRADA", "Iglesia no disponible");
    return { iglesia };
  }
  private autenticar(principal?: Principal): Principal {
    if (!principal)
      throw new ErrorIglesias(
        401,
        "NO_AUTENTICADO",
        "Credencial de personal requerida",
      );
    return principal;
  }
  private fechas(datos: Partial<DatosIglesia>) {
    if (datos.anioConstruccion && datos.anioConstruccion > this.anioActual)
      throw new ErrorIglesias(
        422,
        "PC02_PENDIENTE",
        "Año futuro requiere definición del cliente",
      );
  }
  crear(datos: DatosIglesia, principal?: Principal) {
    const actor = this.autenticar(principal);
    if (actor.rol !== "COORDINACION")
      throw new ErrorIglesias(
        403,
        "SIN_PERMISO",
        "Alta reservada a Coordinación: P092",
      );
    this.fechas(datos);
    return this.repo.crear(datos);
  }
  async editar(
    id: string,
    version: number,
    datos: Partial<DatosIglesia>,
    principal?: Principal,
  ) {
    const actor = this.autenticar(principal);
    if (
      actor.rol !== "COORDINACION" &&
      !(actor.rol === "ADMIN_IGLESIA" && actor.iglesiaId === id)
    )
      throw new ErrorIglesias(
        403,
        "SIN_AMBITO",
        "Edición fuera del ámbito explícito P092–P093",
      );
    const actual = await this.repo.obtener(id);
    if (!actual)
      throw new ErrorIglesias(404, "NO_ENCONTRADA", "Iglesia no encontrada");
    if (actual.cerradaDesde)
      throw new ErrorIglesias(
        501,
        "PC04_PENDIENTE",
        "Gestión durante el cierre pendiente de validación",
      );
    this.fechas(datos);
    return this.repo.editar(id, version, datos);
  }
  cambiarCierre(principal?: Principal): never {
    this.autenticar(principal);
    throw new ErrorIglesias(
      501,
      "PC04_PENDIENTE",
      "Cierre y reapertura requieren definición del cliente",
    );
  }
}
