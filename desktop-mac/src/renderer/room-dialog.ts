// Native "Create room" / "Join room" dialogs for the Home renderer. A plain browser script (no imports, no framework),
// loaded BEFORE home.js; it exposes one global, window.wwRoomDialog = { open(kind, strings, opts), close() }.
// It never makes a request: it hands what the user typed to the bridge functions in `opts` (the main process
// validates everything again, talks to the server and opens the room) and shows the text it gets back.
// DOM is built with createElement/textContent only — never innerHTML — and styled by classes (room-dialog.css).

// Wrapped in a function so this script's names do not collide with the other renderer scripts (all are plain scripts).
(() => {
interface RoomDialogStrings {
  createTitle: string;
  urlPlaceholder: string;
  roomName: string;
  roomNamePlaceholder: string;
  whoCanJoin: string;
  visibilityPublic: string;
  visibilityPublicDesc: string;
  visibilityPrivate: string;
  visibilityPrivateDesc: string;
  creating: string;
  createBtn: string;
  createError: string;
  joinTitle: string;
  joinDesc: string;
  joining: string;
  joinBtn: string;
  joinError: string;
  close: string;
  whatToWatch: string;
  backBtn: string;
  searchPlaceholder: string;
  searchNoResults: string;
  searchAvailable: string;
  otherSources: string;
  clipboardDetected: string;
  hintPlatform: string;
  hintWeb: string;
}
/** One in-app search row, as the main process sends it (video-search-model.ts SearchItem). */
interface SearchItemDto {
  title: string;
  thumbnail: string | null;
  url: string;
  platform: string;
  duration: string | null;
}
/** What the main process answers. `message` is plain text for the user; `reason: 'unauthorized'` closes the dialog. */
type DialogResult = { ok: true } | { ok: false; message?: string; reason?: string };
interface DialogOptions {
  /** title/thumbnail: what step 1 showed (search result or oEmbed), re-checked by the main process. */
  create?(url: string, name: string, isPrivate: boolean, title: string | null, thumbnail: string | null): Promise<DialogResult>;
  join?(code: string): Promise<DialogResult>;
  /** In-app search (>= 2 chars, debounced 400 ms here). */
  search?(q: string): Promise<SearchItemDto[]>;
  /** Title + thumbnail of a typed YouTube/Rutube link (debounced 800 ms here). */
  videoMeta?(url: string): Promise<{ title: string | null; thumbnail: string | null }>;
  /** Clipboard auto-detect when the create dialog opens: only a platform video link, else { url: null }. */
  readClipboard?(): Promise<{ url: string | null }>;
  /** A tile without in-app search: its site (main opens it from its own table). */
  openPlatform?(id: string): Promise<unknown>;
  onClose?(): void;
}
type Kind = 'create' | 'join';

const MAX_NAME = 60; // the web input's maxLength
const MAX_CODE = 10; // the web join field: a typed code is uppercased and cut at 10
const LINK_RE = /^https?:\/\/|\/room\//i;
const SVG_NS = 'http://www.w3.org/2000/svg';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function icon(paths: readonly string[], size = 16): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  for (const d of paths) {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', d);
    svg.append(p);
  }
  return svg;
}
const ICON_CLOSE = ['M18 6 6 18', 'm6 6 12 12'];
const ICON_USERS = ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'];
const ICON_LOCK = ['M5 11h14v10H5z', 'M7 11V7a5 5 0 0 1 10 0v4'];
const ICON_SEARCH = ['M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0', 'm21 21-4.3-4.3'];
const ICON_ARROW = ['M5 12h14', 'm12 5 7 7-7 7'];
const ICON_LEFT = ['m12 19-7-7 7-7', 'M19 12H5'];
const ICON_DOWN = ['m6 9 6 6 6-6'];
const ICON_UP = ['m18 15-6-6-6 6'];

let overlay: HTMLDivElement | null = null;
let restoreFocus: HTMLElement | null = null;
let onClose: (() => void) | undefined;
let busy = false;

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusables(): HTMLElement[] {
  return overlay ? [...overlay.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((e) => e.offsetParent !== null || e === document.activeElement) : [];
}

function close(): void {
  if (!overlay) return;
  overlay.remove();
  overlay = null;
  busy = false;
  document.removeEventListener('keydown', onKey, true);
  const back = restoreFocus;
  restoreFocus = null;
  if (back && back.isConnected) back.focus();
  const cb = onClose;
  onClose = undefined;
  cb?.();
}

/** Escape closes, Tab stays inside the dialog (focus trap). Enter is handled per field. */
function onKey(e: KeyboardEvent): void {
  if (!overlay) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    close();
    return;
  }
  if (e.key !== 'Tab') return;
  const list = focusables();
  const first = list[0];
  const last = list[list.length - 1];
  if (!first || !last) {
    e.preventDefault();
    return;
  }
  const active = document.activeElement;
  if (!overlay.contains(active)) {
    e.preventDefault();
    first.focus();
  } else if (e.shiftKey && active === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}

interface Frame {
  title: HTMLHeadingElement;
  dialog: HTMLDivElement;
  body: HTMLDivElement;
  error: HTMLDivElement;
}

function frame(title: string, desc: string | null, s: RoomDialogStrings): Frame {
  overlay = el('div', 'rd-overlay');
  const dialog = el('div', 'rd-dialog');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'rd-title');
  const head = el('div', 'rd-head');
  const h = el('h2', 'rd-title', title);
  h.id = 'rd-title';
  const x = el('button', 'rd-x');
  x.type = 'button';
  x.setAttribute('aria-label', s.close);
  x.title = s.close;
  x.append(icon(ICON_CLOSE));
  x.addEventListener('click', () => close());
  head.append(h, x);
  dialog.append(head);
  if (desc) {
    const d = el('p', 'rd-desc', desc);
    d.id = 'rd-desc';
    dialog.setAttribute('aria-describedby', 'rd-desc');
    dialog.append(d);
  }
  const body = el('div', 'rd-body');
  const error = el('div', 'rd-error');
  error.setAttribute('role', 'alert');
  error.hidden = true;
  dialog.append(body);
  overlay.append(dialog);
  // A click on the dimmed backdrop (not inside the dialog) closes it, like the web dialog.
  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay && !busy) close();
  });
  return { title: h, dialog, body, error };
}

function showError(box: HTMLDivElement, text: string): void {
  box.textContent = text;
  box.hidden = text === '';
}

/** Runs one submit: button shows the "...ing" text, the answer either closes the dialog or shows its message. */
async function submit(
  run: () => Promise<DialogResult>, button: HTMLButtonElement, idle: string, pending: string, fallback: string, error: HTMLDivElement, fields: HTMLElement[],
): Promise<void> {
  if (busy) return;
  busy = true;
  const mine = overlay;
  button.disabled = true;
  button.textContent = pending;
  button.classList.add('rd-pending');
  for (const f of fields) f.setAttribute('aria-busy', 'true');
  showError(error, '');
  let r: DialogResult;
  try {
    r = await run();
  } catch {
    r = { ok: false };
  }
  if (overlay !== mine) return; // closed (or reopened) meanwhile
  busy = false;
  if (r.ok || r.reason === 'unauthorized') {
    close(); // the main process opens the room (or the login)
    return;
  }
  button.disabled = false;
  button.textContent = idle;
  button.classList.remove('rd-pending');
  for (const f of fields) f.removeAttribute('aria-busy');
  showError(error, typeof r.message === 'string' && r.message.trim() !== '' ? r.message : fallback);
}

function field(label: string | null, input: HTMLInputElement): HTMLDivElement {
  const wrap = el('div', 'rd-field');
  if (label) {
    const l = el('label', 'rd-label', label);
    l.htmlFor = input.id;
    wrap.append(l);
  }
  wrap.append(input);
  return wrap;
}

// ---------------------------------------------------------------- platforms (platforms.tsx: same ids, names, colors, icons)
interface Shape { t: 'path' | 'circle' | 'rect'; a: Record<string, string> }
interface PlatformDef {
  id: string;
  name: string;
  pattern: RegExp | null;
  box: string;
  shapes: Shape[];
  /** true: drawn with strokes (lucide Globe), false: filled. */
  stroke?: boolean;
}
const P = (d: string, fill?: string): Shape => ({ t: 'path', a: fill ? { d, fill } : { d } });
const PLATFORMS: readonly PlatformDef[] = [
  { id: 'youtube', name: 'YouTube', pattern: /youtube\.com|youtu\.be/, box: '0 0 24 24', shapes: [P('M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z')] },
  { id: 'vk', name: 'VK Видео', pattern: /vkvideo\.ru|vk\.com\/video/, box: '0 0 24 24', shapes: [P('M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.712-1.033-1.01-1.49-.69-1.49.318v1.394H12.51c-2.785 0-4.52-1.814-4.52-5.008C7.99 9.42 9.754 7.5 12.58 7.5h1.542v1.572c0 .345.14.55.51.55.34 0 .55-.142.55-.55V7.5h1.748c1.035 0 1.497.49 1.497 1.553v4.988c0 .99-.346 1.47-1.05 1.47-.716 0-1.097-.49-1.097-1.47V12.57c0-1.17-.413-1.753-1.317-1.753-.883 0-1.317.583-1.317 1.753v1.493h-.002c0 .81.39 1.263 1.085 1.263.41 0 .738-.156.965-.465.27 2.11 2.037 2.262 2.037 2.262z')] },
  { id: 'rutube', name: 'Rutube', pattern: /rutube\.ru/, box: '0 0 100 100', shapes: [{ t: 'circle', a: { cx: '50', cy: '50', r: '50', fill: '#E8232A' } }, P('M28 22h27c14.4 0 23 7.5 23 20 0 8.5-4.5 15-12 18l17 18H67L55 60H44v18H28V22zm16 27h11c6 0 9.5-3 9.5-7s-3.5-7-9.5-7H44v14z', 'white')] },
  { id: 'twitch', name: 'Twitch', pattern: /twitch\.tv/, box: '0 0 24 24', shapes: [P('M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0 1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z')] },
  { id: 'vimeo', name: 'Vimeo', pattern: /vimeo\.com/, box: '0 0 24 24', shapes: [P('M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197a315.065 315.065 0 0 0 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.179 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.753 6.762-5.674 2.473.06 3.628 1.664 3.494 4.844Z')] },
  { id: 'dailymotion', name: 'Dailymotion', pattern: /dailymotion\.com|dai\.ly/, box: '0 0 24 24', shapes: [P('M20.5 0h-17A3.5 3.5 0 0 0 0 3.5v17A3.5 3.5 0 0 0 3.5 24h17a3.5 3.5 0 0 0 3.5-3.5v-17A3.5 3.5 0 0 0 20.5 0Zm-2.34 18.3h-2.87v-1.28h-.04c-.5.94-1.6 1.52-2.75 1.52-2.7 0-4.5-2.12-4.5-4.85 0-2.5 1.66-4.84 4.32-4.84 1.1 0 2.2.44 2.83 1.32h.04V4.5h3l-.03 13.8Zm-4.9-2.15c1.34 0 2.05-1.13 2.05-2.36 0-1.26-.68-2.4-2.05-2.4-1.36 0-1.98 1.19-1.98 2.4 0 1.19.66 2.36 1.98 2.36Z')] },
  { id: 'peertube', name: 'PeerTube', pattern: /\/videos\/watch\/[0-9a-f-]{36}|\/w\/[a-zA-Z0-9]{22}$/, box: '0 0 24 24', shapes: [P('M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-2 14.5v-9l7 4.5-7 4.5Z')] },
  { id: 'trovo', name: 'Trovo', pattern: /trovo\.live/, box: '0 0 24 24', shapes: [P('M12 2 2 7v10l10 5 10-5V7L12 2Zm0 2.24 7 3.5v7.52l-7 3.5-7-3.5V7.74l7-3.5ZM9.5 8v8l7-4-7-4Z')] },
  { id: 'cinerama', name: 'Cinerama', pattern: /cinerama\.uz/, box: '0 0 24 24', shapes: [P('M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3zM8 17H6v-2h2zm0-4H6v-2h2zm0-4H6V7h2zm10 8h-2v-2h2zm0-4h-2v-2h2zm0-4h-2V7h2z'), P('M11 8l-3 4 3 4h2l-3-4 3-4z')] },
  { id: 'live', name: 'YouTube Live', pattern: /youtube\.com\/.*live/, box: '0 0 24 24', shapes: [{ t: 'rect', a: { width: '24', height: '24', rx: '5', fill: '#FF0000' } }, P('M17.5 6.5h-11C5.67 6.5 5 7.17 5 8v8c0 .83.67 1.5 1.5 1.5h11c.83 0 1.5-.67 1.5-1.5V8c0-.83-.67-1.5-1.5-1.5zM10 15V9l5 3-5 3z', 'white'), { t: 'circle', a: { cx: '19.5', cy: '4.5', r: '3', fill: '#00C853' } }] },
  { id: 'web', name: 'Web', pattern: null, box: '0 0 24 24', stroke: true, shapes: [{ t: 'circle', a: { cx: '12', cy: '12', r: '10' } }, P('M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20'), P('M2 12h20')] },
];
const TOP_PLATFORM_IDS = ['youtube', 'vk', 'rutube', 'twitch'];
const SEARCHABLE_PLATFORM_IDS = new Set(['youtube', 'rutube', 'vk', 'dailymotion', 'peertube', 'live']);
const detectPlatform = (url: string): PlatformDef | null => PLATFORMS.find((p) => p.pattern?.test(url)) ?? null;

function platformIcon(p: PlatformDef, size: number): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', p.box);
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('aria-hidden', 'true');
  if (p.stroke) {
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
  } else {
    svg.setAttribute('fill', 'currentColor');
  }
  for (const sh of p.shapes) {
    const node = document.createElementNS(SVG_NS, sh.t);
    for (const [k, v] of Object.entries(sh.a)) node.setAttribute(k, v);
    svg.append(node);
  }
  return svg;
}

function spinner(): HTMLSpanElement {
  const s = el('span', 'rd-spin');
  s.setAttribute('aria-hidden', 'true');
  return s;
}

// ---------------------------------------------------------------- create (two steps, as CreateRoomDialog)

function buildCreate(s: RoomDialogStrings, opts: DialogOptions): HTMLElement {
  const f = frame(s.whatToWatch, null, s);
  f.dialog.classList.add('rd-wide');
  const mine = overlay;
  const alive = (): boolean => overlay === mine;

  // State (CreateRoomDialog useState list).
  let step: 1 | 2 = 1;
  let videoUrl = '';
  let videoTitle = '';
  let videoThumbnail: string | null = null;
  let active: PlatformDef | null = null;
  let clipDetected = false;
  let titleLoading = false;
  let showOther = false;
  let roomName = '';
  let isPrivate = false;
  let searchResults: SearchItemDto[] = [];
  let searchLoading = false;
  let debounced = '';
  let titleTimer: number | undefined;
  let searchTimer: number | undefined;
  let metaToken = 0;
  let searchToken = 0;

  // ---- step 1 elements (built once; kept while on step 2 so going back restores them)
  const s1 = el('div', 'rd-step');
  const clip = el('div', 'rd-clip');
  const clipText = el('span', 'rd-clip-text', s.clipboardDetected);
  const clipX = el('button', 'rd-clip-x');
  clipX.type = 'button';
  clipX.setAttribute('aria-label', s.close);
  clipX.append(icon(ICON_CLOSE, 13));
  const clipIcon = el('span', 'rd-clip-icon', '📋');
  clip.append(clipIcon, clipText, clipX);

  const urlRow = el('div', 'rd-url-row');
  const urlWrap = el('div', 'rd-url-wrap');
  const urlIcon = el('span', 'rd-url-icon');
  const url = el('input', 'rd-input');
  url.id = 'rd-url';
  url.type = 'url';
  url.placeholder = s.urlPlaceholder;
  url.autocomplete = 'off';
  url.spellcheck = false;
  url.setAttribute('aria-label', s.urlPlaceholder);
  urlWrap.append(urlIcon, url);
  const next = el('button', 'rd-next');
  next.type = 'button';
  next.setAttribute('aria-label', s.createTitle);
  urlRow.append(urlWrap, next);

  const searchWrap = el('div', 'rd-search-wrap');
  const searchIcon = el('span', 'rd-search-icon');
  searchIcon.append(icon(ICON_SEARCH, 14));
  const search = el('input', 'rd-input rd-search');
  search.id = 'rd-search';
  search.type = 'text';
  search.placeholder = s.searchPlaceholder;
  search.autocomplete = 'off';
  search.setAttribute('aria-label', s.searchPlaceholder);
  searchWrap.append(searchIcon, search);
  const results = el('div', 'rd-results');
  results.setAttribute('role', 'listbox');
  results.setAttribute('aria-label', s.searchPlaceholder);

  const preview = el('div', 'rd-title-preview');
  const hint = el('p', 'rd-hint');
  const topGrid = el('div', 'rd-tiles');
  const otherToggle = el('button', 'rd-other');
  otherToggle.type = 'button';
  const otherGrid = el('div', 'rd-tiles');
  const tiles = new Map<string, HTMLButtonElement>();
  for (const p of PLATFORMS) {
    const b = el('button', `rd-tile rd-p-${p.id}`);
    b.type = 'button';
    const ic = el('span', 'rd-tile-icon');
    ic.append(platformIcon(p, 26));
    b.append(ic, el('span', 'rd-tile-name', p.name));
    if (SEARCHABLE_PLATFORM_IDS.has(p.id)) {
      const badge = el('span', 'rd-tile-badge');
      badge.title = s.searchAvailable;
      badge.append(icon(ICON_SEARCH, 9));
      b.append(badge);
    }
    b.addEventListener('click', () => platformClick(p));
    tiles.set(p.id, b);
    (TOP_PLATFORM_IDS.includes(p.id) ? topGrid : otherGrid).append(b);
  }
  s1.append(clip, urlRow, searchWrap, results, preview, hint, topGrid, otherToggle, otherGrid);

  const canAdvance = (): boolean => videoUrl.trim() !== '' && !titleLoading;

  function paint1(): void {
    clip.hidden = !clipDetected;
    urlIcon.replaceChildren(...(active ? [platformIcon(active, 16)] : []));
    urlIcon.className = active ? `rd-url-icon rd-p-${active.id}` : 'rd-url-icon';
    urlWrap.classList.toggle('rd-has-icon', active !== null);
    next.disabled = !canAdvance();
    next.replaceChildren(titleLoading ? spinner() : icon(ICON_ARROW, 18));
    preview.hidden = !(videoTitle || titleLoading);
    preview.replaceChildren(titleLoading ? spinner() : el('span', 'rd-play', '▶'), el('span', 'rd-title-text', titleLoading ? '...' : videoTitle));
    const hintText = active ? (active.id === 'web' ? s.hintWeb : `${s.hintPlatform} (${active.name})`) : '';
    hint.hidden = !hintText || clipDetected;
    hint.textContent = hintText;
    for (const [id, b] of tiles) b.classList.toggle('rd-active', active?.id === id);
    otherToggle.replaceChildren(document.createTextNode(s.otherSources), icon(showOther ? ICON_UP : ICON_DOWN, 13));
    otherToggle.setAttribute('aria-expanded', String(showOther));
    otherGrid.hidden = !showOther;
    paintResults();
  }

  function paintResults(): void {
    results.hidden = debounced.length < 2;
    if (results.hidden) return;
    if (searchLoading) {
      const row = el('div', 'rd-results-msg');
      row.append(spinner());
      results.replaceChildren(row);
      return;
    }
    if (searchResults.length === 0) {
      results.replaceChildren(el('p', 'rd-results-msg', s.searchNoResults));
      return;
    }
    results.replaceChildren(...searchResults.map((item) => {
      const b = el('button', 'rd-result');
      b.type = 'button';
      b.setAttribute('role', 'option');
      const thumb = el('div', 'rd-thumb');
      if (item.thumbnail && item.thumbnail.startsWith('https:')) {
        const img = el('img');
        img.src = item.thumbnail;
        img.alt = '';
        img.referrerPolicy = 'no-referrer';
        thumb.append(img);
      }
      if (item.duration) thumb.append(el('span', 'rd-duration', item.duration));
      const text = el('div', 'rd-result-text');
      text.append(el('p', 'rd-result-title', item.title));
      const meta = el('div', 'rd-result-meta');
      const p = PLATFORMS.find((x) => x.id === item.platform);
      if (p) {
        const ic = el('span', `rd-result-icon rd-p-${p.id}`);
        ic.append(platformIcon(p, 10));
        meta.append(ic);
      }
      meta.append(el('span', 'rd-result-platform', p?.name ?? item.platform));
      text.append(meta);
      b.append(thumb, text);
      b.addEventListener('click', () => selectResult(item));
      return b;
    }));
  }

  function fetchMeta(u: string): void {
    const token = ++metaToken;
    titleLoading = true;
    paint1();
    const done = (m: { title: string | null; thumbnail: string | null } | null): void => {
      if (!alive() || token !== metaToken) return;
      if (m?.title) videoTitle = m.title;
      if (m?.thumbnail) videoThumbnail = m.thumbnail;
      titleLoading = false;
      paint1();
    };
    if (!opts.videoMeta) {
      done(null);
      return;
    }
    opts.videoMeta(u).then(done, () => done(null));
  }

  function urlChanged(v: string): void {
    videoUrl = v;
    clipDetected = false;
    active = detectPlatform(v);
    window.clearTimeout(titleTimer);
    metaToken++;
    titleLoading = false;
    videoThumbnail = null;
    if (v.length > 12) {
      titleTimer = window.setTimeout(() => fetchMeta(v), 800);
    } else {
      videoTitle = '';
    }
    showError(f.error, '');
    paint1();
  }

  function selectResult(item: SearchItemDto): void {
    videoUrl = item.url;
    url.value = item.url;
    videoTitle = item.title;
    videoThumbnail = item.thumbnail;
    active = detectPlatform(item.url);
    clipDetected = false;
    metaToken++;
    titleLoading = false;
    search.value = '';
    debounced = '';
    searchResults = [];
    roomName = item.title.slice(0, MAX_NAME);
    goStep(2);
  }

  function platformClick(p: PlatformDef): void {
    active = p;
    paint1();
    if (SEARCHABLE_PLATFORM_IDS.has(p.id)) {
      window.setTimeout(() => search.focus(), 80);
      return;
    }
    if (p.id !== 'web') void opts.openPlatform?.(p.id); // the web opens the site in a popup window; here: the system browser
    window.setTimeout(() => url.focus(), 80);
  }

  function goToStep2(): void {
    if (!canAdvance()) return;
    roomName = roomName || videoTitle.slice(0, MAX_NAME);
    goStep(2);
  }

  url.addEventListener('input', () => urlChanged(url.value));
  url.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      goToStep2();
    }
  });
  next.addEventListener('click', goToStep2);
  search.addEventListener('input', () => {
    window.clearTimeout(searchTimer);
    const q = search.value;
    searchTimer = window.setTimeout(() => {
      debounced = q.trim();
      const token = ++searchToken;
      if (debounced.length < 2 || !opts.search) {
        searchResults = [];
        searchLoading = false;
        paintResults();
        return;
      }
      searchLoading = true;
      paintResults();
      const done = (items: SearchItemDto[]): void => {
        if (!alive() || token !== searchToken) return;
        searchResults = Array.isArray(items) ? items : [];
        searchLoading = false;
        paintResults();
      };
      opts.search(debounced).then(done, () => done([]));
    }, 400);
  });
  clipX.addEventListener('click', () => {
    clipDetected = false;
    videoUrl = '';
    url.value = '';
    videoTitle = '';
    videoThumbnail = null;
    active = null;
    metaToken++;
    titleLoading = false;
    paint1();
    url.focus();
  });
  otherToggle.addEventListener('click', () => {
    showOther = !showOther;
    paint1();
  });

  // ---- step 2 (room name + who can join)
  function buildStep2(): [HTMLElement, HTMLInputElement] {
    const s2 = el('div', 'rd-step');
    const back = el('button', 'rd-back');
    back.type = 'button';
    back.append(icon(ICON_LEFT, 13), document.createTextNode(s.backBtn));
    back.addEventListener('click', () => {
      if (!busy) goStep(1);
    });
    s2.append(back);
    if (videoTitle) {
      const card = el('div', 'rd-video');
      const thumb = el('div', 'rd-thumb');
      if (videoThumbnail && videoThumbnail.startsWith('https:')) {
        const img = el('img');
        img.src = videoThumbnail;
        img.alt = '';
        img.referrerPolicy = 'no-referrer';
        thumb.append(img);
      }
      const text = el('div', 'rd-result-text');
      text.append(el('p', 'rd-video-title', videoTitle));
      if (active) {
        const meta = el('div', 'rd-result-meta');
        const ic = el('span', `rd-result-icon rd-p-${active.id}`);
        ic.append(platformIcon(active, 10));
        meta.append(ic, el('span', 'rd-result-platform', active.name));
        text.append(meta);
      }
      card.append(thumb, text);
      s2.append(card);
    }
    const name = el('input', 'rd-input');
    name.id = 'rd-name';
    name.type = 'text';
    name.placeholder = s.roomNamePlaceholder;
    name.maxLength = MAX_NAME;
    name.autocomplete = 'off';
    name.value = roomName;
    name.addEventListener('input', () => {
      roomName = name.value;
      showError(f.error, '');
    });

    // Visibility: the only two states the backend has (isPrivate). Public is the web default.
    const group = el('div', 'rd-options');
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-label', s.whoCanJoin);
    const option = (priv: boolean, title: string, desc: string, paths: readonly string[]): HTMLButtonElement => {
      const b = el('button', 'rd-option');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      const ic = el('span', 'rd-option-icon');
      ic.append(icon(paths, 15));
      b.append(ic, el('span', 'rd-option-title', title), el('span', 'rd-option-desc', desc));
      b.addEventListener('click', () => {
        isPrivate = priv;
        sync();
      });
      return b;
    };
    const pub = option(false, s.visibilityPublic, s.visibilityPublicDesc, ICON_USERS);
    const priv = option(true, s.visibilityPrivate, s.visibilityPrivateDesc, ICON_LOCK);
    const sync = (): void => {
      for (const [b, on] of [[pub, !isPrivate], [priv, isPrivate]] as const) {
        b.classList.toggle('rd-selected', on);
        b.setAttribute('aria-checked', String(on));
        b.tabIndex = on ? 0 : -1;
      }
    };
    group.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      isPrivate = !isPrivate;
      sync();
      (isPrivate ? priv : pub).focus();
    });
    group.append(pub, priv);
    sync();

    const go = el('button', 'rd-submit', s.createBtn);
    go.type = 'button';
    const send = (): void => {
      if (!opts.create) return;
      const create = opts.create;
      void submit(() => create(videoUrl, name.value, isPrivate, videoTitle || null, videoThumbnail), go, s.createBtn, s.creating, s.createError, f.error, [name]);
    };
    name.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        send();
      }
    });
    go.addEventListener('click', send);
    const vis = el('div', 'rd-field');
    vis.append(el('span', 'rd-label', s.whoCanJoin), group);
    s2.append(field(s.roomName, name), vis, f.error, go);
    return [s2, name];
  }

  function goStep(n: 1 | 2): void {
    step = n;
    f.title.textContent = step === 1 ? s.whatToWatch : s.createTitle;
    showError(f.error, '');
    if (step === 1) {
      f.body.replaceChildren(s1);
      paint1();
      url.focus();
    } else {
      window.clearTimeout(searchTimer);
      searchToken++;
      const [s2, name] = buildStep2();
      f.body.replaceChildren(s2);
      name.focus();
    }
  }

  f.body.append(s1);
  paint1();

  // Clipboard auto-detect on open (the web does it 200 ms after opening); the main process only ever returns a
  // platform video link, never other clipboard text.
  if (opts.readClipboard) {
    const read = opts.readClipboard;
    window.setTimeout(() => {
      if (!alive() || step !== 1 || videoUrl) return;
      read().then((r) => {
        const link = r && typeof r.url === 'string' ? r.url : null;
        if (!link || !alive() || step !== 1 || videoUrl) return;
        videoUrl = link;
        url.value = link;
        active = detectPlatform(link);
        clipDetected = true;
        paint1();
        fetchMeta(link);
      }, () => {});
    }, 200);
  }
  return url;
}

function buildJoin(s: RoomDialogStrings, opts: DialogOptions): HTMLElement {
  const f = frame(s.joinTitle, s.joinDesc, s);
  const code = el('input', 'rd-input rd-code');
  code.id = 'rd-code';
  code.type = 'text';
  code.placeholder = 'ABC123';
  code.autocomplete = 'off';
  code.spellcheck = false;
  code.setAttribute('aria-labelledby', 'rd-title');
  const go = el('button', 'rd-submit', s.joinBtn);
  go.type = 'button';
  const canGo = (): boolean => code.value.trim().length >= 4;
  const refresh = (): void => {
    if (!busy) go.disabled = !canGo();
  };
  const send = (): void => {
    if (!canGo() || !opts.join) return;
    const join = opts.join;
    void submit(() => join(code.value), go, s.joinBtn, s.joining, s.joinError, f.error, [code]);
  };
  code.addEventListener('input', () => {
    // Keep a pasted link as typed (paths/ids are case-sensitive); plain codes stay uppercase, max 10 (as the web).
    const v = code.value;
    const next = LINK_RE.test(v) ? v : v.toUpperCase().slice(0, MAX_CODE);
    if (next !== v) code.value = next;
    code.classList.remove('rd-invalid');
    code.removeAttribute('aria-invalid');
    showError(f.error, '');
    refresh();
  });
  code.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      send();
    }
  });
  go.addEventListener('click', send);
  refresh();
  // A failed join marks the field (the web shows the error under the field and reddens it).
  new MutationObserver(() => {
    const bad = !f.error.hidden;
    code.classList.toggle('rd-invalid', bad);
    if (bad) code.setAttribute('aria-invalid', 'true');
    else code.removeAttribute('aria-invalid');
  }).observe(f.error, { attributes: true, attributeFilter: ['hidden'] });
  f.body.append(code, f.error, go);
  return code;
}

function open(kind: Kind, strings: RoomDialogStrings, opts: DialogOptions = {}): void {
  if (kind !== 'create' && kind !== 'join') return;
  if (overlay) close();
  restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  onClose = opts.onClose;
  const first = kind === 'create' ? buildCreate(strings, opts) : buildJoin(strings, opts);
  if (!overlay) return;
  document.body.append(overlay);
  document.addEventListener('keydown', onKey, true);
  first.focus();
}

(window as unknown as { wwRoomDialog: { open: typeof open; close: typeof close } }).wwRoomDialog = Object.freeze({ open, close });
})();
