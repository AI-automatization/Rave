// WeWatch Mobile — Virtual Browser geometry helpers (pure, unit-tested).
// The server frame is rendered with resizeMode="contain", so when the container aspect differs
// from the server viewport's there are letterbox bars; touch coords must be mapped from the
// *rendered image rect*, not the whole container.

export interface Size { width: number; height: number }

/** Rect the contain-fitted frame occupies inside a container of `layout` size. */
export function containRect(layout: Size, dims: Size): { x: number; y: number; width: number; height: number; scale: number } {
  const scale = Math.min(layout.width / dims.width, layout.height / dims.height);
  const width = dims.width * scale;
  const height = dims.height * scale;
  return { x: (layout.width - width) / 2, y: (layout.height - height) / 2, width, height, scale };
}

/** Container-local touch point -> server viewport pixel. null when outside the image (letterbox). */
export function toViewportPoint(localX: number, localY: number, layout: Size | null, dims: Size | null): { x: number; y: number } | null {
  if (!layout || !dims || layout.width <= 0 || layout.height <= 0 || dims.width <= 0 || dims.height <= 0) return null;
  const r = containRect(layout, dims);
  const ix = localX - r.x;
  const iy = localY - r.y;
  if (ix < 0 || iy < 0 || ix > r.width || iy > r.height) return null;
  return {
    x: Math.min(dims.width - 1, Math.round(ix / r.scale)),
    y: Math.min(dims.height - 1, Math.round(iy / r.scale)),
  };
}

/** Player height for a frame of `dims`, fitted to `width` and capped at `maxHeight` (no cropping: contain). */
export function frameHeight(width: number, dims: Size | null, maxHeight: number, fallbackRatio = 9 / 16): number {
  const ratio = dims && dims.width > 0 ? dims.height / dims.width : fallbackRatio;
  return Math.round(Math.max(1, Math.min(width * ratio, maxHeight)));
}

/** Finger delta (screen px) -> server wheel delta: inverted (drag up scrolls down) and scaled to viewport px. */
export function dragToWheel(dx: number, dy: number, scale: number): { deltaX: number; deltaY: number } {
  const s = scale > 0 ? 1 / scale : 1;
  return { deltaX: Math.round(-dx * s) + 0, deltaY: Math.round(-dy * s) + 0 };
}
