/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#001115',
          gold: '#d3ab39',
        },
      },
    },
  },
  plugins: [],
}