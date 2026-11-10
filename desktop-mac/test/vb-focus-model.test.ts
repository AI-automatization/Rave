import { describe, expect, it } from 'vitest';
import { FOCUS_VIDEO_SCRIPT, PLAYING_VIDEO_SCRIPT, UNFOCUS_SCRIPT, focusIframeScript, pickPlayerFrame } from '../src/main/vb-focus-model';

describe('scripts that run inside the VB page', () => {
  it.each([
    ['playing video probe', PLAYING_VIDEO_SCRIPT],
    ['focus video', FOCUS_VIDEO_SCRIPT],
    ['focus iframe', focusIframeScript('https://player.example.com/embed/1?x=1')],
    ['unfocus', UNFOCUS_SCRIPT],
  ])('%s is valid JavaScript', (_n, src) => {
    expect(() => new Function(`return ${src};`)).not.toThrow();
  });
  it('the iframe address is embedded as a string literal, never as code', () => {
    const src = focusIframeScript('https://x.test/"); alert(1); ("');
    expect(() => new Function(`return ${src};`)).not.toThrow();
    expect(src).toContain('alert(1)'); // present only inside the quoted literal
    expect(src).toContain(JSON.stringify('https://x.test/"); alert(1); ("'));
  });
});

describe('pickPlayerFrame', () => {
  it('chooses the frame with the largest playing video', () => {
    const p = [{ id: 1, isMain: true, url: 'a', area: 0 }, { id: 2, isMain: false, url: 'b', area: 5000 }, { id: 3, isMain: false, url: 'c', area: 90000 }];
    expect(pickPlayerFrame(p)?.id).toBe(3);
  });
  it('nothing playing → null', () => {
    expect(pickPlayerFrame([{ id: 1, isMain: true, url: 'a', area: 0 }])).toBeNull();
    expect(pickPlayerFrame([])).toBeNull();
  });
});
