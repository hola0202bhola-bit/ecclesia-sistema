import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type {
  AmbitoLocalidades,
  FuenteLocalidades,
} from "../domain/importacion.js";
import { ErrorIglesias } from "../domain/iglesia.js";

export const MAX_BYTES_INEGI = 8 * 1024 * 1024;
export class DescargaInegi implements FuenteLocalidades {
  constructor(private readonly solicitar: typeof fetch = fetch) {}
  async descargar(a: AmbitoLocalidades) {
    const municipio = a.estadoClave + a.municipioClave;
    if (!/^\d{5}$/.test(municipio))
      throw new ErrorIglesias(422, "AMBITO_INVALIDO", "Clave inválida");
    const fuente =
      "https://gaia.inegi.org.mx/wscatgeo/v2/localidades/" + municipio;
    if (a.origen === "SNAPSHOT") {
      if (municipio !== "21114")
        throw new ErrorIglesias(
          422,
          "SNAPSHOT_NO_DISPONIBLE",
          "La copia verificada solo cubre Puebla (21114)",
        );
      const manifest = JSON.parse(
        readFileSync("prisma/fuentes/rf05/manifest.json", "utf8"),
      );
      const raw = readFileSync("prisma/fuentes/rf05/21114.json");
      if (
        createHash("sha256").update(raw).digest("hex") !== manifest.sha256 ||
        manifest.fuente !== fuente
      )
        throw new ErrorIglesias(
          422,
          "HASH_INVALIDO",
          "La copia INEGI no coincide con su manifest",
        );
      return {
        fuente,
        consulta: manifest.consulta as string,
        original: raw.toString("utf8"),
      };
    }
    try {
      const response = await this.solicitar(fuente, {
        redirect: "error",
        signal: AbortSignal.timeout(15000),
        headers: { Accept: "application/json" },
      });
      if (
        !response.ok ||
        !response.headers.get("content-type")?.includes("json") ||
        !response.body
      )
        throw new Error("Respuesta no JSON");
      const chunks: Uint8Array[] = [];
      let size = 0;
      for await (const chunk of response.body) {
        size += chunk.length;
        if (size > MAX_BYTES_INEGI) throw new Error("Respuesta excedida");
        chunks.push(chunk);
      }
      const raw = Buffer.concat(chunks);
      const original = new TextDecoder("utf-8", { fatal: true }).decode(raw);
      if (!raw.equals(Buffer.from(original, "utf8")))
        throw new Error("Codificación no conservada");
      return { fuente, consulta: new Date().toISOString(), original };
    } catch {
      throw new ErrorIglesias(
        502,
        "INEGI_NO_DISPONIBLE",
        "No se pudo verificar INEGI (JSON, tamaño o tiempo). No se modificó el catálogo; intente después o use la copia verificada de Puebla.",
      );
    }
  }
}
