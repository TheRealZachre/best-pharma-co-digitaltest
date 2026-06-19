import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Load Wrangler `.dev.vars` into process.env for local `next dev`. */
export function loadDevVars(cwd = process.cwd()) {
  if (process.env.NODE_ENV === "production") return;

  const path = join(cwd, ".dev.vars");
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
