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
        type="button"
        onClick={onPress}
        className="cursor-pointer rounded-full border border-[var(--ww-line)] bg-[var(--ww-panel)] px-3 py-1 text-[11px] font-semibold text-[var(--ww-text-3)] backdrop-blur-md transition-colors hover:text-[var(--ww-text)]"
      >
        {label}
      </button>
    </div>
  );
}
