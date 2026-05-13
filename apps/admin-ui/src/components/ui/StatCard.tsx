import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  LIcon?: LucideIcon;
  color?: 'violet' | 'emerald' | 'blue' | 'amber' | 'red' | 'rose';
  trend?: number;
  sub?: string;
  onClick?: () => void;
}

const palettes: Record<NonNullable<StatCardProps['color']>, {
  iconBg: string;
  iconText: string;
  trendColor: string;
}> = {
  violet:  { iconBg: 'bg-violet-500/[0.12]',  iconText: 'text-violet-400',  trendColor: 'text-violet-400' },
  emerald: { iconBg: 'bg-emerald-500/[0.12]',  iconText: 'text-emerald-400', trendColor: 'text-emerald-400' },
  blue:    { iconBg: 'bg-blue-500/[0.12]',     iconText: 'text-blue-400',    trendColor: 'text-blue-400' },
  amber:   { iconBg: 'bg-amber-500/[0.12]',    iconText: 'text-amber-400',   trendColor: 'text-amber-400' },
  red:     { iconBg: 'bg-red-500/[0.12]',      iconText: 'text-red-400',     trendColor: 'text-red-400' },
  rose:    { iconBg: 'bg-rose-500/[0.12]',     iconText: 'text-rose-400',    trendColor: 'text-rose-400' },
};

export function StatCard({
  label,
  value,
  LIcon,
  color = 'violet',
  trend,
  sub,
  onClick,
}: StatCardProps) {
  const p = palettes[color];
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      onClick={onClick}
      className={`
        group relative bg-card rounded-2xl p-5 shadow-card overflow-hidden
        transition-all duration-200
        ${onClick ? 'hover:shadow-card-hover hover:scale-[1.015] cursor-pointer text-left w-full' : ''}
      `}
    >
      {/* Gradient top line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.09] to-transparent" />

      {/* Icon */}
      {LIcon && (
        <div className={`
          w-[38px] h-[38px] rounded-xl flex items-center justify-center mb-3.5 shrink-0
          ${p.iconBg} ${p.iconText}
        `}>
          <LIcon size={17} />
        </div>
      )}

      {/* Value */}
      <p className="text-2xl font-bold text-white tabular-nums leading-none">
        {typeof value === 'number' ? value.toLocaleString('ru') : value}
      </p>

      {/* Label */}
      <p className="text-[12px] font-medium text-text-muted mt-1.5 leading-tight">{label}</p>

      {/* Trend + sub */}
      {(trend != null || sub) && (
        <div className="flex items-center gap-2 mt-2">
          {trend != null && (
            <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {Math.abs(trend)}%
            </span>
          )}
          {sub && (
            <span className="text-[11px] text-text-dim">{sub}</span>
          )}
        </div>
      )}
    </Tag>
  );
}
