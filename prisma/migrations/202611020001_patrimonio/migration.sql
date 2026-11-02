CREATE TYPE "CondicionPatrimonio" AS ENUM ('VIGENTE', 'PERDIDO', 'PRESTADO', 'BAJA');
CREATE TABLE "TipoObjeto" (
  id UUID PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);
CREATE TABLE "CriterioPatrimonio" (
  id TEXT PRIMARY KEY,
  parametros JSONB NOT NULL
);
CREATE TABLE "ObjetoPatrimonial" (
  id UUID PRIMARY KEY,
  "iglesiaId" UUID NOT NULL REFERENCES "Iglesia"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  descripcion VARCHAR(300) NOT NULL CHECK (length(trim(descripcion)) > 0),
  "tipoId" UUID NOT NULL REFERENCES "TipoObjeto"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  "anioExacto" INTEGER CHECK ("anioExacto" BETWEEN 1 AND 9999),
  siglo INTEGER CHECK (siglo BETWEEN 1 AND 100),
  material VARCHAR(200) NOT NULL CHECK (length(trim(material)) > 0),
  conservacion VARCHAR(300) NOT NULL CHECK (length(trim(conservacion)) > 0),
  "ubicacionInterna" VARCHAR(300) NOT NULL CHECK (length(trim("ubicacionInterna")) > 0),
  "catalogadoInah" BOOLEAN NOT NULL,
  condicion "CondicionPatrimonio" NOT NULL DEFAULT 'VIGENTE',
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  CHECK (("anioExacto" IS NULL) <> (siglo IS NULL))
);
CREATE INDEX "ObjetoPatrimonial_iglesiaId_condicion_idx" ON "ObjetoPatrimonial"("iglesiaId", condicion);
CREATE TABLE "CambioPatrimonio" (
  id UUID PRIMARY KEY,
  "objetoId" UUID NOT NULL REFERENCES "ObjetoPatrimonial"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  "actorId" UUID NOT NULL REFERENCES "Usuario"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  fecha TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  antes JSONB NOT NULL,
  despues JSONB NOT NULL
);
CREATE INDEX "CambioPatrimonio_objetoId_fecha_idx" ON "CambioPatrimonio"("objetoId", fecha);
INSERT INTO "TipoObjeto" (id, nombre) VALUES
 ('30000000-0000-4000-8000-000000000001','Imagen de santo'),
 ('30000000-0000-4000-8000-000000000002','Imagen de virgen'),
 ('30000000-0000-4000-8000-000000000003','Imagen de cristo'),
 ('30000000-0000-4000-8000-000000000004','Retablo'),
 ('30000000-0000-4000-8000-000000000005','Pintura'),
 ('30000000-0000-4000-8000-000000000006','Mural'),
 ('30000000-0000-4000-8000-000000000007','Órgano'),
 ('30000000-0000-4000-8000-000000000008','Piano'),
 ('30000000-0000-4000-8000-000000000009','Orfebrería'),
 ('30000000-0000-4000-8000-000000000010','Mobiliario litúrgico'),
 ('30000000-0000-4000-8000-000000000011','Documento'),
 ('30000000-0000-4000-8000-000000000012','Otra pieza');
INSERT INTO "CriterioPatrimonio" (id,parametros) VALUES ('caso-v1',
'{"id":"caso-v1","tramos":[{"desde":0,"puntos":1},{"desde":50,"puntos":2},{"desde":100,"puntos":4},{"desde":200,"puntos":7},{"desde":300,"puntos":10}],"factoresDecimas":{"30000000-0000-4000-8000-000000000001":15,"30000000-0000-4000-8000-000000000002":15,"30000000-0000-4000-8000-000000000003":15,"30000000-0000-4000-8000-000000000004":13,"30000000-0000-4000-8000-000000000005":13,"30000000-0000-4000-8000-000000000006":13,"30000000-0000-4000-8000-000000000007":12,"30000000-0000-4000-8000-000000000008":12,"30000000-0000-4000-8000-000000000009":10,"30000000-0000-4000-8000-000000000010":10,"30000000-0000-4000-8000-000000000011":10,"30000000-0000-4000-8000-000000000012":8},"bonoInahDecimas":50,"distinciones":[{"desdeDecimas":80,"nombre":"Valor patrimonial"},{"desdeDecimas":200,"nombre":"Alto valor patrimonial"},{"desdeDecimas":400,"nombre":"Patrimonio sobresaliente"}]}');
