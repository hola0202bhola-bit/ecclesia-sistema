import { z } from "zod";
export const idInput = z.uuid();
export const importeInput = z
  .string()
  .regex(
    /^(0|[1-9]\d{0,8})\.\d{2}(?![\s\S])/,
    "Use dos decimales, desde 0.00 hasta 999999999.99",
  );
export const altaInput = z.strictObject({ importe: importeInput });
export const correccionInput = altaInput.extend({
  version: z.number().int().min(1).max(2147483646),
});
const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(v + "T12:00:00Z");
    return (
      v >= "1900-01-01" &&
      v <= "9999-12-31" &&
      Number.isFinite(d.getTime()) &&
      d.toISOString().slice(0, 10) === v
    );
  }, "Fecha civil inválida");
export const consultaInput = z
  .strictObject({
    desde: fecha,
    hasta: fecha,
    periodo: z.enum(["DIA", "SEMANA", "MES"]).default("DIA"),
    desglose: z
      .enum(["NINGUNO", "HORARIO", "SACERDOTE", "HORARIO_SACERDOTE"])
      .default("NINGUNO"),
    horarioId: idInput.optional(),
    sacerdoteId: idInput.optional(),
  })
  .refine((q) => {
    const dias =
      (Date.parse(q.hasta + "T12:00:00Z") -
        Date.parse(q.desde + "T12:00:00Z")) /
      86400000;
    return dias >= 0 && dias < 366;
  }, "Seleccione de 1 a 366 días inclusivos");
