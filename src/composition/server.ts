import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createApp } from "./app.js";
import { deploymentConfig } from "./deployment.js";
const runtime = deploymentConfig(process.env);
const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
    query_timeout: 5000,
    max: 5,
  }),
});
const server = createApp(
  db,
  {
    secret: process.env.JWT_SECRET!,
    issuer: "ecclesia-personal",
    audience: "ecclesia-api",
    origin: runtime.origin,
  },
  undefined,
  undefined,
  undefined,
  runtime.deployment,
).listen(runtime.port, runtime.host, () =>
  console.log(
    runtime.deployment.surface === "all" ? "Referencia local:" : "Ecclesia:",
    runtime.origin,
  ),
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    server.close(() => {
      void db.$disconnect();
    });
  });
