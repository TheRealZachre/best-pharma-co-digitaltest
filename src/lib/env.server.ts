import { loadDevVars } from "../../scripts/load-dev-vars.mjs";

/** Load `.dev.vars` for Node.js API routes (not safe for middleware/edge). */
export function ensureLocalEnvLoaded() {
  loadDevVars();
}
