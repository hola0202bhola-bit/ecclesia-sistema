import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createApp } from "./app.js";
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET)
  throw new Error("Configure DATABASE_URL y JWT_SECRET localmente");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const server = createApp(db, {
  secret: process.env.JWT_SECRET,
  issuer: "ecclesia-personal",
  audience: "ecclesia-api",
  origin:
    process.env.APP_ORIGIN ?? `http://127.0.0.1:${process.env.PORT ?? 3000}`,
}).listen(Number(process.env.PORT ?? 3000), "127.0.0.1", () =>
  console.log(
    "Referencia local: http://127.0.0.1:" + (process.env.PORT ?? 3000),
  ),
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    server.close(() => {
      void db.$disconnect();
    });
  });
