-- Campos opcionales para la demostración escolar; conserva datos y migraciones anteriores.
ALTER TABLE "Iglesia"
  ADD COLUMN "descripcion" VARCHAR(500),
  ADD COLUMN "fotoUrl" VARCHAR(700);
