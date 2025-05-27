// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
// export default defineConfig({});


/** @type {import('tailwindcss').Config} */
export default {
    integrations: [tailwind()],
    content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte,md,mdx}'],
    theme: {
        extend: {
            colors: {
                'robocon-red': 'rgb(255, 110, 90)', // Rulebook Red
                'robocon-blue': 'rgb(90, 110, 200)', // Rulebook Blue
            },
        },
    },
    plugins: [],
};