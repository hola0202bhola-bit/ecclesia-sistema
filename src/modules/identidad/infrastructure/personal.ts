import jwt from "jsonwebtoken";
import type { Request, RequestHandler } from "express";
import { timingSafeEqual } from "node:crypto";
import type { JwtConfig } from "../../../shared/infrastructure/personal-jwt.js";
import {
  ErrorIdentidad,
  type RepositorioIdentidad,
  type Sesion,
} from "../domain/identidad.js";
export type RequestSesion = Request & {
  sesion: Sesion;
  principal: Sesion["usuario"];
};
export interface AccesoConfig extends JwtConfig {
  origin?: string;
  allowExternal?: boolean;
}
export function personalSesion(
  repo: RepositorioIdentidad,
  config: AccesoConfig,
  externo: RequestHandler,
): RequestHandler {
  return async (req, res, next) => {
    const bearer = req.headers.authorization;
    const cookie = req.headers.cookie
      ?.split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith("ecclesia_session="))
      ?.slice(17);
    const token =
      bearer?.match(/^Bearer ([^ ]+)$/)?.[1] ?? (!bearer ? cookie : undefined);
    if (!token)
      return next(new ErrorIdentidad(401, "NO_AUTENTICADO", "Inicie sesión"));
    let claims;
    try {
      claims = jwt.verify(token, config.secret, {
        algorithms: ["HS256"],
        issuer: config.issuer,
        audience: config.audience,
      });
    } catch {
      return next(
        new ErrorIdentidad(
          401,
          "TOKEN_INVALIDO",
          "Credencial inválida o vencida",
        ),
      );
    }
    if (typeof claims === "string" || typeof claims.exp !== "number")
      return next(
        new ErrorIdentidad(401, "TOKEN_INVALIDO", "Credencial inválida"),
      );
    if (!claims.jti && config.allowExternal && bearer)
      return externo(req, res, next);
    if (
      typeof claims.jti !== "string" ||
      !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(
        claims.jti,
      )
    )
      return next(new ErrorIdentidad(401, "TOKEN_INVALIDO", "Sesión inválida"));
    const sesion = await repo.sesion(claims.jti);
    if (!sesion || sesion.usuario.id !== claims.sub)
      return next(
        new ErrorIdentidad(401, "SESION_INVALIDA", "Inicie sesión de nuevo"),
      );
    if (!bearer && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const csrf = req.get("X-CSRF-Token") ?? req.body?._csrf;
      if (
        req.get("Origin") !== config.origin ||
        typeof csrf !== "string" ||
        Buffer.byteLength(csrf) !== Buffer.byteLength(sesion.csrf) ||
        !timingSafeEqual(Buffer.from(csrf), Buffer.from(sesion.csrf))
      )
        return next(
          new ErrorIdentidad(
            403,
            "CSRF_INVALIDO",
            "Recargue la página e intente de nuevo",
          ),
        );
    }
    Object.assign(req, { sesion, principal: sesion.usuario });
    next();
  };
}
