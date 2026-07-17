/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
  	extend: {
  		colors: {
  			background: '#000000',
  			'card-bg': '#0a0a0a',
  			'chart-track': '#141414',
  			surface: 'rgba(0, 0, 0, 0.8)',
  			border: 'rgba(212, 175, 55, 0.10)',
  			brand: {
  				primary: '#000000',
  				secondary: '#1a1a1a',
  				accent: '#D4AF37'
  			},
  			text: {
  				primary: '#ffffff',
  				secondary: '#a0a0a0',
  				muted: '#666666'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			urbanist: ['Urbanist', 'sans-serif'],
  			playfair: ['Playfair Display', 'serif'],
  			montenegrin: ['"Montenegrin Gothic One"', 'serif'],
  			'noto-sans': ['"Noto Sans JP"', 'sans-serif'],
  			alpino: ['Alpino', 'sans-serif'],
  		},
  		keyframes: {
  			shimmer: {
  				'0%': { backgroundPosition: '-200% 0' },
  				'100%': { backgroundPosition: '200% 0' },
  			},
  			'fade-in': {
  				'0%': { opacity: '0', transform: 'translateY(12px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' },
  			},
  			'glow-pulse': {
  				'0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' },
  				'50%': { boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' },
  			},
  		},
  		animation: {
  			shimmer: 'shimmer 3s ease-in-out infinite',
  			'fade-in': 'fade-in 0.6s ease-out forwards',
  			'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
  		},
  	}
  },
  plugins: [],
}
