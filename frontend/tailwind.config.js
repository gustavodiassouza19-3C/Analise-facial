/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Certifique-se de que a pasta onde está seu código está mapeada aqui!
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#00090b',
          gold: '#D3AB39',
        }
      }
    },
  },
  plugins: [],
}