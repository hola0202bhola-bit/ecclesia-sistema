import { Router, type Request, type RequestHandler } from "express";
import { ZodError } from "zod";
import type { ServicioOferta } from "../application/servicio.js";
import {
  ErrorOferta,
  tiposServicio,
  tiposPlatica,
  dias,
  type Principal,
  type DatosServicio,
  type DatosPlatica,
} from "../domain/oferta.js";
import {
  idInput,
  paginaInput,
  servicioInput,
  platicaInput,
  servicioPatch,
  platicaPatch,
  formulario,
  versionInput,
} from "./validacion.js";
type Personal = Request & { principal?: Principal; sesion?: { csrf: string } };
export function ofertaRouter(
  servicio: ServicioOferta,
  personal: RequestHandler,
) {
  const r = Router();
  r.get("/catalogos/tipos-servicio", (_req, res) =>
    res.json({ data: tiposServicio }),
  );
  r.get("/catalogos/tipos-platica", (_req, res) =>
    res.json({ data: tiposPlatica }),
  );
  for (const clase of ["servicios", "platicas"] as const) {
    const base = `/iglesias/:iglesiaId/${clase}`;
    r.get(base, async (req, res) => {
      const id = idInput.parse(req.params.iglesiaId),
        pagina = paginaInput.parse(req.query);
      res.json(
        await (clase === "servicios"
          ? servicio.servicios(id, pagina)
          : servicio.platicas(id, pagina)),
      );
    });
    r.post(base, personal, async (req: Personal, res) => {
      const id = idInput.parse(req.params.iglesiaId);
      servicio.autorizar(id, req.principal);
      res
        .status(201)
        .json(
          await (clase === "servicios"
            ? servicio.guardarServicio(
                id,
                servicioInput.parse(req.body),
                req.principal,
              )
            : servicio.guardarPlatica(
                id,
                platicaInput.parse(req.body),
                req.principal,
              )),
        );
    });
    r.patch(base + "/:recursoId", personal, async (req: Personal, res) => {
      const id = idInput.parse(req.params.iglesiaId);
      servicio.autorizar(id, req.principal);
      const recursoId = idInput.parse(req.params.recursoId);
      if (clase === "servicios") {
        const { version, ...datos } = servicioPatch.parse(req.body);
        res.json(
          await servicio.guardarServicio(id, datos, req.principal, {
            id: recursoId,
            version,
          }),
        );
      } else {
        const { version, ...datos } = platicaPatch.parse(req.body);
        res.json(
          await servicio.guardarPlatica(id, datos, req.principal, {
            id: recursoId,
            version,
          }),
        );
      }
    });
  }
  return r;
}
export function ofertaWeb(servicio: ServicioOferta, personal: RequestHandler) {
  const r = Router();
  for (const clase of ["servicios", "platicas"] as const) {
    const consultar = (id: string, req: Request) =>
      clase === "servicios"
        ? servicio.servicios(id, paginaInput.parse(req.query))
        : servicio.platicas(id, paginaInput.parse(req.query));
    const comun = {
      clase,
      tipos: clase === "servicios" ? tiposServicio : tiposPlatica,
      dias,
    };
    r.get(`/iglesias/:iglesiaId/${clase}`, async (req, res) =>
      res.render("oferta", {
        ...comun,
        resultado: await consultar(idInput.parse(req.params.iglesiaId), req),
        privado: false,
      }),
    );
    const base = `/personal/oferta/:iglesiaId/${clase}`;
    r.use(base, personal, (req: Personal, _res, next) => {
      servicio.autorizar(idInput.parse(req.params.iglesiaId), req.principal);
      next();
    });
    r.get(base, async (req, res) =>
      res.render("oferta", {
        ...comun,
        resultado: await consultar(idInput.parse(req.params.iglesiaId), req),
        privado: true,
      }),
    );
    const contexto = async (req: Personal) => {
      const iglesiaId = idInput.parse(req.params.iglesiaId);
      const resultado = await (clase === "servicios"
        ? servicio.servicios(iglesiaId, { page: 1, pageSize: 1 })
        : servicio.platicas(iglesiaId, { page: 1, pageSize: 1 }));
      return { ...comun, iglesia: resultado.iglesia, csrf: req.sesion?.csrf };
    };
    r.get(base + "/nuevo", async (req: Personal, res) =>
      res.render("oferta-formulario", {
        ...(await contexto(req)),
        recursoId: undefined,
        valores: {},
        errores: [],
      }),
    );
    r.get(base + "/:recursoId/editar", async (req: Personal, res) => {
      const ctx = await contexto(req),
        recursoId = idInput.parse(req.params.recursoId);
      const valores = await (clase === "servicios"
        ? servicio.servicio(ctx.iglesia.id, recursoId, req.principal)
        : servicio.platica(ctx.iglesia.id, recursoId, req.principal));
      res.render("oferta-formulario", {
        ...ctx,
        recursoId,
        valores,
        errores: [],
      });
    });
    const guardar = async (
      req: Personal,
      res: import("express").Response,
      recursoId?: string,
    ) => {
      const ctx = await contexto(req);
      try {
        const datos = formulario(req.body ?? {}, clase, !!recursoId);
        const edicion = recursoId
          ? {
              id: recursoId,
              version: versionInput.parse(Number(req.body.version)),
            }
          : undefined;
        if (clase === "servicios")
          await servicio.guardarServicio(
            ctx.iglesia.id,
            datos as DatosServicio,
            req.principal,
            edicion,
          );
        else
          await servicio.guardarPlatica(
            ctx.iglesia.id,
            datos as DatosPlatica,
            req.principal,
            edicion,
          );
        res.redirect(303, `/personal/oferta/${ctx.iglesia.id}/${clase}`);
      } catch (e) {
        if (!(e instanceof ZodError || e instanceof ErrorOferta)) throw e;
        res
          .status(e instanceof ZodError ? 422 : e.status)
          .render("oferta-formulario", {
            ...ctx,
            recursoId,
            valores: req.body ?? {},
            errores:
              e instanceof ZodError
                ? e.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
                : [e.message],
          });
      }
    };
    r.post(base + "/nuevo", (req: Personal, res) => guardar(req, res));
    r.post(base + "/:recursoId/editar", (req: Personal, res) =>
      guardar(req, res, idInput.parse(req.params.recursoId)),
    );
  }
  return r;
}
