import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  loading?: boolean;
}

const variantClass: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-accent hover:bg-accent-hover text-white',
  secondary: 'bg-surface hover:bg-overlay text-white border border-border',
  danger: 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30',
  ghost: 'hover:bg-overlay text-text-muted hover:text-white',
};

const sizeClass: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
};

export function Button({ variant = 'secondary', size = 'md', loading, children, disabled, className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled ?? loading}
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClass[variant]} ${sizeClass[size]} ${className}`}
    >
      {loading && (
        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
