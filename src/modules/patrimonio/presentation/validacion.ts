import { z } from "zod";
import { condiciones } from "../domain/patrimonio.js";
export const idInput = z.uuid();
const texto = (max: number) => z.string().trim().min(1).max(max);
const fecha = {
  anioExacto: z.number().int().min(1).max(9999).nullable().default(null),
  siglo: z.number().int().min(1).max(100).nullable().default(null),
};
export const objetoInput = z
  .strictObject({
    descripcion: texto(300),
    tipoId: idInput,
    ...fecha,
    material: texto(200),
    conservacion: texto(300),
    ubicacionInterna: texto(300),
    catalogadoInah: z.boolean(),
  })
  .refine(
    (v) => (v.anioExacto === null) !== (v.siglo === null),
    "Indique año exacto o siglo, exclusivamente",
  );
export const versionInput = z.number().int().min(1).max(2147483646);
export const formularioEditarInput = objetoInput.safeExtend({
  version: versionInput,
});
export const editarInput = z
  .strictObject({
    descripcion: texto(300).optional(),
    tipoId: idInput.optional(),
    anioExacto: z.number().int().min(1).max(9999).nullable().optional(),
    siglo: z.number().int().min(1).max(100).nullable().optional(),
    material: texto(200).optional(),
    conservacion: texto(300).optional(),
    ubicacionInterna: texto(300).optional(),
    catalogadoInah: z.boolean().optional(),
    version: versionInput,
  })
  .refine((v) => Object.keys(v).length > 1, "Indique al menos un cambio");
export const condicionInput = z.strictObject({
  version: versionInput,
  condicion: z.enum(condiciones),
});
const numeroQuery = (max: number, valor: number) =>
  z.coerce.number().int().min(1).max(max).default(valor);
export const paginaInput = z.strictObject({
  page: numeroQuery(100000, 1),
  pageSize: numeroQuery(100, 20),
});
export const filtrosInput = paginaInput
  .extend({
    estadoClave: z
      .string()
      .regex(/^\d{2}$/)
      .optional(),
    municipioClave: z
      .string()
      .regex(/^\d{3}$/)
      .optional(),
    localidadClave: z
      .string()
      .regex(/^\d{4}$/)
      .optional(),
    tipoObjetoId: idInput.optional(),
    antiguedadMin: z.coerce.number().int().min(0).max(9999).optional(),
  })
  .refine(
    (v) => !v.municipioClave || !!v.estadoClave,
    "Municipio requiere estado",
  )
  .refine(
    (v) => !v.localidadClave || !!v.municipioClave,
    "Localidad requiere municipio y estado",
  );
// El formulario convierte tipos explícitamente; la API JSON nunca coacciona booleanos.
export function formulario(body: Record<string, unknown>, editar = false) {
  const { _csrf: _c, ...campos } = body;
  void _c;
  return (editar ? formularioEditarInput : objetoInput).parse({
    ...campos,
    anioExacto:
      campos.anioExacto === "" || campos.anioExacto === undefined
        ? null
        : Number(campos.anioExacto),
    siglo:
      campos.siglo === "" || campos.siglo === undefined
        ? null
        : Number(campos.siglo),
    catalogadoInah:
      campos.catalogadoInah === "true"
        ? true
        : campos.catalogadoInah === "false"
          ? false
          : campos.catalogadoInah,
    ...(editar ? { version: Number(campos.version) } : {}),
  });
}
