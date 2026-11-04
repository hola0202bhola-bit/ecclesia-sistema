import { Router, type Request, type RequestHandler } from "express";
import { z, ZodError } from "zod";
import type { ServicioCriterios } from "../application/criterios.js";
import {
  tiposObjeto,
  ErrorPatrimonio,
  type Principal,
} from "../domain/patrimonio.js";
type Personal = Request & { principal?: Principal; sesion?: { csrf: string } };
const entero = z.number().int().nonnegative();
export const parametrosCriterio = z.strictObject({
  tramos: z
    .array(
      z.strictObject({ desde: entero.max(9999), puntos: entero.max(1000) }),
    )
    .min(1)
    .max(12),
  factoresDecimas: z.record(z.string(), entero.max(1000)),
  bonoInahDecimas: entero.max(10000),
  distinciones: z
    .array(
      z.strictObject({
        desdeDecimas: entero.max(1000000),
        nombre: z.string().trim().min(1).max(100),
      }),
    )
    .min(1)
    .max(8),
});
const motivo = z.string().trim().min(5).max(500);
const crear = z.strictObject({
  nombre: z.string().trim().min(1).max(120),
  parametros: parametrosCriterio,
  motivo,
});
const activar = z.strictObject({
  version: entero.min(1).max(2147483646),
  motivo,
});
const id = z.string().min(1).max(100);
export function criteriosRouter(
  servicio: ServicioCriterios,
  personal: RequestHandler,
) {
  const r = Router();
  r.get(
    "/api/v1/criterios-patrimoniales",
    personal,
    async (req: Personal, res) =>
      res.json(await servicio.listar(req.principal)),
  );
  r.post(
    "/api/v1/criterios-patrimoniales",
    personal,
    async (req: Personal, res) => {
      servicio.autorizar(req.principal);
      const b = crear.parse(req.body);
      res
        .status(201)
        .json(
          await servicio.crear(b.nombre, b.parametros, b.motivo, req.principal),
        );
    },
  );
  r.post(
    "/api/v1/criterios-patrimoniales/:id/activar",
    personal,
    async (req: Personal, res) => {
      servicio.autorizar(req.principal);
      const b = activar.parse(req.body);
      res.json(
        await servicio.activar(
          id.parse(req.params.id),
          b.version,
          b.motivo,
          req.principal,
        ),
      );
    },
  );
  r.get("/personal/criterios", personal, async (req: Personal, res) => {
    const estado = await servicio.listar(req.principal);
    const plantilla =
      estado.versiones.find(
        (v) => v.id === (req.query.copiar ?? estado.activo.criterioId),
      ) ?? estado.versiones.find((v) => v.id === estado.activo.criterioId)!;
    res.render("criterios", {
      estado,
      plantilla,
      tipos: tiposObjeto,
      csrf: req.sesion?.csrf,
      errores: [],
      valores: null,
    });
  });
  r.post("/personal/criterios", personal, async (req: Personal, res) => {
    servicio.autorizar(req.principal);
    try {
      const campos = z
        .strictObject({
          _csrf: z.string().optional(),
          nombre: z.string(),
          motivo: z.string(),
          bono: z.string(),
          ...Object.fromEntries(
            Array.from({ length: 12 }, (_, i) => [
              [`edad_${i}`, z.string().optional()],
              [`puntos_${i}`, z.string().optional()],
            ]).flat(),
          ),
          ...Object.fromEntries(
            tiposObjeto.map((_, i) => [`factor_${i}`, z.string()]),
          ),
          ...Object.fromEntries(
            Array.from({ length: 8 }, (_, i) => [
              [`umbral_${i}`, z.string().optional()],
              [`distincion_${i}`, z.string().optional()],
            ]).flat(),
          ),
        })
        .parse(req.body);
      const numero = (s: unknown) =>
        typeof s === "string" && /^\d+$/.test(s) ? Number(s) : NaN;
      const decimas = (v: unknown) => {
        if (typeof v !== "string" || !/^(0|[1-9]\d{0,5})(\.\d)?$/.test(v))
          return NaN;
        const [entero, decimal = "0"] = v.split(".");
        return Number(entero) * 10 + Number(decimal);
      };
      const b = crear.parse({
        nombre: campos.nombre,
        motivo: campos.motivo,
        parametros: {
          tramos: Array.from({ length: 12 }, (_, i) => ({
            desde: campos[`edad_${i}`],
            puntos: campos[`puntos_${i}`],
          }))
            .filter((t) => t.desde !== "" || t.puntos !== "")
            .map((t) => ({ desde: numero(t.desde), puntos: numero(t.puntos) })),
          factoresDecimas: Object.fromEntries(
            tiposObjeto.map((t, i) => [t.id, decimas(campos[`factor_${i}`])]),
          ),
          bonoInahDecimas: decimas(campos.bono),
          distinciones: Array.from({ length: 8 }, (_, i) => ({
            desdeDecimas: campos[`umbral_${i}`],
            nombre: campos[`distincion_${i}`],
          }))
            .filter((d) => d.desdeDecimas !== "" || d.nombre !== "")
            .map((d) => ({
              desdeDecimas: decimas(d.desdeDecimas),
              nombre: d.nombre,
            })),
        },
      });
      await servicio.crear(b.nombre, b.parametros, b.motivo, req.principal);
      res.redirect(303, "/personal/criterios");
    } catch (e) {
      if (!(e instanceof ZodError || e instanceof ErrorPatrimonio)) throw e;
      const estado = await servicio.listar(req.principal);
      res.status(e instanceof ZodError ? 422 : e.status).render("criterios", {
        estado,
        plantilla: estado.versiones.find(
          (v) => v.id === estado.activo.criterioId,
        ),
        tipos: tiposObjeto,
        csrf: req.sesion?.csrf,
        errores: [
          e instanceof ZodError
            ? "Revise los campos y el formato de cada línea."
            : e.message,
        ],
        valores: req.body,
      });
    }
  });
  r.post(
    "/personal/criterios/:id/activar",
    personal,
    async (req: Personal, res) => {
      servicio.autorizar(req.principal);
      const { _csrf, ...b } = req.body;
      void _csrf;
      const v = activar.parse({
        ...b,
        version:
          typeof b.version === "string" && /^\d+$/.test(b.version)
            ? Number(b.version)
            : b.version,
      });
      await servicio.activar(
        id.parse(req.params.id),
        v.version,
        v.motivo,
        req.principal,
      );
      res.redirect(303, "/personal/criterios");
    },
  );
  return r;
}
