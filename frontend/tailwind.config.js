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
  			surface: 'rgba(1, 25, 31, 0.8)',
  			border: 'rgba(211, 171, 57, 0.15)',
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
  		}
  	}
  },
  plugins: [],
}