# Deploy to Production

## Trigger

Automatic on push to `main`, via Cloudflare **Workers Builds** (the Git
integration on the `nettside-fyrk` Worker). It shows up as a commit check on
the merge commit.

## Steps

1. Push/merge to `main`
2. Workers Builds runs `npm run build`, then `npx wrangler deploy`
3. The Worker serves static pages from `dist/client` and the server routes
   (`/api/*`, `/stats`, `/beta`, `/feature-toggles`) from `dist/server`
4. Smoke tests run against production (`smoke-test.yml`, daily at 06:00 UTC)

## Manual deploy

```bash
npm run deploy   # astro build && wrangler deploy
```

Requires `npx wrangler login` (or `CLOUDFLARE_API_TOKEN`).

## Preview deploys

Workers Builds uploads a preview version for non-production branches and posts
its `*.workers.dev` URL on the commit.

## Rollback

1. Cloudflare dashboard → Workers & Pages → `nettside-fyrk` → Deployments
2. Pick the previous version → "Rollback"

Or: `npx wrangler rollback`. Or revert the commit and push to `main`.

## Configuration

| What | Where |
|------|-------|
| Worker name, KV binding, compatibility date, custom domains (`fyrk.no`, `www.fyrk.no`) | `wrangler.jsonc` |
| `www.fyrk.no` → `fyrk.no` 301 | Cloudflare Redirect Rule on the `fyrk.no` zone (static assets are served before the Worker runs, so it cannot live in code) |
| Secrets (`ANTHROPIC_API_KEY`, `STATS_TOKEN`, `FEATURE_TOGGLE_TOKEN`, `BETA_TOKEN`) | Worker → Settings → Variables and Secrets, or `npx wrangler secret put` |
| Build-time variables (`PUBLIC_SENTRY_*`) | Worker → Settings → Build → Variables |
| Full list of runtime names | `.dev.vars.example` (also the source for `npm run cf-typegen`) |

After changing `wrangler.jsonc` or `.dev.vars.example`, run `npm run cf-typegen`
and commit the regenerated `worker-configuration.d.ts`.

## Verification

- Check production URL: https://fyrk.no
- `GET /api/health` reports API key, KV and rate limiter status
- Check the Worker's Deployments tab for build status
- Smoke tests run automatically and report failures

## Ownership

Maintained by the FYRK team. Deploy pipeline owned by Cloudflare Workers Builds.
