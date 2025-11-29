import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  output: 'static',
  // For GitHub Pages, uncomment the base if deploying to a subdirectory:
  // base: '/nettside_fyrk',
  // For custom domain (fyrk.no), use:
  site: 'https://fyrk.no'
});

