#!/usr/bin/env bash
# Build a standalone analytics repo from the monorepo.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/../beone-analytics}"

echo "Exporting analytics app to $OUT"
rm -rf "$OUT"
mkdir -p "$OUT/src"

copy() {
  mkdir -p "$(dirname "$OUT/$2")"
  cp -R "$ROOT/$1" "$OUT/$2"
}

# App shell from apps/analytics
copy "apps/analytics/middleware.ts" "middleware.ts"
copy "apps/analytics/postcss.config.mjs" "postcss.config.mjs"
copy "apps/analytics/open-next.config.ts" "open-next.config.ts"
copy "apps/analytics/wrangler.jsonc" "wrangler.jsonc"

# Shared infra
copy "eslint.config.mjs" "eslint.config.mjs"
copy "scripts/load-dev-vars.mjs" "scripts/load-dev-vars.mjs"

cat > "$OUT/scripts/cloudflare-build.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
OPENNEXT_CLOUDFLARE=1 npx opennextjs-cloudflare build
EOF

cat > "$OUT/scripts/cloudflare-deploy.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"

load_secret() {
  if [ -n "${AUTH_SECRET:-}" ]; then return 0; fi
  if [ -n "${NEXTAUTH_SECRET:-}" ]; then
    AUTH_SECRET="$NEXTAUTH_SECRET"
    export AUTH_SECRET
    return 0
  fi
  if [ -f "$root/.dev.vars" ]; then
    set -a
    # shellcheck disable=SC1091
    source "$root/.dev.vars"
    set +a
  fi
}

load_secret
deploy_args=()
if [ -n "${AUTH_SECRET:-}" ]; then
  secrets_file="$(mktemp)"
  trap 'rm -f "$secrets_file"' EXIT
  printf 'AUTH_SECRET=%s\n' "$AUTH_SECRET" > "$secrets_file"
  deploy_args+=(--secrets-file "$secrets_file")
fi

cd "$root"
exec npx wrangler deploy "${deploy_args[@]}"
EOF

cat > "$OUT/scripts/cloudflare-ci.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
bash scripts/cloudflare-build.sh
bash scripts/cloudflare-deploy.sh
EOF

chmod +x "$OUT/scripts/"*.sh

# Data + assets
copy "data" "data"
mkdir -p "$OUT/public"
copy "public/brand" "public/brand"
copy "public/_headers" "public/_headers"

# Analytics pages + API routes
copy "apps/analytics/src/app" "src/app"

# Analytics-only components (brand stack, sidebar)
mkdir -p "$OUT/src/components"
copy "apps/analytics/src/components/brand" "src/components/brand-analytics"
copy "apps/analytics/src/components/layout/AnalyticsAppShell.tsx" "src/components/layout/AnalyticsAppShell.tsx"
copy "apps/analytics/src/components/layout/AnalyticsSidebar.tsx" "src/components/layout/AnalyticsSidebar.tsx"

# Shared components
for dir in analytics auth admin dashboard methodology narrative; do
  copy "src/components/$dir" "src/components/$dir"
done
copy "src/components/brand/BrandLogo.tsx" "src/components/brand/BrandLogo.tsx"
copy "src/components/brand/BrandSignalAnimated.tsx" "src/components/brand/BrandSignalAnimated.tsx"
copy "src/components/layout/Header.tsx" "src/components/layout/Header.tsx"

# Shared lib
for dir in analytics auth data linkedin narrative social; do
  copy "src/lib/$dir" "src/lib/$dir"
done
mkdir -p "$OUT/src/lib/youtube/stubs"
copy "src/lib/youtube/stubs" "src/lib/youtube/stubs"
copy "src/lib/youtube/parse-relative-date.ts" "src/lib/youtube/parse-relative-date.ts"
copy "src/lib/youtube/parse-channel-url.ts" "src/lib/youtube/parse-channel-url.ts"

for file in \
  types.ts metrics.ts mock-data.ts company.ts brand.ts env.ts cloudflare-build.ts \
  audience-growth.ts metric-definitions.ts format-display-provider.ts report-posts.ts \
  export.ts export-pptx.ts export-pptx-types.ts export-charts.ts export-pptx-images.ts; do
  copy "src/lib/$file" "src/lib/$file"
done

copy "src/types" "src/types"

# Inline API routes (no monorepo re-exports)
copy "src/app/api/account/route.ts" "src/app/api/account/route.ts"
copy "src/app/api/health/route.ts" "src/app/api/health/route.ts"
copy "src/app/api/auth/forgot-password/route.ts" "src/app/api/auth/forgot-password/route.ts"
copy "src/app/api/auth/reset-password/route.ts" "src/app/api/auth/reset-password/route.ts"

# Merge analytics brand components into src/components/brand
cp "$OUT/src/components/brand-analytics/"*.tsx "$OUT/src/components/brand/"
rm -rf "$OUT/src/components/brand-analytics"

# Fix @analytics imports → @/
find "$OUT/src" -type f \( -name '*.ts' -o -name '*.tsx' \) -print0 \
  | xargs -0 sed -i '' \
    -e 's|@analytics/components/|@/components/|g' \
    -e 's|@analytics/|@/|g'

# Standalone next.config.ts
cat > "$OUT/next.config.ts" <<'EOF'
import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import path from "path";
import { fileURLToPath } from "url";
import { loadDevVars } from "./scripts/load-dev-vars.mjs";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const stubRoot = path.join(configDir, "src/lib/youtube/stubs");

loadDevVars(configDir);

function isCloudflareBuild(): boolean {
  if (
    process.env.OPENNEXT_CLOUDFLARE === "1" ||
    process.env.CF_PAGES === "1" ||
    process.env.WORKERS_CI === "1"
  ) {
    return true;
  }
  if (
    process.env.CI &&
    process.env.CI !== "false" &&
    process.env.CI !== "0" &&
    !process.env.VERCEL &&
    !process.env.NETLIFY
  ) {
    return true;
  }
  return false;
}

const cloudflareNativeStubAliases = isCloudflareBuild()
  ? {
      "@xenova/transformers": path.join(stubRoot, "transformers-stub.ts"),
      "ffmpeg-static": path.join(stubRoot, "ffmpeg-static-stub.ts"),
      "onnxruntime-node": path.join(stubRoot, "empty-stub.ts"),
    }
  : undefined;

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "ffmpeg-static",
    "@xenova/transformers",
    "onnxruntime-node",
    "pptxgenjs",
  ],
  turbopack: {
    resolveAlias: cloudflareNativeStubAliases ?? {},
  },
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      ...(cloudflareNativeStubAliases ?? {}),
    };
    return config;
  },
  experimental: {
    proxyClientMaxBodySize: "5gb",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "media.licdn.com" },
      { protocol: "https", hostname: "dms.licdn.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "yt3.ggpht.com" },
      { protocol: "https", hostname: "yt3.googleusercontent.com" },
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "**.twimg.com" },
    ],
  },
};

export default nextConfig;

if (process.env.NODE_ENV !== "production") {
  void import("@opennextjs/cloudflare").then((m) =>
    m.initOpenNextCloudflareForDev()
  );
}
EOF

# Standalone tsconfig
cat > "$OUT/tsconfig.json" <<'EOF'
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "src/**/*.ts",
    "src/**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
EOF

# Standalone package.json
cat > "$OUT/package.json" <<'EOF'
{
  "name": "beone-analytics",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001 --webpack",
    "build": "next build --webpack",
    "build:cloudflare": "OPENNEXT_CLOUDFLARE=1 opennextjs-cloudflare build",
    "start": "next start --port 3001",
    "lint": "eslint",
    "deploy": "npm run build:cloudflare && bash scripts/cloudflare-deploy.sh",
    "ci:cloudflare": "bash scripts/cloudflare-ci.sh"
  },
  "dependencies": {
    "@opennextjs/cloudflare": "^1.19.11",
    "@xenova/transformers": "^2.17.2",
    "bcryptjs": "^3.0.3",
    "clsx": "^2.1.1",
    "date-fns": "^4.4.0",
    "html2canvas": "^1.4.1",
    "jspdf": "^4.2.1",
    "jspdf-autotable": "^5.0.8",
    "lucide-react": "^1.17.0",
    "next": "16.2.7",
    "next-auth": "^5.0.0-beta.31",
    "openai": "^6.42.0",
    "pptxgenjs": "^4.0.1",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "recharts": "^3.8.1",
    "xlsx": "^0.18.5",
    "wrangler": "^4.100.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.7",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
EOF

# Fix wrangler schema path
sed -i '' 's|"../../node_modules/wrangler/config-schema.json"|"node_modules/wrangler/config-schema.json"|' "$OUT/wrangler.jsonc"

# Standalone globals.css
cat > "$OUT/src/app/globals.css" <<'EOF'
@import "tailwindcss";
@source "../**/*.{js,ts,jsx,tsx,mdx}";

:root {
  --brand-ink: #181820;
  --brand-paper: #faf7f1;
  --brand-stage: #141319;
  --brand-off-white: #f4f2ec;
  --brand-indigo: #7c78ff;
  --brand-indigo-bright: #8a6cff;
  --brand-muted: #6f6e7a;
  --brand-border: #2b2a31;
  --background: var(--brand-paper);
  --foreground: var(--brand-ink);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-brand-ink: var(--brand-ink);
  --color-brand-paper: var(--brand-paper);
  --color-brand-stage: var(--brand-stage);
  --color-brand-off-white: var(--brand-off-white);
  --color-brand-indigo: var(--brand-indigo);
  --color-brand-indigo-bright: var(--brand-indigo-bright);
  --color-brand-muted: var(--brand-muted);
  --color-brand-border: var(--brand-border);
  --font-sans: var(--font-brand-sans), var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-brand-mono), var(--font-geist-mono), ui-monospace, monospace;
  --font-serif: var(--font-dm-serif), ui-serif, Georgia, serif;
}

body {
  background: var(--background);
  color: var(--foreground);
}

.brand-surface {
  background: var(--brand-paper);
  color: var(--brand-ink);
}

.brand-card {
  border-color: rgb(24 24 32 / 0.08);
  background: #fffefb;
}

.brand-accent-gradient {
  background: linear-gradient(
    90deg,
    #ff6b47 0%,
    #8a6cff 42%,
    #6c8bff 72%,
    #27d3e0 100%
  );
}

@media print {
  aside {
    display: none !important;
  }

  main {
    overflow: visible !important;
  }
}
EOF

# Remove analytics redirect from auth config (standalone only serves analytics)
python3 - "$OUT" <<'PY'
import sys
from pathlib import Path
path = Path(sys.argv[1]) / "src/lib/auth/auth.config.ts"
text = path.read_text()
start = text.find("      const analyticsAppUrl = getAnalyticsAppUrl();")
if start != -1:
    end = text.find("      const isLoggedIn", start)
    text = text[:start] + text[end:]
text = text.replace(
    'import { getAnalyticsAppUrl } from "@/lib/analytics-app-url";\n', ""
)
path.write_text(text)
PY

# README
cat > "$OUT/README.md" <<'EOF'
# BeOne Analytics

Standalone social media analytics and reporting dashboard for BeOne.

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars   # add AUTH_SECRET
npm run dev
```

Open http://localhost:3001

## Deploy to Cloudflare

```bash
npm run deploy
```

Worker name: `digitaltest-analytics`

Set `AUTH_SECRET` and `AUTH_URL` in Cloudflare dashboard for the analytics worker.
EOF

cat > "$OUT/.gitignore" <<'EOF'
node_modules
.next
.open-next
.wrangler
.dev.vars
.env*.local
*.log
.DS_Store
EOF

if [ -f "$ROOT/.dev.vars.example" ]; then
  copy ".dev.vars.example" ".dev.vars.example"
fi

echo "Done. Standalone repo at $OUT"
