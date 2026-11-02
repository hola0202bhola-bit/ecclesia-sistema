import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ServicioIdentidad } from "../dist/modules/identidad/application/servicio.js";
import { PrismaRepositorioIdentidad } from "../dist/modules/identidad/infrastructure/prisma-repositorio.js";
import { CredencialesBcrypt } from "../dist/modules/identidad/infrastructure/credenciales.js";
import { altaInput } from "../dist/modules/identidad/presentation/validacion.js";
if (
  !process.stdin.isTTY ||
  !process.env.DATABASE_URL ||
  !process.env.JWT_SECRET
) {
  console.error(
    "Use una terminal interactiva y configure DATABASE_URL y JWT_SECRET en .env.",
  );
  process.exit(1);
}
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
try {
  const normal = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const identificador = await normal.question(
    "Identificador de la primera Coordinación: ",
  );
  normal.close();
  const mudo = new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });
  const oculto = createInterface({
    input: process.stdin,
    output: mudo,
    terminal: true,
  });
  process.stdout.write(
    "Contraseña (15 caracteres mínimo, máximo 72 bytes; entrada oculta): ",
  );
  const password = await oculto.question("");
  process.stdout.write("\nRepita la contraseña: ");
  const confirmar = await oculto.question("");
  oculto.close();
  process.stdout.write("\n");
  if (password !== confirmar) throw new Error("Las contraseñas no coinciden");
  const servicio = new ServicioIdentidad(
    new PrismaRepositorioIdentidad(db),
    new CredencialesBcrypt({
      secret: process.env.JWT_SECRET,
      issuer: "ecclesia-personal",
      audience: "ecclesia-api",
    }),
  );
  await servicio.inicial(
    altaInput.parse({ identificador, password, rol: "COORDINACION" }),
  );
  console.log(
    "Primera cuenta creada. Entre en /personal/login. No se guardaron credenciales en archivos.",
  );
} catch {
  console.error(
    "No se creó la cuenta: compruebe datos, conexión y que todavía no existan usuarios. No se reemplazan cuentas existentes.",
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
