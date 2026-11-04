import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  lstatSync,
  readdirSync,
  unlinkSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { randomBytes } from "node:crypto";
import { createServer } from "node:net";
import { spawn } from "node:child_process";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";

// Nunca consume DATABASE_URL/.env del usuario. Solo abre el clúster que crea aquí.
const folder = resolve(".demo");
if (
  existsSync(folder) &&
  (lstatSync(folder).isSymbolicLink() || !lstatSync(folder).isDirectory())
)
  throw new Error(".demo debe ser un directorio local propio");
mkdirSync(folder, { recursive: true });
const statePath = join(folder, "estado-local.json");
const lockPath = join(folder, "ejecucion.lock");
for (const path of [
  statePath,
  lockPath,
  join(folder, "postgres"),
  join(folder, "accesos-locales.json"),
]) {
  if (existsSync(path) && lstatSync(path).isSymbolicLink())
    throw new Error("La demo no abre rutas enlazadas");
}
const first = !existsSync(statePath);
if (first && readdirSync(folder).length)
  throw new Error(".demo no vacía sin identificación: no se abre ni reemplaza");
const arg = process.argv.slice(2);
if (
  arg.length > 1 ||
  arg.some(
    (a) =>
      !/^--referencia=\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(
        a,
      ),
  )
)
  throw new Error("Única opción: --referencia=ISO-8601 (primera creación)");
const referencia = new Date(arg[0]?.slice(13) ?? Date.now());
if (!Number.isFinite(referencia.getTime()) || referencia.getTime() > Date.now())
  throw new Error(
    "La referencia debe ser un instante válido que no esté en el futuro",
  );
if (first)
  writeFileSync(
    statePath,
    JSON.stringify(
      {
        formato: "ecclesia-ct20-local-v1",
        referencia: referencia.toISOString(),
        password: randomBytes(32).toString("hex"),
        jwt: randomBytes(48).toString("hex"),
      },
      null,
      2,
    ),
    { flag: "wx", mode: 0o600 },
  );
const state = JSON.parse(readFileSync(statePath, "utf8"));
if (
  state.formato !== "ecclesia-ct20-local-v1" ||
  !/^[a-f0-9]{64}$/.test(state.password) ||
  !/^[a-f0-9]{96}$/.test(state.jwt) ||
  !Number.isFinite(Date.parse(state.referencia))
)
  throw new Error("Identificación local demo inválida");
if (!first && arg.length && referencia.toISOString() !== state.referencia)
  throw new Error(
    "Referencia ya fijada: usar una carpeta de proyecto nueva para otra demostración",
  );
writeFileSync(lockPath, String(process.pid), { flag: "wx", mode: 0o600 });
const freePort = () =>
  new Promise((ok, fail) => {
    const s = createServer();
    s.on("error", fail);
    s.listen(0, "127.0.0.1", () => {
      const p = s.address().port;
      s.close(() => ok(p));
    });
  });
let cluster, web;
const children = new Set();
let stopping = false;
let started = false,
  stoppingPromise;
function stop() {
  if (stoppingPromise) return stoppingPromise;
  stopping = true;
  stoppingPromise = (async () => {
    process.stdin.pause();
    process.stdin.destroy();
    await Promise.all(
      [...children].map(
        (child) =>
          new Promise((ok) => {
            child.once("exit", ok);
            child.kill();
          }),
      ),
    );
    try {
      if (started) await cluster.stop();
    } finally {
      unlinkSync(lockPath);
    }
  })();
  return stoppingPromise;
}
process.once("SIGINT", () => {
  void stop();
});
process.once("SIGTERM", () => {
  void stop();
});
// Permite verificar cierre limpio desde un proceso local de prueba, sin endpoint HTTP.
process.on("message", (message) => {
  if (message === "detener-demo") void stop();
});
process.stdin.setEncoding("utf8");
process.stdin.on("data", (data) => {
  if (data.trim().toLowerCase() === "salir") void stop();
});
try {
  const port = await freePort();
  cluster = new EmbeddedPostgres({
    databaseDir: join(folder, "postgres"),
    user: "ecclesia_demo",
    password: state.password,
    port,
    persistent: true,
    authMethod: "scram-sha-256",
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
    postgresFlags: [
      "-h",
      "127.0.0.1",
      ...(process.platform === "win32" ? ["-c", "io_method=sync"] : []),
    ],
    onLog: () => {},
    onError: () => {},
    autoRehydrateSymlinks: true,
  });
  if (!existsSync(join(folder, "postgres", "PG_VERSION")))
    await cluster.initialise();
  await cluster.start();
  started = true;
  const destino = `postgresql://ecclesia_demo:${state.password}@127.0.0.1:${port}/ecclesia_demo`;
  const admin = new pg.Client({
    connectionString: destino.replace(/\/ecclesia_demo$/, "/postgres"),
  });
  await admin.connect();
  try {
    if (
      !(
        await admin.query(
          "SELECT 1 FROM pg_database WHERE datname='ecclesia_demo'",
        )
      ).rowCount
    )
      await admin.query("CREATE DATABASE ecclesia_demo");
  } finally {
    await admin.end();
  }
  const httpPort = await freePort();
  const env = {
    ...process.env,
    DATABASE_URL: destino,
    ECCLESIA_DEMO_URL: destino,
    ECCLESIA_DEMO_ACCESOS: join(folder, "accesos-locales.json"),
    ECCLESIA_DEMO_REFERENCIA: state.referencia,
    JWT_SECRET: state.jwt,
    PORT: String(httpPort),
    APP_ORIGIN: `http://127.0.0.1:${httpPort}`,
  };
  async function run(args) {
    if (stopping) throw new Error("Demo detenida");
    const code = await new Promise((ok, fail) => {
      const c = spawn(process.execPath, args, {
        env,
        stdio: ["ignore", "inherit", "inherit"],
        windowsHide: true,
      });
      children.add(c);
      c.on("error", fail);
      c.on("exit", (code) => {
        children.delete(c);
        ok(code);
      });
    });
    if (code !== 0) throw new Error("No se completó el comando local de demo");
  }
  await run(["node_modules/prisma/build/index.js", "generate"]);
  await run(["node_modules/prisma/build/index.js", "migrate", "deploy"]);
  await run(["node_modules/tsx/dist/cli.mjs", "prisma/demo/ejecutar.ts"]);
  await run(["node_modules/typescript/bin/tsc", "-p", "tsconfig.build.json"]);
  console.log(
    `Demo ficticia CT20: http://127.0.0.1:${httpPort}/iglesias?estadoClave=21`,
  );
  console.log(
    "Credenciales exclusivas en .demo/accesos-locales.json; no compartir ni subir esa carpeta. Escriba salir y Enter, o Ctrl+C, para detenerla. Volver a ejecutar conserva los datos. No ejecutar db:seed sobre esta base.",
  );
  web = spawn(process.execPath, ["dist/composition/server.js"], {
    env,
    stdio: "inherit",
    windowsHide: true,
  });
  children.add(web);
  await new Promise((ok, fail) => {
    web.on("error", fail);
    web.on("exit", (code) => {
      children.delete(web);
      code && !stopping
        ? fail(new Error("Servidor demo terminó con error"))
        : ok();
    });
  });
} finally {
  await stop();
}
