#!/usr/bin/env bash
# Cloudflare Git runs `npm run build` then `wrangler deploy`.
# OpenNext also invokes `npm run build` internally — use OPENNEXT_INNER_BUILD
# to run plain Next.js only on that inner call and avoid infinite recursion.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ "${OPENNEXT_INNER_BUILD:-}" = "1" ]; then
  exec next build
fi

export OPENNEXT_INNER_BUILD=1
env OPENNEXT_CLOUDFLARE=1 npx opennextjs-cloudflare build

# OpenNext can append env exports twice; wrangler then fails on duplicate symbols.
env_file=".open-next/cloudflare/next-env.mjs"
if [ -f "$env_file" ]; then
  awk '!seen[$0]++' "$env_file" > "${env_file}.tmp" && mv "${env_file}.tmp" "$env_file"
fi
