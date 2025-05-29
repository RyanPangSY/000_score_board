// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
// export default defineConfig({});

/** @type {import('tailwindcss').Config} */
export default defineConfig({
  integrations: [tailwind()],
  site: 'https://RyanPangSY.github.io',
  base: '/000_score_board',
});
