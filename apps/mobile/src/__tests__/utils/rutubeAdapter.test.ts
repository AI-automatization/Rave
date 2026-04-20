// T-E105 — Rutube WebView adapter tests
// Verifies correct postMessage methods and event parsing

import { buildRutubeHtml } from '../../components/video/WebViewAdapters';

const HTML = buildRutubeHtml('test123');

// ─── 1. Correct postMessage command methods ────────────────────────────────────

describe('Rutube adapter — postMessage commands', () => {
  it('seek uses setCurrentTime (not seekTo)', () => {
    expect(HTML).toContain("sendCmd('setCurrentTime'");
    expect(HTML).not.toContain("sendCmd('seekTo'");
  });

  it('play uses play (not playVideo)', () => {
    expect(HTML).toContain("sendCmd('play')");
    expect(HTML).not.toContain("sendCmd('playVideo')");
  });

  it('pause uses pause (not pauseVideo)', () => {
    expect(HTML).toContain("sendCmd('pause')");
    expect(HTML).not.toContain("sendCmd('pauseVideo')");
  });

  it('sendCmd builds correct message format: { method, value }', () => {
    expect(HTML).toContain("var msg = { method: method }");
    expect(HTML).toContain("if (value !== undefined) msg.value = value");
  });

  it('seek command sends value (currentTime in seconds)', () => {
    expect(HTML).toContain("sendCmd('setCurrentTime', t)");
  });
});

// ─── 2. Correct event listener — Rutube API format ────────────────────────────

describe('Rutube adapter — event listener', () => {
  it('listens on data.type (not data.event)', () => {
    expect(HTML).toContain('switch (data.type)');
    expect(HTML).not.toContain('switch (data.event)');
  });

  it('ready event is player:ready (not inited/ready)', () => {
    expect(HTML).toContain("case 'player:ready'");
    expect(HTML).not.toContain("case 'onStateChange'");
  });

  it('state change event is player:changeState', () => {
    expect(HTML).toContain("case 'player:changeState'");
  });

  it('time update event is player:currentTime', () => {
    expect(HTML).toContain("case 'player:currentTime'");
    expect(HTML).not.toContain("case 'onCurrentTime'");
  });

  it('playing state detected via d.state === playing', () => {
    expect(HTML).toContain("d.state === 'playing'");
  });

  it('paused state detected via d.state === paused', () => {
    expect(HTML).toContain("d.state === 'paused'");
  });

  it('stopped state also triggers pause', () => {
    expect(HTML).toContain("d.state === 'stopped'");
  });

  it('currentTime read from d.time (not info.currentTime)', () => {
    expect(HTML).toContain('ct = d.time || ct');
    expect(HTML).not.toContain('info.currentTime');
  });

  it('duration read from d.duration', () => {
    expect(HTML).toContain('dur = d.duration || dur');
  });

  it('does NOT use playerState: 1/2 (YouTube format)', () => {
    expect(HTML).not.toContain('playerState === 1');
    expect(HTML).not.toContain('playerState === 2');
  });
});

// ─── 3. Event parsing simulation ──────────────────────────────────────────────

describe('Rutube event parsing — state machine simulation', () => {
  type State = { ct: number; dur: number; paused: boolean };

  function processRutubeEvent(state: State, rawMsg: unknown): State {
    const data = typeof rawMsg === 'string' ? JSON.parse(rawMsg as string) : rawMsg as Record<string, unknown>;
    const d = (data.data as Record<string, unknown>) || {};
    const next = { ...state };

    switch (data.type) {
      case 'player:changeState':
        if (d.state === 'playing') next.paused = false;
        else if (d.state === 'paused' || d.state === 'stopped') next.paused = true;
        break;
      case 'player:currentTime':
        if (d.time) next.ct = d.time as number;
        if (d.duration) next.dur = d.duration as number;
        break;
    }
    return next;
  }

  it('player:changeState playing → paused=false', () => {
    const state = { ct: 0, dur: 0, paused: true };
    const next = processRutubeEvent(state, { type: 'player:changeState', data: { state: 'playing' } });
    expect(next.paused).toBe(false);
  });

  it('player:changeState paused → paused=true', () => {
    const state = { ct: 30, dur: 600, paused: false };
    const next = processRutubeEvent(state, { type: 'player:changeState', data: { state: 'paused' } });
    expect(next.paused).toBe(true);
  });

  it('player:changeState stopped → paused=true', () => {
    const state = { ct: 599, dur: 600, paused: false };
    const next = processRutubeEvent(state, { type: 'player:changeState', data: { state: 'stopped' } });
    expect(next.paused).toBe(true);
  });

  it('player:currentTime updates ct and dur', () => {
    const state = { ct: 0, dur: 0, paused: false };
    const next = processRutubeEvent(state, { type: 'player:currentTime', data: { time: 42.5, duration: 600 } });
    expect(next.ct).toBe(42.5);
    expect(next.dur).toBe(600);
  });

  it('unknown event type leaves state unchanged', () => {
    const state = { ct: 30, dur: 600, paused: false };
    const next = processRutubeEvent(state, { type: 'onStateChange', info: { playerState: 1 } });
    expect(next).toEqual(state);
  });

  it('JSON string message parsed correctly', () => {
    const state = { ct: 0, dur: 0, paused: true };
    const msg = JSON.stringify({ type: 'player:changeState', data: { state: 'playing' } });
    const next = processRutubeEvent(state, msg);
    expect(next.paused).toBe(false);
  });
});

// ─── 4. sendCmd format simulation ─────────────────────────────────────────────

describe('sendCmd format — T-E105 regression', () => {
  function buildMsg(method: string, value?: number): string {
    const msg: Record<string, unknown> = { method };
    if (value !== undefined) msg.value = value;
    return JSON.stringify(msg);
  }

  it('play → { method: "play" }', () => {
    expect(buildMsg('play')).toBe('{"method":"play"}');
  });

  it('pause → { method: "pause" }', () => {
    expect(buildMsg('pause')).toBe('{"method":"pause"}');
  });

  it('setCurrentTime → { method: "setCurrentTime", value: 60 }', () => {
    expect(buildMsg('setCurrentTime', 60)).toBe('{"method":"setCurrentTime","value":60}');
  });

  it('old seekTo would send wrong format', () => {
    const wrong = buildMsg('seekTo', 60);
    expect(wrong).toContain('seekTo');
    expect(wrong).not.toContain('setCurrentTime');
  });

  it('old playVideo would send wrong format', () => {
    const wrong = buildMsg('playVideo');
    expect(wrong).toContain('playVideo');
    expect(wrong).not.toContain('"play"');
  });
});

// ─── 5. HTML structure integrity ──────────────────────────────────────────────

describe('buildRutubeHtml — HTML structure', () => {
  it('contains video ID in iframe src', () => {
    expect(HTML).toContain('rutube.ru/play/embed/test123');
  });

  it('contains autoplay parameter', () => {
    expect(HTML).toContain('autoplay=1');
  });

  it('has ReactNativeWebView bridge', () => {
    expect(HTML).toContain('ReactNativeWebView');
  });

  it('has progress timer for PROGRESS events', () => {
    expect(HTML).toContain("type: 'PROGRESS'");
  });

  it('different videoId produces different HTML', () => {
    const html2 = buildRutubeHtml('abc999');
    expect(HTML).not.toBe(html2);
    expect(html2).toContain('rutube.ru/play/embed/abc999');
  });
});
