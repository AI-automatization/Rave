interface BadgeProps {
  variant?: 'green' | 'red' | 'yellow' | 'blue' | 'gray';
  children: React.ReactNode;
}

const variantClass: Record<NonNullable<BadgeProps['variant']>, string> = {
  green: 'bg-green-500/15 text-green-400 ring-green-500/20',
  red: 'bg-red-500/15 text-red-400 ring-red-500/20',
  yellow: 'bg-yellow-500/15 text-yellow-400 ring-yellow-500/20',
  blue: 'bg-blue-500/15 text-blue-400 ring-blue-500/20',
  gray: 'bg-gray-500/15 text-gray-400 ring-gray-500/20',
};

export function Badge({ variant = 'gray', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${variantClass[variant]}`}>
      {children}
    </span>
  );
}
