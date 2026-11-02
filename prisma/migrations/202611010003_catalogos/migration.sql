CREATE TABLE "Estado" (
  "clave" VARCHAR(2) PRIMARY KEY CHECK ("clave" ~ '^(0[1-9]|[12][0-9]|3[0-2])$'),
  "nombre" TEXT NOT NULL
);
CREATE TABLE "Municipio" (
  "clave" VARCHAR(5) PRIMARY KEY,
  "estadoClave" VARCHAR(2) NOT NULL REFERENCES "Estado"("clave") ON DELETE RESTRICT,
  "codigo" VARCHAR(3) NOT NULL CHECK ("codigo" ~ '^[0-9]{3}$' AND "codigo" <> '000'),
  "nombre" TEXT NOT NULL,
  UNIQUE ("estadoClave", "codigo"),
  CHECK ("clave" = "estadoClave" || "codigo")
);
CREATE TABLE "CatalogoVersion" (
  "version" TEXT PRIMARY KEY,
  "consulta" TEXT NOT NULL,
  "sha256" VARCHAR(64) NOT NULL,
  "manifest" JSONB NOT NULL
);
-- Aditiva: no elimina ni reclasifica localidades o iglesias preexistentes.
