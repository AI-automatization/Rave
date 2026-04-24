import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent:        '#7B72F8',
        'accent-dim':  '#5B52D8',
        'accent-hover':'#6B62E8',
        bg:            '#08080f',
        surface:       '#0e0e1a',
        overlay:       '#14141f',
        card:          '#111120',
        border:        'rgba(255,255,255,0.07)',
        'border-md':   'rgba(255,255,255,0.11)',
        'text-muted':  '#8b8ca8',
        'text-dim':    '#5a5b70',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card':      '0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)',
        'card-hover':'0 0 0 1px rgba(123,114,248,0.3), 0 8px 32px rgba(0,0,0,0.5)',
        'glow':      '0 0 32px rgba(123,114,248,0.25)',
        'glow-sm':   '0 0 14px rgba(123,114,248,0.18)',
        'inset-t':   'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      animation: {
        'fade-in':  'fadeIn 0.18s ease-out',
        'slide-up': 'slideUp 0.22s ease-out',
        'spin-slow':'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};

export default config;
