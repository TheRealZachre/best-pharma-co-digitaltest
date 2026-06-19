#!/usr/bin/env bash
# Seed bundled JSON files into the APP_DATA_KV namespace.
set -euo pipefail

cd "$(dirname "$0")/.."

seed_file() {
  local filename="$1"
  local key="json-cache:${filename}"
  local path="data/${filename}"

  if [ ! -f "$path" ]; then
    echo "Skipping ${filename} (not found)"
    return 0
  fi

  echo "Seeding ${key}..."
  npx wrangler kv key put "$key" --path="$path" --binding=APP_DATA_KV --remote --preview false
}

seed_file "best-pharma-co-users.json"
seed_file "password-reset-tokens.json"

echo "Done seeding APP_DATA_KV."
