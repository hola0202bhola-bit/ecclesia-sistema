import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const harness = ["ecclesia-arnes-codex", "arnes-codex"]
  .map((name) => new URL(`../../${name}/scripts/`, import.meta.url))
  .find((url) => existsSync(new URL("check-product.mjs", url)));
if (!harness)
  throw new Error("Instale el arnés Ecclesia como carpeta hermana.");
if (process.argv.includes("--completo")) {
  const result = spawnSync(
    process.execPath,
    [fileURLToPath(new URL("check.mjs", harness)), process.cwd()],
    { stdio: "inherit", windowsHide: true },
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} else {
  const { checkProduct } = await import(new URL("check-product.mjs", harness));
  console.log(checkProduct(process.cwd()));
}
