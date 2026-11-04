import { Router } from "express";
import type { Request, RequestHandler } from "express";
import type { ServicioIglesias } from "../application/servicio.js";
import type { Principal, Iglesia } from "../domain/iglesia.js";
import type { ServicioCatalogos } from "../application/catalogos.js";
import {
  cierreInput,
  crearInput,
  editarInput,
  filtrosInput,
  idInput,
} from "./validacion.js";
export type RequestPersonal = Request & { principal?: Principal };
export function iglesiasRouter(
  servicio: ServicioIglesias,
  personal: RequestHandler,
) {
  const router = Router();
  router.get("/", async (req, res) => {
    res.json(await servicio.listar(filtrosInput.parse(req.query)));
  });
  router.get("/:id", async (req, res) => {
    res.json(await servicio.ficha(idInput.parse(req.params.id)));
  });
  router.post("/", personal, async (req: RequestPersonal, res) => {
    const iglesia = await servicio.crear(
      crearInput.parse(req.body),
      req.principal,
    );
    res.status(201).location(`/api/v1/iglesias/${iglesia.id}`).json(iglesia);
  });
  router.patch("/:id", personal, async (req: RequestPersonal, res) => {
    const { version, ...datos } = editarInput.parse(req.body);
    res.json(
      await servicio.editar(
        idInput.parse(req.params.id),
        version,
        datos,
        req.principal,
      ),
    );
  });
  for (const comando of ["cerrar", "reabrir"])
    router.post(
      `/:id/${comando}`,
      personal,
      async (req: RequestPersonal, res) => {
        const { version, motivo } = cierreInput.parse(req.body);
        res.json(
          await servicio.cambiarCierre(
            idInput.parse(req.params.id),
            version,
            comando === "cerrar",
            motivo,
            req.principal,
          ),
        );
      },
    );
  return router;
}
export function webRouter(
  servicio: ServicioIglesias,
  catalogos: ServicioCatalogos,
  completar: (
    iglesia: Iglesia,
  ) => Promise<Record<string, unknown>> = async () => ({}),
) {
  const router = Router();
  router.get("/", async (req, res) => {
    const query = Object.fromEntries(
      Object.entries(req.query).filter(([, v]) => v !== ""),
    );
    const filtros = filtrosInput.parse({ estadoClave: "21", ...query });
    const resultado = filtros ? await servicio.listar(filtros) : null;
    res.render("iglesias", {
      resultado,
      filtros: filtros ?? {},
      catalogos: await catalogos.consultar(filtros ?? {}),
      queryPagina: (page: number) =>
        "?" +
        new URLSearchParams({
          ...Object.fromEntries(
            Object.entries(query).map(([k, v]) => [k, String(v)]),
          ),
          page: String(page),
        }).toString(),
    });
  });
  router.get("/:id", async (req, res) => {
    const ficha = await servicio.ficha(idInput.parse(req.params.id));
    res.render("ficha", { ...ficha, ...(await completar(ficha.iglesia)) });
  });
  return router;
}
