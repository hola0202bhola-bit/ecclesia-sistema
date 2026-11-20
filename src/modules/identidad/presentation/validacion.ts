import { z } from "zod";
import { avataresCuenta } from "../domain/identidad.js";
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
export const registroInput = z
  .object({ identificador: identificadorInput, password: passwordInput })
  .strict();
const textoPerfil = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null)
    .nullable();
export const perfilInput = z
  .object({
    nombreVisible: textoPerfil(100),
    presentacion: textoPerfil(500),
    avatar: z.enum(avataresCuenta),
    version: z.number().int().min(0).max(2147483646),
  })
  .strict();
