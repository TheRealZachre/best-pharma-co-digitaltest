#!/usr/bin/env bash
# Deploy to Cloudflare Workers. Uploads AUTH_SECRET when available.
set -euo pipefail

load_secret() {
  if [ -n "${AUTH_SECRET:-}" ]; then
    return 0
  fi
  if [ -n "${NEXTAUTH_SECRET:-}" ]; then
    AUTH_SECRET="$NEXTAUTH_SECRET"
    export AUTH_SECRET
    return 0
  fi
  if [ -f .dev.vars ]; then
    # shellcheck disable=SC1091
    set -a
    source .dev.vars
    set +a
  fi
}

require_cloudflare_credentials() {
  if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
    return 0
  fi

  if [ -n "${CLOUDFLARE_API_TOKEN:-}" ] && [ -n "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
    return 0
  fi

  cat >&2 <<'EOF'
ERROR: Cloudflare credentials are not available.

GitHub Actions: add these repository secrets:
  CLOUDFLARE_API_TOKEN
  CLOUDFLARE_ACCOUNT_ID

Create an API token at:
  https://dash.cloudflare.com/profile/api-tokens
Use template: "Edit Cloudflare Workers" with account and zone permissions.
EOF
  exit 1
}

load_secret
require_cloudflare_credentials

secrets_file=""
if [ -n "${AUTH_SECRET:-}" ] || [ -n "${RESEND_API_KEY:-}" ] || [ -n "${AUTH_EMAIL_FROM:-}" ]; then
  secrets_file="$(mktemp)"
  trap 'rm -f "$secrets_file"' EXIT
  : > "$secrets_file"
  if [ -n "${AUTH_SECRET:-}" ]; then
    printf 'AUTH_SECRET=%s\n' "$AUTH_SECRET" >> "$secrets_file"
    echo "Uploading AUTH_SECRET with wrangler deploy..."
  fi
  if [ -n "${RESEND_API_KEY:-}" ]; then
    printf 'RESEND_API_KEY=%s\n' "$RESEND_API_KEY" >> "$secrets_file"
    echo "Uploading RESEND_API_KEY with wrangler deploy..."
  fi
  if [ -n "${AUTH_EMAIL_FROM:-}" ]; then
    printf 'AUTH_EMAIL_FROM=%s\n' "$AUTH_EMAIL_FROM" >> "$secrets_file"
    echo "Uploading AUTH_EMAIL_FROM with wrangler deploy..."
  fi
fi

deploy_args=()
if [ -n "${secrets_file:-}" ]; then
  deploy_args+=(--secrets-file "$secrets_file")
elif [ "${WORKERS_CI:-}" = "1" ] && [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  cat >&2 <<'EOF'

ERROR: AUTH_SECRET is not available during deploy.

Fix (choose one):

  A) Worker runtime secret (recommended — works with "npx wrangler deploy"):
     Cloudflare dashboard → Workers & Pages → digitaltest
     → Settings → Variables and Secrets → Add → Secret → AUTH_SECRET
     Generate: openssl rand -base64 32

  B) CI build secret + updated commands:
     Settings → Builds → Build variables and secrets → Add → Secret → AUTH_SECRET
     Build command:  npm run ci:cloudflare
     Deploy command: echo "deployed in build step"

  C) Local one-time upload:
     npm run setup:cloudflare

EOF
  exit 1
else
  echo "Note: optional worker secrets not provided in this environment."
  echo "Deploying without uploading AUTH_SECRET, RESEND_API_KEY, or AUTH_EMAIL_FROM."
fi

env_file=".open-next/cloudflare/next-env.mjs"
if [ -f "$env_file" ]; then
  awk '!seen[$0]++' "$env_file" > "${env_file}.tmp" && mv "${env_file}.tmp" "$env_file"
fi

upload_log="$(mktemp)"
trap 'rm -f "$upload_log" ${secrets_file:+"$secrets_file"}' EXIT

set +e
npx opennextjs-cloudflare upload "${deploy_args[@]}" 2>&1 | tee "$upload_log"
upload_status=${PIPESTATUS[0]}
set -e

if [ "$upload_status" -ne 0 ]; then
  echo "ERROR: opennextjs-cloudflare upload failed with exit code ${upload_status}." >&2
  exit "$upload_status"
fi

version_id="$(
  awk -F': ' '/Worker Version ID:/{print $2}' "$upload_log" | tail -1 | tr -d '[:space:]'
)"

if [ -z "${version_id:-}" ]; then
  version_id="$(
    npx wrangler versions list 2>/dev/null | awk -F': ' '/Version ID:/{print $2}' | head -1 | tr -d '[:space:]'
  )"
fi

if [ -n "${version_id:-}" ]; then
  echo "Promoting version ${version_id} to 100% traffic..."
  npx wrangler versions deploy "${version_id}" --yes
else
  echo "WARNING: Could not determine uploaded Worker version ID; skipping traffic promotion." >&2
fi

# Run wrangler deploy to keep custom domains and routes in sync.
# (versions deploy skips route/domain registration; wrangler deploy handles it.)
echo "Syncing routes and custom domains..."
npx wrangler deploy 2>&1 | grep -E "domain|route|Deployed|Uploaded|https://" || true
