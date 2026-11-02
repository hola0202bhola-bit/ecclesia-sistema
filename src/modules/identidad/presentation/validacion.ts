import { z } from "zod";
export const identificadorInput = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9._-]{2,79}$/);
export const passwordInput = z
  .string()
  .min(15)
  .refine((v) => Array.from(v).length >= 15, "Mínimo 15 caracteres Unicode")
  .max(72)
  .refine(
    (v) => new TextEncoder().encode(v).length <= 72,
    "Máximo 72 bytes UTF-8",
  );
export const loginInput = z
  .object({
    identificador: identificadorInput,
    password: z
      .string()
      .min(1)
      .max(72)
      .refine((v) => new TextEncoder().encode(v).length <= 72),
  })
  .strict();
export const altaInput = z
  .object({
    identificador: identificadorInput,
    password: passwordInput,
    rol: z.enum(["COORDINACION", "ADMIN_IGLESIA", "TESORERO"]),
    iglesiaId: z.uuid().optional(),
  })
  .strict();
export const paginaInput = z
  .object({
    page: z.coerce.number().int().min(1).max(100000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
