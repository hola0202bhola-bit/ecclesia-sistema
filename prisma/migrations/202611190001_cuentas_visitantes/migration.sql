-- Aditiva: conserva cuentas, sesiones, roles y las once migraciones anteriores.
ALTER TYPE "RolPersonal" ADD VALUE 'VISITANTE';
ALTER TABLE "Usuario" DROP CONSTRAINT "usuario_ambito";
-- Comparar como texto permite añadir el enum y el CHECK en la misma migración.
ALTER TABLE "Usuario" ADD CONSTRAINT "usuario_ambito" CHECK (
  ("rol"::text IN ('COORDINACION', 'VISITANTE') AND "iglesiaId" IS NULL) OR
  ("rol"::text IN ('ADMIN_IGLESIA', 'TESORERO') AND "iglesiaId" IS NOT NULL)
);
CREATE TABLE "LimiteRegistro" (
  "clave" VARCHAR(64) PRIMARY KEY,
  "ventana" BIGINT NOT NULL,
  "cantidad" INTEGER NOT NULL CHECK ("cantidad" BETWEEN 1 AND 6)
);
CREATE INDEX "LimiteRegistro_ventana_idx" ON "LimiteRegistro"("ventana");
CREATE TABLE "PerfilCuenta" (
  "usuarioId" UUID PRIMARY KEY REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "nombreVisible" VARCHAR(100),
  "presentacion" VARCHAR(500),
  "avatar" VARCHAR(20) NOT NULL DEFAULT 'templo',
  "version" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "perfil_avatar" CHECK ("avatar" IN ('templo','campana','paloma','rama')),
  CONSTRAINT "perfil_version" CHECK ("version" > 0),
  CONSTRAINT "perfil_nombre" CHECK ("nombreVisible" IS NULL OR length(btrim("nombreVisible")) BETWEEN 1 AND 100),
  CONSTRAINT "perfil_presentacion" CHECK ("presentacion" IS NULL OR length(btrim("presentacion")) BETWEEN 1 AND 500)
);
