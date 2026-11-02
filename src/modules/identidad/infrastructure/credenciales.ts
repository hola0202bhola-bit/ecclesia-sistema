import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Credenciales, Usuario } from "../domain/identidad.js";
import type { JwtConfig } from "../../../shared/infrastructure/personal-jwt.js";
export class CredencialesBcrypt implements Credenciales {
  constructor(private readonly config: JwtConfig) {}
  hash(password: string) {
    return bcrypt.hash(password, 12);
  }
  verificar(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }
  emitir(usuario: Usuario, sesionId: string) {
    return jwt.sign({}, this.config.secret, {
      algorithm: "HS256",
      subject: usuario.id,
      jwtid: sesionId,
      issuer: this.config.issuer,
      audience: this.config.audience,
      expiresIn: "1h",
    });
  }
}
