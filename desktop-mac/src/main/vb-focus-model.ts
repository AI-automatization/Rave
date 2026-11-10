// "Video only" for the docked VB: the room should get the film's picture, not the film SITE around it (menus, banners,
// comments, the Telegram button). The page the VB shows keeps running as it is; the element that holds the playing video is
// stretched over the whole view and everything else is hidden. Browsing the site again = turn this off.
//
// All scripts are plain strings run inside the VB page (main frame or one of its iframes). They are idempotent: running one
// again changes nothing, so the app can simply repeat them while the mode is on.

/** Marks used on the page (data attributes, so the site's own class names are never touched). */
export const FOCUS_ATTR = 'data-ww-focus';
export const FOCUS_EL = 'data-ww-focus-el';
export const FOCUS_ANC = 'data-ww-focus-anc';

/** The largest video that is actually playing in THIS frame: { area } or null. */
export const PLAYING_VIDEO_SCRIPT = `(() => {
  let best = 0;
  for (const v of document.querySelectorAll('video')) {
    if (v.paused || v.ended || v.readyState < 2) continue;
    const r = v.getBoundingClientRect();
    const area = Math.max(r.width, v.videoWidth ? 1 : 0) * Math.max(r.height, 1);
    if (r.width >= 160 && r.height >= 90 && area > best) best = area;
  }
  return best > 0 ? { area: best } : null;
})()`;

const STYLE = `
html[${FOCUS_ATTR}], html[${FOCUS_ATTR}] body { overflow: hidden !important; background: #000 !important; }
html[${FOCUS_ATTR}] body *:not([${FOCUS_ANC}]):not([${FOCUS_EL}]):not([${FOCUS_EL}] *) { visibility: hidden !important; }
html[${FOCUS_ATTR}] [${FOCUS_ANC}] { transform: none !important; filter: none !important; contain: none !important; perspective: none !important; clip-path: none !important; overflow: visible !important; backdrop-filter: none !important; will-change: auto !important; opacity: 1 !important; }
html[${FOCUS_ATTR}] [${FOCUS_EL}] { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; max-width: none !important; max-height: none !important; margin: 0 !important; padding: 0 !important; border: 0 !important; z-index: 2147483647 !important; background: #000 !important; visibility: visible !important; transform: none !important; }
`;

const MARK = `
  const STYLE_ID = 'ww-focus-style';
  if (!document.getElementById(STYLE_ID)) {
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = ${JSON.stringify(STYLE)};
    (document.head || document.documentElement).appendChild(st);
  }
  for (const e of document.querySelectorAll('[${FOCUS_EL}]')) if (e !== el) e.removeAttribute('${FOCUS_EL}');
  for (const e of document.querySelectorAll('[${FOCUS_ANC}]')) e.removeAttribute('${FOCUS_ANC}');
  el.setAttribute('${FOCUS_EL}', '');
  for (let a = el.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement) a.setAttribute('${FOCUS_ANC}', '');
  document.documentElement.setAttribute('${FOCUS_ATTR}', '');
  return true;
`;

/** In the frame that owns the playing <video>: the tightest "player" element around it fills the view. */
export const FOCUS_VIDEO_SCRIPT = `(() => {
  let video = null, best = 0;
  for (const v of document.querySelectorAll('video')) {
    if (v.paused || v.ended || v.readyState < 2) continue;
    const r = v.getBoundingClientRect();
    const area = r.width * r.height;
    if (r.width >= 160 && r.height >= 90 && area > best) { best = area; video = v; }
  }
  if (!video) return false;
  // climb to the element that wraps the video and its on-screen controls (about the video's own size), never to <body>
  let el = video;
  const vr = video.getBoundingClientRect();
  while (el.parentElement && el.parentElement !== document.body && el.parentElement !== document.documentElement) {
    const pr = el.parentElement.getBoundingClientRect();
    if (pr.width <= vr.width * 1.12 && pr.height <= vr.height * 1.25) el = el.parentElement; else break;
  }
  ${MARK}
})()`;

/** In the TOP frame: the <iframe> that holds the player (matched by its address, else the biggest iframe) fills the view. */
export const focusIframeScript = (frameUrl: string): string => `(() => {
  const want = ${JSON.stringify(frameUrl)};
  const norm = (u) => { try { const x = new URL(u, location.href); return x.origin + x.pathname; } catch (e) { return ''; } };
  const wantN = norm(want);
  const frames = Array.from(document.querySelectorAll('iframe'));
  let el = frames.find((f) => f.src && norm(f.src) === wantN) || null;
  if (!el) {
    let best = 0;
    for (const f of frames) { const r = f.getBoundingClientRect(); if (r.width * r.height > best) { best = r.width * r.height; el = f; } }
  }
  if (!el) return false;
  ${MARK}
})()`;

/** Back to the normal page. */
export const UNFOCUS_SCRIPT = `(() => {
  const root = document.documentElement;
  if (!root.hasAttribute('${FOCUS_ATTR}')) return false;
  root.removeAttribute('${FOCUS_ATTR}');
  for (const e of document.querySelectorAll('[${FOCUS_EL}]')) e.removeAttribute('${FOCUS_EL}');
  for (const e of document.querySelectorAll('[${FOCUS_ANC}]')) e.removeAttribute('${FOCUS_ANC}');
  const st = document.getElementById('ww-focus-style');
  if (st) st.remove();
  return true;
})()`;

export interface FrameProbe { id: number; isMain: boolean; url: string; area: number }

/** The frame that holds the film: the one with the largest playing video; null = nothing is playing. */
export function pickPlayerFrame(probes: readonly FrameProbe[]): FrameProbe | null {
  let best: FrameProbe | null = null;
  for (const p of probes) if (p.area > 0 && (!best || p.area > best.area)) best = p;
  return best;
}
