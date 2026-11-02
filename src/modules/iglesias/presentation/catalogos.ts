import { Router } from "express";
import { z } from "zod";
import type { ServicioCatalogos } from "../application/catalogos.js";
import { ErrorIglesias } from "../domain/iglesia.js";
const pagina = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().min(1).max(1000000))
  .default(1);
const pageSize = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().min(1).max(100))
  .default(20);
export function catalogosRouter(servicio: ServicioCatalogos) {
  const router = Router();
  router.get("/:catalogo", async (req, res) => {
    const tipo = req.params.catalogo;
    if (
      !["estados", "municipios", "localidades", "tipos-iglesia"].includes(tipo)
    )
      throw new ErrorIglesias(404, "NO_IMPLEMENTADO", "Catálogo no disponible");
    const query = z
      .strictObject({
        page: pagina,
        pageSize,
        ...(tipo === "municipios" || tipo === "localidades"
          ? { estadoClave: z.string().regex(/^(0[1-9]|[12]\d|3[0-2])$/) }
          : {}),
        ...(tipo === "localidades"
          ? { municipioClave: z.string().regex(/^\d{3}$/) }
          : {}),
      })
      .parse(req.query);
    const f = query as {
      page: number;
      pageSize: number;
      estadoClave?: string;
      municipioClave?: string;
    };
    const c = await servicio.consultar(f);
    const data =
      tipo === "estados"
        ? c.estados.map((v) => ({ id: v.clave, nombre: v.nombre }))
        : tipo === "municipios"
          ? c.municipios.map((v) => ({
              id: v.codigo,
              nombre: v.nombre,
              estadoClave: v.estadoClave,
            }))
          : tipo === "localidades"
            ? c.localidades.map((v) => ({
                id: v.localidadClave,
                nombre: v.nombre,
                estadoClave: v.estadoClave,
                municipioClave: v.municipioClave,
              }))
            : c.tipos;
    res.json({
      data: data.slice((f.page - 1) * f.pageSize, f.page * f.pageSize),
      meta: { page: f.page, pageSize: f.pageSize, total: data.length },
      fuentes: c.versiones,
      alcance:
        "Estados y municipios del snapshot INEGI; localidades parciales. Tipos según P063.",
    });
  });
  return router;
}
