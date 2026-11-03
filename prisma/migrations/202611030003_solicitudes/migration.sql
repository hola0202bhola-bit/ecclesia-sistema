-- RF25–31, aditiva. No inventario ni asignación física.
CREATE TYPE "TipoEspacio" AS ENUM ('CRIPTA','NICHO','COLUMBARIO','OSARIO');
CREATE TYPE "EstadoSolicitud" AS ENUM ('REGISTRADA','COTIZADA','SIN_LUGAR','ACEPTADA','RECHAZADA','VENCIDA','CANCELADA');
CREATE TYPE "ActorSolicitud" AS ENUM ('PERSONAL','SOLICITANTE','SISTEMA');
CREATE TABLE "OfertaFuneraria" (
 "iglesiaId" UUID NOT NULL REFERENCES "Iglesia"(id) ON DELETE RESTRICT,
 tipo "TipoEspacio" NOT NULL, activo BOOLEAN NOT NULL DEFAULT true,
 version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
 PRIMARY KEY ("iglesiaId",tipo)
);
CREATE TABLE "CambioEspacio" (
 id UUID PRIMARY KEY, "iglesiaId" UUID NOT NULL, tipo "TipoEspacio" NOT NULL,
 "actorId" UUID NOT NULL REFERENCES "Usuario"(id) ON DELETE RESTRICT,
 instante TIMESTAMPTZ(3) NOT NULL, antes JSONB NOT NULL, despues JSONB NOT NULL,
 version INTEGER NOT NULL CHECK (version > 0),
 FOREIGN KEY ("iglesiaId",tipo) REFERENCES "OfertaFuneraria"("iglesiaId",tipo) ON DELETE RESTRICT,
 UNIQUE ("iglesiaId",tipo,version)
);
CREATE INDEX "CambioEspacio_actorId_idx" ON "CambioEspacio"("actorId");
CREATE TABLE "SolicitudEspacio" (
 id UUID PRIMARY KEY, "iglesiaId" UUID NOT NULL REFERENCES "Iglesia"(id) ON DELETE RESTRICT,
 tipo "TipoEspacio" NOT NULL,
 folio VARCHAR(24) NOT NULL UNIQUE CHECK (folio ~ '^[A-F0-9]{24}$'),
 "claveHash" VARCHAR(64) NOT NULL CHECK ("claveHash" ~ '^[a-f0-9]{64}$'),
 "peticionId" UUID NOT NULL UNIQUE,
 nombre VARCHAR(120) NOT NULL CHECK (length(trim(nombre)) BETWEEN 2 AND 120),
 contacto VARCHAR(200) NOT NULL CHECK (length(trim(contacto)) BETWEEN 5 AND 200),
 estado "EstadoSolicitud" NOT NULL DEFAULT 'REGISTRADA',
 version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
 creada TIMESTAMPTZ(3) NOT NULL,
 "precioCentavos" BIGINT CHECK ("precioCentavos" BETWEEN 0 AND 99999999999),
 condiciones VARCHAR(2000),
 emitida TIMESTAMPTZ(3), vence TIMESTAMPTZ(3), "decisionEn" TIMESTAMPTZ(3),
 UNIQUE (id,"iglesiaId"),
 FOREIGN KEY ("iglesiaId",tipo) REFERENCES "OfertaFuneraria"("iglesiaId",tipo) ON DELETE RESTRICT,
 CONSTRAINT "cotizacion_completa" CHECK (
  ("precioCentavos" IS NULL AND condiciones IS NULL AND emitida IS NULL AND vence IS NULL)
  OR ("precioCentavos" IS NOT NULL AND condiciones IS NOT NULL AND length(trim(condiciones)) > 0
      AND emitida IS NOT NULL AND vence IS NOT NULL AND emitida >= creada
      AND vence = emitida + INTERVAL '360 hours')
 ),
 CONSTRAINT "estado_cotizacion" CHECK (
  (estado IN ('REGISTRADA','SIN_LUGAR') AND emitida IS NULL)
  OR (estado IN ('COTIZADA','ACEPTADA','RECHAZADA','VENCIDA') AND emitida IS NOT NULL)
  OR estado = 'CANCELADA'
 ),
 CONSTRAINT "estado_decision" CHECK (
  (estado IN ('ACEPTADA','RECHAZADA','CANCELADA') AND "decisionEn" IS NOT NULL AND "decisionEn" >= creada)
  OR (estado NOT IN ('ACEPTADA','RECHAZADA','CANCELADA') AND "decisionEn" IS NULL)
 ),
 CONSTRAINT "decision_vigente" CHECK (
  estado NOT IN ('ACEPTADA','RECHAZADA') OR ("decisionEn" >= emitida AND "decisionEn" < vence)
 )
);
CREATE INDEX "SolicitudEspacio_iglesiaId_creada_id_idx" ON "SolicitudEspacio"("iglesiaId",creada,id);
CREATE INDEX "SolicitudEspacio_iglesiaId_tipo_idx" ON "SolicitudEspacio"("iglesiaId",tipo);
CREATE INDEX "SolicitudEspacio_estado_vence_idx" ON "SolicitudEspacio"(estado,vence);
CREATE TABLE "CambioSolicitud" (
 id UUID PRIMARY KEY, "solicitudId" UUID NOT NULL, "iglesiaId" UUID NOT NULL,
 actor "ActorSolicitud" NOT NULL, "actorId" UUID REFERENCES "Usuario"(id) ON DELETE RESTRICT,
 instante TIMESTAMPTZ(3) NOT NULL, antes JSONB NOT NULL, despues JSONB NOT NULL,
 version INTEGER NOT NULL CHECK (version > 0),
 FOREIGN KEY ("solicitudId","iglesiaId") REFERENCES "SolicitudEspacio"(id,"iglesiaId") ON DELETE RESTRICT,
 CHECK ((actor = 'PERSONAL' AND "actorId" IS NOT NULL) OR (actor <> 'PERSONAL' AND "actorId" IS NULL)),
 UNIQUE ("solicitudId",version)
);
CREATE INDEX "CambioSolicitud_actorId_idx" ON "CambioSolicitud"("actorId");
CREATE INDEX "CambioSolicitud_iglesiaId_idx" ON "CambioSolicitud"("iglesiaId");
CREATE TABLE "LimiteSolicitud" (
 clave VARCHAR(64) PRIMARY KEY CHECK (clave ~ '^[a-f0-9]{64}$'),
 cantidad INTEGER NOT NULL CHECK (cantidad > 0), vence TIMESTAMPTZ(3) NOT NULL
);
CREATE INDEX "LimiteSolicitud_vence_idx" ON "LimiteSolicitud"(vence);
