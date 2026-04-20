// T-E104 — Platform-specific MOBILE_UA tests
// Verifies iOS → Safari UA, Android → Chrome UA in both source files

// ─── webViewScripts.ts ────────────────────────────────────────────────────────

describe('webViewScripts — MOBILE_UA on iOS', () => {
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
  it('contains iPhone', () => expect(MOBILE_UA).toContain('iPhone'));
  it('contains CPU iPhone OS 17_0', () => expect(MOBILE_UA).toContain('CPU iPhone OS 17_0'));
  it('contains AppleWebKit/605', () => expect(MOBILE_UA).toContain('AppleWebKit/605'));
  it('contains Safari', () => expect(MOBILE_UA).toContain('Safari'));
  it('contains Version/17.0', () => expect(MOBILE_UA).toContain('Version/17.0'));
  it('does NOT contain Android', () => expect(MOBILE_UA).not.toContain('Android'));
  it('does NOT contain Chrome', () => expect(MOBILE_UA).not.toContain('Chrome'));
  it('does NOT contain Pixel', () => expect(MOBILE_UA).not.toContain('Pixel'));
  it('matches iOS UA pattern', () => {
    expect(MOBILE_UA).toMatch(/iPhone.*AppleWebKit.*Safari/);
  });
  it('does NOT contain Android 13', () => expect(MOBILE_UA).not.toContain('Android 13'));
  it('does NOT contain Chrome/120', () => expect(MOBILE_UA).not.toContain('Chrome/120'));
});

describe('webViewScripts — MOBILE_UA on Android', () => {
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
  it('contains Android', () => expect(MOBILE_UA).toContain('Android'));
  it('contains Android 13', () => expect(MOBILE_UA).toContain('Android 13'));
  it('contains Pixel 7', () => expect(MOBILE_UA).toContain('Pixel 7'));
  it('contains Chrome/120', () => expect(MOBILE_UA).toContain('Chrome/120'));
  it('contains Mobile Safari', () => expect(MOBILE_UA).toContain('Mobile Safari'));
  it('does NOT contain iPhone', () => expect(MOBILE_UA).not.toContain('iPhone'));
  it('does NOT contain AppleWebKit/605', () => expect(MOBILE_UA).not.toContain('AppleWebKit/605'));
  it('does NOT contain Version/17.0', () => expect(MOBILE_UA).not.toContain('Version/17.0'));
  it('matches Android UA pattern', () => {
    expect(MOBILE_UA).toMatch(/Android.*Chrome.*Mobile Safari/);
  });
  it('does NOT contain CPU iPhone', () => expect(MOBILE_UA).not.toContain('CPU iPhone'));
});

// ─── videoPlayer.ts ───────────────────────────────────────────────────────────

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
  it('contains Android 13', () => expect(MOBILE_UA).toContain('Android 13'));
  it('contains Pixel 7', () => expect(MOBILE_UA).toContain('Pixel 7'));
  it('contains Chrome/120', () => expect(MOBILE_UA).toContain('Chrome/120'));
  it('does NOT contain iPhone', () => expect(MOBILE_UA).not.toContain('iPhone'));
  it('does NOT contain AppleWebKit/605', () => expect(MOBILE_UA).not.toContain('AppleWebKit/605'));
  it('matches Android UA pattern', () => {
    expect(MOBILE_UA).toMatch(/Android.*Chrome.*Mobile Safari/);
  });
});

// ─── Cross-source consistency: iOS must match between both files ──────────────

describe('UA consistency — iOS: webViewScripts vs videoPlayer must match', () => {
  let webViewUA: string;
  let videoPlayerUA: string;

  beforeAll(() => {
    jest.resetModules();
    jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ({ MOBILE_UA: webViewUA } = require('../../utils/webViewScripts'));
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
    expect(webViewUA).toBe(videoPlayerUA);
  });
});

describe('UA consistency — Android: webViewScripts vs videoPlayer must match', () => {
  let webViewUA: string;
  let videoPlayerUA: string;

  beforeAll(() => {
    jest.resetModules();
    jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ({ MOBILE_UA: webViewUA } = require('../../utils/webViewScripts'));
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
    expect(webViewUA).toBe(videoPlayerUA);
  });
});

// ─── iOS vs Android must be DIFFERENT ─────────────────────────────────────────

describe('UA differentiation — iOS and Android must produce different strings', () => {
  const IOS_UA_MARKER = 'iPhone';
  const ANDROID_UA_MARKER = 'Android';

  it('iOS UA has iPhone marker, not Android', () => {
    let MOBILE_UA: string;
    jest.isolateModules(() => {
      jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      ({ MOBILE_UA } = require('../../utils/webViewScripts'));
    });
    expect(MOBILE_UA!).toContain(IOS_UA_MARKER);
    expect(MOBILE_UA!).not.toContain(ANDROID_UA_MARKER);
  });

  it('Android UA has Android marker, not iPhone', () => {
    let MOBILE_UA: string;
    jest.isolateModules(() => {
      jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      ({ MOBILE_UA } = require('../../utils/webViewScripts'));
    });
    expect(MOBILE_UA!).toContain(ANDROID_UA_MARKER);
    expect(MOBILE_UA!).not.toContain(IOS_UA_MARKER);
  });

  it('iOS and Android produce different UA strings', () => {
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
});
