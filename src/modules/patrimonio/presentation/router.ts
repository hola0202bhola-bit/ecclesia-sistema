import { Router, type Request, type RequestHandler } from "express";
import { ZodError } from "zod";
import type { ServicioPatrimonio } from "../application/servicio.js";
import {
  ErrorPatrimonio,
  tiposObjeto,
  type Principal,
} from "../domain/patrimonio.js";
import {
  idInput,
  objetoInput,
  editarInput,
  condicionInput,
  paginaInput,
  filtrosInput,
  formulario,
} from "./validacion.js";
type Personal = Request & { principal?: Principal; sesion?: { csrf: string } };
const pagina = (req: Request) => paginaInput.parse(req.query);
export function patrimonioRouter(
  servicio: ServicioPatrimonio,
  personal: RequestHandler,
) {
  const router = Router();
  router.get("/ranking-patrimonial", async (req, res) =>
    res.json(await servicio.ranking(filtrosInput.parse(req.query))),
  );
  router.get("/iglesias/por-patrimonio", async (req, res) =>
    res.json(await servicio.ranking(filtrosInput.parse(req.query))),
  );
  router.get("/iglesias/:iglesiaId/objetos", async (req, res) =>
    res.json(
      await servicio.consultar(
        idInput.parse(req.params.iglesiaId),
        pagina(req),
      ),
    ),
  );
  router.post(
    "/iglesias/:iglesiaId/objetos",
    personal,
    async (req: Personal, res) => {
      const id = idInput.parse(req.params.iglesiaId);
      servicio.autorizar(id, req.principal);
      res
        .status(201)
        .json(
          await servicio.guardar(
            id,
            objetoInput.parse(req.body),
            req.principal,
          ),
        );
    },
  );
  router.patch(
    "/iglesias/:iglesiaId/objetos/:objetoId",
    personal,
    async (req: Personal, res) => {
      const id = idInput.parse(req.params.iglesiaId);
      servicio.autorizar(id, req.principal);
      const { version, ...datos } = editarInput.parse(req.body);
      res.json(
        await servicio.editar(
          id,
          idInput.parse(req.params.objetoId),
          version,
          datos,
          req.principal,
        ),
      );
    },
  );
  router.put(
    "/iglesias/:iglesiaId/objetos/:objetoId/condicion",
    personal,
    async (req: Personal, res) => {
      const id = idInput.parse(req.params.iglesiaId);
      servicio.autorizar(id, req.principal);
      const { condicion, version } = condicionInput.parse(req.body);
      res.json(
        await servicio.condicion(
          id,
          idInput.parse(req.params.objetoId),
          version,
          condicion,
          req.principal,
        ),
      );
    },
  );
  return router;
}
export function patrimonioWeb(
  servicio: ServicioPatrimonio,
  personal: RequestHandler,
) {
  const router = Router();
  router.get("/ranking-patrimonial", async (req, res) => {
    // Campos vacíos del buscador significan filtro ausente.
    const query = Object.fromEntries(
      Object.entries(req.query).filter(([, v]) => v !== ""),
    );
    const filtros = filtrosInput.parse(query);
    res.render("ranking-patrimonial", {
      resultado: await servicio.ranking(filtros),
      filtros,
      tipos: tiposObjeto,
    });
  });
  router.get("/iglesias/:iglesiaId/patrimonio", async (req, res) => {
    res.render("patrimonio", {
      resultado: await servicio.consultar(
        idInput.parse(req.params.iglesiaId),
        pagina(req),
      ),
      privado: false,
      csrf: undefined,
      tipos: tiposObjeto,
    });
  });
  router.use("/personal/patrimonio/:iglesiaId", personal);
  router.get("/personal/patrimonio/:iglesiaId", async (req: Personal, res) => {
    res.render("patrimonio", {
      resultado: await servicio.consultar(
        idInput.parse(req.params.iglesiaId),
        pagina(req),
        req.principal,
        true,
      ),
      privado: true,
      csrf: req.sesion?.csrf,
      tipos: tiposObjeto,
    });
  });
  const contexto = async (req: Personal) => {
    const iglesiaId = idInput.parse(req.params.iglesiaId);
    const resultado = await servicio.consultar(
      iglesiaId,
      { page: 1, pageSize: 100 },
      req.principal,
      true,
    );
    return { iglesiaId, iglesia: resultado.iglesia };
  };
  // Obtener un objeto por ID no depende de la página visible.
  const obtener = async (req: Personal, objetoId: string) => {
    let page = 1;
    for (;;) {
      const r = await servicio.consultar(
        idInput.parse(req.params.iglesiaId),
        { page, pageSize: 100 },
        req.principal,
        true,
      );
      const objeto = r.data.find((o) => o.id === objetoId);
      if (objeto) return objeto;
      if (page * 100 >= r.meta.total)
        throw new ErrorPatrimonio(
          404,
          "OBJETO_NO_ENCONTRADO",
          "Objeto no disponible",
        );
      page++;
    }
  };
  router.get(
    "/personal/patrimonio/:iglesiaId/nuevo",
    async (req: Personal, res) =>
      res.render("objeto-formulario", {
        ...(await contexto(req)),
        objetoId: undefined,
        valores: {},
        errores: [],
        csrf: req.sesion?.csrf,
        tipos: tiposObjeto,
      }),
  );
  router.get(
    "/personal/patrimonio/:iglesiaId/:objetoId/editar",
    async (req: Personal, res) => {
      const ctx = await contexto(req);
      const objetoId = idInput.parse(req.params.objetoId);
      res.render("objeto-formulario", {
        ...ctx,
        objetoId,
        valores: await obtener(req, objetoId),
        errores: [],
        csrf: req.sesion?.csrf,
        tipos: tiposObjeto,
      });
    },
  );
  async function guardar(
    req: Personal,
    res: import("express").Response,
    objetoId?: string,
  ) {
    const ctx = await contexto(req);
    try {
      const datos = formulario(req.body ?? {}, !!objetoId);
      await servicio.guardar(
        ctx.iglesiaId,
        datos,
        req.principal,
        objetoId
          ? { id: objetoId, version: editarInput.parse(datos).version }
          : undefined,
      );
      res.redirect(303, `/personal/patrimonio/${ctx.iglesiaId}`);
    } catch (e) {
      if (!(e instanceof ZodError || e instanceof ErrorPatrimonio)) throw e;
      res
        .status(e instanceof ZodError ? 422 : e.status)
        .render("objeto-formulario", {
          ...ctx,
          objetoId,
          valores: req.body ?? {},
          errores:
            e instanceof ZodError
              ? ["Revise el formulario: datos, tipos y año o siglo exclusivo."]
              : [e.message],
          csrf: req.sesion?.csrf,
          tipos: tiposObjeto,
        });
    }
  }
  router.post("/personal/patrimonio/:iglesiaId/nuevo", (req: Personal, res) =>
    guardar(req, res),
  );
  router.post(
    "/personal/patrimonio/:iglesiaId/:objetoId/editar",
    (req: Personal, res) =>
      guardar(req, res, idInput.parse(req.params.objetoId)),
  );
  router.post(
    "/personal/patrimonio/:iglesiaId/:objetoId/condicion",
    async (req: Personal, res) => {
      const iglesiaId = idInput.parse(req.params.iglesiaId);
      servicio.autorizar(iglesiaId, req.principal);
      const { _csrf: _c, ...body } = req.body ?? {};
      void _c;
      const { condicion, version } = condicionInput.parse({
        ...body,
        version: Number(body.version),
      });
      await servicio.condicion(
        iglesiaId,
        idInput.parse(req.params.objetoId),
        version,
        condicion,
        req.principal,
      );
      res.redirect(303, `/personal/patrimonio/${iglesiaId}`);
    },
  );
  return router;
}
