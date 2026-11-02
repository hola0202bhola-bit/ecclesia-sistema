-- Incremento aditivo RF13–15; no altera datos de migraciones anteriores.
CREATE TYPE "ModalidadAportacion" AS ENUM ('FIJO', 'GRATUITO', 'DONATIVO');
CREATE TABLE "TipoServicio" ("id" UUID PRIMARY KEY, "nombre" TEXT NOT NULL UNIQUE);
CREATE TABLE "TipoPlatica" ("id" UUID PRIMARY KEY, "nombre" TEXT NOT NULL UNIQUE);
INSERT INTO "TipoServicio" VALUES
('40000000-0000-4000-8000-000000000001','Bautizo'),
('40000000-0000-4000-8000-000000000002','Primera comunión'),
('40000000-0000-4000-8000-000000000003','Confirmación'),
('40000000-0000-4000-8000-000000000004','Matrimonio'),
('40000000-0000-4000-8000-000000000005','Misa de XV años'),
('40000000-0000-4000-8000-000000000006','Bendición'),
('40000000-0000-4000-8000-000000000007','Otro servicio');
INSERT INTO "TipoPlatica" VALUES
('50000000-0000-4000-8000-000000000001','Pláticas prebautismales'),
('50000000-0000-4000-8000-000000000002','Catecismo para la primera comunión'),
('50000000-0000-4000-8000-000000000003','Pláticas de confirmación'),
('50000000-0000-4000-8000-000000000004','Pláticas prematrimoniales');
CREATE TABLE "ServicioOfrecido" (
"id" UUID PRIMARY KEY, "iglesiaId" UUID NOT NULL REFERENCES "Iglesia"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
"tipoId" UUID NOT NULL REFERENCES "TipoServicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
"nombre" VARCHAR(200) NOT NULL CHECK (length(trim("nombre")) > 0),
"modalidad" "ModalidadAportacion" NOT NULL, "importe" DECIMAL(11,2),
"moneda" VARCHAR(3) NOT NULL CHECK ("moneda" ~ '^[A-Z]{3}$'),
"requisitos" VARCHAR(2000) NOT NULL CHECK (length(trim("requisitos")) > 0),
"duracionMinutos" INTEGER NOT NULL CHECK ("duracionMinutos" > 0), "requiereCita" BOOLEAN NOT NULL,
"version" INTEGER NOT NULL DEFAULT 1 CHECK ("version" > 0),
CONSTRAINT "servicio_aportacion" CHECK (("modalidad" = 'FIJO' AND "importe" IS NOT NULL AND "importe" > 0) OR ("modalidad" <> 'FIJO' AND "importe" IS NULL))
);
CREATE INDEX "ServicioOfrecido_iglesiaId_id_idx" ON "ServicioOfrecido"("iglesiaId", "id");
CREATE TABLE "HorarioServicio" (
"servicioId" UUID NOT NULL REFERENCES "ServicioOfrecido"("id") ON DELETE CASCADE ON UPDATE CASCADE,
"diaSemana" INTEGER NOT NULL CHECK ("diaSemana" BETWEEN 1 AND 7),
"horaLocal" VARCHAR(5) NOT NULL CHECK ("horaLocal" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
PRIMARY KEY ("servicioId", "diaSemana", "horaLocal")
);
CREATE TABLE "Platica" (
"id" UUID PRIMARY KEY, "iglesiaId" UUID NOT NULL REFERENCES "Iglesia"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
"tipoId" UUID NOT NULL REFERENCES "TipoPlatica"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
"sesiones" INTEGER NOT NULL CHECK ("sesiones" > 0), "importe" DECIMAL(11,2) NOT NULL CHECK ("importe" >= 0),
"moneda" VARCHAR(3) NOT NULL CHECK ("moneda" ~ '^[A-Z]{3}$'),
"cupo" INTEGER NOT NULL CHECK ("cupo" >= 0),
"lugar" VARCHAR(300) NOT NULL CHECK (length(trim("lugar")) > 0),
"impartidor" VARCHAR(200) NOT NULL CHECK (length(trim("impartidor")) > 0),
"version" INTEGER NOT NULL DEFAULT 1 CHECK ("version" > 0)
);
CREATE INDEX "Platica_iglesiaId_id_idx" ON "Platica"("iglesiaId", "id");
CREATE TABLE "HorarioPlatica" (
"platicaId" UUID NOT NULL REFERENCES "Platica"("id") ON DELETE CASCADE ON UPDATE CASCADE,
"diaSemana" INTEGER NOT NULL CHECK ("diaSemana" BETWEEN 1 AND 7),
"horaLocal" VARCHAR(5) NOT NULL CHECK ("horaLocal" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
PRIMARY KEY ("platicaId", "diaSemana", "horaLocal")
);
CREATE TABLE "CambioOferta" (
"id" UUID PRIMARY KEY,
"servicioId" UUID REFERENCES "ServicioOfrecido"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
"platicaId" UUID REFERENCES "Platica"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
"actorId" UUID NOT NULL REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
"fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"antes" JSONB NOT NULL, "despues" JSONB NOT NULL,
CHECK (("servicioId" IS NULL) <> ("platicaId" IS NULL))
);
CREATE INDEX "CambioOferta_servicioId_fecha_idx" ON "CambioOferta"("servicioId", "fecha");
CREATE INDEX "CambioOferta_platicaId_fecha_idx" ON "CambioOferta"("platicaId", "fecha");
