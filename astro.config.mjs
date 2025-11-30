import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// Determine site URL based on environment
const siteUrl = process.env.SITE || 'https://fyrk.no';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  output: 'static',
  // For GitHub Pages, uncomment the base if deploying to a subdirectory:
  // base: '/nettside_fyrk',
  // For custom domain, use environment variable:
  site: siteUrl
});

