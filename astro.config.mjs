import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), react(), sitemap()],
  output: 'static',
  adapter: cloudflare({ imageService: 'compile' }),
  site: 'https://fyrk.no'
});

