import { z } from "zod";
const texto = (max: number) => z.string().trim().min(1).max(max);
const campos = {
  nombre: texto(200),
  tipoId: z.uuid(),
  estadoClave: z.string().regex(/^\d{2}$/),
  municipioClave: z.string().regex(/^\d{3}$/),
  localidadClave: z.string().regex(/^\d{4}$/),
  direccion: texto(500),
  descripcion: texto(500).nullable().optional(),
  fotoUrl: z
    .string()
    .trim()
    .min(1)
    .max(700)
    .refine((valor) => {
      try {
        const u = new URL(valor);
        // Solo nombres DNS públicos: sin IP literal ni destinos locales/reservados.
        // No hay petición ni resolución DNS desde el servidor.
        const host = u.hostname.toLowerCase().replace(/\.$/, "");
        return (
          u.protocol === "https:" &&
          !u.username &&
          !u.password &&
          !valor.includes("#") &&
          !/\s/.test(valor) &&
          /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(
            host,
          ) &&
          !/(^|\.)(localhost|local|internal|invalid|test|example|onion)$/.test(
            host,
          )
        );
      } catch {
        return false;
      }
    }, "Use URL HTTPS pública sin credenciales ni fragmento")
    .nullable()
    .optional(),
  capacidad: z.number().int().min(0).max(2147483647).optional(),
  anioConstruccion: z.number().int().min(1).max(9999).optional(),
  contacto: texto(300).optional(),
  latitud: z.number().min(-90).max(90).optional(),
  longitud: z.number().min(-180).max(180).optional(),
  zonaIana: texto(100)
    .refine((value) => {
      try {
        new Intl.DateTimeFormat("es", { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }, "Zona IANA no reconocida")
    .optional(),
};
const pareja = (value: { latitud?: number; longitud?: number }) =>
  (value.latitud === undefined) === (value.longitud === undefined);
export const crearInput = z
  .strictObject(campos)
  .refine(pareja, "Proporcionar ambas coordenadas");
export const editarInput = z
  .strictObject(campos)
  .partial()
  .extend({ version: z.number().int().min(1).max(2147483646) })
  .refine(
    (value) => Object.keys(value).length > 1,
    "Incluir al menos un campo modificable",
  )
  .refine((value) => pareja(value), "Editar ambas coordenadas juntas");
const enteroQuery = (max: number) =>
  z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(0).max(max));
export const filtrosInput = z
  .strictObject({
    estadoClave: campos.estadoClave,
    municipioClave: campos.municipioClave.optional(),
    localidadClave: campos.localidadClave.optional(),
    tipoId: campos.tipoId.optional(),
    nombre: texto(200).optional(),
    capacidadMin: enteroQuery(2147483647).optional(),
    capacidadMax: enteroQuery(2147483647).optional(),
    page: enteroQuery(1000000).pipe(z.number().min(1)).default(1),
    pageSize: enteroQuery(100).pipe(z.number().min(1)).default(20),
  })
  .refine(
    (v) =>
      v.capacidadMin === undefined ||
      v.capacidadMax === undefined ||
      v.capacidadMin <= v.capacidadMax,
    "Intervalo invertido",
  )
  .refine(
    (v) => !v.localidadClave || !!v.municipioClave,
    "Localidad requiere municipio",
  );
export const idInput = z.uuid();

const numeroFormulario = (schema: z.ZodType) =>
  z.preprocess(
    (v) =>
      v === ""
        ? undefined
        : typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v)
          ? Number(v)
          : v,
    schema,
  );
export const formularioInput = z
  .strictObject({
    _csrf: z.string().optional(),
    ubicacion: z
      .string()
      .regex(/^\d{9}$/, "Seleccione una localidad del catálogo cargado"),
    nombre: campos.nombre,
    tipoId: campos.tipoId,
    direccion: campos.direccion,
    descripcion: z
      .preprocess(
        (v) => (typeof v === "string" && v.trim() === "" ? null : v),
        campos.descripcion,
      )
      .optional(),
    fotoUrl: z
      .preprocess(
        (v) => (typeof v === "string" && v.trim() === "" ? null : v),
        campos.fotoUrl,
      )
      .optional(),
    capacidad: numeroFormulario(campos.capacidad).optional(),
    anioConstruccion: numeroFormulario(campos.anioConstruccion).optional(),
    latitud: numeroFormulario(campos.latitud).optional(),
    longitud: numeroFormulario(campos.longitud).optional(),
    contacto: z
      .preprocess((v) => (v === "" ? undefined : v), campos.contacto)
      .optional(),
    zonaIana: z
      .preprocess((v) => (v === "" ? undefined : v), campos.zonaIana)
      .optional(),
    version: numeroFormulario(
      z.number().int().min(1).max(2147483646),
    ).optional(),
  })
  .transform(({ _csrf, ubicacion, ...datos }) => {
    void _csrf;
    return {
      ...datos,
      estadoClave: ubicacion.slice(0, 2),
      municipioClave: ubicacion.slice(2, 5),
      localidadClave: ubicacion.slice(5),
    };
  });

export const cierreInput = z.strictObject({
  version: z.number().int().min(1).max(2147483646),
  motivo: texto(500).min(5),
});
