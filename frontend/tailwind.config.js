/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Nomes semânticos universais para o seu ecossistema
        background: '#001217',     // O fundo principal do app
        surface: 'rgb(0, 18, 23, 07)',        // O fundo sólido dos cards/painéis
        border: 'rgba(212, 171, 58)', // A linha sutil dos elementos
        
        brand: {
          primary: '#001115',
          secondary: '#01191f',
          accent: '#d3ab39',       // O seu dourado de destaque/ação
        },

        text: {
          primary: '#ffffff',      // Títulos e textos principais
          secondary: '#94a3b8',    // Descrições e subtextos
          muted: '#64748b',        // Textos desativados ou labels pequenas
        }
      },
    },
  },
  plugins: [],
}