import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { ErrorIdentidad } from "../domain/identidad.js";

export function limiteRegistro(
  limitar: (clave: string) => Promise<void>,
  secret: string,
): RequestHandler {
  return async (req, res, next) => {
    const clave = createHmac("sha256", secret)
      .update("registro-cuenta:" + req.ip)
      .digest("hex");
    try {
      await limitar(clave);
      next();
    } catch (error) {
      if (error instanceof ErrorIdentidad && error.status === 429)
        res.set("Retry-After", "3600");
      next(error);
    }
  };
}
export function csrfAcceso(origin: string, secret: string): RequestHandler {
  const firma = (valor: string) =>
    createHmac("sha256", secret)
      .update("csrf-acceso:" + valor)
      .digest("hex");
  const valido = (valor?: string): valor is string =>
    Boolean(
      valor &&
      /^[a-f0-9]{64}\.[a-f0-9]{64}$/.test(valor) &&
      timingSafeEqual(
        Buffer.from(valor.slice(65)),
        Buffer.from(firma(valor.slice(0, 64))),
      ),
    );
  return (req, res, next) => {
    const cookie = req.headers.cookie
      ?.split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith("ecclesia_acceso="))
      ?.slice(16);
    if (["GET", "HEAD"].includes(req.method)) {
      const nonce = randomBytes(32).toString("hex");
      const token = valido(cookie) ? cookie : nonce + "." + firma(nonce);
      if (!valido(cookie))
        res.cookie("ecclesia_acceso", token, {
          httpOnly: true,
          sameSite: "strict",
          secure: origin.startsWith("https:"),
          path: "/",
          maxAge: 3600000,
        });
      res.locals.csrfAcceso = token;
      return next();
    }
    const token = req.body?._csrf;
    if (
      req.get("Origin") !== origin ||
      !valido(cookie) ||
      typeof token !== "string" ||
      Buffer.byteLength(token) !== Buffer.byteLength(cookie) ||
      !timingSafeEqual(Buffer.from(token), Buffer.from(cookie))
    )
      return next(
        new ErrorIdentidad(
          403,
          "CSRF_INVALIDO",
          "Recargue el formulario e intente de nuevo",
        ),
      );
    res.locals.csrfAcceso = cookie;
    next();
  };
}
