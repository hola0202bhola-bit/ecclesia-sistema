import { Prisma, type PrismaClient } from "@prisma/client";
import type {
  ConsultaCatalogo,
  RepositorioCatalogos,
} from "../domain/catalogos.js";
export class PrismaRepositorioCatalogos implements RepositorioCatalogos {
  constructor(private readonly db: PrismaClient) {}
  async consultar(f: ConsultaCatalogo) {
    const [estados, municipios, localidades, tipos, versiones] =
      await this.db.$transaction(
        [
          this.db.estado.findMany({ orderBy: { nombre: "asc" } }),
          this.db.municipio.findMany({
            where: { estadoClave: f.estadoClave },
            orderBy: [{ nombre: "asc" }, { clave: "asc" }],
          }),
          this.db.localidad.findMany({
            where: {
              estadoClave: f.estadoClave,
              municipioClave: f.municipioClave,
            },
            orderBy: { clave: "asc" },
          }),
          this.db.tipoIglesia.findMany({ orderBy: { nombre: "asc" } }),
          this.db.catalogoVersion.findMany({
            select: { version: true, consulta: true, sha256: true },
            orderBy: { version: "asc" },
          }),
        ],
        { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
      );
    return { estados, municipios, localidades, tipos, versiones };
  }
}
