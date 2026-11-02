import { Router, type Request, type RequestHandler } from "express";
import type { Principal } from "../../../shared/domain/personal.js";
import { ErrorIdentidad, type Sesion } from "../domain/identidad.js";
import type { ServicioIdentidad } from "../application/servicio.js";
import { altaInput, loginInput, paginaInput } from "./validacion.js";
type Personal = Request & { principal?: Principal; sesion?: Sesion };
export function identidadRouter(
  servicio: ServicioIdentidad,
  personal: RequestHandler,
  origin: string,
) {
  const router = Router();
  // Límite por IP antes de bcrypt; mapa acotado y ventana fija. No bloquea cuentas permanentemente.
  const intentos = new Map<string, { n: number; hasta: number }>();
  const limitar: RequestHandler = (req, res, next) => {
    const ahora = Date.now();
    for (const [key, value] of intentos)
      if (value.hasta <= ahora) intentos.delete(key);
    const key = req.ip ?? "local";
    const value = intentos.get(key) ?? { n: 0, hasta: ahora + 900000 };
    if (value.n >= 10 || intentos.size >= 10000) {
      res.set("Retry-After", "900");
      return next(
        new ErrorIdentidad(429, "INTENTOS_AGOTADOS", "Intente más tarde"),
      );
    }
    value.n++;
    intentos.set(key, value);
    next();
  };
  const origen: RequestHandler = (req, _res, next) => {
    if (
      (req.get("Origin") && req.get("Origin") !== origin) ||
      (!req.is("application/json") && req.get("Origin") !== origin)
    )
      return next(
        new ErrorIdentidad(403, "ORIGEN_INVALIDO", "Origen no permitido"),
      );
    next();
  };
  const cookie = {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: origin.startsWith("https:"),
    path: "/",
  };
  router.post("/api/v1/auth/login", origen, limitar, async (req, res) => {
    const input = loginInput.parse(req.body);
    const resultado = await servicio.login(input.identificador, input.password);
    res.json(resultado);
  });
  router.get("/api/v1/auth/me", personal, (req: Personal, res) =>
    res.json({ usuario: req.principal, csrfToken: req.sesion?.csrf }),
  );
  router.post("/api/v1/auth/logout", personal, async (req: Personal, res) => {
    if (req.sesion) await servicio.salir(req.sesion.id);
    res.clearCookie("ecclesia_session", cookie).status(204).end();
  });
  router.get("/api/v1/usuarios", personal, async (req: Personal, res) => {
    const { page, pageSize } = paginaInput.parse(req.query);
    res.json(await servicio.listar(page, pageSize, req.principal));
  });
  router.post("/api/v1/usuarios", personal, async (req: Personal, res) => {
    res
      .status(201)
      .json(await servicio.crear(altaInput.parse(req.body), req.principal));
  });
  router.get("/personal/login", (_req, res) =>
    res.render("login", { error: null }),
  );
  router.post("/personal/login", origen, limitar, async (req, res) => {
    const input = loginInput.parse(req.body);
    try {
      const resultado = await servicio.login(
        input.identificador,
        input.password,
      );
      res
        .cookie("ecclesia_session", resultado.accessToken, {
          ...cookie,
          maxAge: 3600000,
        })
        .redirect(303, "/personal");
    } catch (error) {
      if (error instanceof ErrorIdentidad && error.status === 401) {
        res.status(401).render("login", { error: error.message });
        return;
      }
      throw error;
    }
  });
  router.get("/personal", personal, (req: Personal, res) =>
    res.render("personal", { usuario: req.principal, csrf: req.sesion?.csrf }),
  );
  router.get("/personal/usuarios", personal, async (req: Personal, res) => {
    const { page, pageSize } = paginaInput.parse(req.query);
    res.render("usuarios", {
      resultado: await servicio.listar(page, pageSize, req.principal),
      csrf: req.sesion?.csrf,
    });
  });
  router.post("/personal/usuarios", personal, async (req: Personal, res) => {
    const { _csrf, ...datos } = req.body;
    void _csrf;
    if (datos.iglesiaId === "") delete datos.iglesiaId;
    await servicio.crear(altaInput.parse(datos), req.principal);
    res.redirect(303, "/personal/usuarios");
  });
  router.post("/personal/logout", personal, async (req: Personal, res) => {
    if (req.sesion) await servicio.salir(req.sesion.id);
    res
      .clearCookie("ecclesia_session", cookie)
      .redirect(303, "/personal/login");
  });
  return router;
}
