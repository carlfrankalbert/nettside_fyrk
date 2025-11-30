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

## Problem 2: test.fyrk.no shows 404

### Option A: Netlify (Recommended)
1. Go to: https://www.netlify.com
2. Import repository: `carlfrankalbert/nettside_fyrk`
3. Configure:
   - **Branch:** `develop`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Add custom domain: `test.fyrk.no`
5. Update DNS CNAME: `test` → `<netlify-site>.netlify.app`

### Option B: GitHub Pages Preview Environment
1. Go to: https://github.com/carlfrankalbert/nettside_fyrk/settings/pages
2. Check if `preview` environment exists
3. If not, the `deploy-preview.yml` workflow should create it
4. Verify DNS CNAME: `test` → `carlfrankalbert.github.io`

### Verify Develop Branch:
```bash
git checkout develop
cat src/pages/index.astro
# Should show full website (BaseLayout, ServiceCard, etc.)
```

### Force Redeploy:
```bash
git checkout develop
git commit --allow-empty -m "Force redeploy"
git push origin develop
```

## Quick Fix Commands

### For fyrk.no (main branch):
```bash
git checkout main
git commit --allow-empty -m "Force redeploy fyrk.no"
git push origin main
```

### For test.fyrk.no (develop branch):
```bash
git checkout develop
git commit --allow-empty -m "Force redeploy test.fyrk.no"
git push origin develop
```

## Verify Deployments

### Check GitHub Actions:
- Main: https://github.com/carlfrankalbert/nettside_fyrk/actions/workflows/deploy.yml
- Develop: https://github.com/carlfrankalbert/nettside_fyrk/actions/workflows/deploy-preview.yml

### Check DNS:
```bash
dig fyrk.no CNAME
dig test.fyrk.no CNAME
```

## Common Issues

1. **GitHub Pages caching:** Wait 5-10 minutes after deployment
2. **DNS propagation:** Can take up to 48 hours (usually faster)
3. **Wrong branch:** Verify GitHub Pages is set to correct branch/environment
4. **Workflow not running:** Check Actions tab for errors

