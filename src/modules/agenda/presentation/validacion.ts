import { z } from "zod";
export const idInput = z.uuid();
const texto = (max: number) => z.string().trim().min(1).max(max);
export const fechaInput = z.iso.date();
const hora = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const nombreInput = z.strictObject({ nombre: texto(200) });
export const vinculoInput = z.strictObject({ sacerdoteId: idInput });
export const renombrarInput = nombreInput.extend({
  version: z.number().int().positive(),
});
export const horarioInput = z.strictObject({
  sacerdoteId: idInput,
  diaSemana: z.number().int().min(1).max(7),
  horaLocal: hora,
  tipo: z.enum(["DIARIA", "DOMINICAL", "ESPECIAL"]),
  idioma: texto(100),
  duracionMinutos: z.number().int().min(1).max(720).default(60),
  desde: fechaInput,
  hasta: fechaInput,
  activo: z.boolean().default(true),
});
// Edición completa para que la UI y la API validen el mismo agregado.
export const horarioEdicion = horarioInput.extend({
  version: z.number().int().positive(),
});
export const celebracionInput = z.strictObject({
  ocurrenciaId: idInput,
  oficianteId: idInput,
  fechaLocal: fechaInput,
  horaLocal: hora,
  motivo: texto(500).optional(),
});
export const semanaInput = z.strictObject({ desde: fechaInput });
