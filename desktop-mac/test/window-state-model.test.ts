import { describe, expect, it } from 'vitest';
import { restoreBounds } from '../src/main/window-state-model';

const DISPLAY = [{ x: 0, y: 0, width: 1728, height: 1117 }];
const MIN = { width: 1000, height: 640 };

describe('restoreBounds', () => {
  it('returns the saved place when it is on a display', () => {
    expect(restoreBounds({ x: 100, y: 80, width: 1300, height: 800 }, DISPLAY, MIN)).toEqual({ x: 100, y: 80, width: 1300, height: 800 });
  });
  it('works on a second display to the left', () => {
    const two = [...DISPLAY, { x: -1920, y: 0, width: 1920, height: 1080 }];
    expect(restoreBounds({ x: -1800, y: 50, width: 1200, height: 700 }, two, MIN)).not.toBeNull();
  });
  it('ignores a place whose display is gone', () => {
    expect(restoreBounds({ x: -1800, y: 50, width: 1200, height: 700 }, DISPLAY, MIN)).toBeNull();
    expect(restoreBounds({ x: 1700, y: 1100, width: 1200, height: 700 }, DISPLAY, MIN)).toBeNull();
  });
  it.each([null, 'x', 42, {}, { x: 0, y: 0, width: 100, height: 100 }, { x: 0, y: 0, width: 99999, height: 800 },
    { x: '0', y: 0, width: 1200, height: 800 }, { x: NaN, y: 0, width: 1200, height: 800 }, { x: 0, y: Infinity, width: 1200, height: 800 }])(
    'ignores garbage %j', (raw) => {
      expect(restoreBounds(raw, DISPLAY, MIN)).toBeNull();
    });
});
