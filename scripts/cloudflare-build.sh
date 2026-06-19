#!/usr/bin/env bash
set -euo pipefail

# Single Cloudflare Workers Builds command — do not manually stub node_modules.
# next.config.ts swaps native packages for typed stubs when CI=1.
exec npm run build
