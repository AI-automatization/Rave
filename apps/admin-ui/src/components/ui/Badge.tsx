interface BadgeProps {
  variant?: 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gray' | 'orange';
  dot?: boolean;
  children: React.ReactNode;
}

const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
  green:  'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  red:    'bg-red-500/10 text-red-400 ring-red-500/20',
  yellow: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  blue:   'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  purple: 'bg-violet-500/10 text-violet-400 ring-violet-500/20',
  orange: 'bg-orange-500/10 text-orange-400 ring-orange-500/20',
  gray:   'bg-white/[0.06] text-text-muted ring-white/[0.08]',
};

const dots: Record<NonNullable<BadgeProps['variant']>, string> = {
  green: 'bg-emerald-400', red: 'bg-red-400', yellow: 'bg-amber-400',
  blue: 'bg-blue-400', purple: 'bg-violet-400', orange: 'bg-orange-400', gray: 'bg-text-muted',
};

export function Badge({ variant = 'gray', dot, children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset tracking-wide ${variants[variant]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dots[variant]}`} />}
      {children}
    </span>
  );
}
