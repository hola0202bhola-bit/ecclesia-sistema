-- CreateEnum
CREATE TYPE "TipoMisa" AS ENUM ('DIARIA', 'DOMINICAL', 'ESPECIAL');

-- CreateTable
CREATE TABLE "Sacerdote" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Sacerdote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsignacionSacerdote" (
    "iglesiaId" UUID NOT NULL,
    "sacerdoteId" UUID NOT NULL,

    CONSTRAINT "AsignacionSacerdote_pkey" PRIMARY KEY ("iglesiaId","sacerdoteId")
);

-- CreateTable
CREATE TABLE "HorarioMisa" (
    "id" UUID NOT NULL,
    "iglesiaId" UUID NOT NULL,
    "sacerdoteId" UUID NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaLocal" VARCHAR(5) NOT NULL,
    "tipo" "TipoMisa" NOT NULL,
    "idioma" VARCHAR(100) NOT NULL,
    "duracionMinutos" INTEGER NOT NULL DEFAULT 60,
    "desde" VARCHAR(10) NOT NULL,
    "hasta" VARCHAR(10) NOT NULL,
    "zonaIana" VARCHAR(100) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "HorarioMisa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OcurrenciaMisa" (
    "id" UUID NOT NULL,
    "horarioId" UUID NOT NULL,
    "iglesiaId" UUID NOT NULL,
    "sacerdoteId" UUID NOT NULL,
    "fechaLocal" VARCHAR(10) NOT NULL,
    "horaLocal" VARCHAR(5) NOT NULL,
    "zonaIana" VARCHAR(100) NOT NULL,
    "inicio" TIMESTAMPTZ(3) NOT NULL,
    "fin" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "OcurrenciaMisa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CelebracionMisa" (
    "id" UUID NOT NULL,
    "ocurrenciaId" UUID NOT NULL,
    "iglesiaId" UUID NOT NULL,
    "previstoId" UUID NOT NULL,
    "oficianteId" UUID NOT NULL,
    "fechaLocal" VARCHAR(10) NOT NULL,
    "horaLocal" VARCHAR(5) NOT NULL,
    "zonaIana" VARCHAR(100) NOT NULL,
    "inicio" TIMESTAMPTZ(3) NOT NULL,
    "fin" TIMESTAMPTZ(3) NOT NULL,
    "actorId" UUID NOT NULL,
    "registradoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" VARCHAR(500),

    CONSTRAINT "CelebracionMisa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CambioAgenda" (
    "id" UUID NOT NULL,
    "iglesiaId" UUID NOT NULL,
    "recursoId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "fecha" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "antes" JSONB NOT NULL,
    "despues" JSONB NOT NULL,

    CONSTRAINT "CambioAgenda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HorarioMisa_iglesiaId_idx" ON "HorarioMisa"("iglesiaId");

-- CreateIndex
CREATE INDEX "OcurrenciaMisa_sacerdoteId_inicio_fin_idx" ON "OcurrenciaMisa"("sacerdoteId", "inicio", "fin");

-- CreateIndex
CREATE INDEX "OcurrenciaMisa_iglesiaId_fechaLocal_idx" ON "OcurrenciaMisa"("iglesiaId", "fechaLocal");

-- CreateIndex
CREATE UNIQUE INDEX "OcurrenciaMisa_horarioId_fechaLocal_key" ON "OcurrenciaMisa"("horarioId", "fechaLocal");

-- CreateIndex
CREATE UNIQUE INDEX "CelebracionMisa_ocurrenciaId_key" ON "CelebracionMisa"("ocurrenciaId");

-- CreateIndex
CREATE INDEX "CelebracionMisa_iglesiaId_inicio_idx" ON "CelebracionMisa"("iglesiaId", "inicio");

-- CreateIndex
CREATE INDEX "CelebracionMisa_oficianteId_inicio_fin_idx" ON "CelebracionMisa"("oficianteId", "inicio", "fin");

-- CreateIndex
CREATE INDEX "CambioAgenda_iglesiaId_recursoId_fecha_idx" ON "CambioAgenda"("iglesiaId", "recursoId", "fecha");

-- AddForeignKey
ALTER TABLE "AsignacionSacerdote" ADD CONSTRAINT "AsignacionSacerdote_iglesiaId_fkey" FOREIGN KEY ("iglesiaId") REFERENCES "Iglesia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionSacerdote" ADD CONSTRAINT "AsignacionSacerdote_sacerdoteId_fkey" FOREIGN KEY ("sacerdoteId") REFERENCES "Sacerdote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorarioMisa" ADD CONSTRAINT "HorarioMisa_iglesiaId_fkey" FOREIGN KEY ("iglesiaId") REFERENCES "Iglesia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorarioMisa" ADD CONSTRAINT "HorarioMisa_sacerdoteId_fkey" FOREIGN KEY ("sacerdoteId") REFERENCES "Sacerdote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcurrenciaMisa" ADD CONSTRAINT "OcurrenciaMisa_horarioId_fkey" FOREIGN KEY ("horarioId") REFERENCES "HorarioMisa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcurrenciaMisa" ADD CONSTRAINT "OcurrenciaMisa_iglesiaId_fkey" FOREIGN KEY ("iglesiaId") REFERENCES "Iglesia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcurrenciaMisa" ADD CONSTRAINT "OcurrenciaMisa_sacerdoteId_fkey" FOREIGN KEY ("sacerdoteId") REFERENCES "Sacerdote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CelebracionMisa" ADD CONSTRAINT "CelebracionMisa_ocurrenciaId_fkey" FOREIGN KEY ("ocurrenciaId") REFERENCES "OcurrenciaMisa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CelebracionMisa" ADD CONSTRAINT "CelebracionMisa_iglesiaId_fkey" FOREIGN KEY ("iglesiaId") REFERENCES "Iglesia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CelebracionMisa" ADD CONSTRAINT "CelebracionMisa_previstoId_fkey" FOREIGN KEY ("previstoId") REFERENCES "Sacerdote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CelebracionMisa" ADD CONSTRAINT "CelebracionMisa_oficianteId_fkey" FOREIGN KEY ("oficianteId") REFERENCES "Sacerdote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CelebracionMisa" ADD CONSTRAINT "CelebracionMisa_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CambioAgenda" ADD CONSTRAINT "CambioAgenda_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Perfil conservador RF16–21. Nunca se infiere ni rellena una zona ausente.
ALTER TABLE "Sacerdote" ADD CONSTRAINT "Sacerdote_validos" CHECK (length(trim(nombre))>0 AND version>0);
ALTER TABLE "HorarioMisa" ADD CONSTRAINT "HorarioMisa_validos" CHECK (
  "diaSemana" BETWEEN 1 AND 7 AND "horaLocal" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  AND "duracionMinutos" BETWEEN 1 AND 720 AND version>0 AND length(trim(idioma))>0
  AND desde ~ '^\d{4}-\d{2}-\d{2}$' AND hasta ~ '^\d{4}-\d{2}-\d{2}$'
  AND desde::date <= hasta::date AND hasta::date-desde::date<=365);
ALTER TABLE "HorarioMisa" ADD CONSTRAINT "HorarioMisa_asignado" FOREIGN KEY ("iglesiaId","sacerdoteId") REFERENCES "AsignacionSacerdote"("iglesiaId","sacerdoteId") ON DELETE RESTRICT;
ALTER TABLE "OcurrenciaMisa" ADD CONSTRAINT "OcurrenciaMisa_intervalo" CHECK (inicio<fin);
ALTER TABLE "CelebracionMisa" ADD CONSTRAINT "CelebracionMisa_intervalo" CHECK (inicio<fin);
ALTER TABLE "CelebracionMisa" ADD CONSTRAINT "CelebracionMisa_sustitucion" CHECK ("previstoId"="oficianteId" OR (motivo IS NOT NULL AND length(trim(motivo))>0));
-- La zona vigente no puede invalidar silenciosamente reservas materializadas.
CREATE FUNCTION proteger_zona_agenda() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW."zonaIana" IS DISTINCT FROM OLD."zonaIana" AND EXISTS (SELECT 1 FROM "HorarioMisa" WHERE "iglesiaId"=OLD.id) THEN
  RAISE EXCEPTION 'ZONA_CON_AGENDA: reprogramación pendiente PC-11';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER "Iglesia_zona_agenda" BEFORE UPDATE OF "zonaIana" ON "Iglesia" FOR EACH ROW EXECUTE FUNCTION proteger_zona_agenda();
