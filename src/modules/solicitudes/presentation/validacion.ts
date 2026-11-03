import { z } from "zod";
import { tipos } from "../domain/solicitud.js";
export const idInput = z.uuid();
export const tipoInput = z.enum(tipos);
export const espacioInput = z.strictObject({
  activo: z.boolean(),
  version: z.number().int().min(0).max(2147483646),
});
export const altaInput = z.strictObject({
  tipo: tipoInput,
  nombre: z.string().trim().min(2).max(120),
  contacto: z.string().trim().min(5).max(200),
  peticionId: z.uuid(),
});
export const accesoInput = z.strictObject({
  folio: z.string().regex(/^[A-F0-9]{24}$/),
  clave: z.string().regex(/^[\w-]{43}$/),
});
export const decisionInput = z.strictObject({
  ...accesoInput.shape,
  accion: z.enum(["ACEPTAR", "RECHAZAR", "CANCELAR"]),
  version: z.number().int().min(1).max(2147483646),
});
export const revisionInput = z.discriminatedUnion("resultado", [
  z.strictObject({
    resultado: z.literal("SIN_LUGAR"),
    version: z.number().int().min(1).max(2147483646),
  }),
  z.strictObject({
    resultado: z.literal("COTIZAR"),
    version: z.number().int().min(1).max(2147483646),
    precio: z.string().regex(/^(0|[1-9]\d{0,8})\.\d{2}(?![\s\S])/),
    condiciones: z.string().trim().min(1).max(2000),
  }),
]);
export const paginaInput = z.coerce
  .number()
  .int()
  .min(1)
  .max(1000000)
  .default(1);
