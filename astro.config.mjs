import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), react()],
  output: 'hybrid',
  adapter: node({
    mode: 'standalone'
  }),
  devToolbar: {
    enabled: true
  },
  // For GitHub Pages, uncomment the base if deploying to a subdirectory:
  // base: '/nettside_fyrk',
  // For custom domain (fyrk.no), use:
  site: 'https://fyrk.no'
});

