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
  app.use(identidadRouter(identidad, personal, acceso.origin));
  app.use("/api/v1/iglesias", iglesiasRouter(servicio, personal));
  app.use("/iglesias", webRouter(servicio));
  app.get("/", (_req, res) => res.redirect("/iglesias"));
  app.use((_req, res) =>
    res.status(404).json({
      code: "NO_IMPLEMENTADO",
      message: "Ruta no disponible",
      details: [],
    }),
  );
  const errores: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    void _next;
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
    if (error instanceof ErrorIglesias || error instanceof ErrorIdentidad) {
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
