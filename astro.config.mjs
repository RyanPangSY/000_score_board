// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  site: 'https://RyanPangSY.github.io',
  vite: {
    server: {
      proxy: {
        '/api': 'http://localhost:4321',
      },
    },
  },
  base: '000_score_board',
});
