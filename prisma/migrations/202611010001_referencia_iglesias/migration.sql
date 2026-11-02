-- Perfil mínimo de referencia; PC-02 pendiente. No es el esquema final de Ecclesia.
CREATE TABLE "Localidad" (
 "clave" VARCHAR(9) PRIMARY KEY,
 "estadoClave" VARCHAR(2) NOT NULL,
 "municipioClave" VARCHAR(3) NOT NULL,
 "localidadClave" VARCHAR(4) NOT NULL,
 "nombre" TEXT NOT NULL, "fuente" TEXT NOT NULL, "consulta" TEXT NOT NULL,
 UNIQUE ("estadoClave", "municipioClave", "localidadClave"),
 CHECK ("clave" = "estadoClave" || "municipioClave" || "localidadClave"),
 CHECK ("estadoClave" ~ '^[0-9]{2}$' AND "municipioClave" ~ '^[0-9]{3}$' AND "localidadClave" ~ '^[0-9]{4}$')
);
CREATE TABLE "TipoIglesia" ("id" UUID PRIMARY KEY, "nombre" TEXT NOT NULL UNIQUE);
CREATE TABLE "Iglesia" (
 "id" UUID PRIMARY KEY, "nombre" VARCHAR(200) NOT NULL CHECK (length(trim("nombre")) > 0),
 "nombreBusqueda" VARCHAR(200) NOT NULL,
 "tipoId" UUID NOT NULL REFERENCES "TipoIglesia"("id") ON DELETE RESTRICT,
 "estadoClave" VARCHAR(2) NOT NULL, "municipioClave" VARCHAR(3) NOT NULL, "localidadClave" VARCHAR(4) NOT NULL,
 "direccion" VARCHAR(500) NOT NULL CHECK (length(trim("direccion")) > 0),
 "capacidad" INTEGER CHECK ("capacidad" >= 0),
 "anioConstruccion" INTEGER CHECK ("anioConstruccion" BETWEEN 1 AND 9999),
 "contacto" VARCHAR(300), "latitud" DOUBLE PRECISION, "longitud" DOUBLE PRECISION,
 "zonaIana" VARCHAR(100), "cerradaDesde" TIMESTAMP(3),
 "version" INTEGER NOT NULL DEFAULT 1 CHECK ("version" > 0),
 FOREIGN KEY ("estadoClave", "municipioClave", "localidadClave") REFERENCES "Localidad"("estadoClave", "municipioClave", "localidadClave") ON DELETE RESTRICT,
 CHECK (("latitud" IS NULL AND "longitud" IS NULL) OR ("latitud" IS NOT NULL AND "longitud" IS NOT NULL AND "latitud" BETWEEN -90 AND 90 AND "longitud" BETWEEN -180 AND 180))
);
CREATE INDEX "Iglesia_estadoClave_municipioClave_localidadClave_idx" ON "Iglesia"("estadoClave", "municipioClave", "localidadClave");
