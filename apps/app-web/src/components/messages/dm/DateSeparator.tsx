'use client';

interface Props {
  label: string;
  onPress: () => void;
}

// Inline "Today"/"Yesterday"/date pill between message groups — port of mobile's
// DateSeparator.tsx. Clicking opens the jump-to-date calendar (Phase 4).
export function DateSeparator({ label, onPress }: Props) {
  return (
    <div className="flex justify-center py-2">
      <button
        onClick={onPress}
        className="px-3 py-1 rounded-full text-[11px] font-semibold text-white/60 hover:text-white/85 transition-colors cursor-pointer"
        style={{ backgroundColor: 'rgba(28,28,46,0.85)' }}
      >
        {label}
      </button>
    </div>
  );
}
