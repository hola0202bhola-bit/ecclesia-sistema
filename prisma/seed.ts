import "dotenv/config";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  cargarFuentes,
  importarFuentes,
} from "../src/modules/iglesias/infrastructure/fuentes-inegi.js";
if (!process.env.DATABASE_URL) throw new Error("Configure DATABASE_URL");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
try {
  // Validar todas las fuentes antes de la primera escritura; importación atómica.
  const source = cargarFuentes(
    fileURLToPath(new URL("./fuentes", import.meta.url)),
  );
  await importarFuentes(db, source);
  const tipos = [
    "Catedral",
    "Basílica",
    "Parroquia",
    "Templo",
    "Capilla",
    "Santuario",
  ];
  for (const [index, nombre] of tipos.entries()) {
    const id = `10000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
    await db.tipoIglesia.upsert({
      where: { id },
      update: {},
      create: { id, nombre },
    });
  }
  const id = "20000000-0000-4000-8000-000000000001";
  await db.iglesia.upsert({
    where: { id },
    update: {},
    create: {
      id,
      nombre: "Parroquia Demostración (ficticia)",
      nombreBusqueda: "parroquia demostracion (ficticia)",
      tipoId: "10000000-0000-4000-8000-000000000003",
      estadoClave: "21",
      municipioClave: "114",
      localidadClave: "0001",
      direccion: "Calle de prueba 123 (ficticia)",
      capacidad: 100,
      anioConstruccion: 1900,
    },
  });
  console.log(
    `Seed idempotente: ${source.estados.length} estados, ${source.municipios.length} municipios, 1 localidad oficial, 6 tipos del caso y 1 iglesia ficticia. Localidades parciales.`,
  );
} finally {
  await db.$disconnect();
}
