/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
  	extend: {
  		colors: {
  			background: '#0a0a0a',
  			'card-bg': '#141414',
  			'chart-track': '#1a1a1a',
  			surface: 'rgba(10, 10, 10, 0.8)',
  			border: 'rgba(211, 171, 57, 0.08)',
  			brand: {
  				primary: '#0a0a0a',
  				secondary: '#303030',
  				accent: '#d3ab39'
  			},
  			text: {
  				primary: '#ffffff',
  				secondary: '#94a3b8',
  				muted: '#64748b'
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
  		keyframes: {
  			shimmer: {
  				'0%': { backgroundPosition: '-200% 0' },
  				'100%': { backgroundPosition: '200% 0' },
  			},
  			'fade-in': {
  				'0%': { opacity: '0', transform: 'translateY(12px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' },
  			},
  		},
  		animation: {
  			shimmer: 'shimmer 3s ease-in-out infinite',
  			'fade-in': 'fade-in 0.6s ease-out forwards',
  		},
  	}
  },
  plugins: [],
}
