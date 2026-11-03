import {
  randomBytes,
  createHash,
  timingSafeEqual,
  createHmac,
} from "node:crypto";
import type { RequestHandler } from "express";
import {
  ErrorSolicitud,
  type CredencialesSolicitud,
} from "../domain/solicitud.js";
export const hashClave = (clave: string) =>
  createHash("sha256").update(clave).digest("hex");
export function verificaClave(clave: string, hash?: string) {
  const recibido = Buffer.from(hashClave(clave), "hex");
  return (
    timingSafeEqual(
      recibido,
      Buffer.from(hash ?? hashClave("verificador-inexistente"), "hex"),
    ) && hash !== undefined
  );
}
export class ClavesSolicitud implements CredencialesSolicitud {
  generar() {
    const clave = randomBytes(32).toString("base64url");
    return {
      folio: randomBytes(12).toString("hex").toUpperCase(),
      clave,
      claveHash: hashClave(clave),
    };
  }
}
export function proteccionAnonima(
  origin: string,
  secret: string,
): RequestHandler {
  return (req, res, next) => {
    const cookie = req.headers.cookie
      ?.split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith("ecclesia_visitante="))
      ?.slice(19);
    const firma = (s: string) =>
      createHmac("sha256", secret)
        .update("csrf-visitante:" + s)
        .digest("hex");
    const valido = (s?: string): s is string => {
      if (!s || !/^[a-f0-9]{64}\.[a-f0-9]{64}$/.test(s)) return false;
      return timingSafeEqual(
        Buffer.from(s.slice(65)),
        Buffer.from(firma(s.slice(0, 64))),
      );
    };
    if (["GET", "HEAD"].includes(req.method)) {
      const nonce = randomBytes(32).toString("hex");
      const token = valido(cookie) ? cookie : nonce + "." + firma(nonce);
      if (!valido(cookie))
        res.cookie("ecclesia_visitante", token, {
          httpOnly: true,
          sameSite: "strict",
          secure: origin.startsWith("https:"),
          path: "/",
          maxAge: 3600000,
        });
      res.locals.csrf = token;
      return next();
    }
    const token = req.get("X-CSRF-Token") ?? req.body?._csrf;
    if (
      req.get("Origin") !== origin ||
      !valido(cookie) ||
      typeof token !== "string" ||
      Buffer.byteLength(token) !== Buffer.byteLength(cookie) ||
      !timingSafeEqual(Buffer.from(cookie), Buffer.from(token))
    )
      return next(
        new ErrorSolicitud(
          403,
          "CSRF_INVALIDO",
          "Recargue el formulario e intente de nuevo",
        ),
      );
    res.locals.csrf = cookie;
    next();
  };
}
export const claveLimite = (secret: string, valor: string) =>
  createHmac("sha256", secret)
    .update("limite-solicitudes:" + valor)
    .digest("hex");
