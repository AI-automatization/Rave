// The VB "docked" in the app window: the room page tells the app where its video area is (CSS pixels, relative to the
// web content view); the app places the VB page exactly there. Pure helpers, unit-tested (test/vb-dock-model.test.ts).

export interface Rect { x: number; y: number; width: number; height: number }

const MAX_COORD = 20_000;
const MIN_SIDE = 40;

/** A rectangle from the web page → whole numbers, or null (hide the dock) for anything that is not a sane rectangle. */
export function parseDockRect(raw: unknown): Rect | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const vals = [r['x'], r['y'], r['width'], r['height']];
  if (!vals.every((v) => typeof v === 'number' && Number.isFinite(v))) return null;
  const [x, y, width, height] = (vals as number[]).map((v) => Math.round(v)) as [number, number, number, number];
  if (width < MIN_SIDE || height < MIN_SIDE) return null;
  if (Math.abs(x) > MAX_COORD || Math.abs(y) > MAX_COORD || width > MAX_COORD || height > MAX_COORD) return null;
  return { x, y, width, height };
}

/** Web content view coordinates → window coordinates (the content view's own top-left is added). */
export function toWindowRect(r: Rect, origin: { x: number; y: number }): Rect {
  return { x: r.x + origin.x, y: r.y + origin.y, width: r.width, height: r.height };
}

/**
 * Where the docked VB goes while its player is full screen. The VB is being captured for the room, and Chromium then
 * keeps a full-screen page at 16:9 of the VIEW's width, centred in the view, whatever the view's height (measured
 * 2026-11-13: views 1470×923, 1470×956 and 1470×826 all gave a 1470×826 page; 1200 wide gave 1200×675). So the view is
 * made exactly 16:9 itself: as wide as the window and sitting on its bottom edge, the player's controls are at the
 * bottom of the screen like a normal full screen (the black backdrop fills the band above). A window narrower than 16:9
 * gets the full height, centred.
 */
export function fullscreenDockRect(w: number, h: number): Rect {
  const pageH = Math.floor((w * 9) / 16); // floor: Chromium gave 826 for 1470 (826.875)
  if (pageH <= h) return { x: 0, y: h - pageH, width: w, height: pageH };
  const pageW = Math.floor((h * 16) / 9);
  return { x: Math.round((w - pageW) / 2), y: 0, width: pageW, height: h };
}
