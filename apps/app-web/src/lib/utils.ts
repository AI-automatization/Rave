import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const AVATAR_COLORS = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626', '#DB2777', '#0891B2'];

// Deterministic color per username/id — same seed always maps to the same color, so a member's
// avatar color stays stable across the member list, chat, header stack, etc.
export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
