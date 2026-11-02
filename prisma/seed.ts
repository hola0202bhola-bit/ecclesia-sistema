import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
if (!process.env.DATABASE_URL) throw new Error("Configure DATABASE_URL");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
try {
  const source = JSON.parse(
    readFileSync(
      new URL("./fuentes/inegi-localidad.json", import.meta.url),
      "utf8",
    ),
  );
  const loc = source.datos[0];
  await db.localidad.upsert({
    where: { clave: loc.cvegeo },
    update: {},
    create: {
      clave: loc.cvegeo,
      estadoClave: loc.cve_ent,
      municipioClave: loc.cve_mun,
      localidadClave: loc.cve_loc,
      nombre: loc.nomgeo,
      fuente: "https://gaia.inegi.org.mx/wscatgeo/v2/localidades/211140001",
      consulta: "2026-11-01",
    },
  });
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
    "Seed idempotente: 1 localidad oficial, 6 tipos del caso y 1 iglesia ficticia. No es el seed nacional final.",
  );
} finally {
  await db.$disconnect();
}
