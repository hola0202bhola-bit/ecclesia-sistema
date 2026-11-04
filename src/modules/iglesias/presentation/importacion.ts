import { Router, type Request, type RequestHandler } from "express";
import { z } from "zod";
import type { ServicioImportacion } from "../application/importacion.js";
import type { ServicioCatalogos } from "../application/catalogos.js";
import type { Principal } from "../domain/importacion.js";

type Personal = Request & { principal?: Principal; sesion?: { csrf: string } };
const ambito = z.strictObject({
  estadoClave: z.string().regex(/^(0[1-9]|[12]\d|3[0-2])$/),
  municipioClave: z.string().regex(/^\d{3}$/),
  origen: z.enum(["INEGI", "SNAPSHOT"]),
});
const motivo = z.strictObject({ motivo: z.string().trim().min(5).max(500) });
const id = z.uuid();
export function importacionRouter(
  servicio: ServicioImportacion,
  catalogos: ServicioCatalogos,
  personal: RequestHandler,
) {
  const r = Router();
  const api = "/api/v1/catalogos/importaciones-localidades";
  const web = "/personal/catalogos/localidades";
  r.get(api, personal, async (req: Personal, res) =>
    res.json({ data: await servicio.listar(req.principal), limite: 20 }),
  );
  r.post(api, personal, async (req: Personal, res) => {
    servicio.autorizar(req.principal);
    res
      .status(201)
      .json(await servicio.preparar(ambito.parse(req.body), req.principal));
  });
  r.get(api + "/:id", personal, async (req: Personal, res) =>
    res.json(await servicio.obtener(id.parse(req.params.id), req.principal)),
  );
  r.get(api + "/:id/original", personal, async (req: Personal, res) =>
    res
      .type("application/json")
      .send(await servicio.original(id.parse(req.params.id), req.principal)),
  );
  for (const accion of ["aplicar", "revertir"] as const) {
    r.post(api + "/:id/" + accion, personal, async (req: Personal, res) => {
      servicio.autorizar(req.principal);
      res.json(
        await servicio[accion](
          id.parse(req.params.id),
          motivo.parse(req.body).motivo,
          req.principal,
        ),
      );
    });
    r.post(web + "/:id/" + accion, personal, async (req: Personal, res) => {
      servicio.autorizar(req.principal);
      const { _csrf, ...body } = req.body;
      void _csrf;
      await servicio[accion](
        id.parse(req.params.id),
        motivo.parse(body).motivo,
        req.principal,
      );
      res.redirect(303, web + "/" + req.params.id);
    });
  }
  r.get(web, personal, async (req: Personal, res) => {
    servicio.autorizar(req.principal);
    const estadoClave = z
      .string()
      .regex(/^(0[1-9]|[12]\d|3[0-2])$/)
      .parse(req.query.estadoClave ?? "21");
    res.render("importacion-localidades", {
      catalogos: await catalogos.consultar({ estadoClave }),
      estadoClave,
      lotes: await servicio.listar(req.principal),
      lote: null,
      csrf: req.sesion?.csrf,
    });
  });
  r.post(web, personal, async (req: Personal, res) => {
    servicio.autorizar(req.principal);
    const { _csrf, ...body } = req.body;
    void _csrf;
    const l = await servicio.preparar(ambito.parse(body), req.principal);
    res.redirect(303, web + "/" + l.id);
  });
  r.get(web + "/:id", personal, async (req: Personal, res) =>
    res.render("importacion-localidades", {
      catalogos: null,
      estadoClave: null,
      lotes: [],
      lote: await servicio.obtener(id.parse(req.params.id), req.principal),
      csrf: req.sesion?.csrf,
    }),
  );
  return r;
}
