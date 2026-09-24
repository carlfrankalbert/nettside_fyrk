import process from 'node:process';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    sitemap({
      filter: (page) =>
        !page.includes('/stats') &&
        !page.includes('/feature-toggles') &&
        !page.includes('/beta') &&
        !page.includes('/api/'),
    }),
  ],
  // Disabled while Playwright drives the dev server, so the overlay stays out
  // of visual baselines and accessibility scans.
  devToolbar: { enabled: process.env.ASTRO_DEV_TOOLBAR !== 'false' },
  output: 'static',
  adapter: cloudflare({ imageService: 'compile' }),
  // No Astro sessions in use; otherwise the adapter adds a SESSION KV binding
  // and wrangler provisions an empty namespace for it on deploy.
  session: false,
  site: 'https://fyrk.no'
});

