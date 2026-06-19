#!/usr/bin/env bash
# Upload worker secrets from .dev.vars to the best-pharma-co-digitaltest worker.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .dev.vars ]; then
  echo "Missing .dev.vars. Copy .dev.vars.example and fill in secrets." >&2
  exit 1
fi

if ! grep -q '^AUTH_SECRET=' .dev.vars 2>/dev/null; then
  secret="$(openssl rand -base64 32)"
  {
    echo "# Local Wrangler secrets — do not commit"
    echo "AUTH_SECRET=$secret"
  } >> .dev.vars
  echo "Wrote AUTH_SECRET to .dev.vars"
fi

# shellcheck disable=SC1091
set -a
source .dev.vars
set +a

if npx wrangler whoami 2>&1 | grep -qi "not authenticated"; then
  cat <<'EOF'

Next step: log in to Cloudflare, then re-run this script.

  npx wrangler login
  npm run setup:cloudflare

EOF
  exit 1
fi

put_secret() {
  local name="$1"
  local value="$2"
  if [ -z "${value:-}" ]; then
    echo "Skipping ${name} (not set in .dev.vars)"
    return 0
  fi
  printf '%s' "$value" | npx wrangler secret put "$name"
  echo "Uploaded ${name}"
}

put_secret AUTH_SECRET "${AUTH_SECRET:-}"
put_secret RESEND_API_KEY "${RESEND_API_KEY:-}"
put_secret AUTH_EMAIL_FROM "${AUTH_EMAIL_FROM:-}"
put_secret APIFY_TOKEN "${APIFY_TOKEN:-}"
put_secret LINKEDIN_FOUNDER_FOLLOWERS "${LINKEDIN_FOUNDER_FOLLOWERS:-}"

echo ""
echo "Done. Worker secrets are on best-pharma-co-digitaltest."
echo "Redeploy from Cloudflare or run: npm run deploy"
