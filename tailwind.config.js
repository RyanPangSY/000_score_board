/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte,md,mdx}'],
  theme: {
    extend: {
      colors: {
        'robocon-red': 'rgb(255, 110, 90)', // Rulebook Red
        'robocon-blue': 'rgb(90, 110, 200)', // Rulebook Blue
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
      },
    },
  },
  plugins: [],
};