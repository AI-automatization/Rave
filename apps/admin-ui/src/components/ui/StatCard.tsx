import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: string | React.ReactNode;
  LIcon?: LucideIcon;
  color?: 'violet' | 'emerald' | 'blue' | 'amber' | 'red' | 'rose';
  trend?: number;
  sub?: string;
  onClick?: () => void;
}

const palettes: Record<NonNullable<StatCardProps['color']>, { icon: string; glow: string; text: string }> = {
  violet:  { icon: 'bg-violet-500/15 text-violet-400',  glow: 'shadow-[0_0_20px_rgba(139,92,246,0.12)]',  text: 'text-violet-400' },
  emerald: { icon: 'bg-emerald-500/15 text-emerald-400', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.12)]', text: 'text-emerald-400' },
  blue:    { icon: 'bg-blue-500/15 text-blue-400',       glow: 'shadow-[0_0_20px_rgba(59,130,246,0.12)]', text: 'text-blue-400' },
  amber:   { icon: 'bg-amber-500/15 text-amber-400',     glow: 'shadow-[0_0_20px_rgba(245,158,11,0.12)]', text: 'text-amber-400' },
  red:     { icon: 'bg-red-500/15 text-red-400',         glow: 'shadow-[0_0_20px_rgba(239,68,68,0.12)]',  text: 'text-red-400' },
  rose:    { icon: 'bg-rose-500/15 text-rose-400',       glow: 'shadow-[0_0_20px_rgba(244,63,94,0.12)]',  text: 'text-rose-400' },
};

export function StatCard({ label, value, icon, LIcon, color = 'violet', trend, sub, onClick }: StatCardProps) {
  const p = palettes[color];
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`group relative bg-card rounded-2xl p-5 flex items-start gap-4 shadow-card transition-all duration-200 ${onClick ? 'hover:shadow-card-hover hover:scale-[1.01] cursor-pointer text-left w-full' : ''} ${p.glow}`}
    >
      {/* Subtle top gradient border */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-t-2xl" />

      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg ${p.icon}`}>
        {LIcon ? <LIcon size={18} /> : icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-white tabular-nums">
          {typeof value === 'number' ? value.toLocaleString('ru') : value}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {trend != null && (
            <span className={`flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trend)}%
            </span>
          )}
          {sub && <span className="text-xs text-text-dim">{sub}</span>}
        </div>
      </div>
    </Tag>
  );
}
