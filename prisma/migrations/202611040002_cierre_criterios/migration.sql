CREATE TABLE "CambioCierre" (
 id UUID PRIMARY KEY,
 "iglesiaId" UUID NOT NULL REFERENCES "Iglesia"(id) ON DELETE RESTRICT,
 "actorId" UUID NOT NULL REFERENCES "Usuario"(id) ON DELETE RESTRICT,
 fecha TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 motivo VARCHAR(500) NOT NULL CHECK(length(trim(motivo)) BETWEEN 5 AND 500),
 antes TIMESTAMP(3), despues TIMESTAMP(3),
 version INTEGER NOT NULL CHECK(version > 1),
 UNIQUE("iglesiaId",version),
 CHECK((antes IS NULL) <> (despues IS NULL))
);
ALTER TABLE "CriterioPatrimonio" ADD COLUMN nombre VARCHAR(120) NOT NULL DEFAULT 'Criterios del caso original';
ALTER TABLE "CriterioPatrimonio" ADD COLUMN "creadoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE TABLE "ConfiguracionIndice" (
 id TEXT PRIMARY KEY CHECK(id = 'global'),
 "criterioId" TEXT NOT NULL REFERENCES "CriterioPatrimonio"(id) ON DELETE RESTRICT,
 version INTEGER NOT NULL DEFAULT 1 CHECK(version > 0)
);
INSERT INTO "ConfiguracionIndice" (id,"criterioId") VALUES ('global','caso-v1');
CREATE TABLE "CambioCriterio" (
 id UUID PRIMARY KEY,
 "criterioId" TEXT NOT NULL REFERENCES "CriterioPatrimonio"(id) ON DELETE RESTRICT,
 "actorId" UUID NOT NULL REFERENCES "Usuario"(id) ON DELETE RESTRICT,
 fecha TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 tipo TEXT NOT NULL CHECK(tipo IN ('CREACION','ACTIVACION')),
 motivo VARCHAR(500) NOT NULL CHECK(length(trim(motivo)) BETWEEN 5 AND 500),
 anterior TEXT REFERENCES "CriterioPatrimonio"(id) ON DELETE RESTRICT,
 version INTEGER
);
CREATE INDEX "CambioCriterio_fecha_idx" ON "CambioCriterio"(fecha);
