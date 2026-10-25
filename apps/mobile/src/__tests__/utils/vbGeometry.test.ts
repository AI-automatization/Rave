// WeWatch Mobile — vbGeometry tests
import { containRect, toViewportPoint, frameHeight, dragToWheel } from '../../utils/vbGeometry';

const phone = { width: 412, height: 846 };

describe('containRect', () => {
  it('pillarboxes a portrait frame in a wide container', () => {
    const r = containRect({ width: 800, height: 400 }, phone);
    expect(r.height).toBeCloseTo(400);
    expect(r.x).toBeGreaterThan(0);
    expect(r.y).toBe(0);
  });
  it('letterboxes a wide frame in a tall container', () => {
    const r = containRect({ width: 400, height: 800 }, { width: 1280, height: 720 });
    expect(r.width).toBeCloseTo(400);
    expect(r.y).toBeGreaterThan(0);
  });
});

describe('toViewportPoint', () => {
  it('maps center to center', () => {
    const p = toViewportPoint(400, 200, { width: 800, height: 400 }, phone);
    expect(p).toEqual({ x: 206, y: 423 });
  });
  it('returns null inside the letterbox bars', () => {
    expect(toViewportPoint(5, 200, { width: 800, height: 400 }, phone)).toBeNull();
  });
  it('returns null without layout or dimensions', () => {
    expect(toViewportPoint(1, 1, null, phone)).toBeNull();
    expect(toViewportPoint(1, 1, { width: 10, height: 10 }, null)).toBeNull();
  });
  it('clamps the far edge to the last pixel', () => {
    expect(toViewportPoint(412, 846, { width: 412, height: 846 }, phone)).toEqual({ x: 411, y: 845 });
  });
});

describe('frameHeight', () => {
  it('keeps portrait aspect up to the cap', () => {
    expect(frameHeight(400, phone, 10000)).toBe(821);
    expect(frameHeight(400, phone, 500)).toBe(500);
  });
  it('falls back to 16:9 without dimensions', () => {
    expect(frameHeight(320, null, 10000)).toBe(180);
  });
});

describe('dragToWheel', () => {
  it('inverts and scales to viewport pixels', () => {
    expect(dragToWheel(0, -50, 0.5)).toEqual({ deltaX: 0, deltaY: 100 });
  });
});
