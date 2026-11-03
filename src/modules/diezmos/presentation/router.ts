import { Router, type Request, type RequestHandler } from "express";
import { ZodError } from "zod";
import type { ServicioDiezmos } from "../application/servicio.js";
import { ErrorDiezmo, type Principal } from "../domain/diezmo.js";
import {
  idInput,
  altaInput,
  correccionInput,
  consultaInput,
} from "./validacion.js";
type Personal = Request & { principal?: Principal; sesion?: { csrf: string } };
export function diezmosRouter(s: ServicioDiezmos, personal: RequestHandler) {
  const r = Router(),
    base = "/iglesias/:iglesiaId";
  r.use(
    base + "/celebraciones/:celebracionId/diezmo",
    personal,
    (req: Personal, _res, next) => {
      s.autorizar(idInput.parse(req.params.iglesiaId), req.principal, true);
      next();
    },
  );
  const recurso = base + "/celebraciones/:celebracionId/diezmo";
  r.post(recurso, async (req: Personal, res) =>
    res
      .status(201)
      .json(
        await s.guardar(
          idInput.parse(req.params.iglesiaId),
          idInput.parse(req.params.celebracionId),
          altaInput.parse(req.body).importe,
          req.principal,
        ),
      ),
  );
  r.put(recurso, async (req: Personal, res) => {
    const d = correccionInput.parse(req.body);
    res.json(
      await s.guardar(
        idInput.parse(req.params.iglesiaId),
        idInput.parse(req.params.celebracionId),
        d.importe,
        req.principal,
        d.version,
      ),
    );
  });
  r.get(recurso, async (req: Personal, res) =>
    res.json(
      await s.consultar(
        idInput.parse(req.params.iglesiaId),
        idInput.parse(req.params.celebracionId),
        req.principal,
      ),
    ),
  );
  r.get(recurso + "/correcciones", async (req: Personal, res) =>
    res.json({
      data: await s.historial(
        idInput.parse(req.params.iglesiaId),
        idInput.parse(req.params.celebracionId),
        req.principal,
      ),
    }),
  );
  r.get(base + "/reportes/diezmos", personal, async (req: Personal, res) => {
    const id = idInput.parse(req.params.iglesiaId);
    s.autorizar(id, req.principal);
    res.json(
      await s.reporte(id, consultaInput.parse(req.query), req.principal),
    );
  });
  return r;
}
export function diezmosWeb(s: ServicioDiezmos, personal: RequestHandler) {
  const r = Router(),
    base = "/personal/diezmos/:iglesiaId";
  r.use(base, personal, (req: Personal, _res, next) => {
    s.autorizar(idInput.parse(req.params.iglesiaId), req.principal);
    next();
  });
  const consulta = (req: Request) => {
    const hoy = new Date().toISOString().slice(0, 10);
    return consultaInput.parse({
      desde: hoy.slice(0, 7) + "-01",
      hasta: hoy,
      ...req.query,
    });
  };
  const contexto = (req: Personal) => ({
    iglesiaId: idInput.parse(req.params.iglesiaId),
    csrf: req.sesion?.csrf,
    tesorero: req.principal?.rol === "TESORERO",
  });
  const lista = async (req: Personal) => {
    const q = consulta(req);
    return {
      ...contexto(req),
      reporte: await s.reporte(
        idInput.parse(req.params.iglesiaId),
        q,
        req.principal,
      ),
      query: new URLSearchParams(Object.entries(q)).toString(),
    };
  };
  r.get(base, async (req: Personal, res) =>
    res.render("diezmos", { ...(await lista(req)), errores: [], valores: {} }),
  );
  const detalle = async (req: Personal) => ({
    ...contexto(req),
    ...(await s.ficha(
      idInput.parse(req.params.iglesiaId),
      idInput.parse(req.params.celebracionId),
      req.principal,
    )),
  });
  r.get(base + "/:celebracionId", async (req: Personal, res) =>
    res.render("diezmo-formulario", {
      ...(await detalle(req)),
      valores: null,
      errores: [],
    }),
  );
  r.post(base + "/:celebracionId", async (req: Personal, res) => {
    const id = idInput.parse(req.params.iglesiaId),
      cid = idInput.parse(req.params.celebracionId);
    s.autorizar(id, req.principal, true);
    const { _csrf, ...campos } = req.body ?? {};
    void _csrf;
    const edicion = campos.version !== undefined;
    try {
      const d = edicion
        ? correccionInput.parse({ ...campos, version: Number(campos.version) })
        : altaInput.parse(campos);
      await s.guardar(
        id,
        cid,
        d.importe,
        req.principal,
        "version" in d && typeof d.version === "number" ? d.version : undefined,
      );
      res.redirect(303, `/personal/diezmos/${id}/${cid}`);
    } catch (e) {
      if (!(e instanceof ErrorDiezmo || e instanceof ZodError)) throw e;
      const errores =
        e instanceof ZodError
          ? e.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
          : [e.message];
      const status = e instanceof ZodError ? 422 : e.status;
      if (edicion && status !== 404)
        res.status(status).render("diezmo-formulario", {
          ...(await detalle(req)),
          valores: campos,
          errores,
        });
      else
        res.status(status).render("diezmos", {
          ...(await lista(req)),
          valores: { ...campos, celebracionId: cid },
          errores,
        });
    }
  });
  return r;
}
