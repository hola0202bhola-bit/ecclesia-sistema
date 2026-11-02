import { randomBytes } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import {
  ErrorIdentidad,
  type RepositorioIdentidad,
  type Usuario,
} from "../domain/identidad.js";
const publico = {
  id: true,
  identificador: true,
  rol: true,
  iglesiaId: true,
  activo: true,
} as const;
function usuario(row: {
  id: string;
  identificador: string;
  rol: string;
  iglesiaId: string | null;
  activo: boolean;
}): Usuario {
  return {
    ...row,
    rol: row.rol as Usuario["rol"],
    iglesiaId: row.iglesiaId ?? undefined,
  };
}
export class PrismaRepositorioIdentidad implements RepositorioIdentidad {
  constructor(private readonly db: PrismaClient) {}
  async buscar(identificador: string) {
    const row = await this.db.usuario.findUnique({ where: { identificador } });
    return row ? { ...usuario(row), passwordHash: row.passwordHash } : null;
  }
  async crear(
    datos: Parameters<RepositorioIdentidad["crear"]>[0],
    inicial = false,
  ) {
    try {
      return await this.db.$transaction(async (tx) => {
        if (inicial) {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(827316)`;
          if (await tx.usuario.count())
            throw new ErrorIdentidad(
              409,
              "YA_INICIALIZADO",
              "Ya existen cuentas; use Coordinación",
            );
        }
        return usuario(
          await tx.usuario.create({ data: datos, select: publico }),
        );
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002")
          throw new ErrorIdentidad(
            409,
            "USUARIO_EXISTENTE",
            "Identificador ya registrado",
          );
        if (error.code === "P2003")
          throw new ErrorIdentidad(
            422,
            "IGLESIA_INVALIDA",
            "Iglesia inexistente",
          );
      }
      throw error;
    }
  }
  async listar(page: number, pageSize: number) {
    const [rows, total] = await this.db.$transaction(
      [
        this.db.usuario.findMany({
          select: publico,
          orderBy: [{ identificador: "asc" }, { id: "asc" }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        this.db.usuario.count(),
      ],
      { isolationLevel: "RepeatableRead" },
    );
    return { data: rows.map(usuario), meta: { page, pageSize, total } };
  }
  crearSesion(usuarioId: string, vence: Date) {
    return this.db.sesion.create({
      data: { usuarioId, vence, csrf: randomBytes(32).toString("hex") },
      select: { id: true, csrf: true },
    });
  }
  async sesion(id: string) {
    const row = await this.db.sesion.findUnique({
      where: { id },
      include: { usuario: { select: publico } },
    });
    return row && row.vence > new Date() && row.usuario.activo
      ? { ...row, usuario: usuario(row.usuario) }
      : null;
  }
  async salir(id: string) {
    await this.db.sesion.deleteMany({ where: { id } });
  }
}
