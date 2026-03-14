import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-text-muted font-medium">{label}</label>}
      <input
        {...props}
        className={`bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${error ? 'border-red-500' : ''} ${className}`}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, children, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-text-muted font-medium">{label}</label>}
      <select
        {...props}
        className={`bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors ${className}`}
      >
        {children}
      </select>
    </div>
  );
}
