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
  async formulario(id: string | undefined, principal?: Principal) {
    const actor = this.autenticar(principal);
    if (!id) {
      if (actor.rol !== "COORDINACION")
        throw new ErrorIglesias(
          403,
          "SIN_PERMISO",
          "Alta reservada a Coordinación: P092",
        );
      return null;
    }
    this.permisoEdicion(id, actor);
    const actual = await this.repo.obtener(id);
    if (!actual)
      throw new ErrorIglesias(404, "NO_ENCONTRADA", "Iglesia no encontrada");
    if (actual.cerradaDesde)
      throw new ErrorIglesias(
        409,
        "IGLESIA_CERRADA",
        "La iglesia está cerrada; consulte su historial o reábrala antes de editar",
      );
    return actual;
  }
  async gestion(filtros: Filtros, principal?: Principal) {
    const actor = this.autenticar(principal);
    if (actor.rol === "COORDINACION") return this.repo.listar(filtros, true);
    if (actor.rol !== "ADMIN_IGLESIA" || !actor.iglesiaId)
      throw new ErrorIglesias(
        403,
        "SIN_PERMISO",
        "Gestión reservada a Coordinación y al administrador de su iglesia",
      );
    const iglesia = (await this.privada(actor.iglesiaId, actor)).iglesia;
    return {
      data: iglesia ? [iglesia] : [],
      meta: { page: 1, pageSize: 1, total: iglesia ? 1 : 0 },
    };
  }
  private permisoEdicion(id: string, actor: Principal) {
    if (
      actor.rol !== "COORDINACION" &&
      !(actor.rol === "ADMIN_IGLESIA" && actor.iglesiaId === id)
    )
      throw new ErrorIglesias(
        403,
        "SIN_AMBITO",
        "Edición fuera del ámbito explícito P092–P093",
      );
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
    this.permisoEdicion(id, actor);
    const actual = await this.repo.obtener(id);
    if (!actual)
      throw new ErrorIglesias(404, "NO_ENCONTRADA", "Iglesia no encontrada");
    if (actual.cerradaDesde)
      throw new ErrorIglesias(
        409,
        "IGLESIA_CERRADA",
        "La iglesia está cerrada; consulte su historial o reábrala antes de editar",
      );
    this.fechas(datos);
    return this.repo.editar(id, version, datos);
  }
  async privada(id: string, principal?: Principal) {
    const actor = this.autenticar(principal);
    this.permisoEdicion(id, actor);
    const iglesia = await this.repo.obtener(id);
    if (!iglesia)
      throw new ErrorIglesias(404, "NO_ENCONTRADA", "Iglesia no encontrada");
    return { iglesia, historial: await this.repo.historial(id) };
  }
  cambiarCierre(
    id: string,
    version: number,
    cerrar: boolean,
    motivo: string,
    principal?: Principal,
  ) {
    const actor = this.autenticar(principal);
    this.permisoEdicion(id, actor);
    if (
      !Number.isInteger(version) ||
      version < 1 ||
      version > 2147483646 ||
      motivo.trim().length < 5 ||
      motivo.trim().length > 500
    )
      throw new ErrorIglesias(
        422,
        "ENTRADA_INVALIDA",
        "Indique versión y un motivo de 5 a 500 caracteres",
      );
    return this.repo.cambiarCierre(
      id,
      version,
      cerrar,
      motivo.trim(),
      actor.id,
    );
  }
}
