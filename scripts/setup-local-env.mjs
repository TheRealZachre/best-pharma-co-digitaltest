import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const examplePath = join(root, ".dev.vars.example");
const devVarsPath = join(root, ".dev.vars");
const envLocalPath = join(root, ".env.local");

if (!existsSync(examplePath)) {
  console.warn("[setup-local-env] Missing .dev.vars.example — skipping.");
  process.exit(0);
}

if (!existsSync(devVarsPath)) {
  copyFileSync(examplePath, devVarsPath);
  console.log("[setup-local-env] Created .dev.vars from .dev.vars.example");
}

const vars = Object.fromEntries(
  readFileSync(examplePath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    })
    .filter(([key]) => key)
);

const authSecret = vars.AUTH_SECRET ?? vars.NEXTAUTH_SECRET;
const authUrl = vars.AUTH_URL ?? vars.NEXTAUTH_URL ?? "http://localhost:3004";

if (!authSecret) {
  console.warn("[setup-local-env] No AUTH_SECRET in .dev.vars.example");
  process.exit(0);
}

if (!existsSync(envLocalPath)) {
  writeFileSync(
    envLocalPath,
    `# Auto-generated for local Next.js dev (including middleware)
AUTH_SECRET=${authSecret}
NEXTAUTH_SECRET=${authSecret}
AUTH_URL=${authUrl}
NEXTAUTH_URL=${authUrl}
LINKEDIN_DATA_PROVIDER=${vars.LINKEDIN_DATA_PROVIDER ?? "seed"}
`,
    "utf8"
  );
  console.log("[setup-local-env] Created .env.local for Next.js auth");
}
