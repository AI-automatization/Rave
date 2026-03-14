import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#E50914',
        'primary-hover': '#b8070f',
        bg: '#0A0A0F',
        surface: '#111118',
        overlay: '#16161F',
        gold: '#FFD700',
        diamond: '#88CCFF',
        border: '#1e1e2a',
        'text-muted': '#6b7280',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
