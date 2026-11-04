import { readFileSync, writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  cargarDemo,
  generarAccesos,
  validarDestino,
  type AccesosDemo,
} from "./carga.js";

const destino = process.env.ECCLESIA_DEMO_URL!;
const archivo = process.env.ECCLESIA_DEMO_ACCESOS!;
const referencia = new Date(process.env.ECCLESIA_DEMO_REFERENCIA!);
validarDestino(destino, "SOLO_DEMO_LOCAL");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: destino }),
});
try {
  // Si se perdió el comprobante local, nunca publicar credenciales nuevas inservibles.
  let accesos: AccesosDemo;
  try {
    accesos = JSON.parse(readFileSync(archivo, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    if (await db.cargaDemo.count())
      throw new Error(
        "Demo ya cargada sin accesos-locales.json; restaurar el archivo local o crear otra copia demo",
      );
    accesos = generarAccesos();
    writeFileSync(archivo, JSON.stringify(accesos, null, 2) + "\n", {
      flag: "wx",
      mode: 0o600,
    });
  }
  const resultado = await cargarDemo(
    db,
    destino,
    "SOLO_DEMO_LOCAL",
    referencia,
    accesos,
  );
  console.log(
    `CT20: ${resultado.creada ? "carga completa" : "ya cargada; datos conservados"}. Historia ${resultado.periodo.desde} a ${resultado.periodo.finHistorico}; agenda hasta ${resultado.periodo.hasta}. Datos ficticios.`,
  );
} finally {
  await db.$disconnect();
}
