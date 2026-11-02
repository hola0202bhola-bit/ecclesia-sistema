CREATE TYPE "RolPersonal" AS ENUM ('COORDINACION', 'ADMIN_IGLESIA', 'TESORERO');
CREATE TABLE "Usuario" (
  "id" UUID PRIMARY KEY,
  "identificador" VARCHAR(80) NOT NULL UNIQUE,
  "passwordHash" VARCHAR(60) NOT NULL,
  "rol" "RolPersonal" NOT NULL,
  "iglesiaId" UUID REFERENCES "Iglesia"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "usuario_ambito" CHECK (("rol" = 'COORDINACION' AND "iglesiaId" IS NULL) OR ("rol" <> 'COORDINACION' AND "iglesiaId" IS NOT NULL)),
  CONSTRAINT "usuario_identificador" CHECK ("identificador" ~ '^[a-z0-9][a-z0-9._-]{2,79}$'),
  CONSTRAINT "usuario_hash" CHECK ("passwordHash" ~ '^\$2[ab]\$12\$.{53}$')
);
CREATE TABLE "Sesion" (
  "id" UUID PRIMARY KEY,
  "usuarioId" UUID NOT NULL REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "csrf" VARCHAR(64) NOT NULL,
  "vence" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Sesion_usuarioId_idx" ON "Sesion"("usuarioId");
CREATE INDEX "Sesion_vence_idx" ON "Sesion"("vence");
