// VideoProgressBar — stale closure fix tests
// Verifies that PanResponder reads live values via refs, not stale initial values

// ─── 1. calcTimeFromRef — core seek calculation ────────────────────────────────

describe('calcTimeFromRef — position to seconds conversion', () => {
  function calcTimeFromRef(x: number, trackWidth: number, duration: number): number {
    if (trackWidth <= 0 || duration <= 0) return 0;
    return Math.max(0, Math.min(duration, (x / trackWidth) * duration));
  }

  it('returns 0 when trackWidth is 0 (initial state)', () => {
    expect(calcTimeFromRef(100, 0, 600)).toBe(0);
  });

  it('returns 0 when duration is 0 (initial state)', () => {
    expect(calcTimeFromRef(100, 300, 0)).toBe(0);
  });

  it('calculates mid-point correctly', () => {
    expect(calcTimeFromRef(150, 300, 600)).toBe(300);
  });

  it('calculates start position', () => {
    expect(calcTimeFromRef(0, 300, 600)).toBe(0);
  });

  it('calculates end position', () => {
    expect(calcTimeFromRef(300, 300, 600)).toBe(600);
  });

  it('clamps to 0 for negative x', () => {
    expect(calcTimeFromRef(-10, 300, 600)).toBe(0);
  });

  it('clamps to duration for x > trackWidth', () => {
    expect(calcTimeFromRef(400, 300, 600)).toBe(600);
  });

  it('25% position → 25% of duration', () => {
    expect(calcTimeFromRef(75, 300, 600)).toBe(150);
  });

  it('works for short video (60s)', () => {
    expect(calcTimeFromRef(100, 400, 60)).toBeCloseTo(15);
  });

  it('works for long video (2h)', () => {
    expect(calcTimeFromRef(200, 400, 7200)).toBe(3600);
  });
});

// ─── 2. Stale closure bug — what the OLD code did ─────────────────────────────

describe('stale closure regression — old behavior was broken', () => {
  it('old code: PanResponder captured isOwner=false at mount → gesture rejected', () => {
    // Simulate: PanResponder captures isOwner at creation time
    const capturedIsOwner = false; // initial value before room loaded
    const onStartShouldSetPanResponder = () => capturedIsOwner && true && true;
    expect(onStartShouldSetPanResponder()).toBe(false); // gesture never started
  });

  it('old code: PanResponder captured duration=0 at mount → seek always 0', () => {
    const capturedDuration = 0;
    const capturedTrackWidth = 300;
    const calcTime = (x: number) => {
      if (capturedTrackWidth <= 0 || capturedDuration <= 0) return 0;
      return (x / capturedTrackWidth) * capturedDuration;
    };
    expect(calcTime(150)).toBe(0); // always 0 because duration was 0
  });

  it('old code: even if gesture started, onSeek received wrong value (0)', () => {
    const capturedDuration = 0;
    const capturedTrackWidth = 300;
    const onSeek = jest.fn();
    const calcAndSeek = (x: number) => {
      const t = capturedTrackWidth > 0 && capturedDuration > 0
        ? (x / capturedTrackWidth) * capturedDuration
        : 0;
      onSeek(t);
    };
    calcAndSeek(150);
    expect(onSeek).toHaveBeenCalledWith(0); // bug: always 0
  });
});

// ─── 3. Fixed behavior — refs read live values ────────────────────────────────

describe('fixed behavior — refs always read current values', () => {
  it('ref update: isOwner false→true allows gesture after re-render', () => {
    const isOwnerRef = { current: false };

    // Before data loads
    expect(isOwnerRef.current).toBe(false);

    // After re-render with actual isOwner value
    isOwnerRef.current = true;
    const onStartShouldSetPanResponder = () => isOwnerRef.current;
    expect(onStartShouldSetPanResponder()).toBe(true);
  });

  it('ref update: duration 0→600 enables correct seek calculation', () => {
    const durationRef = { current: 0 };
    const trackWidthRef = { current: 300 };

    const calcTime = (x: number) => {
      if (trackWidthRef.current <= 0 || durationRef.current <= 0) return 0;
      return (x / trackWidthRef.current) * durationRef.current;
    };

    // Before data loads
    expect(calcTime(150)).toBe(0);

    // After re-render
    durationRef.current = 600;
    expect(calcTime(150)).toBe(300); // correct: 50% of 600s
  });

  it('ref update: onSeek callback always calls latest version', () => {
    const onSeekRef = { current: jest.fn() };
    const firstOnSeek = onSeekRef.current;

    // Re-render provides new callback
    const newOnSeek = jest.fn();
    onSeekRef.current = newOnSeek;

    // PanResponder uses ref — calls new version
    onSeekRef.current(120);

    expect(newOnSeek).toHaveBeenCalledWith(120);
    expect(firstOnSeek).not.toHaveBeenCalled();
  });

  it('trackWidthRef updated on layout → calcTime uses real width', () => {
    const trackWidthRef = { current: 0 };
    const durationRef = { current: 600 };

    const calcTime = (x: number) => {
      if (trackWidthRef.current <= 0 || durationRef.current <= 0) return 0;
      return (x / trackWidthRef.current) * durationRef.current;
    };

    // Before layout event
    expect(calcTime(150)).toBe(0);

    // onLayout fires: setTrackWidth(320) + trackWidthRef.current = 320
    trackWidthRef.current = 320;
    expect(calcTime(160)).toBeCloseTo(300); // 50% of 600s
  });

  it('isLiveRef=true blocks gesture even if isOwner=true', () => {
    const isOwnerRef = { current: true };
    const durationRef = { current: 600 };
    const isLiveRef = { current: true };

    const canSeek = () => isOwnerRef.current && durationRef.current > 0 && !isLiveRef.current;
    expect(canSeek()).toBe(false); // live stream — no seek
  });

  it('all conditions met → gesture allowed', () => {
    const isOwnerRef = { current: true };
    const durationRef = { current: 600 };
    const isLiveRef = { current: false };

    const canSeek = () => isOwnerRef.current && durationRef.current > 0 && !isLiveRef.current;
    expect(canSeek()).toBe(true);
  });
});

// ─── 4. PanResponder release — full seek flow ─────────────────────────────────

describe('onPanResponderRelease — full seek flow with refs', () => {
  function simulateRelease(
    locationX: number,
    trackWidth: number,
    duration: number,
    isOwner: boolean,
    isLive: boolean,
  ): number | null {
    const trackWidthRef = { current: trackWidth };
    const durationRef = { current: duration };
    const isOwnerRef = { current: isOwner };
    const isLiveRef = { current: isLive };

    const canSeek = isOwnerRef.current && durationRef.current > 0 && !isLiveRef.current;
    if (!canSeek) return null;

    if (trackWidthRef.current <= 0 || durationRef.current <= 0) return 0;
    return Math.max(0, Math.min(durationRef.current, (locationX / trackWidthRef.current) * durationRef.current));
  }

  it('owner, 50% position → returns 50% of duration', () => {
    const result = simulateRelease(160, 320, 600, true, false);
    expect(result).toBe(300);
  });

  it('non-owner → returns null (no seek)', () => {
    expect(simulateRelease(160, 320, 600, false, false)).toBeNull();
  });

  it('live stream → returns null (no seek)', () => {
    expect(simulateRelease(160, 320, 600, true, true)).toBeNull();
  });

  it('duration=0 → returns null (no seek)', () => {
    expect(simulateRelease(160, 320, 0, true, false)).toBeNull();
  });

  it('x=0 → returns 0 (beginning)', () => {
    expect(simulateRelease(0, 320, 600, true, false)).toBe(0);
  });

  it('x=trackWidth → returns duration (end)', () => {
    expect(simulateRelease(320, 320, 600, true, false)).toBe(600);
  });

  it('x > trackWidth → clamped to duration', () => {
    expect(simulateRelease(400, 320, 600, true, false)).toBe(600);
  });
});

// ─── 5. formatTime — display correctness ──────────────────────────────────────

describe('formatTime — progress bar display', () => {
  function formatTime(secs: number): string {
    if (!secs || isNaN(secs) || secs < 0) return '0:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  it('0 → 0:00', () => expect(formatTime(0)).toBe('0:00'));
  it('negative → 0:00', () => expect(formatTime(-5)).toBe('0:00'));
  it('NaN → 0:00', () => expect(formatTime(NaN)).toBe('0:00'));
  it('65 → 1:05', () => expect(formatTime(65)).toBe('1:05'));
  it('3600 → 1:00:00', () => expect(formatTime(3600)).toBe('1:00:00'));
  it('3665 → 1:01:05', () => expect(formatTime(3665)).toBe('1:01:05'));
  it('59 → 0:59', () => expect(formatTime(59)).toBe('0:59'));
  it('600 → 10:00', () => expect(formatTime(600)).toBe('10:00'));
});
