import { Router, type Request, type RequestHandler } from "express";
import { ZodError } from "zod";
import type { ServicioAgenda } from "../application/servicio.js";
import { ErrorAgenda, type Principal } from "../domain/agenda.js";
import {
  idInput,
  nombreInput,
  vinculoInput,
  renombrarInput,
  horarioInput,
  horarioEdicion,
  celebracionInput,
  semanaInput,
} from "./validacion.js";
type Personal = Request & { principal?: Principal; sesion?: { csrf: string } };
export function agendaRouter(s: ServicioAgenda, personal: RequestHandler) {
  const r = Router(),
    base = "/iglesias/:iglesiaId";
  r.get(base + "/misas", async (req, res) =>
    res.json({
      data: await s.semana(
        idInput.parse(req.params.iglesiaId),
        semanaInput.parse(req.query),
      ),
    }),
  );
  r.use(base + "/agenda", personal, (req: Personal, _res, next) => {
    s.autorizar(idInput.parse(req.params.iglesiaId), req.principal);
    next();
  });
  r.get(base + "/agenda/sacerdotes", async (req: Personal, res) =>
    res.json({
      data: await s.sacerdotes(
        idInput.parse(req.params.iglesiaId),
        req.principal,
      ),
    }),
  );
  r.post(base + "/agenda/sacerdotes", async (req: Personal, res) =>
    res
      .status(201)
      .json(
        await s.registrar(
          idInput.parse(req.params.iglesiaId),
          nombreInput.parse(req.body).nombre,
          req.principal,
        ),
      ),
  );
  r.post(base + "/agenda/asignaciones", async (req: Personal, res) =>
    res
      .status(201)
      .json(
        await s.vincular(
          idInput.parse(req.params.iglesiaId),
          vinculoInput.parse(req.body).sacerdoteId,
          req.principal,
        ),
      ),
  );
  r.patch(base + "/agenda/sacerdotes/:id", async (req: Personal, res) => {
    const d = renombrarInput.parse(req.body);
    res.json(
      await s.renombrar(
        idInput.parse(req.params.iglesiaId),
        { id: idInput.parse(req.params.id), version: d.version },
        d.nombre,
        req.principal,
      ),
    );
  });
  r.get(base + "/agenda/horarios", async (req: Personal, res) =>
    res.json({
      data: await s.horarios(
        idInput.parse(req.params.iglesiaId),
        req.principal,
      ),
    }),
  );
  r.post(base + "/agenda/horarios", async (req: Personal, res) =>
    res
      .status(201)
      .json(
        await s.guardar(
          idInput.parse(req.params.iglesiaId),
          horarioInput.parse(req.body),
          req.principal,
        ),
      ),
  );
  r.put(base + "/agenda/horarios/:id", async (req: Personal, res) => {
    const { version, ...d } = horarioEdicion.parse(req.body);
    res.json(
      await s.guardar(idInput.parse(req.params.iglesiaId), d, req.principal, {
        id: idInput.parse(req.params.id),
        version,
      }),
    );
  });
  r.get(base + "/agenda/sacerdotes/:id/semana", async (req: Personal, res) =>
    res.json({
      data: await s.agenda(
        idInput.parse(req.params.iglesiaId),
        idInput.parse(req.params.id),
        semanaInput.parse(req.query),
        req.principal,
      ),
    }),
  );
  r.get(base + "/agenda/celebraciones", async (req: Personal, res) =>
    res.json({
      data: await s.celebraciones(
        idInput.parse(req.params.iglesiaId),
        req.principal,
      ),
    }),
  );
  r.post(base + "/agenda/celebraciones", async (req: Personal, res) =>
    res
      .status(201)
      .json(
        await s.celebrar(
          idInput.parse(req.params.iglesiaId),
          celebracionInput.parse(req.body),
          req.principal,
        ),
      ),
  );
  return r;
}
export function agendaWeb(s: ServicioAgenda, personal: RequestHandler) {
  const r = Router(),
    base = "/personal/agenda/:iglesiaId";
  const semana = (req: Request) =>
    semanaInput.parse({
      desde: req.query.desde ?? new Date().toISOString().slice(0, 10),
    });
  r.get("/iglesias/:iglesiaId/misas", async (req, res) =>
    res.render("misas", {
      data: await s.semana(idInput.parse(req.params.iglesiaId), semana(req)),
      desde: semana(req).desde,
      iglesiaId: req.params.iglesiaId,
    }),
  );
  r.use(base, personal, (req: Personal, _res, next) => {
    s.autorizar(idInput.parse(req.params.iglesiaId), req.principal);
    next();
  });
  const contexto = async (req: Personal) => {
    const iglesiaId = idInput.parse(req.params.iglesiaId),
      w = semana(req);
    return {
      iglesiaId,
      desde: w.desde,
      csrf: req.sesion?.csrf,
      sacerdotes: await s.sacerdotes(iglesiaId, req.principal),
      horarios: await s.horarios(iglesiaId, req.principal),
      ocurrencias: await s.semana(iglesiaId, w),
      celebraciones: await s.celebraciones(iglesiaId, req.principal),
    };
  };
  r.get(base, async (req: Personal, res) =>
    res.render("agenda", {
      ...(await contexto(req)),
      errores: [],
      valores: {},
    }),
  );
  r.get(base + "/sacerdotes/:id", async (req: Personal, res) =>
    res.render("misas", {
      data: await s.agenda(
        idInput.parse(req.params.iglesiaId),
        idInput.parse(req.params.id),
        semana(req),
        req.principal,
      ),
      desde: semana(req).desde,
      iglesiaId: req.params.iglesiaId,
    }),
  );
  r.post(base + "/:accion", async (req: Personal, res) => {
    const id = idInput.parse(req.params.iglesiaId),
      b = req.body ?? {},
      accion = req.params.accion;
    try {
      // Solo conversiones de formulario; no coerción de JSON ni campos de ámbito del cliente.
      const { _csrf, ...campos } = b;
      void _csrf;
      if (accion === "sacerdotes")
        await s.registrar(id, nombreInput.parse(campos).nombre, req.principal);
      else if (accion === "asignaciones")
        await s.vincular(
          id,
          vinculoInput.parse(campos).sacerdoteId,
          req.principal,
        );
      else if (accion === "nombre") {
        const { sacerdoteId, ...resto } = campos;
        const d = renombrarInput.parse({
          ...resto,
          version: Number(resto.version),
        });
        await s.renombrar(
          id,
          { id: idInput.parse(sacerdoteId), version: d.version },
          d.nombre,
          req.principal,
        );
      } else if (accion === "horarios") {
        const { horarioId, version, ...resto } = campos;
        const datos = horarioInput.parse({
          ...resto,
          diaSemana: Number(resto.diaSemana),
          duracionMinutos:
            resto.duracionMinutos === ""
              ? undefined
              : Number(resto.duracionMinutos),
          activo: resto.activo === "true",
        });
        await s.guardar(
          id,
          datos,
          req.principal,
          horarioId
            ? {
                id: idInput.parse(horarioId),
                version: renombrarInput.shape.version.parse(Number(version)),
              }
            : undefined,
        );
      } else if (accion === "celebraciones")
        await s.celebrar(
          id,
          celebracionInput.parse({
            ...campos,
            motivo: campos.motivo || undefined,
          }),
          req.principal,
        );
      else throw new ErrorAgenda(404, "NO_ENCONTRADO", "Acción no disponible");
      res.redirect(303, `/personal/agenda/${id}`);
    } catch (e) {
      if (!(e instanceof ErrorAgenda || e instanceof ZodError)) throw e;
      res.status(e instanceof ZodError ? 422 : e.status).render("agenda", {
        ...(await contexto(req)),
        valores: b,
        errores:
          e instanceof ZodError
            ? e.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
            : [e.message],
      });
    }
  });
  return r;
}
