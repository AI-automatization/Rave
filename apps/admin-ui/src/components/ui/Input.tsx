import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, hint, icon, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-text-muted tracking-wide">{label}</label>}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none">
            {icon}
          </span>
        )}
        <input
          {...props}
          className={`w-full bg-surface border rounded-xl px-3 py-2.5 text-sm text-white placeholder-text-dim
            focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50
            transition-all duration-150
            ${error ? 'border-red-500/50 focus:ring-red-500/20 focus:border-red-500/50' : 'border-border hover:border-border-md'}
            ${icon ? 'pl-9' : ''}
            ${className}`}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-text-dim">{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, children, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-text-muted tracking-wide">{label}</label>}
      <select
        {...props}
        className={`bg-surface border border-border hover:border-border-md rounded-xl px-3 py-2.5 text-sm text-white
          focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50
          transition-all duration-150 ${className}`}
      >
        {children}
      </select>
    </div>
  );
}
