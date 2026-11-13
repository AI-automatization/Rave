import { describe, expect, it } from 'vitest';
import { fullscreenDockRect, parseDockRect, toWindowRect } from '../src/main/vb-dock-model';

describe('parseDockRect', () => {
  it('rounds a normal rectangle to whole numbers', () => {
    expect(parseDockRect({ x: 10.4, y: 20.6, width: 900.2, height: 506.5 })).toEqual({ x: 10, y: 21, width: 900, height: 507 });
  });
  it.each([
    null, undefined, 42, 'x', [], {},
    { x: 0, y: 0, width: 10, height: 500 },
    { x: 0, y: 0, width: 500, height: 10 },
    { x: NaN, y: 0, width: 500, height: 500 },
    { x: 0, y: Infinity, width: 500, height: 500 },
    { x: '0', y: 0, width: 500, height: 500 },
    { x: 99999, y: 0, width: 500, height: 500 },
    { x: 0, y: 0, width: 99999, height: 500 },
  ])('%j -> null (hide the dock)', (v) => {
    expect(parseDockRect(v)).toBeNull();
  });
});

describe('toWindowRect', () => {
  it('adds the content view origin', () => {
    expect(toWindowRect({ x: 5, y: 7, width: 100, height: 60 }, { x: 240, y: 52 })).toEqual({ x: 245, y: 59, width: 100, height: 60 });
  });
});

describe('fullscreenDockRect', () => {
  it('a window taller than 16:9: full width, on the bottom edge (controls at the bottom)', () => {
    expect(fullscreenDockRect(1470, 923)).toEqual({ x: 0, y: 97, width: 1470, height: 826 });
  });
  it('an exactly 16:9 window: the whole window', () => {
    expect(fullscreenDockRect(1920, 1080)).toEqual({ x: 0, y: 0, width: 1920, height: 1080 });
  });
  it('a window wider than 16:9: full height, centred', () => {
    expect(fullscreenDockRect(2560, 1080)).toEqual({ x: 320, y: 0, width: 1920, height: 1080 });
  });
});
