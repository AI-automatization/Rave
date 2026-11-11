// Where the main window was when it was last closed. Pure (no Electron import), unit-tested.
// The saved rectangle is only used if it is sane AND still mostly on a connected display (a monitor may be gone).

export interface WindowBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const MAX_SIDE = 16_384;
const MIN_VISIBLE = 120; // px of the window that must still be on a display in each direction

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 100_000;

/** The saved bounds if they can be used on the displays connected now, otherwise null (the default size and place). */
export function restoreBounds(raw: unknown, displays: readonly WindowBounds[], min: { width: number; height: number }): WindowBounds | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { x, y, width, height } = raw as Record<string, unknown>;
  if (!isInt(x) || !isInt(y) || !isInt(width) || !isInt(height)) return null;
  if (width < min.width || height < min.height || width > MAX_SIDE || height > MAX_SIDE) return null;
  const visible = displays.some((d) => {
    const w = Math.min(x + width, d.x + d.width) - Math.max(x, d.x);
    const h = Math.min(y + height, d.y + d.height) - Math.max(y, d.y);
    return w >= MIN_VISIBLE && h >= MIN_VISIBLE;
  });
  return visible ? { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) } : null;
}
