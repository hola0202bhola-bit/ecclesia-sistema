import { z } from "zod";
export const idInput = z.uuid();
const texto = (max: number) => z.string().trim().min(1).max(max);
const entero = (min: number) => z.number().int().min(min).max(2147483646);
export const versionInput = entero(1);
const importe = z
  .string()
  .regex(
    /^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/,
    "Importe no negativo, hasta 9 enteros y 2 decimales",
  );
const horarios = z
  .array(
    z.strictObject({
      diaSemana: z.number().int().min(1).max(7),
      horaLocal: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
    }),
  )
  .min(1)
  .max(100)
  .refine(
    (v) =>
      new Set(v.map((h) => `${h.diaSemana}/${h.horaLocal}`)).size === v.length,
    "No repita día y hora",
  );
const comun = {
  tipoId: idInput,
  importe,
  moneda: z.string().regex(/^[A-Z]{3}$/),
  horarios,
};
const servicio = z.strictObject({
  ...comun,
  nombre: texto(200),
  modalidad: z.enum(["FIJO", "GRATUITO", "DONATIVO"]),
  importe: importe.nullable(),
  requisitos: texto(2000),
  duracionMinutos: entero(1),
  requiereCita: z.boolean(),
});
const platica = z.strictObject({
  ...comun,
  sesiones: entero(1),
  cupo: entero(0),
  lugar: texto(300),
  impartidor: texto(200),
});
export const servicioInput = servicio;
export const platicaInput = platica;
export const servicioPatch = servicio
  .partial()
  .extend({ version: versionInput })
  .refine((v) => Object.keys(v).length > 1, "Indique algún cambio");
export const platicaPatch = platica
  .partial()
  .extend({ version: versionInput })
  .refine((v) => Object.keys(v).length > 1, "Indique algún cambio");
export const paginaInput = z.strictObject({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
// Conversión exclusiva para formularios. JSON mantiene tipos estrictos.
export function formulario(
  body: Record<string, unknown>,
  clase: "servicios" | "platicas",
  editar: boolean,
) {
  const { _csrf: _c, ...campos } = body;
  void _c;
  const hs = [];
  for (let diaSemana = 1; diaSemana <= 7; diaSemana++) {
    const clave = `horario${diaSemana}`;
    const horas = z
      .string()
      .max(700)
      .parse(campos[clave] ?? "");
    delete campos[clave];
    if (horas.trim())
      for (const hora of horas.split(","))
        hs.push({ diaSemana, horaLocal: hora.trim() });
  }
  const valores: Record<string, unknown> = { ...campos, horarios: hs };
  if (editar) valores.version = Number(campos.version);
  if (clase === "servicios") {
    valores.duracionMinutos =
      campos.duracionMinutos === ""
        ? undefined
        : Number(campos.duracionMinutos);
    valores.importe = campos.importe === "" ? null : campos.importe;
    valores.requiereCita =
      campos.requiereCita === "true"
        ? true
        : campos.requiereCita === "false"
          ? false
          : campos.requiereCita;
    return (
      editar ? servicio.extend({ version: versionInput }) : servicio
    ).parse(valores);
  }
  valores.sesiones =
    campos.sesiones === "" ? undefined : Number(campos.sesiones);
  valores.cupo = campos.cupo === "" ? undefined : Number(campos.cupo);
  return (editar ? platica.extend({ version: versionInput }) : platica).parse(
    valores,
  );
}
