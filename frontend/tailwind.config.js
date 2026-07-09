/** @type {import('tailwindcss').Config} */
export default {
 content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <-- Garanta que essa linha exista
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#00181f',
          gold: '#d3ab39',
        },
      },
    },
  },
  plugins: [],
}