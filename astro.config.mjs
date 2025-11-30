import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

/**
 * Astro Configuration for GitHub Pages
 * 
 * Dette prosjektet deployes til GitHub Pages med to miljøer:
 * - Dev: deploy-dev.yml → dev branch
 * - Prod: deploy-prod.yml → main branch
 * 
 * Site URL:
 * - Standard: GitHub Pages URL (carlfrankalbert.github.io/nettside_fyrk)
 * - Custom domain: Sett via SITE environment variable i GitHub Actions workflows
 * 
 * Base Path:
 * - Hvis du deployer til subdirectory (f.eks. /nettside_fyrk), uncomment base linjen under
 * - For root domain (fyrk.no), la base være undefined eller tom
 * 
 * Custom Domain Setup:
 * 1. Sett SITE secret i GitHub repository settings (Settings → Secrets → Actions)
 * 2. Legg til CNAME fil i public/ mappen med ditt domene
 * 3. Konfigurer DNS CNAME record til GitHub Pages
 * 4. GitHub Pages vil automatisk håndtere SSL-certifikat
 */
const siteUrl = process.env.SITE || 'https://fyrk.no';

export default defineConfig({
  integrations: [tailwind()],
  output: 'static',
  
  // Base path for GitHub Pages subdirectory deployment
  // Uncomment hvis du deployer til subdirectory (f.eks. /nettside_fyrk):
  // base: '/nettside_fyrk',
  
  // Site URL - settes via SITE environment variable i GitHub Actions
  // Standard: GitHub Pages URL
  // Custom domain: Sett SITE secret i GitHub repository settings
  // Dette brukes for canonical URLs og Open Graph metadata
  site: siteUrl
});

