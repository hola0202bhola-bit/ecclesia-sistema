import {
  Router,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import type { ServicioSolicitudes } from "../application/servicio.js";
import {
  ErrorSolicitud,
  accesoInvalido,
  type Principal,
  type AccesoSolicitud,
  type Decision,
} from "../domain/solicitud.js";
import {
  idInput,
  tipoInput,
  espacioInput,
  altaInput,
  accesoInput,
  decisionInput,
  revisionInput,
  paginaInput,
} from "./validacion.js";
type Personal = Request & { principal?: Principal; sesion?: { csrf: string } };
type Limite = (req: Request, seguimiento: boolean) => Promise<void>;
const id = (req: Request) => idInput.parse(req.params.iglesiaId);
const sid = (req: Request) => idInput.parse(req.params.solicitudId);
const campos = (req: Request) => {
  const { _csrf, ...d } = req.body ?? {};
  void _csrf;
  return d;
};
function acceso(d: unknown): AccesoSolicitud {
  const r = accesoInput.safeParse(d);
  if (!r.success) throw accesoInvalido();
  return r.data;
}
function errorWeb(e: unknown, res: Response) {
  if (!(e instanceof ErrorSolicitud || e instanceof ZodError)) throw e;
  const status = e instanceof ZodError ? 422 : e.status;
  return res.status(status).render("error", {
    status,
    message:
      e instanceof ZodError
        ? "Revise los campos e intente de nuevo desde el formulario."
        : e.message,
  });
}
export function solicitudesRouter(
  s: ServicioSolicitudes,
  personal: RequestHandler,
  anonimo: RequestHandler,
  limitar: Limite,
) {
  const r = Router(),
    base = "/iglesias/:iglesiaId",
    sol = base + "/solicitudes";
  const autorizar: RequestHandler = (req: Personal, _res, next) => {
    s.autorizar(id(req), req.principal);
    next();
  };
  r.get("/solicitudes/acceso", anonimo, (_req, res) =>
    res.json({ csrf: res.locals.csrf, peticionId: randomUUID() }),
  );
  r.get(base + "/ofertas-espacio", async (req, res) =>
    res.json({
      data: (await s.espacios(id(req))).map((f) => ({ tipo: f.tipo })),
    }),
  );
  r.get(
    base + "/ofertas-espacio/gestion",
    personal,
    autorizar,
    async (req: Personal, res) =>
      res.json({ data: await s.espacios(id(req), req.principal, true) }),
  );
  r.put(
    base + "/ofertas-espacio/:tipo",
    personal,
    autorizar,
    async (req: Personal, res) => {
      const d = espacioInput.parse(req.body);
      res.json(
        await s.espacio(
          id(req),
          tipoInput.parse(req.params.tipo),
          d.activo,
          d.version,
          req.principal,
        ),
      );
    },
  );
  r.post(sol, anonimo, async (req, res) => {
    await limitar(req, false);
    res.status(201).json(await s.crear(id(req), altaInput.parse(req.body)));
  });
  r.get(sol, personal, autorizar, async (req: Personal, res) =>
    res.json(
      await s.lista(
        id(req),
        paginaInput.parse(req.query.pagina),
        req.principal,
      ),
    ),
  );
  r.get(
    sol + "/:solicitudId",
    personal,
    autorizar,
    async (req: Personal, res) =>
      res.json(await s.ficha(id(req), sid(req), req.principal)),
  );
  r.post(
    sol + "/:solicitudId/revision",
    personal,
    autorizar,
    async (req: Personal, res) =>
      res.json(
        await s.ficha(
          id(req),
          sid(req),
          req.principal,
          revisionInput.parse(req.body),
        ),
      ),
  );
  r.get("/solicitudes/:folio", async (req, res) => {
    await limitar(req, true);
    res.json(
      await s.seguimiento(
        acceso({
          folio: req.params.folio,
          clave: req.get("X-Solicitud-Clave"),
        }),
      ),
    );
  });
  for (const [ruta, accion] of [
    ["aceptar", "ACEPTAR"],
    ["rechazar", "RECHAZAR"],
    ["cancelar", "CANCELAR"],
  ] as const)
    r.post("/solicitudes/:folio/" + ruta, anonimo, async (req, res) => {
      await limitar(req, true);
      const a = acceso({
        folio: req.params.folio,
        clave: req.get("X-Solicitud-Clave"),
      });
      const d = decisionInput.parse({ ...req.body, ...a, accion });
      res.json(await s.seguimiento(a, { accion, version: d.version }));
    });
  return r;
}
export function solicitudesWeb(
  s: ServicioSolicitudes,
  personal: RequestHandler,
  anonimo: RequestHandler,
  limitar: Limite,
) {
  const r = Router(),
    base = "/personal/solicitudes/:iglesiaId";
  const publico = "/iglesias/:iglesiaId/espacios";
  r.get(publico, anonimo, async (req, res) =>
    res.render("espacios", {
      iglesiaId: id(req),
      espacios: await s.espacios(id(req)),
      peticionId: randomUUID(),
      valores: {},
      errores: [],
    }),
  );
  r.post(publico, anonimo, async (req, res) => {
    await limitar(req, false);
    const d = campos(req);
    try {
      const recibo = await s.crear(id(req), altaInput.parse(d));
      res.status(201).render("solicitud-recibo", { recibo });
    } catch (e) {
      if (!(e instanceof ZodError || e instanceof ErrorSolicitud)) throw e;
      const errores =
        e instanceof ZodError
          ? e.issues.map((i) => i.path.join(".") + ": " + i.message)
          : [e.message];
      res.status(e instanceof ZodError ? 422 : e.status).render("espacios", {
        iglesiaId: id(req),
        espacios: await s.espacios(id(req)),
        peticionId: d.peticionId ?? randomUUID(),
        valores: d,
        errores,
      });
    }
  });
  r.get("/solicitudes", anonimo, (_req, res) =>
    res.render("solicitud-acceso", { error: null }),
  );
  for (const decidir of [false, true])
    r.post(
      "/solicitudes/" + (decidir ? "decision" : "seguimiento"),
      anonimo,
      async (req, res) => {
        await limitar(req, true);
        const d = campos(req);
        try {
          const a = acceso({ folio: d.folio, clave: d.clave });
          const decision: Decision | undefined = decidir
            ? decisionInput.parse({ ...d, version: Number(d.version) })
            : undefined;
          const solicitud = await s.seguimiento(a, decision);
          res.render("solicitud-seguimiento", { solicitud, acceso: a });
        } catch (e) {
          if (e instanceof ErrorSolicitud && e.status === 404)
            res.status(404).render("solicitud-acceso", { error: e.message });
          else errorWeb(e, res);
        }
      },
    );
  r.use(base, personal, (req: Personal, _res, next) => {
    s.autorizar(id(req), req.principal);
    next();
  });
  const contexto = (req: Personal) => ({
    iglesiaId: id(req),
    csrf: req.sesion?.csrf,
  });
  r.get(base, async (req: Personal, res) =>
    res.render("solicitudes-gestion", {
      ...contexto(req),
      espacios: await s.espacios(id(req), req.principal, true),
      lista: await s.lista(
        id(req),
        paginaInput.parse(req.query.pagina),
        req.principal,
      ),
      errores: [],
    }),
  );
  r.post(base + "/espacios/:tipo", async (req: Personal, res) => {
    try {
      const d = espacioInput.parse({
        ...campos(req),
        activo:
          campos(req).activo === "true"
            ? true
            : campos(req).activo === "false"
              ? false
              : campos(req).activo,
        version: Number(campos(req).version),
      });
      await s.espacio(
        id(req),
        tipoInput.parse(req.params.tipo),
        d.activo,
        d.version,
        req.principal,
      );
      res.redirect(303, "/personal/solicitudes/" + id(req));
    } catch (e) {
      errorWeb(e, res);
    }
  });
  r.get(base + "/:solicitudId", async (req: Personal, res) =>
    res.render("solicitud-revision", {
      ...contexto(req),
      solicitud: await s.ficha(id(req), sid(req), req.principal),
      errores: [],
      valores: {},
    }),
  );
  r.post(base + "/:solicitudId", async (req: Personal, res) => {
    const d = campos(req);
    try {
      const rev = revisionInput.parse({ ...d, version: Number(d.version) });
      await s.ficha(id(req), sid(req), req.principal, rev);
      res.redirect(303, "/personal/solicitudes/" + id(req) + "/" + sid(req));
    } catch (e) {
      if (!(e instanceof ZodError || e instanceof ErrorSolicitud)) throw e;
      res
        .status(e instanceof ZodError ? 422 : e.status)
        .render("solicitud-revision", {
          ...contexto(req),
          solicitud: await s.ficha(id(req), sid(req), req.principal),
          errores: [
            e instanceof ZodError
              ? "Revise precio, condiciones y versión"
              : e.message,
          ],
          valores: d,
        });
    }
  });
  return r;
}
