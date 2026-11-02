import jwt from "jsonwebtoken";
import type { RequestHandler } from "express";
export interface JwtConfig {
  secret: string;
  issuer: string;
  audience: string;
}
// Adaptador de personal externo. No crea cuentas ni decide membresías.
export function personalJwt(config: JwtConfig): RequestHandler {
  if (Buffer.byteLength(config.secret) < 32)
    throw new Error("JWT_SECRET requiere al menos 32 bytes");
  return (req, res, next) => {
    const token = req.headers.authorization?.match(/^Bearer ([^ ]+)$/)?.[1];
    if (!token) {
      res.status(401).json({
        code: "NO_AUTENTICADO",
        message: "Credencial requerida",
        details: [],
      });
      return;
    }
    try {
      const claims = jwt.verify(token, config.secret, {
        algorithms: ["HS256"],
        issuer: config.issuer,
        audience: config.audience,
      });
      if (
        typeof claims === "string" ||
        typeof claims.sub !== "string" ||
        !claims.sub ||
        typeof claims.exp !== "number" ||
        !["COORDINACION", "ADMIN_IGLESIA", "TESORERO"].includes(claims.rol) ||
        (claims.rol !== "COORDINACION" &&
          (typeof claims.iglesiaId !== "string" ||
            !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(
              claims.iglesiaId,
            ))) ||
        claims.roles !== undefined ||
        claims.iglesiaIds !== undefined
      )
        throw new Error("Claims fuera del perfil mínimo");
      Object.assign(req, {
        principal: {
          id: claims.sub,
          rol: claims.rol,
          iglesiaId: claims.iglesiaId,
        },
      });
      next();
    } catch {
      res.status(401).json({
        code: "TOKEN_INVALIDO",
        message: "Credencial inválida o vencida",
        details: [],
      });
    }
  };
}
