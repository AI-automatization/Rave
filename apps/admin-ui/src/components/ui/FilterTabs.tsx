interface TabOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterTabsProps {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterTabs({ options, value, onChange, className = '' }: FilterTabsProps) {
  return (
    <div className={`inline-flex items-center gap-px bg-surface rounded-xl p-1 ${className}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[12px] font-medium transition-all duration-150 whitespace-nowrap ${
            value === opt.value
              ? 'bg-raised text-white shadow-xs'
              : 'text-[#6b6b8a] hover:text-[#c4c3dc] hover:bg-white/[0.03]'
          }`}
        >
          {opt.label}
          {opt.count != null && (
            <span className={`tabular-nums text-[10px] font-normal ${
              value === opt.value ? 'text-text-dim' : 'text-text-ghost'
            }`}>
              {opt.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
