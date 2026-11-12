// Shared DM formatting helpers — single source of truth, ported from mobile's
// apps/mobile/src/utils/dmFormat.ts. Was previously duplicated between
// ConversationList.tsx and ChatWindow.tsx (see T-S122).

export const PALETTE = ['#7B72F8', '#F87171', '#34D399', '#FBBF24', '#60A5FA', '#F472B6', '#A78BFA'];

// Deterministic hash → stable color per user id. Null-safe (a conversation/peer
// id can be momentarily undefined during optimistic renders).
export function memberColor(id: string | undefined | null): string {
  if (!id) return PALETTE[0];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

// Local HH:MM, zero-padded 24-hour — matches mobile's formatTime exactly.
export function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  } catch {
    return '';
  }
}

// Coarse relative time for conversation list rows (<1m / Nm / Nh / Nd).
export function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return '<1m';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}
