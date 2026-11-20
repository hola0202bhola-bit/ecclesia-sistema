import type { Principal } from "../../../shared/domain/personal.js";
import {
  ErrorIdentidad,
  esCoordinacion,
  type AltaUsuario,
  type Credenciales,
  type RepositorioIdentidad,
  type EdicionPerfil,
} from "../domain/identidad.js";
export class ServicioIdentidad {
  constructor(
    private readonly repo: RepositorioIdentidad,
    private readonly credenciales: Credenciales,
  ) {}
  async login(identificador: string, password: string, soloPersonal = false) {
    const cuenta = await this.repo.buscar(identificador);
    // Hash bcrypt válido de costo 12 para igualar trabajo con identificadores inexistentes.
    const valido = await this.credenciales.verificar(
      password,
      cuenta?.passwordHash ??
        "$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW",
    );
    if (
      !cuenta?.activo ||
      !valido ||
      (soloPersonal && cuenta.rol === "VISITANTE")
    )
      throw new ErrorIdentidad(
        401,
        "CREDENCIALES_INVALIDAS",
        "Identificador o contraseña inválidos",
      );
    const { passwordHash: _hash, ...usuario } = cuenta;
    void _hash;
    const sesion = await this.repo.crearSesion(
      usuario.id,
      new Date(Date.now() + 3600000),
    );
    return {
      accessToken: this.credenciales.emitir(usuario, sesion.id),
      tokenType: "Bearer" as const,
      expiresIn: 3600,
      usuario,
      csrfToken: sesion.csrf,
    };
  }
  async crear(datos: AltaUsuario, principal?: Principal) {
    esCoordinacion(principal);
    return this.guardar(datos);
  }
  registrar(datos: Pick<AltaUsuario, "identificador" | "password">) {
    // Ni rol ni iglesia se toman de la entrada del visitante.
    return this.guardar({
      identificador: datos.identificador,
      password: datos.password,
      rol: "VISITANTE",
    });
  }
  limitarRegistro(clave: string) {
    return this.repo.limitarRegistro(clave);
  }
  perfil(principal?: Principal) {
    return this.repo.perfil(this.actor(principal));
  }
  guardarPerfil(datos: EdicionPerfil, principal?: Principal) {
    return this.repo.guardarPerfil(this.actor(principal), datos);
  }
  private actor(principal?: Principal) {
    if (!principal)
      throw new ErrorIdentidad(401, "NO_AUTENTICADO", "Inicie sesión");
    return principal.id;
  }
  async inicial(datos: AltaUsuario) {
    if (datos.rol !== "COORDINACION" || datos.iglesiaId)
      throw new ErrorIdentidad(
        422,
        "PERFIL_INVALIDO",
        "Primera cuenta de Coordinación",
      );
    return this.guardar(datos, true);
  }
  private async guardar({ password, ...datos }: AltaUsuario, inicial = false) {
    if (
      ["COORDINACION", "VISITANTE"].includes(datos.rol) ===
      Boolean(datos.iglesiaId)
    )
      throw new ErrorIdentidad(
        422,
        "AMBITO_INVALIDO",
        "Coordinación y visitantes sin iglesia; administración y tesorería con una iglesia",
      );
    return this.repo.crear(
      { ...datos, passwordHash: await this.credenciales.hash(password) },
      inicial,
    );
  }
  listar(page: number, pageSize: number, principal?: Principal) {
    esCoordinacion(principal);
    return this.repo.listar(page, pageSize);
  }
  salir(id: string) {
    return this.repo.salir(id);
  }
}
