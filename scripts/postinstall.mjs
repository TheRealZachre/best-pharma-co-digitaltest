// Skip optional postinstall steps on Cloudflare CI.
const isCi =
  process.env.CI && process.env.CI !== "false" && process.env.CI !== "0";

if (process.env.CF_PAGES || process.env.WORKERS_CI || isCi) {
  process.exit(0);
}
