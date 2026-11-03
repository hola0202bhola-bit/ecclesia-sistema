-- Incremento aditivo RF22-24. Sin backfill de importes ni usuarios.
CREATE UNIQUE INDEX "CelebracionMisa_iglesiaId_id_key" ON "CelebracionMisa"("iglesiaId", "id");
CREATE TABLE "Diezmo" (
  "id" UUID PRIMARY KEY,
  "iglesiaId" UUID NOT NULL REFERENCES "Iglesia"("id") ON DELETE RESTRICT,
  "celebracionId" UUID NOT NULL UNIQUE,
  "importeCentavos" BIGINT NOT NULL CHECK ("importeCentavos" BETWEEN 0 AND 99999999999),
  "moneda" VARCHAR(3) NOT NULL DEFAULT 'MXN' CHECK ("moneda" = 'MXN'),
  "version" INTEGER NOT NULL DEFAULT 1 CHECK ("version" > 0),
  UNIQUE ("iglesiaId", "id"),
  UNIQUE ("iglesiaId", "celebracionId"),
  FOREIGN KEY ("iglesiaId", "celebracionId") REFERENCES "CelebracionMisa"("iglesiaId", "id") ON DELETE RESTRICT
);
CREATE TABLE "CorreccionDiezmo" (
  "id" UUID PRIMARY KEY,
  "iglesiaId" UUID NOT NULL,
  "diezmoId" UUID NOT NULL,
  "actorId" UUID NOT NULL REFERENCES "Usuario"("id") ON DELETE RESTRICT,
  "instante" TIMESTAMPTZ(3) NOT NULL DEFAULT clock_timestamp(),
  "anteriorCentavos" BIGINT CHECK ("anteriorCentavos" BETWEEN 0 AND 99999999999),
  "nuevoCentavos" BIGINT NOT NULL CHECK ("nuevoCentavos" BETWEEN 0 AND 99999999999),
  "version" INTEGER NOT NULL CHECK ("version" > 0),
  CHECK (("version" = 1 AND "anteriorCentavos" IS NULL) OR ("version" > 1 AND "anteriorCentavos" IS NOT NULL)),
  UNIQUE ("diezmoId", "version"),
  FOREIGN KEY ("iglesiaId", "diezmoId") REFERENCES "Diezmo"("iglesiaId", "id") ON DELETE RESTRICT
);
CREATE INDEX "CorreccionDiezmo_iglesiaId_diezmoId_instante_idx" ON "CorreccionDiezmo"("iglesiaId", "diezmoId", "instante");

CREATE INDEX "CelebracionMisa_iglesiaId_fechaLocal_id_idx" ON "CelebracionMisa"("iglesiaId", "fechaLocal", "id");
