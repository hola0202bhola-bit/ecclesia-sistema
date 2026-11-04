import { Router, type Request, type RequestHandler } from "express";
import { ZodError } from "zod";
import type { Principal } from "../domain/iglesia.js";
import { ErrorIglesias } from "../domain/iglesia.js";
import type { ServicioIglesias } from "../application/servicio.js";
import type { ServicioCatalogos } from "../application/catalogos.js";
import {
  cierreInput,
  crearInput,
  editarInput,
  filtrosInput,
  formularioInput,
  idInput,
} from "./validacion.js";
type Personal = Request & { principal?: Principal; sesion?: { csrf: string } };
export function gestionRouter(
  servicio: ServicioIglesias,
  catalogos: ServicioCatalogos,
  personal: RequestHandler,
) {
  const router = Router();
  router.use(personal);
  router.get("/", async (req: Personal, res) => {
    const filtros = filtrosInput.parse({ estadoClave: "21", ...req.query });
    res.render("gestion-iglesias", {
      resultado: await servicio.gestion(filtros, req.principal),
      usuario: req.principal,
      filtros,
      catalogos: await catalogos.consultar(filtros),
      queryPagina: (page: number) =>
        "?" +
        new URLSearchParams({
          ...Object.fromEntries(
            Object.entries(req.query).map(([k, v]) => [k, String(v)]),
          ),
          estadoClave: filtros.estadoClave,
          page: String(page),
        }).toString(),
    });
  });
  async function opciones() {
    // Solo localidades auténticas cargadas. No se ofrece registrar iglesias donde no hay localidad verificable.
    const base = await catalogos.consultar({});
    const ubicaciones = base.localidades.map((localidad) => ({
      clave: localidad.clave,
      nombre: `${base.estados.find((e) => e.clave === localidad.estadoClave)?.nombre ?? localidad.estadoClave} / ${base.municipios.find((m) => m.clave === localidad.estadoClave + localidad.municipioClave)?.nombre ?? localidad.municipioClave} / ${localidad.nombre} (${localidad.clave})`,
    }));
    return { ...base, ubicaciones };
  }
  const campos = async (
    req: Personal,
    res: import("express").Response,
    id?: string,
  ) => {
    const iglesia = await servicio.formulario(id, req.principal);
    res.render("iglesia-formulario", {
      id,
      csrf: req.sesion?.csrf,
      errores: [],
      guardado: req.query.guardado === "1",
      catalogos: await opciones(),
      valores: iglesia
        ? {
            ...iglesia,
            ubicacion:
              iglesia.estadoClave +
              iglesia.municipioClave +
              iglesia.localidadClave,
          }
        : {},
    });
  };
  router.get("/nueva", (req: Personal, res) => campos(req, res));
  router.get("/:id/editar", (req: Personal, res) =>
    campos(req, res, idInput.parse(req.params.id)),
  );
  async function guardar(
    req: Personal,
    res: import("express").Response,
    id?: string,
  ) {
    await servicio.formulario(id, req.principal);
    try {
      const datos = formularioInput.parse(req.body);
      let iglesia;
      if (id) {
        const { version, ...cambios } = editarInput.parse(datos);
        iglesia = await servicio.editar(id, version, cambios, req.principal);
      } else {
        iglesia = await servicio.crear(crearInput.parse(datos), req.principal);
      }
      res.redirect(303, `/personal/iglesias/${iglesia.id}/editar?guardado=1`);
    } catch (error) {
      if (!(error instanceof ZodError || error instanceof ErrorIglesias))
        throw error;
      const status = error instanceof ZodError ? 422 : error.status;
      const errores =
        error instanceof ZodError
          ? error.issues.map(
              (i) =>
                `${i.path.join(".") || "Formulario"}: ${i.code === "custom" ? i.message : i.code === "unrecognized_keys" ? "Campos no permitidos" : i.code === "too_small" ? "Campo vacío o menor al mínimo" : i.code === "too_big" ? "Valor mayor al máximo" : "Formato o tipo de dato incorrecto"}`,
            )
          : [error.message];
      res.status(status).render("iglesia-formulario", {
        id,
        csrf: req.sesion?.csrf,
        errores,
        guardado: false,
        catalogos: await opciones(),
        valores: req.body ?? {},
      });
    }
  }
  router.post("/nueva", (req: Personal, res) => guardar(req, res));
  router.post("/:id/editar", (req: Personal, res) =>
    guardar(req, res, idInput.parse(req.params.id)),
  );
  router.get("/:id/historial", async (req: Personal, res) => {
    res.render("iglesia-historial", {
      ...(await servicio.privada(idInput.parse(req.params.id), req.principal)),
      csrf: req.sesion?.csrf,
      errores: [],
      valores: null,
    });
  });
  for (const comando of ["cerrar", "reabrir"])
    router.post(`/:id/${comando}`, async (req: Personal, res) => {
      const id = idInput.parse(req.params.id);
      await servicio.privada(id, req.principal);
      try {
        const { _csrf, ...body } = req.body;
        void _csrf;
        const { version, motivo } = cierreInput.parse({
          ...body,
          version:
            typeof body.version === "string" && /^\d+$/.test(body.version)
              ? Number(body.version)
              : body.version,
        });
        await servicio.cambiarCierre(
          id,
          version,
          comando === "cerrar",
          motivo,
          req.principal,
        );
        res.redirect(303, `/personal/iglesias/${id}/historial`);
      } catch (error) {
        if (!(error instanceof ZodError || error instanceof ErrorIglesias))
          throw error;
        res
          .status(error instanceof ZodError ? 422 : error.status)
          .render("iglesia-historial", {
            ...(await servicio.privada(id, req.principal)),
            csrf: req.sesion?.csrf,
            errores: [
              error instanceof ZodError
                ? "Indique una versión válida y un motivo de 5 a 500 caracteres."
                : error.message,
            ],
            valores: req.body,
          });
      }
    });
  return router;
}
