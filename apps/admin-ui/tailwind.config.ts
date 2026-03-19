import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#3b82f6',
        'accent-hover': '#2563eb',
        bg: '#09090b',
        surface: '#111113',
        overlay: '#1c1c1f',
        border: '#27272a',
        'border-light': '#3f3f46',
        'text-muted': '#71717a',
        'text-dim': '#52525b',
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
