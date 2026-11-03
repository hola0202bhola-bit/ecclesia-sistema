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
import { ErrorOferta } from "../modules/servicios/domain/oferta.js";
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
) {
  const app = express();
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.set({
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy":
        "default-src 'self'; style-src 'unsafe-inline'; frame-ancestors 'none'",
    });
    next();
  });
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
  app.use(patrimonioWeb(patrimonio, personal));
  app.use("/api/v1/catalogos", catalogosRouter(catalogos));
  app.use("/personal/iglesias", gestionRouter(servicio, catalogos, personal));
  app.use("/api/v1/iglesias", iglesiasRouter(servicio, personal));
  app.use("/iglesias", webRouter(servicio, catalogos));
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
      req.path.startsWith("/personal/iglesias") ||
      req.path.startsWith("/iglesias") ||
      req.path.startsWith("/personal/patrimonio") ||
      req.path.startsWith("/personal/oferta") ||
      req.path.startsWith("/personal/agenda") ||
      req.path.startsWith("/personal/diezmos") ||
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
