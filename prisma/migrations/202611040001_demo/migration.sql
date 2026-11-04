-- Aditiva: ninguna modificación de los ocho esquemas ni datos anteriores.
CREATE TABLE "CargaDemo" (
  id TEXT PRIMARY KEY,
  referencia TIMESTAMPTZ(3) NOT NULL,
  fuentes VARCHAR(64) NOT NULL CHECK (fuentes ~ '^[a-f0-9]{64}$')
);
