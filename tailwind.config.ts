import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#00c853',
        'brand-dark': '#00a63e',
        'text-primary': '#364153',
        'text-secondary': '#4a5565',
        'text-light': '#6a7282',
        'text-footer': '#99a1af',
        black: '#101828',
        white: '#fefefe',
      },
      fontFamily: {
        sans: ['Noto Sans', 'Arial', 'sans-serif'],
      },
      fontSize: {
        hero: ['72px', { lineHeight: '120%', fontWeight: '700' }],
        section: ['48px', { lineHeight: '100%', fontWeight: '700' }],
        'card-title': ['24px', { lineHeight: '32px', fontWeight: '700' }],
      },
      borderRadius: {
        card: '16px',
        button: '12px',
        pill: '24px',
      },
      boxShadow: {
        card: '0 4px 8px rgba(0,0,0,0.14)',
        'card-hover': '0 4px 8px rgba(0,0,0,0.3)',
      },
      maxWidth: {
        container: '1360px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-from-top': {
          '0%': { transform: 'translateY(-16px)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
