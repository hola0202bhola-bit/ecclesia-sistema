import { ServicioCriterios } from "../modules/patrimonio/application/criterios.js";
import { PrismaRepositorioCriterios } from "../modules/patrimonio/infrastructure/criterios.js";
import { criteriosRouter } from "../modules/patrimonio/presentation/criterios.js";
import { ServicioSolicitudes } from "../modules/solicitudes/application/servicio.js";
import { PrismaRepositorioSolicitudes } from "../modules/solicitudes/infrastructure/prisma-repositorio.js";
import {
  ClavesSolicitud,
  proteccionAnonima,
  claveLimite,
} from "../modules/solicitudes/infrastructure/seguridad.js";
import {
  solicitudesRouter,
  solicitudesWeb,
} from "../modules/solicitudes/presentation/router.js";
import { ErrorSolicitud } from "../modules/solicitudes/domain/solicitud.js";
import express from "express";
import type { ErrorRequestHandler } from "express";
import { resolve } from "node:path";
import { ZodError } from "zod";
import { ServicioIdentidad } from "../modules/identidad/application/servicio.js";
import { ErrorIdentidad } from "../modules/identidad/domain/identidad.js";
import { PrismaRepositorioIdentidad } from "../modules/identidad/infrastructure/prisma-repositorio.js";
import { CredencialesBcrypt } from "../modules/identidad/infrastructure/credenciales.js";
import {
  personalSesion,
  type AccesoConfig,
} from "../modules/identidad/infrastructure/personal.js";
import { identidadRouter } from "../modules/identidad/presentation/router.js";
import type { PrismaClient } from "@prisma/client";
import { ServicioIglesias } from "../modules/iglesias/application/servicio.js";
import { ErrorIglesias } from "../modules/iglesias/domain/iglesia.js";
import { PrismaRepositorioIglesias } from "../modules/iglesias/infrastructure/prisma-repositorio.js";
import {
  iglesiasRouter,
  webRouter,
} from "../modules/iglesias/presentation/router.js";
import { personalJwt } from "../shared/infrastructure/personal-jwt.js";
import { ServicioCatalogos } from "../modules/iglesias/application/catalogos.js";
import { PrismaRepositorioCatalogos } from "../modules/iglesias/infrastructure/catalogos.js";
import { gestionRouter } from "../modules/iglesias/presentation/gestion.js";
import { catalogosRouter } from "../modules/iglesias/presentation/catalogos.js";
import { ServicioPatrimonio } from "../modules/patrimonio/application/servicio.js";
import { PrismaRepositorioPatrimonio } from "../modules/patrimonio/infrastructure/prisma-repositorio.js";
import {
  patrimonioRouter,
  patrimonioWeb,
} from "../modules/patrimonio/presentation/router.js";
import { ErrorPatrimonio } from "../modules/patrimonio/domain/patrimonio.js";
import { ServicioOferta } from "../modules/servicios/application/servicio.js";
import { PrismaRepositorioOferta } from "../modules/servicios/infrastructure/prisma-repositorio.js";
import {
  ofertaRouter,
  ofertaWeb,
} from "../modules/servicios/presentation/router.js";
import {
  ErrorOferta,
  tiposPlatica,
} from "../modules/servicios/domain/oferta.js";
import { ServicioAgenda } from "../modules/agenda/application/servicio.js";
import { PrismaRepositorioAgenda } from "../modules/agenda/infrastructure/prisma-repositorio.js";
import {
  agendaRouter,
  agendaWeb,
} from "../modules/agenda/presentation/router.js";
import { ErrorAgenda } from "../modules/agenda/domain/agenda.js";
import { ServicioDiezmos } from "../modules/diezmos/application/servicio.js";
import { PrismaRepositorioDiezmos } from "../modules/diezmos/infrastructure/prisma-repositorio.js";
import {
  diezmosRouter,
  diezmosWeb,
} from "../modules/diezmos/presentation/router.js";
import { ErrorDiezmo } from "../modules/diezmos/domain/diezmo.js";
export function createApp(
  db: PrismaClient,
  config: AccesoConfig,
  anioActual = new Date().getUTCFullYear(),
  reloj: () => Date = () => new Date(),
) {
  const app = express();
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.set({
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
      "Content-Security-Policy":
        "default-src 'self'; style-src 'self'; script-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    });
    next();
  });
  app.use((req, res, next) => {
    res.locals.activePath = req.path;
    res.locals.personalLink = req.headers.cookie?.includes("ecclesia_session=")
      ? "/personal"
      : "/personal/login";
    next();
  });
  app.use(
    "/assets",
    express.static(resolve("public"), { index: false, dotfiles: "deny" }),
  );
  app.use(express.json({ limit: "16kb" }));
  app.use(express.urlencoded({ extended: false, limit: "16kb" }));
  app.set("view engine", "ejs");
  app.set("views", resolve("views"));
  const servicio = new ServicioIglesias(
    new PrismaRepositorioIglesias(db),
    anioActual,
  );
  const repoIdentidad = new PrismaRepositorioIdentidad(db);
  const identidad = new ServicioIdentidad(
    repoIdentidad,
    new CredencialesBcrypt(config),
  );
  const acceso = {
    ...config,
    origin: config.origin ?? "http://127.0.0.1:3000",
  };
  const personal = personalSesion(repoIdentidad, acceso, personalJwt(config));
  const catalogos = new ServicioCatalogos(new PrismaRepositorioCatalogos(db));
  const patrimonio = new ServicioPatrimonio(
    new PrismaRepositorioPatrimonio(db),
    anioActual,
  );
  app.use(identidadRouter(identidad, personal, acceso.origin));
  app.use(
    criteriosRouter(
      new ServicioCriterios(new PrismaRepositorioCriterios(db)),
      personal,
    ),
  );
  const solicitudes = new ServicioSolicitudes(
    new PrismaRepositorioSolicitudes(db, reloj),
    new ClavesSolicitud(),
  );
  const anonimo = proteccionAnonima(acceso.origin, config.secret);
  const limitar = async (req: express.Request, seguimiento: boolean) => {
    // Express no confía en X-Forwarded-For: límite sobre la conexión real.
    await solicitudes.limitar(
      claveLimite(
        config.secret,
        (seguimiento ? "seguimiento:" : "alta:") + req.ip,
      ),
      seguimiento ? 60 : 10,
      seguimiento ? 900000 : 3600000,
    );
    if (seguimiento) {
      const folio = req.params.folio ?? req.body?.folio;
      if (typeof folio === "string" && /^[A-F0-9]{24}$/.test(folio))
        await solicitudes.limitar(
          claveLimite(config.secret, "folio:" + folio),
          20,
          900000,
        );
    }
  };
  app.use(
    "/api/v1",
    solicitudesRouter(solicitudes, personal, anonimo, limitar),
  );
  app.use(solicitudesWeb(solicitudes, personal, anonimo, limitar));
  const diezmos = new ServicioDiezmos(new PrismaRepositorioDiezmos(db));
  app.use("/api/v1", diezmosRouter(diezmos, personal));
  app.use(diezmosWeb(diezmos, personal));
  const agenda = new ServicioAgenda(new PrismaRepositorioAgenda(db));
  app.use("/api/v1", agendaRouter(agenda, personal));
  app.use(agendaWeb(agenda, personal));
  const oferta = new ServicioOferta(new PrismaRepositorioOferta(db));
  app.use("/api/v1", ofertaRouter(oferta, personal));
  app.use(ofertaWeb(oferta, personal));
  app.use("/api/v1", patrimonioRouter(patrimonio, personal));
  app.use(
    patrimonioWeb(patrimonio, personal, (filtros) =>
      catalogos.consultar(filtros),
    ),
  );
  app.use("/api/v1/catalogos", catalogosRouter(catalogos));
  app.use("/personal/iglesias", gestionRouter(servicio, catalogos, personal));
  app.use("/api/v1/iglesias", iglesiasRouter(servicio, personal));
  app.use(
    "/iglesias",
    webRouter(servicio, catalogos, async (iglesia) => {
      // RF02: composición de consultas públicas existentes, sin importar módulos entre sí.
      // Cada sección se limita a cinco registros y enlaza a su consulta completa.
      const pagina = { page: 1, pageSize: 5 };
      const ahora = reloj();
      const desde = iglesia.zonaIana
        ? new Intl.DateTimeFormat("sv-SE", {
            timeZone: iglesia.zonaIana,
          }).format(ahora)
        : null;
      const [ubicacion, piezas, servicios, platicas, misas, espacios] =
        await Promise.all([
          catalogos.consultar({
            estadoClave: iglesia.estadoClave,
            municipioClave: iglesia.municipioClave,
          }),
          patrimonio.consultar(iglesia.id, pagina),
          oferta.servicios(iglesia.id, pagina),
          oferta.platicas(iglesia.id, pagina),
          desde ? agenda.semana(iglesia.id, { desde }) : Promise.resolve([]),
          solicitudes.espacios(iglesia.id),
        ]);
      const proximas = misas.filter(
        (misa) => misa.inicio.getTime() >= ahora.getTime(),
      );
      return {
        resumen: {
          ubicacion,
          piezas,
          servicios,
          platicas,
          misas: proximas.slice(0, 7),
          totalMisas: proximas.length,
          desde,
          espacios,
          tiposPlatica,
        },
      };
    }),
  );
  app.get("/", (_req, res) => res.redirect("/iglesias"));
  app.use((_req, res) =>
    res.status(404).json({
      code: "NO_IMPLEMENTADO",
      message: "Ruta no disponible",
      details: [],
    }),
  );
  const errores: ErrorRequestHandler = (error: unknown, req, res, _next) => {
    void _next;
    const httpStatus =
      typeof error === "object" && error !== null && "status" in error
        ? Number(error.status)
        : 500;
    if (
      req.path.startsWith("/personal") ||
      req.path.startsWith("/personal/iglesias") ||
      req.path.startsWith("/iglesias") ||
      req.path.startsWith("/personal/patrimonio") ||
      req.path.startsWith("/personal/oferta") ||
      req.path.startsWith("/personal/agenda") ||
      req.path.startsWith("/personal/diezmos") ||
      req.path.startsWith("/personal/solicitudes") ||
      req.path.startsWith("/solicitudes") ||
      req.path.startsWith("/ranking-patrimonial")
    ) {
      const status =
        error instanceof ZodError
          ? 422
          : error instanceof ErrorIglesias ||
              error instanceof ErrorIdentidad ||
              error instanceof ErrorPatrimonio ||
              error instanceof ErrorOferta ||
              error instanceof ErrorAgenda ||
              error instanceof ErrorSolicitud ||
              error instanceof ErrorDiezmo
            ? error.status
            : httpStatus === 400 || httpStatus === 413
              ? httpStatus
              : 500;
      res.status(status).render("error", {
        status,
        message:
          error instanceof ZodError
            ? "Revise los filtros o el identificador solicitado."
            : error instanceof ErrorIglesias ||
                error instanceof ErrorIdentidad ||
                error instanceof ErrorPatrimonio ||
                error instanceof ErrorOferta ||
                error instanceof ErrorAgenda ||
                error instanceof ErrorSolicitud ||
                error instanceof ErrorDiezmo
              ? error.message
              : status === 413
                ? "Entrada demasiado grande"
                : status === 400
                  ? "Solicitud inválida"
                  : "Error interno",
      });
      return;
    }
    if (error instanceof ZodError) {
      res.status(422).json({
        code: "ENTRADA_INVALIDA",
        message: "Revise los campos",
        details: error.issues.map((i) => ({
          field: i.path.join("."),
          reason: i.message,
        })),
      });
      return;
    }
    if (
      error instanceof ErrorIglesias ||
      error instanceof ErrorIdentidad ||
      error instanceof ErrorPatrimonio ||
      error instanceof ErrorOferta ||
      error instanceof ErrorAgenda ||
      error instanceof ErrorSolicitud ||
      error instanceof ErrorDiezmo
    ) {
      res
        .status(error.status)
        .json({ code: error.code, message: error.message, details: [] });
      return;
    }
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? Number(error.status)
        : 500;
    res.status(status === 400 || status === 413 ? status : 500).json({
      code: "ERROR",
      message:
        status === 400
          ? "JSON inválido"
          : status === 413
            ? "Entrada demasiado grande"
            : "Error interno",
      details: [],
    });
  };
  app.use(errores);
  return app;
}
