// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import indexnow from 'astro-indexnow';

export default defineConfig({
  site: 'https://odps-validator.com',
  integrations: [
    react(),
    sitemap(),
    indexnow({
      host: 'odps-validator.com',
      key: '62aba8d483f849bd87bafc35f5141bec'
    })
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
