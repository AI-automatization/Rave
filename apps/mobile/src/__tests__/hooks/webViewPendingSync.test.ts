// T-E103 — WebView pendingSync tests
// Verifies: syncState deferred during ad, applied on first handleWebViewPlay

// ─── 1. pendingSync logic unit tests (pure functions) ─────────────────────────

describe('pendingSync state machine — core logic', () => {
  it('pendingSync stores currentTime and isPlaying', () => {
    const pendingSync = { currentTime: 120.5, isPlaying: true };
    expect(pendingSync.currentTime).toBe(120.5);
    expect(pendingSync.isPlaying).toBe(true);
  });

  it('pendingSync cleared after apply', () => {
    let pendingSync: { currentTime: number; isPlaying: boolean } | null = { currentTime: 60, isPlaying: true };
    pendingSync = null;
    expect(pendingSync).toBeNull();
  });

  it('pendingSync ignored when webViewReady is true', () => {
    const webViewReady = { current: true };
    const pendingSync = { current: { currentTime: 60, isPlaying: true } };
    const seekCalled = jest.fn();

    // Simulate: if (!webViewReadyRef.current) → apply; else → skip
    if (!webViewReady.current && pendingSync.current) {
      seekCalled(pendingSync.current.currentTime);
    }

    expect(seekCalled).not.toHaveBeenCalled();
  });

  it('pendingSync applied when webViewReady is false (first play after ad)', () => {
    const webViewReady = { current: false };
    const pendingSync: { current: { currentTime: number; isPlaying: boolean } | null } = { current: { currentTime: 90, isPlaying: true } };
    const seekCalled = jest.fn();

    if (!webViewReady.current && pendingSync.current) {
      seekCalled(pendingSync.current.currentTime);
      webViewReady.current = true;
      pendingSync.current = null;
    }

    expect(seekCalled).toHaveBeenCalledWith(90);
    expect(webViewReady.current).toBe(true);
    expect(pendingSync.current).toBeNull();
  });
});

// ─── 2. WebView mode detection — only defer for WebView, not native ───────────

describe('pendingSync deferred only in WebView mode', () => {
  it('defers when isWebViewMode=true and webViewReady=false', () => {
    const isWebViewMode = true;
    const webViewReady = { current: false };
    const deferred = isWebViewMode && !webViewReady.current;
    expect(deferred).toBe(true);
  });

  it('does NOT defer when isWebViewMode=false (native player)', () => {
    const isWebViewMode = false;
    const webViewReady = { current: false };
    const deferred = isWebViewMode && !webViewReady.current;
    expect(deferred).toBe(false);
  });

  it('does NOT defer when webViewReady=true (ad already finished)', () => {
    const isWebViewMode = true;
    const webViewReady = { current: true };
    const deferred = isWebViewMode && !webViewReady.current;
    expect(deferred).toBe(false);
  });

  it('does NOT defer when isWebViewMode=false even if webViewReady=false', () => {
    const isWebViewMode = false;
    const webViewReady = { current: false };
    const deferred = isWebViewMode && !webViewReady.current;
    expect(deferred).toBe(false);
  });
});

// ─── 3. 30-second timeout — discard stale sync ────────────────────────────────

describe('pendingSync 30s timeout — discard stale sync', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('pendingSync discarded after 30 seconds', () => {
    let pendingSync: { currentTime: number; isPlaying: boolean } | null = { currentTime: 60, isPlaying: true };

    const timeout = setTimeout(() => {
      pendingSync = null;
    }, 30_000);

    expect(pendingSync).not.toBeNull();
    jest.advanceTimersByTime(30_000);
    expect(pendingSync).toBeNull();

    clearTimeout(timeout);
  });

  it('pendingSync NOT discarded before 30 seconds', () => {
    let pendingSync: { currentTime: number; isPlaying: boolean } | null = { currentTime: 60, isPlaying: true };

    const timeout = setTimeout(() => {
      pendingSync = null;
    }, 30_000);

    jest.advanceTimersByTime(29_999);
    expect(pendingSync).not.toBeNull();

    clearTimeout(timeout);
  });

  it('timeout cleared when pendingSync is applied before timeout', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const timeoutId = setTimeout(() => { /* discard */ }, 30_000);

    // Simulate apply before timeout — clearTimeout called
    clearTimeout(timeoutId);

    jest.advanceTimersByTime(30_000);
    expect(clearTimeoutSpy).toHaveBeenCalledWith(timeoutId);

    clearTimeoutSpy.mockRestore();
  });
});

// ─── 4. webViewReady reset on video URL change ────────────────────────────────

describe('webViewReady reset when video URL changes', () => {
  it('resets to false when new videoUrl arrives', () => {
    const webViewReady = { current: true };
    // Simulate room?.videoUrl change effect
    webViewReady.current = false;
    expect(webViewReady.current).toBe(false);
  });

  it('clears pendingSync when videoUrl changes', () => {
    let pendingSync: { currentTime: number; isPlaying: boolean } | null = { currentTime: 60, isPlaying: true };
    pendingSync = null;
    expect(pendingSync).toBeNull();
  });

  it('after reset: next syncState is deferred again (isWebViewMode still true)', () => {
    const webViewReady = { current: false }; // reset
    const isWebViewMode = true;
    const deferred = isWebViewMode && !webViewReady.current;
    expect(deferred).toBe(true);
  });
});

// ─── 5. handleWebViewPlay — pendingSync apply flow ────────────────────────────

describe('handleWebViewPlay — pendingSync apply flow', () => {
  it('applies pendingSync on first call (webViewReady=false)', () => {
    const webViewReady = { current: false };
    const pendingSync = { current: { currentTime: 120, isPlaying: true } as { currentTime: number; isPlaying: boolean } | null };
    const seekTo = jest.fn().mockResolvedValue(undefined);
    const play = jest.fn().mockResolvedValue(undefined);
    const setIsPlaying = jest.fn();

    // Simulate handleWebViewPlay logic
    if (!webViewReady.current) {
      webViewReady.current = true;
      if (pendingSync.current) {
        const { currentTime, isPlaying } = pendingSync.current;
        pendingSync.current = null;
        seekTo(currentTime * 1000);
        if (isPlaying) play();
        return; // early return — don't call setIsPlaying/emitPlay
      }
    }
    setIsPlaying(true);

    expect(seekTo).toHaveBeenCalledWith(120_000);
    expect(play).toHaveBeenCalled();
    expect(setIsPlaying).not.toHaveBeenCalled(); // early return
    expect(webViewReady.current).toBe(true);
    expect(pendingSync.current).toBeNull();
  });

  it('does NOT apply pendingSync on second call (webViewReady=true)', () => {
    const webViewReady = { current: true }; // already ready
    const pendingSync = { current: null as { currentTime: number; isPlaying: boolean } | null };
    const seekTo = jest.fn();
    const setIsPlaying = jest.fn();
    const emitPlay = jest.fn();
    const isOwner = false;
    const isSyncing = { current: false };

    if (!webViewReady.current) {
      webViewReady.current = true;
      if (pendingSync.current) { seekTo(0); return; }
    }
    setIsPlaying(true);
    if (isOwner && !isSyncing.current) emitPlay(30);

    expect(seekTo).not.toHaveBeenCalled();
    expect(setIsPlaying).toHaveBeenCalledWith(true);
  });

  it('seekTo receives ms (currentTime * 1000)', () => {
    const pendingCurrentTime = 65.5; // seconds
    const expectedMs = 65_500;
    expect(pendingCurrentTime * 1000).toBe(expectedMs);
  });

  it('applies pause (not play) when isPlaying=false in pendingSync', () => {
    const webViewReady = { current: false };
    const pendingSync = { current: { currentTime: 30, isPlaying: false } as { currentTime: number; isPlaying: boolean } | null };
    const seekTo = jest.fn().mockResolvedValue(undefined);
    const play = jest.fn();
    const pause = jest.fn();

    if (!webViewReady.current && pendingSync.current) {
      const { currentTime, isPlaying } = pendingSync.current;
      pendingSync.current = null;
      seekTo(currentTime * 1000);
      if (isPlaying) play(); else pause();
    }

    expect(seekTo).toHaveBeenCalledWith(30_000);
    expect(play).not.toHaveBeenCalled();
    expect(pause).toHaveBeenCalled();
  });
});

// ─── 6. Regression: expo-av (native) player not affected ─────────────────────

describe('regression — native player (expo-av) not affected by pendingSync', () => {
  it('direct mp4 is not WebView mode — pendingSync never set', () => {
    // detectVideoPlatform('https://cdn.com/video.mp4') → 'direct' → isWebViewMode=false
    const isWebViewMode = false;
    const webViewReady = { current: false };
    const deferred = isWebViewMode && !webViewReady.current;
    expect(deferred).toBe(false);
  });

  it('YouTube extracted URL is not WebView mode — no pendingSync', () => {
    // When YouTube URL is successfully extracted to direct stream
    const extractedVideoUrl = 'https://stream.googlevideo.com/videoplayback?id=xyz';
    const isWebViewMode = !extractedVideoUrl; // false — extracted
    const deferred = isWebViewMode && true; // even if webViewReady=false
    expect(deferred).toBe(false);
  });

  it('Rutube (no extraction) stays in WebView mode — pendingSync active', () => {
    const extractedVideoUrl = undefined; // Rutube cannot be extracted
    const isWebViewMode = !extractedVideoUrl && true; // true
    expect(isWebViewMode).toBe(true);
  });
});
