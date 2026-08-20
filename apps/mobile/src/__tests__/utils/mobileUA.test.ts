// T-E104 — Platform-specific UA tests
// webViewScripts.MOBILE_UA is intentionally a DESKTOP UA since 58c3a43f (fix(mobile): WebView
// desktop UA + block IFRAME_SCAN on auth pages) — video-player WebViews render better with a
// desktop UA on embed sites. webViewScripts.BROWSER_MOBILE_UA carries the real per-platform
// mobile UA that MOBILE_UA used to be, for the in-app browser (MediaWebViewScreen) which DOES
// want a genuine mobile layout. videoPlayer.MOBILE_UA is unrelated to that rename and still
// means "real mobile UA".

// ─── webViewScripts.ts — MOBILE_UA is desktop-flavored, still platform-conditioned ───────────

describe('webViewScripts — MOBILE_UA (desktop) on iOS', () => {
  let MOBILE_UA: string;

  beforeAll(() => {
    jest.resetModules();
    jest.mock('react-native', () => ({
      Platform: { OS: 'ios' },
    }));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ({ MOBILE_UA } = require('../../utils/webViewScripts'));
  });

  afterAll(() => {
    jest.resetModules();
    jest.unmock('react-native');
  });

  it('is a string', () => expect(typeof MOBILE_UA).toBe('string'));
  it('starts with Mozilla/5.0', () => expect(MOBILE_UA.startsWith('Mozilla/5.0')).toBe(true));
  it('contains Macintosh', () => expect(MOBILE_UA).toContain('Macintosh'));
  it('contains AppleWebKit/605', () => expect(MOBILE_UA).toContain('AppleWebKit/605'));
  it('contains Safari', () => expect(MOBILE_UA).toContain('Safari'));
  it('does NOT contain iPhone', () => expect(MOBILE_UA).not.toContain('iPhone'));
  it('does NOT contain Android', () => expect(MOBILE_UA).not.toContain('Android'));
});

describe('webViewScripts — MOBILE_UA (desktop) on Android', () => {
  let MOBILE_UA: string;

  beforeAll(() => {
    jest.resetModules();
    jest.mock('react-native', () => ({
      Platform: { OS: 'android' },
    }));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ({ MOBILE_UA } = require('../../utils/webViewScripts'));
  });

  afterAll(() => {
    jest.resetModules();
    jest.unmock('react-native');
  });

  it('is a string', () => expect(typeof MOBILE_UA).toBe('string'));
  it('starts with Mozilla/5.0', () => expect(MOBILE_UA.startsWith('Mozilla/5.0')).toBe(true));
  it('contains Windows NT', () => expect(MOBILE_UA).toContain('Windows NT'));
  it('contains Chrome/', () => expect(MOBILE_UA).toContain('Chrome/'));
  it('does NOT contain iPhone', () => expect(MOBILE_UA).not.toContain('iPhone'));
  it('does NOT contain Android', () => expect(MOBILE_UA).not.toContain('Android'));
});

// ─── webViewScripts.ts — BROWSER_MOBILE_UA (real per-device spoof, in-app browser) ───────────

describe('webViewScripts — BROWSER_MOBILE_UA on iOS', () => {
  let BROWSER_MOBILE_UA: string;

  beforeAll(() => {
    jest.resetModules();
    jest.mock('react-native', () => ({
      Platform: { OS: 'ios' },
    }));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ({ BROWSER_MOBILE_UA } = require('../../utils/webViewScripts'));
  });

  afterAll(() => {
    jest.resetModules();
    jest.unmock('react-native');
  });

  it('is a string', () => expect(typeof BROWSER_MOBILE_UA).toBe('string'));
  it('contains iPhone', () => expect(BROWSER_MOBILE_UA).toContain('iPhone'));
  it('contains AppleWebKit/605', () => expect(BROWSER_MOBILE_UA).toContain('AppleWebKit/605'));
  it('contains Safari', () => expect(BROWSER_MOBILE_UA).toContain('Safari'));
  it('does NOT contain Android', () => expect(BROWSER_MOBILE_UA).not.toContain('Android'));
  it('matches iOS UA pattern', () => {
    expect(BROWSER_MOBILE_UA).toMatch(/iPhone.*AppleWebKit.*Safari/);
  });
});

describe('webViewScripts — BROWSER_MOBILE_UA on Android', () => {
  let BROWSER_MOBILE_UA: string;

  beforeAll(() => {
    jest.resetModules();
    jest.mock('react-native', () => ({
      Platform: { OS: 'android' },
    }));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ({ BROWSER_MOBILE_UA } = require('../../utils/webViewScripts'));
  });

  afterAll(() => {
    jest.resetModules();
    jest.unmock('react-native');
  });

  it('is a string', () => expect(typeof BROWSER_MOBILE_UA).toBe('string'));
  it('contains Android', () => expect(BROWSER_MOBILE_UA).toContain('Android'));
  it('contains Chrome/', () => expect(BROWSER_MOBILE_UA).toContain('Chrome/'));
  it('contains Mobile Safari', () => expect(BROWSER_MOBILE_UA).toContain('Mobile Safari'));
  it('does NOT contain iPhone', () => expect(BROWSER_MOBILE_UA).not.toContain('iPhone'));
  it('matches Android UA pattern', () => {
    expect(BROWSER_MOBILE_UA).toMatch(/Android.*Chrome.*Mobile Safari/);
  });
});

// ─── videoPlayer.ts — MOBILE_UA (real mobile UA, unaffected by the webViewScripts rename) ────

describe('videoPlayer — MOBILE_UA on iOS', () => {
  let MOBILE_UA: string;

  beforeAll(() => {
    jest.resetModules();
    jest.mock('react-native', () => ({
      Platform: { OS: 'ios' },
    }));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ({ MOBILE_UA } = require('../../utils/videoPlayer'));
  });

  afterAll(() => {
    jest.resetModules();
    jest.unmock('react-native');
  });

  it('is a string', () => expect(typeof MOBILE_UA).toBe('string'));
  it('contains iPhone', () => expect(MOBILE_UA).toContain('iPhone'));
  it('contains AppleWebKit/605', () => expect(MOBILE_UA).toContain('AppleWebKit/605'));
  it('contains Safari', () => expect(MOBILE_UA).toContain('Safari'));
  it('does NOT contain Android', () => expect(MOBILE_UA).not.toContain('Android'));
  it('does NOT contain Chrome', () => expect(MOBILE_UA).not.toContain('Chrome'));
  it('matches iOS UA pattern', () => {
    expect(MOBILE_UA).toMatch(/iPhone.*AppleWebKit.*Safari/);
  });
});

describe('videoPlayer — MOBILE_UA on Android', () => {
  let MOBILE_UA: string;

  beforeAll(() => {
    jest.resetModules();
    jest.mock('react-native', () => ({
      Platform: { OS: 'android' },
    }));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ({ MOBILE_UA } = require('../../utils/videoPlayer'));
  });

  afterAll(() => {
    jest.resetModules();
    jest.unmock('react-native');
  });

  it('is a string', () => expect(typeof MOBILE_UA).toBe('string'));
  it('contains Android 14', () => expect(MOBILE_UA).toContain('Android 14'));
  it('contains Pixel 8', () => expect(MOBILE_UA).toContain('Pixel 8'));
  it('contains Chrome/', () => expect(MOBILE_UA).toContain('Chrome/'));
  it('does NOT contain iPhone', () => expect(MOBILE_UA).not.toContain('iPhone'));
  it('does NOT contain AppleWebKit/605', () => expect(MOBILE_UA).not.toContain('AppleWebKit/605'));
  it('matches Android UA pattern', () => {
    expect(MOBILE_UA).toMatch(/Android.*Chrome.*Mobile Safari/);
  });
});

// ─── Cross-source consistency: the two REAL-mobile-UA sources must still agree ───────────────
// webViewScripts.BROWSER_MOBILE_UA and videoPlayer.MOBILE_UA both claim to be "the real device
// UA" for their respective screens — unlike webViewScripts.MOBILE_UA (now desktop-only), these
// two should still describe the same physical device.

describe('UA consistency — iOS: BROWSER_MOBILE_UA vs videoPlayer.MOBILE_UA must match', () => {
  let browserUA: string;
  let videoPlayerUA: string;

  beforeAll(() => {
    jest.resetModules();
    jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ({ BROWSER_MOBILE_UA: browserUA } = require('../../utils/webViewScripts'));
    jest.resetModules();
    jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ({ MOBILE_UA: videoPlayerUA } = require('../../utils/videoPlayer'));
  });

  afterAll(() => {
    jest.resetModules();
    jest.unmock('react-native');
  });

  it('both sources return identical iOS UA string', () => {
    expect(browserUA).toBe(videoPlayerUA);
  });
});

describe('UA consistency — Android: BROWSER_MOBILE_UA vs videoPlayer.MOBILE_UA must match', () => {
  let browserUA: string;
  let videoPlayerUA: string;

  beforeAll(() => {
    jest.resetModules();
    jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ({ BROWSER_MOBILE_UA: browserUA } = require('../../utils/webViewScripts'));
    jest.resetModules();
    jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ({ MOBILE_UA: videoPlayerUA } = require('../../utils/videoPlayer'));
  });

  afterAll(() => {
    jest.resetModules();
    jest.unmock('react-native');
  });

  it('both sources return identical Android UA string', () => {
    expect(browserUA).toBe(videoPlayerUA);
  });
});

// ─── iOS vs Android must be DIFFERENT (both UA flavors) ───────────────────────────────────────

describe('UA differentiation — iOS and Android must produce different strings', () => {
  it('webViewScripts.MOBILE_UA (desktop) differs between iOS and Android', () => {
    let iosUA: string;
    let androidUA: string;
    jest.isolateModules(() => {
      jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      ({ MOBILE_UA: iosUA } = require('../../utils/webViewScripts'));
    });
    jest.isolateModules(() => {
      jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      ({ MOBILE_UA: androidUA } = require('../../utils/webViewScripts'));
    });
    expect(iosUA!).not.toBe(androidUA!);
  });

  it('webViewScripts.BROWSER_MOBILE_UA has iPhone marker on iOS, not Android', () => {
    let BROWSER_MOBILE_UA: string;
    jest.isolateModules(() => {
      jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      ({ BROWSER_MOBILE_UA } = require('../../utils/webViewScripts'));
    });
    expect(BROWSER_MOBILE_UA!).toContain('iPhone');
    expect(BROWSER_MOBILE_UA!).not.toContain('Android');
  });

  it('webViewScripts.BROWSER_MOBILE_UA has Android marker on Android, not iPhone', () => {
    let BROWSER_MOBILE_UA: string;
    jest.isolateModules(() => {
      jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      ({ BROWSER_MOBILE_UA } = require('../../utils/webViewScripts'));
    });
    expect(BROWSER_MOBILE_UA!).toContain('Android');
    expect(BROWSER_MOBILE_UA!).not.toContain('iPhone');
  });
});
