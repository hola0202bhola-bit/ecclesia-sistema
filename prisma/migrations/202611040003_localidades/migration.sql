-- No inventa municipios para reparar huérfanos. La validación falla íntegramente
-- si una instalación previa contiene localidades sin jerarquía oficial cargada.
ALTER TABLE "Localidad" ADD CONSTRAINT "Localidad_municipio_fkey"
  FOREIGN KEY ("estadoClave", "municipioClave") REFERENCES "Municipio"("estadoClave", "codigo") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "ImportacionLocalidades" (
  id UUID PRIMARY KEY,
  "estadoClave" VARCHAR(2) NOT NULL,
  "municipioClave" VARCHAR(3) NOT NULL,
  origen TEXT NOT NULL CHECK (origen IN ('INEGI','SNAPSHOT')),
  estado TEXT NOT NULL DEFAULT 'PREVIA' CHECK (estado IN ('PREVIA','APLICADA','REVERTIDA')),
  "actorId" UUID NOT NULL REFERENCES "Usuario"(id) ON DELETE RESTRICT,
  "aplicadoPor" UUID REFERENCES "Usuario"(id) ON DELETE RESTRICT,
  "revertidaPor" UUID REFERENCES "Usuario"(id) ON DELETE RESTRICT,
  fuente TEXT NOT NULL,
  consulta TEXT NOT NULL,
  sha256 VARCHAR(64) NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
  original TEXT NOT NULL,
  antes JSONB NOT NULL,
  diferencias JSONB NOT NULL,
  "huellaAntes" VARCHAR(64) NOT NULL,
  "huellaDespues" VARCHAR(64),
  revision INTEGER CHECK (revision > 0),
  "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "aplicadaEn" TIMESTAMPTZ(3),
  "revertidaEn" TIMESTAMPTZ(3),
  motivo VARCHAR(500),
  "motivoReversion" VARCHAR(500),
  FOREIGN KEY ("estadoClave", "municipioClave") REFERENCES "Municipio"("estadoClave", codigo) ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE ("estadoClave", "municipioClave", revision)
);
CREATE INDEX "ImportacionLocalidades_actorId_idx" ON "ImportacionLocalidades"("actorId");
CREATE INDEX "ImportacionLocalidades_aplicadoPor_idx" ON "ImportacionLocalidades"("aplicadoPor");
CREATE INDEX "ImportacionLocalidades_revertidaPor_idx" ON "ImportacionLocalidades"("revertidaPor");
