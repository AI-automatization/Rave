interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  color?: 'red' | 'blue' | 'green' | 'yellow' | 'purple';
  sub?: string;
}

const colorClass: Record<NonNullable<StatCardProps['color']>, string> = {
  red: 'text-red-400',
  blue: 'text-blue-400',
  green: 'text-green-400',
  yellow: 'text-yellow-400',
  purple: 'text-purple-400',
};

export function StatCard({ label, value, icon, color = 'blue', sub }: StatCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 flex items-start gap-4">
      <div className={`text-3xl ${colorClass[color]}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-text-muted text-xs uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
      </div>
    </div>
  );
}
