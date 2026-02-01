# Deploy to Production

## Trigger

Automatic on push to `main` via `.github/workflows/deploy.yml`.

## Steps

1. Push/merge to `main`
2. GitHub Actions runs: typecheck, lint, build
3. Cloudflare Pages deploys the build output
4. Smoke tests run against production (`smoke-test.yml`, daily at 06:00 UTC)

## Manual deploy

```bash
npm run build
npx wrangler pages deploy dist/
```

## Preview deploys

PRs get preview URLs automatically via `.github/workflows/deploy-preview.yml`.

## Rollback

1. Go to Cloudflare Pages dashboard
2. Select previous deployment
3. Click "Rollback to this deploy"

Or revert the commit and push to `main`.

## Verification

- Check production URL: https://fyrk.no
- Check Cloudflare Pages dashboard for deploy status
- Smoke tests run automatically and report failures

## Required secrets

| Secret | Where | Description |
|--------|-------|-------------|
| `CLOUDFLARE_API_TOKEN` | GitHub Secrets | Cloudflare Pages deploy token |
| `ANTHROPIC_API_KEY` | Cloudflare env | AI tool API key |

## Ownership

Maintained by the FYRK team. Deploy pipeline owned by CI workflows.
