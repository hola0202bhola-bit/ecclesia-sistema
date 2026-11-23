-- Aditiva: conserva asignaciones, identidades, historia y cotizaciones previas.
ALTER TABLE "AsignacionSacerdote"
  ADD COLUMN "activo" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD CONSTRAINT "AsignacionSacerdote_version_valida" CHECK ("version" > 0);

ALTER TABLE "OfertaFuneraria"
  ADD COLUMN "responsablePublico" VARCHAR(200),
  ADD COLUMN "costoReferenciaCentavos" BIGINT,
  ADD CONSTRAINT "OfertaFuneraria_responsable_publico_valido" CHECK ("responsablePublico" IS NULL OR length(btrim("responsablePublico")) > 0),
  ADD CONSTRAINT "OfertaFuneraria_costo_referencia_valido" CHECK ("costoReferenciaCentavos" IS NULL OR "costoReferenciaCentavos" BETWEEN 0 AND 99999999999);
