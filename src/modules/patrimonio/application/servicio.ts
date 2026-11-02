import {
  ErrorPatrimonio,
  calcularIndice,
  validarObjeto,
  anioObjeto,
  type Principal,
  type DatosObjeto,
  type Condicion,
  type Pagina,
  type FiltrosPatrimonio,
  type RepositorioPatrimonio,
} from "../domain/patrimonio.js";

export class ServicioPatrimonio {
  constructor(
    private readonly repo: RepositorioPatrimonio,
    private readonly referencia: number,
  ) {}
  autorizar(iglesiaId: string, actor?: Principal): Principal {
    if (!actor)
      throw new ErrorPatrimonio(401, "NO_AUTENTICADO", "Inicie sesión");
    if (actor.rol !== "ADMIN_IGLESIA" || actor.iglesiaId !== iglesiaId)
      throw new ErrorPatrimonio(
        403,
        "SIN_AMBITO",
        "Patrimonio reservado al administrador de su iglesia: P093",
      );
    return actor;
  }
  async consultar(
    iglesiaId: string,
    pagina: Pagina,
    actor?: Principal,
    privado = false,
  ) {
    if (privado) this.autorizar(iglesiaId, actor);
    const snapshot = await this.repo.leer(iglesiaId);
    if (!snapshot || snapshot.iglesia.cerradaDesde)
      throw new ErrorPatrimonio(404, "NO_ENCONTRADA", "Iglesia no disponible");
    const { iglesia, criterios } = snapshot;
    const objetos = iglesia.objetos.filter(
      (o) => privado || o.condicion === "VIGENTE",
    );
    return {
      iglesia: { id: iglesia.id, nombre: iglesia.nombre },
      data: objetos.slice(
        (pagina.page - 1) * pagina.pageSize,
        pagina.page * pagina.pageSize,
      ),
      meta: { ...pagina, total: objetos.length },
      calculo: calcularIndice(objetos, criterios, this.referencia),
    };
  }
  async ranking(filtros: FiltrosPatrimonio) {
    const snapshot = await this.repo.ranking(filtros);
    const data = snapshot.iglesias
      .filter((i) => !i.cerradaDesde && i.objetos.length > 0)
      .filter(
        (i) =>
          (filtros.tipoObjetoId === undefined &&
            filtros.antiguedadMin === undefined) ||
          i.objetos.some(
            (o) =>
              o.condicion === "VIGENTE" &&
              (!filtros.tipoObjetoId || o.tipoId === filtros.tipoObjetoId) &&
              this.referencia - anioObjeto(o) >= (filtros.antiguedadMin ?? 0),
          ),
      )
      .map((i) => ({
        iglesia: {
          id: i.id,
          nombre: i.nombre,
          estadoClave: i.estadoClave,
          municipioClave: i.municipioClave,
          localidadClave: i.localidadClave,
        },
        ...calcularIndice(i.objetos, snapshot.criterios, this.referencia),
      }))
      .sort(
        (a, b) =>
          Number(b.indice) - Number(a.indice) ||
          a.iglesia.nombre.localeCompare(b.iglesia.nombre, "es") ||
          a.iglesia.id.localeCompare(b.iglesia.id),
      );
    // No exponer IDs/antigüedades de piezas no vigentes a través del cálculo público.
    return {
      data: data
        .slice(
          (filtros.page - 1) * filtros.pageSize,
          filtros.page * filtros.pageSize,
        )
        .map(({ aportaciones: _a, ...r }) => {
          void _a;
          return r;
        }),
      meta: {
        page: filtros.page,
        pageSize: filtros.pageSize,
        total: data.length,
      },
    };
  }
  guardar(
    iglesiaId: string,
    datos: DatosObjeto,
    actor?: Principal,
    edicion?: { id: string; version: number },
  ) {
    const principal = this.autorizar(iglesiaId, actor);
    validarObjeto(datos, this.referencia);
    return this.repo.guardar(iglesiaId, principal.id, datos, edicion);
  }
  async editar(
    iglesiaId: string,
    objetoId: string,
    version: number,
    cambios: Partial<DatosObjeto>,
    actor?: Principal,
  ) {
    this.autorizar(iglesiaId, actor);
    const snapshot = await this.repo.leer(iglesiaId);
    const actual = snapshot?.iglesia.objetos.find((o) => o.id === objetoId);
    if (!actual)
      throw new ErrorPatrimonio(
        404,
        "OBJETO_NO_ENCONTRADO",
        "Objeto no disponible",
      );
    const {
      descripcion,
      tipoId,
      anioExacto,
      siglo,
      material,
      conservacion,
      ubicacionInterna,
      catalogadoInah,
    } = actual;
    return this.guardar(
      iglesiaId,
      {
        descripcion,
        tipoId,
        anioExacto,
        siglo,
        material,
        conservacion,
        ubicacionInterna,
        catalogadoInah,
        ...cambios,
      },
      actor,
      { id: objetoId, version },
    );
  }
  condicion(
    iglesiaId: string,
    objetoId: string,
    version: number,
    condicion: Condicion,
    actor?: Principal,
  ) {
    const principal = this.autorizar(iglesiaId, actor);
    return this.repo.condicion(
      iglesiaId,
      principal.id,
      objetoId,
      version,
      condicion,
    );
  }
}
