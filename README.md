# Best Pharma Co. DigitalTest

Fictional pharma demo environment — corporate social analytics, CEO profiles, Wikipedia monitoring, and admin console. All company names, posts, and Wikipedia content are fabricated for sales demonstrations.

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars   # add AUTH_SECRET and optional APIFY_TOKEN
npm run seed:demo                # write fictional post/analytics caches
npm run dev
```

Open http://localhost:3004

## Demo company

| Item | Value |
|------|--------|
| Company | Best Pharma Co. |
| CEO | Elena Marshall |
| LinkedIn | `best-pharma-co` |
| Instagram | `@bestpharmacoco` |
| Facebook | facebook.com/BestPharmaCo |
| X | `@BestPharmaCo` |
| YouTube | `@BestPharmaCo` |
| TikTok | `@bestpharmacoco` |
| Wikipedia (corporate) | Fictional demo article |
| Wikipedia (CEO) | Fictional demo article |

Client-specific settings live in `src/lib/client.ts`.

## Seed demo data

```bash
npm run seed:demo
```

Writes fictional posts to `data/linkedin-posts.json`, `data/social-posts.json`, and `data/founder-social-posts.json`.

## Deploy to Cloudflare

Worker name: `best-pharma-co-digitaltest` (update `wrangler.jsonc` after forking)

1. Create a new KV namespace: `npx wrangler kv namespace create APP_DATA_KV`
2. Update `wrangler.jsonc` with the returned IDs
3. Add `AUTH_SECRET` under Worker → Settings → Variables and Secrets
