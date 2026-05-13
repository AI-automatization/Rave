import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Core surfaces ───────────────────────────────────────
        'void':    '#05050d',
        'bg':      '#08081a',
        'surface': '#0c0c1e',
        'overlay': '#10102a',
        'card':    '#0e0e22',
        'raised':  '#131332',

        // ── Accent ─────────────────────────────────────────────
        'accent':       '#6C63FF',
        'accent-hover': '#7B74FF',
        'accent-dim':   '#5248E0',
        'accent-muted': 'rgba(108,99,255,0.12)',

        // ── Semantic ────────────────────────────────────────────
        'success': '#22C55E',
        'warning': '#F59E0B',
        'danger':  '#EF4444',
        'info':    '#3B82F6',

        // ── Borders ─────────────────────────────────────────────
        'border':    'rgba(255,255,255,0.055)',
        'border-md': 'rgba(255,255,255,0.10)',
        'border-lg': 'rgba(255,255,255,0.15)',

        // ── Text ────────────────────────────────────────────────
        'text-primary': '#F4F4FC',
        'text-muted':   '#8886AA',
        'text-dim':     '#4E4D6A',
        'text-ghost':   '#302F4E',
      },

      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },

      fontSize: {
        '2xs': ['10px', '14px'],
        'xs':  ['11px', '16px'],
        'sm':  ['13px', '20px'],
        'base':['14px', '22px'],
        'md':  ['15px', '22px'],
        'lg':  ['16px', '24px'],
        'xl':  ['18px', '26px'],
        '2xl': ['22px', '30px'],
        '3xl': ['28px', '36px'],
        '4xl': ['36px', '44px'],
      },

      letterSpacing: {
        tight: '-0.02em',
        snug:  '-0.01em',
        wider: '0.06em',
        widest:'0.10em',
      },

      borderRadius: {
        DEFAULT: '10px',
        'sm':  '7px',
        'md':  '10px',
        'lg':  '14px',
        'xl':  '18px',
        '2xl': '24px',
        '3xl': '32px',
        'full':'9999px',
      },

      spacing: {
        '0.5':  '2px',
        '1':    '4px',
        '1.5':  '6px',
        '2':    '8px',
        '2.5':  '10px',
        '3':    '12px',
        '3.5':  '14px',
        '4':    '16px',
        '5':    '20px',
        '6':    '24px',
        '7':    '28px',
        '8':    '32px',
        '9':    '36px',
        '10':   '40px',
        '11':   '44px',
        '12':   '48px',
        '14':   '56px',
        '16':   '64px',
        '18':   '72px',
        '20':   '80px',
        '24':   '96px',
        '28':   '112px',
        '32':   '128px',
      },

      boxShadow: {
        'xs':         '0 1px 2px rgba(0,0,0,0.3)',
        'sm':         '0 2px 8px rgba(0,0,0,0.35)',
        'card':       '0 0 0 1px rgba(255,255,255,0.055), 0 4px 20px rgba(0,0,0,0.5)',
        'card-hover': '0 0 0 1px rgba(108,99,255,0.25), 0 8px 32px rgba(0,0,0,0.6)',
        'card-focus': '0 0 0 2px rgba(108,99,255,0.4)',
        'modal':      '0 0 0 1px rgba(255,255,255,0.08), 0 24px 80px rgba(0,0,0,0.8)',
        'glow-sm':    '0 0 16px rgba(108,99,255,0.20)',
        'glow-md':    '0 0 32px rgba(108,99,255,0.28)',
        'glow-lg':    '0 0 64px rgba(108,99,255,0.20)',
        'inset-t':    'inset 0 1px 0 rgba(255,255,255,0.07)',
        'inset-all':  'inset 0 0 0 1px rgba(255,255,255,0.07)',
        'none':       'none',
      },

      animation: {
        'fade-in':     'fadeIn 0.15s cubic-bezier(0.16,1,0.3,1)',
        'fade-out':    'fadeOut 0.12s ease-in',
        'slide-up':    'slideUp 0.20s cubic-bezier(0.16,1,0.3,1)',
        'slide-down':  'slideDown 0.20s cubic-bezier(0.16,1,0.3,1)',
        'scale-in':    'scaleIn 0.18s cubic-bezier(0.16,1,0.3,1)',
        'spin-slow':   'spin 1.8s linear infinite',
        'pulse-slow':  'pulse 2.5s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer':     'shimmer 2s linear infinite',
        'float':       'float 6s ease-in-out infinite',
      },

      keyframes: {
        fadeIn:   { from: { opacity: '0' },                                          to: { opacity: '1' } },
        fadeOut:  { from: { opacity: '1' },                                          to: { opacity: '0' } },
        slideUp:  { from: { opacity: '0', transform: 'translateY(10px)' },           to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown:{ from: { opacity: '0', transform: 'translateY(-10px)' },          to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:  { from: { opacity: '0', transform: 'scale(0.94)' },               to: { opacity: '1', transform: 'scale(1)' } },
        shimmer:  { from: { backgroundPosition: '-200% 0' },                         to: { backgroundPosition: '200% 0' } },
        float:    { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
      },

      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
