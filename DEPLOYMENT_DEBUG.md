# Deployment Debug Guide

## Problem 1: fyrk.no shows whole site instead of temporary landing page

### Check GitHub Pages Settings:
1. Go to: https://github.com/carlfrankalbert/nettside_fyrk/settings/pages
2. Verify:
   - **Source:** GitHub Actions
   - **Environment:** `github-pages` (this deploys from `main` branch)
   - **Custom domain:** `fyrk.no`

### Verify Main Branch:
```bash
git checkout main
cat src/pages/index.astro
# Should show temporary landing page (LandingLogo component only)
```

### Force Redeploy:
```bash
git checkout main
git commit --allow-empty -m "Force redeploy"
git push origin main
```

### Check GitHub Actions:
- Go to: https://github.com/carlfrankalbert/nettside_fyrk/actions
- Find "Deploy to GitHub Pages" workflow
- Verify it's deploying from `main` branch
- Check that it completed successfully

## Problem 2: fyrk.no/test shows 404 or "Tilgang begrenset"

### Verify Test Route Exists:
```bash
git checkout develop
ls src/pages/test/index.astro
# Should exist and contain test environment code
```

### Check IP Whitelisting:
1. Go to: https://github.com/carlfrankalbert/nettside_fyrk/settings/secrets/actions
2. Verify `WHITELISTED_IPS` secret exists and contains your IP
3. Check your IP at: https://api.ipify.org
4. Make sure IP is correctly formatted (comma-separated if multiple)

### Verify Develop Branch:
```bash
git checkout develop
cat src/pages/test/index.astro
# Should show full website with IP whitelisting check
```

### Force Redeploy:
```bash
git checkout develop
git commit --allow-empty -m "Force redeploy"
git push origin develop
```

## Problem 3: test.fyrk.no shows 404 (Legacy - bruk fyrk.no/test i stedet)

> **Note:** Testmiljøet er nå flyttet til `fyrk.no/test`. Se Problem 2 over.

### Option A: GitHub Pages Preview Environment
1. Go to: https://github.com/carlfrankalbert/nettside_fyrk/settings/pages
2. Check if `preview` environment exists
3. If not, the `deploy-preview.yml` workflow should create it
4. Verify DNS CNAME: `test` → `carlfrankalbert.github.io`

## Quick Fix Commands

### For fyrk.no (main branch):
```bash
git checkout main
git commit --allow-empty -m "Force redeploy fyrk.no"
git push origin main
```

### For fyrk.no/test (develop branch):
```bash
git checkout develop
git commit --allow-empty -m "Force redeploy fyrk.no/test"
git push origin develop
```

## Verify Deployments

### Check GitHub Actions:
- Main: https://github.com/carlfrankalbert/nettside_fyrk/actions/workflows/deploy.yml
- Develop: https://github.com/carlfrankalbert/nettside_fyrk/actions/workflows/deploy-test.yml

### Check Test Route:
```bash
# Test tilgjengelighet
curl -I https://fyrk.no/test

# Sjekk IP whitelisting (skal vise innhold hvis whitelisted)
curl https://fyrk.no/test
```

## Common Issues

1. **GitHub Pages caching:** Wait 5-10 minutes after deployment
2. **DNS propagation:** Can take up to 48 hours (usually faster)
3. **Wrong branch:** Verify GitHub Pages is set to correct branch/environment
4. **Workflow not running:** Check Actions tab for errors

