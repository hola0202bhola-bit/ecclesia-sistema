import { Router, type Request, type RequestHandler } from "express";
import { ZodError } from "zod";
import type { Principal } from "../../../shared/domain/personal.js";
import type { ServicioIdentidad } from "../application/servicio.js";
import {
  avataresCuenta,
  ErrorIdentidad,
  type Sesion,
} from "../domain/identidad.js";
import { loginInput, registroInput, perfilInput } from "./validacion.js";

type CuentaRequest = Request & { principal?: Principal; sesion?: Sesion };
export type IglesiaAsignada = (
  principal?: Principal,
) => Promise<{ id: string; nombre: string } | null>;
export function cuentaRouter(
  servicio: ServicioIdentidad,
  personal: RequestHandler,
  opciones: {
    origin: string;
    csrf: RequestHandler;
    limitarRegistro: RequestHandler;
    limitarLogin: RequestHandler;
    iglesiaAsignada: IglesiaAsignada;
  },
) {
  const router = Router();
  const { origin, csrf, limitarRegistro, limitarLogin, iglesiaAsignada } =
    opciones;
  const cookie = {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: origin.startsWith("https:"),
    path: "/",
  };
  const sesionReal: RequestHandler = (req: CuentaRequest, _res, next) =>
    next(
      req.sesion
        ? undefined
        : new ErrorIdentidad(401, "NO_AUTENTICADO", "Inicie sesión"),
    );
  const origenApi: RequestHandler = (req, _res, next) => {
    if (
      !req.is("application/json") ||
      (req.get("Origin") && req.get("Origin") !== origin)
    )
      return next(
        new ErrorIdentidad(
          403,
          "ORIGEN_INVALIDO",
          "Origen o formato no permitido",
        ),
      );
    next();
  };
  router.post(
    "/api/v1/auth/registro",
    origenApi,
    limitarRegistro,
    async (req, res) => {
      res
        .status(201)
        .json(await servicio.registrar(registroInput.parse(req.body)));
    },
  );
  router.get(
    "/api/v1/cuenta/perfil",
    personal,
    sesionReal,
    async (req: CuentaRequest, res) =>
      res.json(await servicio.perfil(req.principal)),
  );
  router.put(
    "/api/v1/cuenta/perfil",
    personal,
    sesionReal,
    async (req: CuentaRequest, res) =>
      res.json(
        await servicio.guardarPerfil(
          perfilInput.parse(req.body),
          req.principal,
        ),
      ),
  );
  for (const modo of ["login", "registro"] as const) {
    router.get("/cuenta/" + modo, csrf, (_req, res) =>
      res.render("cuenta-acceso", { modo, error: null }),
    );
    router.post(
      "/cuenta/" + modo,
      csrf,
      modo === "registro" ? limitarRegistro : limitarLogin,
      async (req, res) => {
        const { _csrf, ...entrada } = req.body;
        void _csrf;
        try {
          if (modo === "registro") {
            await servicio.registrar(registroInput.parse(entrada));
            res.redirect(303, "/cuenta/login");
          } else {
            const datos = loginInput.parse(entrada);
            const result = await servicio.login(
              datos.identificador,
              datos.password,
            );
            res
              .cookie("ecclesia_session", result.accessToken, {
                ...cookie,
                maxAge: 3600000,
              })
              .redirect(303, "/iglesias");
          }
        } catch (error) {
          if (error instanceof ZodError || error instanceof ErrorIdentidad) {
            res
              .status(error instanceof ZodError ? 422 : error.status)
              .render("cuenta-acceso", {
                modo,
                error:
                  error instanceof ZodError
                    ? "Revise el identificador y la contraseña (15 caracteres como mínimo, máximo 72 bytes)."
                    : error.message,
              });
            return;
          }
          throw error;
        }
      },
    );
  }
  const formulario = async (
    req: CuentaRequest,
    res: Parameters<RequestHandler>[1],
    status = 200,
    error: string | null = null,
  ) =>
    res.status(status).render("cuenta-perfil", {
      perfil: await servicio.perfil(req.principal),
      usuario: req.principal,
      iglesiaAsignada: await iglesiaAsignada(req.principal),
      csrf: req.sesion!.csrf,
      avatares: avataresCuenta,
      error,
    });
  router.get("/cuenta/perfil", personal, sesionReal, async (req, res) => {
    await formulario(req, res);
  });
  router.post(
    "/cuenta/perfil",
    personal,
    sesionReal,
    async (req: CuentaRequest, res) => {
      const { _csrf, version, ...entrada } = req.body ?? {};
      void _csrf;
      try {
        await servicio.guardarPerfil(
          perfilInput.parse({
            ...entrada,
            version: /^\d+$/.test(version ?? "") ? Number(version) : -1,
          }),
          req.principal,
        );
        res.redirect(303, "/cuenta/perfil");
      } catch (error) {
        if (
          error instanceof ZodError ||
          (error instanceof ErrorIdentidad && error.status === 409)
        ) {
          await formulario(
            req,
            res,
            error instanceof ZodError ? 422 : 409,
            error instanceof ZodError
              ? "Revise los campos del perfil."
              : error.message,
          );
          return;
        }
        throw error;
      }
    },
  );
  router.post(
    "/cuenta/logout",
    personal,
    sesionReal,
    async (req: CuentaRequest, res) => {
      await servicio.salir(req.sesion!.id);
      res
        .clearCookie("ecclesia_session", cookie)
        .redirect(303, res.locals.loginLink);
    },
  );
  return router;
}
