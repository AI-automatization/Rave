'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Globe, Keyboard, Loader2, Maximize, Minimize, MousePointer2, X } from 'lucide-react';
import type { VBFrameSource, VBInput } from '@/hooks/use-virtual-browser';
import { VirtualBrowserAudio } from './VirtualBrowserAudio';

interface Props {
  isOwner: boolean;
  /** A frame has arrived for the current session (state — flips once per session). */
  hasFrame: boolean;
  /** The frames themselves, outside React — the <img> below swaps its src on each one. */
  frameSource: VBFrameSource;
  dimensions: { width: number; height: number } | null;
  error: string | null;
  /** Page VB is showing is a bot-challenge wall — see use-virtual-browser.ts's `blocked`. Not an
   * `error` (that's scoped to the pre-session URL-input screen, see the render tree below) — this
   * needs to show ON TOP of a live, still-streaming frame. */
  blocked: 'cloudflare' | 'recaptcha' | null;
  /** 1-indexed position while waiting for a Free-tier slot — see use-virtual-browser.ts. null =
   * not queued (Pro never queues, or the session just hasn't hit the cap). */
  queuePosition: number | null;
  /** VB reported the site itself can't be reached (use-virtual-browser.ts) — shown instead of the
   * generic URL screen, with a way to try the page as a plain iframe or pick another link. */
  unreachable: boolean;
  start: (url: string) => void;
  stop: () => void;
  sendInput: (input: VBInput) => void;
  /** Owner-only: opens the same video-candidate picker "Это не то видео" already opens — the
   * blocked-badge's escape hatch to pick a different source instead of waiting out a dead session. */
  onPickDifferentVideo?: () => void;
  /** Owner-only: re-open `url` as a plain iframe room media ('webview') instead of the VB — the
   * unreachable state's escape hatch (the server's IP may be blocked while the viewer's isn't). */
  onTryIframe?: (url: string | null) => void;
  /** Live MP3 of the VB page's sound (GET /vb-audio/:roomId) — played while frames are showing. */
  audioUrl?: string;
}

// Hidden-input sentinel: a zero-width char the phone keyboard can "delete", so Backspace still
// produces an input event on an otherwise empty field (Android fires nothing for an empty one).
const KB_BASE = '\u200b';
// Picture/sound sync: a screencast frame itself needs ~0.15s from the VB page to this <img>, so
// frames wait for the sound's delay minus that. Under 50ms isn't worth a timer; over 2.5s the
// sound is broken rather than late and the owner's clicks would feel dead.
const FRAME_PIPELINE_S = 0.15;
const MIN_FRAME_DELAY_MS = 50;
const MAX_FRAME_DELAY_MS = 2500;
// Buttons and the hint fade out after the mouse/finger rests this long, back on the next move.
const CONTROLS_HIDE_MS = 2500;

// Kosmi-style shared virtual browser: a real headless Chromium page runs on the server, the
// owner controls it with mouse/keyboard, and every room member just watches the same live JPEG
// frame stream. See services/watch-party/src/services/virtualBrowser.service.ts for the server
// side (CDP screencast + input dispatch). State/socket wiring lives in the parent's
// useVirtualBrowser() call (RoomContent.tsx) — this component is presentational + input capture.
export function VirtualBrowserPlayer({ isOwner, hasFrame, frameSource, dimensions, error, blocked, queuePosition, unreachable, start, stop, sendInput, onPickDifferentVideo, onTryIframe, audioUrl }: Props) {
  const t = useTranslations('party');
  const [urlInput, setUrlInput] = useState('');
  const lastUrlRef = useRef<string | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const frameDelayMsRef = useRef(0);
  const [controlsShown, setControlsShown] = useState(true);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wakeControls = useCallback(() => {
    setControlsShown(true);
    clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => setControlsShown(false), CONTROLS_HIDE_MS);
  }, []);
  useEffect(() => {
    wakeControls();
    return () => clearTimeout(hideControlsTimer.current);
  }, [wakeControls]);
  const setFrameDelay = useCallback((audioDelayS: number) => {
    frameDelayMsRef.current = Math.max(0, (audioDelayS - FRAME_PIPELINE_S) * 1000);
  }, []);
  const containerRef = useRef<HTMLDivElement>(null);
  const kbInputRef = useRef<HTMLInputElement>(null);
  const kbPrevRef = useRef(KB_BASE);
  // 'css' = fixed full-viewport fallback for iOS Safari on iPhone, where element fullscreen
  // (requestFullscreen on a non-<video> element) is unsupported.
  const [fsMode, setFsMode] = useState<'none' | 'native' | 'css'>('none');
  // Primary pointer is a finger — set in an effect (not initial state) so SSR/hydration match.
  const [isCoarse, setIsCoarse] = useState(false);
  const [kbOpen, setKbOpen] = useState(false);
  const kbOpenRef = useRef(false);
  kbOpenRef.current = kbOpen;
  const lastMoveRef = useRef(0);
  // Owner's own pointer position in CSS space (not server-viewport space) — purely local visual
  // feedback, no round-trip needed since it's just "where is MY mouse over the stream right now".
  const [localCursorCss, setLocalCursorCss] = useState<{ x: number; y: number } | null>(null);

  // Displayed-pixels per server-viewport pixel. The <img> is object-contain, so the picture can be
  // letterboxed inside the element (portrait phone frame in a wide box, landscape in a tall one) —
  // the scale is the smaller of the two axes, not the element's own width/height ratio.
  const getScale = useCallback((): number | null => {
    if (!imgRef.current || !dimensions) return null;
    const rect = imgRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return Math.min(rect.width / dimensions.width, rect.height / dimensions.height);
  }, [dimensions]);

  // Maps a viewport-space client point to the server-side browser's viewport regardless of how
  // large (or letterboxed) the <img> is rendered on screen. Takes raw coordinates rather than a
  // React.MouseEvent so the touch handlers below can reuse it — a TouchEvent has no clientX of its
  // own, only per-Touch ones.
  const clientToViewport = useCallback((clientX: number, clientY: number, strict = false): { x: number; y: number } | null => {
    const scale = getScale();
    if (!imgRef.current || !dimensions || !scale) return null;
    const rect = imgRef.current.getBoundingClientRect();
    const offsetX = (rect.width - dimensions.width * scale) / 2;
    const offsetY = (rect.height - dimensions.height * scale) / 2;
    // strict (taps): a point on the letterbox bars is not on the page — don't click an edge pixel.
    const px = (clientX - rect.left - offsetX) / scale;
    const py = (clientY - rect.top - offsetY) / scale;
    if (strict && (px < 0 || py < 0 || px >= dimensions.width || py >= dimensions.height)) return null;
    const clamp = (v: number, max: number) => Math.max(0, Math.min(max - 1, Math.round(v)));
    return {
      x: clamp(px, dimensions.width),
      y: clamp(py, dimensions.height),
    };
  }, [dimensions, getScale]);

  const toViewportCoords = useCallback(
    (e: React.MouseEvent) => clientToViewport(e.clientX, e.clientY),
    [clientToViewport],
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isOwner && imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      setLocalCursorCss({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    if (!isOwner) return;
    const now = Date.now();
    if (now - lastMoveRef.current < 40) return; // ~25fps — enough for pointer tracking, cheap
    lastMoveRef.current = now;
    const pos = toViewportCoords(e);
    if (pos) sendInput({ type: 'mousemove', x: pos.x, y: pos.y });
  };

  const handleMouseLeave = () => {
    if (isOwner) setLocalCursorCss(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isOwner) return;
    // Safari does not focus an <img> on click, so the keydown/keyup handlers below never fired
    // after the first interaction — typing into the remote page silently did nothing.
    imgRef.current?.focus();
    const pos = toViewportCoords(e);
    if (pos) sendInput({ type: 'mousedown', x: pos.x, y: pos.y });
  };

  const handleMouseUp = () => {
    if (!isOwner) return;
    sendInput({ type: 'mouseup' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOwner) return;
    e.preventDefault();
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      sendInput({ type: 'type', text: e.key });
    } else {
      sendInput({ type: 'keydown', key: e.key });
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (!isOwner) return;
    if (e.key.length !== 1) sendInput({ type: 'keyup', key: e.key });
  };

  // Native (non-React) wheel listener with { passive: false } — React attaches its synthetic
  // onWheel as a PASSIVE listener by default (has been since React 17, for scroll-perf reasons),
  // which silently makes e.preventDefault() a no-op. Without this, scrolling over the stream
  // scrolled the actual WeWatch page underneath instead of the remote browser — exactly the
  // reported bug. This is the standard workaround: attach the listener directly to the DOM node.
  useEffect(() => {
    const el = imgRef.current;
    if (!el || !isOwner) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      sendInput({ type: 'wheel', deltaX: e.deltaX, deltaY: e.deltaY });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [isOwner, sendInput, hasFrame]); // re-attach when the <img> mounts/unmounts

  // Touch input. Before this the component listened for mouse events ONLY, so on a phone or a
  // touchscreen laptop the virtual browser was completely uncontrollable — the reported bug.
  //
  // Native listeners with { passive: false } for the same reason as the wheel handler above:
  // React registers touchstart/touchmove passively, which makes preventDefault() a silent no-op,
  // and without it every drag scrolls the WeWatch page behind the stream instead.
  //
  // A finger drag is translated to WHEEL, not to a held mousemove: on a touch device dragging
  // means "scroll the page", whereas a held pointer drag would select text on the remote page.
  // A tap (no meaningful movement) becomes a real `tap` input — the server dispatches an actual
  // touch, which is what mobile-layout pages (menus, custom players) react to, unlike a mouse click.
  const gestureRef = useRef({ startX: 0, startY: 0, lastX: 0, lastY: 0, moved: false, accX: 0, accY: 0, flushTimer: null as ReturnType<typeof setTimeout> | null });
  useEffect(() => {
    const el = imgRef.current;
    if (!el || !isOwner) return;

    // Below this, the finger hasn't really moved — treat the gesture as a tap.
    const TAP_SLOP_PX = 10;
    // Gesture state lives in a ref, not in this closure: this effect used to re-run on every new
    // frame (~7/s on a phone session), and closure-local state reset mid-swipe — lastX/lastY
    // fell back to 0, so each re-attach emitted a huge opposite wheel delta that cancelled the
    // scroll (reproduced 2026-10-25: alternating +37 / -560 deltas, page never moved).
    const g = gestureRef.current;
    // touchmove fires ~60x/s; every one used to be its own socket emit, which on a phone connection
    // made scrolling lag behind the finger. Deltas are summed and flushed at most every 40ms.
    const flushWheel = () => {
      g.flushTimer = null;
      if (g.accX || g.accY) sendInput({ type: 'wheel', deltaX: g.accX, deltaY: g.accY });
      g.accX = 0;
      g.accY = 0;
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      e.preventDefault();
      // Same Safari focus problem as mousedown — but not while the on-screen keyboard is open:
      // moving focus off its hidden input would close the keyboard on every tap.
      if (!kbOpenRef.current) el.focus();
      g.startX = g.lastX = t.clientX;
      g.startY = g.lastY = t.clientY;
      g.moved = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      e.preventDefault();
      const dx = t.clientX - g.lastX;
      const dy = t.clientY - g.lastY;
      if (Math.abs(t.clientX - g.startX) > TAP_SLOP_PX || Math.abs(t.clientY - g.startY) > TAP_SLOP_PX) {
        g.moved = true;
      }
      g.lastX = t.clientX;
      g.lastY = t.clientY;
      if (!g.moved) return;
      // Negated: dragging the finger UP should scroll the content DOWN, which is a positive
      // wheel delta — the same convention as native touch scrolling. Divided by the display scale
      // so the remote page moves with the finger even when the frame is shown smaller/larger than
      // the server viewport.
      const scale = getScale() || 1;
      g.accX += -dx / scale;
      g.accY += -dy / scale;
      if (!g.flushTimer) g.flushTimer = setTimeout(flushWheel, 40);
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (g.flushTimer) { clearTimeout(g.flushTimer); flushWheel(); }
      if (g.moved) return; // it was a scroll, not a tap
      const pos = clientToViewport(g.startX, g.startY, true);
      if (pos) sendInput({ type: 'tap', x: pos.x, y: pos.y });
    };

    const onTouchCancel = () => {
      // System interrupted the gesture (call, notification shade, …) — never a tap.
      if (g.flushTimer) { clearTimeout(g.flushTimer); flushWheel(); }
      g.moved = true;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    el.addEventListener('touchcancel', onTouchCancel);
    return () => {
      // Flush (not drop) a pending batch — the re-attached listeners keep accumulating into g.
      if (g.flushTimer) { clearTimeout(g.flushTimer); flushWheel(); }
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [isOwner, sendInput, hasFrame, clientToViewport, getScale]);

  useEffect(() => {
    setIsCoarse(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  // Live frames straight into the <img>, no React render per frame (see use-virtual-browser.ts).
  // While the VB sound is audible each frame is held back by the sound's delay
  // (VirtualBrowserAudio onDelay), so picture and sound line up instead of the sound trailing.
  useEffect(() => {
    const el = imgRef.current;
    if (!el || !hasFrame) return;
    let seq = 0;
    let shownSeq = 0;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const paint = (frame: string, n: number) => {
      if (n <= shownSeq) return; // a newer frame is already up (the delay shrank)
      shownSeq = n;
      el.src = `data:image/jpeg;base64,${frame}`;
    };
    const show = (frame: string | null) => {
      if (!frame) return;
      const n = ++seq;
      const delayMs = Math.min(frameDelayMsRef.current, MAX_FRAME_DELAY_MS);
      if (delayMs < MIN_FRAME_DELAY_MS) { paint(frame, n); return; }
      const timer = setTimeout(() => { timers.delete(timer); paint(frame, n); }, delayMs);
      timers.add(timer);
    };
    show(frameSource.get());
    const unsubscribe = frameSource.subscribe(show);
    return () => {
      unsubscribe();
      timers.forEach(clearTimeout);
    };
  }, [hasFrame, frameSource, isOwner]);

  // Native fullscreen can also end from outside our button (Esc, iOS swipe, browser UI).
  useEffect(() => {
    const onChange = () => setFsMode((m) => (m === 'native' && !document.fullscreenElement ? 'none' : m));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (fsMode !== 'none') {
      if (fsMode === 'native' && document.fullscreenElement) void document.exitFullscreen().catch(() => {});
      setFsMode('none');
      return;
    }
    const el = containerRef.current;
    if (el && document.fullscreenEnabled && typeof el.requestFullscreen === 'function') {
      el.requestFullscreen().then(() => setFsMode('native')).catch(() => setFsMode('css'));
    } else {
      setFsMode('css');
    }
  };

  // On-screen keyboard (phones have no key events for a non-input <img>). A hidden text input takes
  // focus so the OS keyboard opens; its value is diffed against the previous one on every input
  // event, which handles predictive/IME composition too (a replaced word becomes N Backspaces +
  // the new text). Sent through the same `type` / keydown+keyup inputs as desktop typing.
  const toggleKeyboard = () => {
    const input = kbInputRef.current;
    if (!input) return;
    if (document.activeElement === input) input.blur();
    else input.focus(); // must stay inside the click handler — iOS only opens the keyboard from a user gesture
  };

  const resetKbInput = (el: HTMLInputElement) => {
    el.value = KB_BASE;
    kbPrevRef.current = KB_BASE;
    el.setSelectionRange(KB_BASE.length, KB_BASE.length);
  };

  const handleKbInput = (e: React.FormEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const cur = el.value;
    const prev = kbPrevRef.current;
    let common = 0;
    while (common < prev.length && common < cur.length && prev[common] === cur[common]) common++;
    for (let i = 0; i < prev.length - common; i++) {
      sendInput({ type: 'keydown', key: 'Backspace' });
      sendInput({ type: 'keyup', key: 'Backspace' });
    }
    const added = cur.slice(common);
    if (added) sendInput({ type: 'type', text: added });
    kbPrevRef.current = cur;
    // Never reset mid-composition (it would cancel the word the keyboard is building).
    const composing = (e.nativeEvent as InputEvent).isComposing;
    if (!composing && (cur.length > 32 || !cur.startsWith(KB_BASE))) resetKbInput(el);
  };

  const handleKbKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    sendInput({ type: 'keydown', key: 'Enter' });
    sendInput({ type: 'keyup', key: 'Enter' });
  };

  // 2026-08-25 (Saidazim: "виден только владельцу"). VB_FRAME is now emitted to the owner's
  // socket only (vbSession.helper.ts), so a non-owner never receives frame/dimensions data at
  // all — show a status message instead of the live screencast unconditionally, not just for the
  // pre-session (!frame && !dimensions) state.
  // 2026-10-26: when the room watches the VB itself (VB_WATCH_IN_BROWSER, watch-party
  // virtualBrowser.service.ts) members do get frames — then they watch the live screen too
  // (view only: every input handler above is owner-gated).
  if (!isOwner && !hasFrame) {
    return (
      <div className="aspect-video bg-[#0A0A12] rounded-xl flex flex-col items-center justify-center gap-2 text-center px-6">
        <Globe size={24} className="text-zinc-700" />
        <p className="text-sm text-zinc-500">{t('vbOwnerPicking')}</p>
      </div>
    );
  }

  if (!hasFrame && (!dimensions || unreachable)) {
    if (queuePosition !== null) {
      return (
        <div className="aspect-video bg-[#0A0A12] rounded-xl flex flex-col items-center justify-center gap-2 text-center px-6">
          <Loader2 size={24} className="text-violet-400/60 animate-spin" />
          <p className="text-sm text-zinc-300">{t('vbQueued', { position: queuePosition })}</p>
        </div>
      );
    }
    return (
      <div className={`bg-[#0A0A12] rounded-xl flex flex-col items-center justify-center gap-3 px-6 text-center ${unreachable ? 'min-h-[16rem] py-5' : 'aspect-video'}`}>
        {unreachable ? (
          <div role="alert" className="flex flex-col items-center gap-2" data-testid="vb-unreachable">
            <Globe size={24} className="text-red-400/80" />
            <p className="text-white text-sm font-semibold">{t('vbUnreachableTitle')}</p>
            <p className="text-white/55 text-xs max-w-sm">{t('vbUnreachableHint')}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {onTryIframe && (lastUrlRef.current || urlInput) && (
                <button
                  type="button"
                  onClick={() => onTryIframe(lastUrlRef.current ?? urlInput.trim())}
                  className="h-11 sm:h-9 rounded-lg px-4 text-[13px] font-medium text-white cursor-pointer bg-violet-600 hover:bg-violet-500"
                >
                  {t('vbTryIframe')}
                </button>
              )}
              <button
                type="button"
                onClick={() => { setUrlInput(''); urlInputRef.current?.focus(); }}
                className="h-11 sm:h-9 rounded-lg px-4 text-[13px] font-medium text-white/80 bg-white/10 hover:bg-white/15 cursor-pointer"
              >
                {t('vbTryAnother')}
              </button>
            </div>
          </div>
        ) : (
          <Globe size={24} className="text-violet-400/60" />
        )}
        <div className="flex gap-2 w-full max-w-sm">
          <input
            ref={urlInputRef}
            type="url"
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && urlInput) { lastUrlRef.current = urlInput; start(urlInput); } }}
            placeholder="https://..."
            className="flex-1 h-11 sm:h-10 px-3 bg-[#111118] border border-white/[0.08] rounded-lg text-base sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50"
          />
          <button
            onClick={() => { if (urlInput) { lastUrlRef.current = urlInput; start(urlInput); } }}
            disabled={!urlInput}
            className="h-11 sm:h-10 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            {t('vbOpen')}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>
    );
  }

  // Portrait frame (phone-sized viewport): sized by the frame's own ratio but capped to 70% of the
  // screen height so the chat below the player is never pushed off a phone. Landscape frames keep
  // the full-width 16:9 box. Fullscreen modes ignore all of this and fill the screen.
  const ratio = dimensions ? dimensions.width / dimensions.height : 16 / 9;
  const boxStyle: React.CSSProperties | undefined = fsMode !== 'none'
    ? undefined
    : ratio < 1
      ? { aspectRatio: ratio, width: `min(100%, calc(70dvh * ${ratio}))` }
      : { aspectRatio: ratio };
  // Hidden controls must not catch clicks meant for the page underneath.
  const fadeCls = controlsShown || kbOpen ? 'opacity-100' : 'opacity-0 [&_*]:!pointer-events-none';
  const btnCls = `${isCoarse ? 'w-11 h-11' : 'w-8 h-8'} rounded-lg bg-black/60 hover:bg-black/80 flex items-center justify-center text-white cursor-pointer`;

  return (
    <div
      ref={containerRef}
      style={boxStyle}
      onPointerMove={wakeControls}
      onPointerDown={wakeControls}
      className={`bg-black overflow-hidden ${
        fsMode === 'css'
          ? 'fixed inset-0 z-[70] h-[100dvh] w-screen'
          : fsMode === 'native'
            ? 'relative h-full w-full'
            : 'relative mx-auto rounded-xl'
      }`}
    >
      {/* Control cluster: pointer-events-none wrapper padded by the safe-area insets (notch / home
          bar in the CSS-fullscreen mode), buttons re-enable pointer events. */}
      <div
        className={`absolute inset-x-0 top-0 z-10 flex justify-end gap-2 p-2 pointer-events-none transition-opacity duration-300 ${fadeCls}`}
        style={{
          paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
          paddingRight: 'max(0.5rem, env(safe-area-inset-right))',
        }}
      >
        {hasFrame && audioUrl && <VirtualBrowserAudio src={audioUrl} onDelay={setFrameDelay} />}
        {isOwner && isCoarse && hasFrame && (
          <button
            type="button"
            // preventDefault on mousedown keeps focus where it is, so a tap on this button while the
            // keyboard is open closes it instead of blurring-then-reopening it.
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleKeyboard}
            aria-pressed={kbOpen}
            title={t('vbKeyboard')}
            aria-label={t('vbKeyboard')}
            className={`${btnCls} pointer-events-auto ${kbOpen ? '!bg-violet-600' : ''}`}
          >
            <Keyboard size={18} />
          </button>
        )}
        {hasFrame && (
          <button
            type="button"
            onClick={toggleFullscreen}
            title={fsMode === 'none' ? t('vbFullscreen') : t('vbExitFullscreen')}
            aria-label={fsMode === 'none' ? t('vbFullscreen') : t('vbExitFullscreen')}
            className={`${btnCls} pointer-events-auto`}
          >
            {fsMode === 'none' ? <Maximize size={16} /> : <Minimize size={16} />}
          </button>
        )}
        {isOwner && (
          <button
            type="button"
            onClick={stop}
            title={t('vbClose')}
            aria-label={t('vbClose')}
            className={`${btnCls} pointer-events-auto`}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Hidden input that owns the phone keyboard — see toggleKeyboard. 16px font so iOS doesn't
          zoom the page on focus; opacity-0 rather than display:none (a non-rendered input can't
          take focus). */}
      <input
        ref={kbInputRef}
        type="text"
        inputMode="text"
        enterKeyHint="go"
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        defaultValue={KB_BASE}
        aria-label={t('vbKeyboard')}
        tabIndex={-1}
        onFocus={(e) => { setKbOpen(true); resetKbInput(e.currentTarget); }}
        onBlur={() => setKbOpen(false)}
        onInput={handleKbInput}
        onKeyDown={handleKbKeyDown}
        className="absolute bottom-0 left-0 h-px w-px opacity-0 pointer-events-none"
        style={{ fontSize: 16 }}
      />

      {!hasFrame && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A12]/80">
          <Loader2 size={28} className="animate-spin text-violet-400" />
        </div>
      )}

      {hasFrame && (
        <>
          {/* Nothing in the room auto-plays here on purpose — the whole point of falling back to
              VB is a real page the owner has to click through (play button, ads, captchas). Without
              this hint people stared at a loaded page with no idea they were the ones expected to
              act on it. */}
          <div
            className={`absolute z-10 flex max-w-[calc(100%-10rem)] items-center gap-2 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm border border-violet-500/20 pointer-events-none transition-opacity duration-300 ${fadeCls}`}
            style={{ top: 'max(0.5rem, env(safe-area-inset-top))', left: 'max(0.5rem, env(safe-area-inset-left))' }}
          >
            <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-violet-400 animate-pulse" />
            <span className="truncate text-white/80 text-xs font-medium">{t('vbStartVideo')}</span>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element -- live JPEG frame stream (base64 data URL), not a real <Image>-optimizable asset */}
          <img
            ref={imgRef}
            alt=""
            draggable={false}
            tabIndex={isOwner ? 0 : -1}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onContextMenu={(e) => e.preventDefault()}
            // globals.css only applies touch-action to button/a/[role=button], so this <img> was
            // left with the browser default and every gesture went to page scroll/zoom first.
            // `none` for the owner only — viewers should still be able to scroll the room past it.
            style={isOwner ? { touchAction: 'none' } : undefined}
            className={`w-full h-full object-contain select-none ${isOwner ? 'cursor-none' : 'cursor-not-allowed'}`}
          />

          {/* Owner's own cursor — the JPEG screencast never contains an OS cursor (headless
              Chrome doesn't render one), so without this the owner has zero feedback about
              where they're about to click. cursor-none above hides the real OS pointer so this
              doesn't look like two overlapping cursors. */}
          {isOwner && localCursorCss && (
            <MousePointer2
              size={18}
              className="absolute pointer-events-none text-violet-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
              style={{ left: localCursorCss.x, top: localCursorCss.y, transform: 'translate(-2px,-2px)' }}
              fill="currentColor"
            />
          )}

          {/* Bot-challenge wall — not solved/bypassed (out of scope on purpose, see
              virtualBrowser.service.ts), just surfaced. Owner can click straight through to the
              candidate picker instead of waiting out a screencast that will never resolve on its
              own; non-owner sees the same badge but it's informational only (picker is owner-gated,
              same as "Это не то видео"). */}
          {blocked && (
            <button
              type="button"
              disabled={!isOwner || !onPickDifferentVideo}
              onClick={() => onPickDifferentVideo?.()}
              className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-[12px] font-medium text-white/80 backdrop-blur-sm transition-colors ${isOwner && onPickDifferentVideo ? 'cursor-pointer hover:bg-black/85 hover:text-white' : 'cursor-default'}`}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
              {t('vbBlocked')}
              {isOwner && onPickDifferentVideo && <span className="opacity-70">— {t('playerPickAnother')}</span>}
            </button>
          )}
        </>
      )}
    </div>
  );
}
