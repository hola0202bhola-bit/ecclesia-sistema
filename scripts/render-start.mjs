import "dotenv/config";
import { spawnSync } from "node:child_process";
import { deploymentConfig } from "../dist/composition/deployment.js";

const surface = process.argv[2];
if (!["api", "front", "admin"].includes(surface))
  throw new Error("Seleccione api, front o admin");
process.env.APP_SURFACE = surface;
// Rechaza configuración incompleta antes de modificar una base remota.
deploymentConfig(process.env);
if (surface === "api") {
  const result = spawnSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    { stdio: "inherit", windowsHide: true },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
// Mismo proceso: SIGTERM llega al cierre ordenado del servidor.
await import("../dist/composition/server.js");
