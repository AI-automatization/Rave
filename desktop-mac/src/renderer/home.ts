// Renderer of the native Home. A plain browser script: no imports, no frameworks. It only DRAWS what the main process
// pushes (banner room, other rooms, state). All text is set with textContent — never innerHTML — and the only
// thing it can ask for is "open this room id" (main validates it and builds the URL itself).

// Wrapped in a function so this script's names do not collide with the other renderer script (both are plain scripts).
(() => {
interface RoomCardDto {
  id: string;
  title: string;
  subtitle: string | null;
  badge: 'live' | 'starting' | 'paused';
  members: number;
  thumbnail: string | null;
  platform: string | null;
  ownerId: string | null;
}
interface WatchCardDto {
  title: string;
  thumbnail: string | null;
  viewers: number | null;
}
interface HomeStrings {
  banner: string;
  joinBanner: string;
  join: string;
  waitingRoom: string;
  sectionTitle: string;
  sectionSub: string;
  viewers: string;
  people: string;
  badgeLive: string;
  badgeStarting: string;
  badgePaused: string;
  emptyTitle: string;
  emptyDesc: string;
  noMatch: string;
  errorTitle: string;
  errorDesc: string;
  retry: string;
  untitled: string;
  railTrending: string;
  railHistory: string;
  weeklyViewers: string;
  startError: string;
  sortLabel: string;
  sortViewers: string;
  sortNewest: string;
  owner: string;
  greetingMorning: string;
  greetingDay: string;
  greetingEvening: string;
  greetingGuest: string;
  friendsOnline: string;
  noFriendsOnline: string;
  create: string;
  step1: string;
  step2: string;
  step3: string;
  startTitle: string;
  startSub: string;
  quickCreate: string;
  quickJoin: string;
  startSources: string;
  startDirect: string;
}
interface SettingsStrings {
  title: string; profileTitle: string; photoHint: string; photoButton: string; avatarUpdated: string; avatarTooLarge: string; avatarError: string;
  usernameLabel: string; bioLabel: string; save: string; saving: string; saved: string; saveError: string; language: string;
  changePassword: string; currentPassword: string; newPassword: string; confirmNewPassword: string; pwMinLength: string; pwMismatch: string;
  pwRequired: string; pwChanged: string; pwChangedDesc: string; sessions: string; signOutAll: string; signOutConfirm: string; confirm: string;
  cancel: string; dangerZone: string; deleteAccount: string; deleteMyAccount: string; deleteConfirm: string; deleteHint: string; yourPassword: string;
  deleteFailed: string; logout: string; logoutInfo: string; logoutError: string; loadError: string;
  usernameRule: string; usernameTaken: string; usernameBanned: string; bioRule: string; wrongPassword: string; pwMaxLength: string;
  reloginNote: string; photoTypeError: string; retry: string; languageNames: Record<'uz' | 'ru' | 'en', string>; chooseFile: string;
  sessionExpired: string; deleteTypeName: string;
}
interface SettingsDto {
  status: 'loading' | 'ok' | 'error';
  profile: { username: string; bio: string; initial: string; avatarUrl: string | null } | null;
  locale: 'uz' | 'ru' | 'en';
  s: SettingsStrings;
}
interface RoomDialogStrings { [k: string]: string }
type DialogResult = { ok: true } | { ok: false; message?: string; reason?: string };
interface SearchItemDto { title: string; thumbnail: string | null; url: string; platform: string; duration: string | null }
interface VideoMetaDto { title: string | null; thumbnail: string | null }
interface RoomDialogApi {
  open(kind: 'create' | 'join', strings: RoomDialogStrings, opts: {
    create?(url: string, name: string, isPrivate: boolean, title: string | null, thumbnail: string | null): Promise<DialogResult>;
    join?(code: string): Promise<DialogResult>;
    search?(q: string): Promise<SearchItemDto[]>;
    videoMeta?(url: string): Promise<VideoMetaDto>;
    readClipboard?(): Promise<{ url: string | null }>;
    openPlatform?(id: string): Promise<unknown>;
    onClose?(): void;
  }): void;
  close(): void;
}
interface HomeDataDto {
  roomDialog: RoomDialogStrings;
  settings?: SettingsDto;
  strings: HomeStrings; // every word on this screen, in the language of the web app (sent by the main process)
  status: 'loading' | 'ok' | 'error';
  screen: 'home' | 'rooms' | 'live' | 'history' | 'settings';
  sort: 'viewers' | 'newest';
  owners: Record<string, string>;
  spotlight: RoomCardDto | null;
  rooms: RoomCardDto[];
  total: number;
  query: string;
  trending: WatchCardDto[];
  history: WatchCardDto[];
  head: { greeting: 'morning' | 'day' | 'evening' | 'guest'; name: string | null; online: number };
}
type Outcome = { ok: true } | { ok: false; kind?: string; reason?: string };
interface HomeBridge {
  ready(): Promise<unknown>;
  open(id: string): Promise<unknown>;
  retry(): Promise<unknown>;
  watch(kind: string, index: number): Promise<{ ok: boolean; reason?: string }>;
  sort(key: string): Promise<unknown>;
  newRoom(): Promise<unknown>;
  join(): Promise<unknown>;
  createRoom(url: string, name: string, isPrivate: boolean, title: string | null, thumbnail: string | null): Promise<DialogResult>;
  joinRoom(code: string): Promise<DialogResult>;
  searchVideos(q: string): Promise<SearchItemDto[]>;
  videoMeta(url: string): Promise<VideoMetaDto>;
  readClipboard(): Promise<{ url: string | null }>;
  openPlatform(id: string): Promise<unknown>;
  onOpenDialog(cb: (kind: 'create' | 'join') => void): () => void;
  settings: {
    reload(): Promise<unknown>;
    saveProfile(username: string, bio: string): Promise<Outcome>;
    pickAvatar(): Promise<Outcome>;
    setLanguage(l: string): Promise<Outcome>;
    changePassword(current: string, next: string, confirm: string): Promise<Outcome>;
    signOutAll(): Promise<Outcome>;
    deleteAccount(password: string): Promise<Outcome>;
    logout(): Promise<Outcome>;
  };
  onData(cb: (d: HomeDataDto) => void): () => void;
}

const bridge = (window as unknown as { wewatchHome: HomeBridge }).wewatchHome;
const root = document.getElementById('root') as HTMLElement;
const roomDialog = (window as unknown as { wwRoomDialog?: RoomDialogApi }).wwRoomDialog;
let dialogStrings: RoomDialogStrings | null = null;
function openRoomDialog(kind: 'create' | 'join'): void {
  if (!roomDialog || !dialogStrings) return;
  roomDialog.open(kind, dialogStrings, {
    create: (url, name, isPrivate, title, thumbnail) => bridge.createRoom(url, name, isPrivate, title, thumbnail),
    join: (code) => bridge.joinRoom(code),
    search: (q) => bridge.searchVideos(q),
    videoMeta: (url) => bridge.videoMeta(url),
    readClipboard: () => bridge.readClipboard(),
    openPlatform: (id) => bridge.openPlatform(id),
  });
}
bridge.onOpenDialog((kind) => openRoomDialog(kind)); // the toolbar's "+ Yangi xona" (main process asks)

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
function peopleIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const head = document.createElementNS(SVG_NS, 'circle');
  head.setAttribute('cx', '12');
  head.setAttribute('cy', '8');
  head.setAttribute('r', '3.5');
  const body = document.createElementNS(SVG_NS, 'path');
  body.setAttribute('d', 'M4.5 20c.6-4 3.5-6 7.5-6s6.9 2 7.5 6');
  svg.append(head, body);
  return svg;
}

const openRoom = (id: string): void => void bridge.open(id);
const fill = (template: string, n: number): string => template.replace('{n}', String(n));

// Platform tile colours (the design tints every card by where the video comes from). Unknown platform -> the app accent.
const PLATFORM_COLORS: Record<string, [string, string]> = {
  youtube: ['#ff3b3b', '#7a0d1c'],
  vimeo: ['#1ab7ea', '#0b3f66'],
  twitch: ['#9146ff', '#3b1a78'],
  netflix: ['#e50914', '#4a0408'],
  kinopoisk: ['#ff6600', '#6b2a00'],
  rutube: ['#2f6bff', '#10286b'],
  tiktok: ['#25f4ee', '#7a1d52'],
  instagram: ['#e1306c', '#5b1f86'],
  dailymotion: ['#2f8bff', '#0f2f66'],
};
const FALLBACK_COLORS: [string, string] = ['#7c3aed', '#2a1466'];

function playTile(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'tile-icon');
  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '12');
  circle.setAttribute('r', '9');
  const tri = document.createElementNS(SVG_NS, 'path');
  tri.setAttribute('d', 'M10 8.5v7l6-3.5z');
  svg.append(circle, tri);
  return svg;
}

function poster(room: RoomCardDto, S: HomeStrings): HTMLElement {
  const p = el('div', 'poster');
  const [from, to] = PLATFORM_COLORS[(room.platform ?? '').toLowerCase()] ?? FALLBACK_COLORS;
  p.style.setProperty('--from', from); // CSSOM, not a style attribute: the page's CSP forbids inline styles
  p.style.setProperty('--to', to);
  const tile = el('div', 'tile');
  tile.append(playTile());
  if (room.platform) tile.appendChild(el('span', 'tile-label', room.platform.toUpperCase()));
  p.appendChild(tile);
  if (room.thumbnail) {
    const img = el('img');
    img.src = room.thumbnail; // https only (checked in the main process); CSP allows img-src https: and nothing else
    img.alt = '';
    img.referrerPolicy = 'no-referrer';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', () => img.remove()); // keep the platform tile
    p.appendChild(img);
  }
  const badge = { live: S.badgeLive, starting: S.badgeStarting, paused: S.badgePaused }[room.badge];
  p.appendChild(el('span', `badge ${room.badge}`, badge));
  const count = el('span', 'count');
  count.append(peopleIcon(), document.createTextNode(fill(S.people, room.members)));
  p.appendChild(count);
  return p;
}

/** "Room name (video title)" — how the design writes a card's title. */
const cardTitle = (room: RoomCardDto, S: HomeStrings): string => {
  const t = room.title || S.untitled;
  return room.subtitle ? `${t} (${room.subtitle})` : t;
};

function card(room: RoomCardDto, S: HomeStrings, owners: Record<string, string>): HTMLElement {
  const c = el('article', 'card');
  c.appendChild(poster(room, S));
  const body = el('div', 'body');
  body.appendChild(el('div', 'title', cardTitle(room, S)));
  const owner = room.ownerId ? owners[room.ownerId] : undefined;
  if (owner) body.appendChild(el('div', 'subtitle', `${S.owner}: ${owner}`)); // only when the owner's name is known
  body.appendChild(el('div', 'spacer'));
  const btn = el('button', room.badge === 'starting' ? 'btn quiet full' : 'btn full', room.badge === 'starting' ? S.waitingRoom : S.join);
  btn.type = 'button';
  btn.addEventListener('click', () => openRoom(room.id));
  body.appendChild(btn);
  c.appendChild(body);
  return c;
}

function banner(room: RoomCardDto, S: HomeStrings): HTMLElement {
  const b = el('section', 'banner');
  const kicker = el('span', 'kicker');
  kicker.append(el('span', 'dot'), document.createTextNode(S.banner));
  b.appendChild(kicker);
  b.appendChild(el('h1', undefined, cardTitle(room, S)));
  const actions = el('div', 'actions');
  const join = el('button', 'btn', S.joinBanner);
  join.type = 'button';
  join.addEventListener('click', () => openRoom(room.id));
  const viewers = el('span', 'viewers');
  viewers.append(peopleIcon(), document.createTextNode(fill(S.viewers, room.members)));
  actions.append(join, viewers);
  b.appendChild(actions);
  return b;
}

function playIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const tri = document.createElementNS(SVG_NS, 'path');
  tri.setAttribute('d', 'M8 5.5v13l11-6.5z');
  svg.appendChild(tri);
  return svg;
}

let toastTimer: number | undefined;
function toast(text: string): void {
  document.querySelector('.toast')?.remove();
  const t = el('div', 'toast', text);
  t.setAttribute('role', 'status');
  document.body.appendChild(t);
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.remove(), 4000);
}

/** One tap from a video to a room playing it. The main process holds the list; only "rail + position" is sent. */
function startWatching(kind: 'trending' | 'history', index: number, btn: HTMLButtonElement, S: HomeStrings): void {
  if (root.classList.contains('busy')) return;
  root.classList.add('busy');
  btn.classList.add('starting');
  void bridge.watch(kind, index).then((r) => {
    root.classList.remove('busy');
    btn.classList.remove('starting');
    if (!r.ok && r.reason !== 'unauthorized') toast(S.startError);
  });
}

function watchCard(c: WatchCardDto, kind: 'trending' | 'history', index: number, S: HomeStrings): HTMLElement {
  const b = el('button', 'watch');
  b.type = 'button';
  const poster = el('div', 'wposter');
  if (c.thumbnail) {
    const img = el('img');
    img.src = c.thumbnail; // https only (checked in the main process)
    img.alt = '';
    img.referrerPolicy = 'no-referrer';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', () => img.remove());
    poster.appendChild(img);
  }
  if (kind === 'trending') poster.appendChild(el('span', 'rank', `#${index + 1}`));
  const play = el('span', 'play');
  play.appendChild(playIcon());
  poster.appendChild(play);
  b.appendChild(poster);
  const info = el('div', 'winfo');
  info.appendChild(el('span', 'wtitle', c.title));
  if (kind === 'trending' && c.viewers !== null) {
    const v = el('span', 'wviews');
    v.append(peopleIcon(), document.createTextNode(fill(S.weeklyViewers, c.viewers)));
    info.appendChild(v);
  }
  b.appendChild(info);
  b.addEventListener('click', () => startWatching(kind, index, b, S));
  return b;
}

function rail(title: string, cards: WatchCardDto[], kind: 'trending' | 'history', S: HomeStrings): HTMLElement {
  const sec = el('section', 'rail-section');
  sec.appendChild(el('h2', undefined, title));
  const row = el('div', 'rail');
  cards.forEach((c, i) => row.appendChild(watchCard(c, kind, i, S)));
  sec.appendChild(row);
  return sec;
}

function message(title: string, desc?: string, action?: { label: string; run: () => void }, compact = false): HTMLElement {
  const m = el('section', compact ? 'message compact' : 'message');
  m.appendChild(el('h2', undefined, title));
  if (desc) m.appendChild(el('p', undefined, desc));
  if (action) {
    const btn = el('button', 'btn', action.label);
    btn.type = 'button';
    btn.addEventListener('click', action.run);
    m.appendChild(btn);
  }
  return m;
}

/** Section title + subtitle on the left, the sort control on the right (room lists only). */
function sectionHead(title: string, sub: string, d: HomeDataDto | null, S: HomeStrings): HTMLElement {
  const head = el('div', 'section-head');
  const left = el('div', 'titles');
  left.append(el('h2', undefined, title), el('p', undefined, sub));
  head.appendChild(left);
  if (d) {
    const wrap = el('label', 'sort');
    wrap.appendChild(el('span', undefined, S.sortLabel));
    const select = el('select');
    for (const [key, label] of [['viewers', S.sortViewers], ['newest', S.sortNewest]] as const) {
      const o = el('option', undefined, label);
      o.value = key;
      o.selected = d.sort === key;
      select.appendChild(o);
    }
    select.addEventListener('change', () => void bridge.sort(select.value));
    wrap.appendChild(select);
    head.appendChild(wrap);
  }
  return head;
}

// ---- Bosh sahifa: the web Home's header and "start" block (components/home/StartHero.tsx) ----

function icon(paths: string[], circle?: [number, number, number]): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'ico');
  if (circle) {
    const c = document.createElementNS(SVG_NS, 'circle');
    c.setAttribute('cx', String(circle[0]));
    c.setAttribute('cy', String(circle[1]));
    c.setAttribute('r', String(circle[2]));
    svg.appendChild(c);
  }
  for (const d of paths) {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', d);
    svg.appendChild(p);
  }
  return svg;
}
const plusIcon = (): SVGSVGElement => icon(['M12 5v14', 'M5 12h14']);
const joinIcon = (): SVGSVGElement => icon(['M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4', 'M10 17l5-5-5-5', 'M15 12H3']);
const linkIcon = (): SVGSVGElement => icon(['M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7', 'M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7']);

function actionButton(cls: string, ic: SVGSVGElement, label: string, run: () => void): HTMLButtonElement {
  const b = el('button', cls);
  b.append(ic, el('span', undefined, label));
  b.addEventListener('click', run);
  return b;
}

function homeHeader(d: HomeDataDto, S: HomeStrings): HTMLElement {
  const h = el('header', 'home-head');
  const text = el('div', 'home-head-text');
  const g = d.head.greeting;
  const line = g === 'guest' || !d.head.name ? S.greetingGuest : (g === 'morning' ? S.greetingMorning : g === 'day' ? S.greetingDay : S.greetingEvening).replace('{n}', d.head.name);
  text.appendChild(el('h1', undefined, line));
  const sub = el('p', 'home-head-sub');
  if (d.head.online > 0) {
    sub.appendChild(el('span', 'online-dot'));
    sub.appendChild(document.createTextNode(fill(S.friendsOnline, d.head.online)));
  } else {
    sub.textContent = S.noFriendsOnline;
  }
  text.appendChild(sub);
  const actions = el('div', 'home-head-actions');
  actions.append(
    actionButton('btn ghost', joinIcon(), S.join, () => openRoomDialog('join')),
    actionButton('btn primary', plusIcon(), S.create, () => openRoomDialog('create')),
  );
  h.append(text, actions);
  return h;
}

const SOURCES: ReadonlyArray<[string, string]> = [['YouTube', '#ff0000'], ['VK Video', '#0077ff'], ['Rutube', '#ff6600']];

/** Shown instead of the live banner when no room is playing: the three steps, two actions, the supported sources. */
function startHero(S: HomeStrings): HTMLElement {
  const sec = el('section', 'hero');
  const steps = el('ol', 'hero-steps');
  [S.step1, S.step2, S.step3].forEach((label, i) => {
    const li = el('li');
    if (i > 0) li.appendChild(el('span', 'arrow', '→'));
    li.append(el('span', 'num', String(i + 1)), document.createTextNode(label));
    steps.appendChild(li);
  });
  sec.appendChild(steps);
  const body = el('div', 'hero-body');
  body.appendChild(el('h2', undefined, S.startTitle));
  body.appendChild(el('p', 'hero-sub', S.startSub));
  const actions = el('div', 'hero-actions');
  actions.append(
    actionButton('btn primary big', plusIcon(), S.quickCreate, () => openRoomDialog('create')),
    actionButton('btn ghost big', joinIcon(), S.quickJoin, () => openRoomDialog('join')),
  );
  body.appendChild(actions);
  const sources = el('div', 'hero-sources');
  sources.appendChild(el('span', 'hero-sources-label', S.startSources));
  const chips = el('div', 'chips');
  for (const [label, color] of SOURCES) {
    const chip = el('span', 'chip');
    const dot = el('span', 'chip-dot');
    dot.style.setProperty('background', color); // CSSOM, not a style attribute (CSP)
    chip.append(dot, document.createTextNode(label));
    chips.appendChild(chip);
  }
  const direct = el('span', 'chip');
  direct.append(linkIcon(), document.createTextNode(S.startDirect));
  chips.appendChild(direct);
  sources.appendChild(chips);
  body.appendChild(sources);
  sec.appendChild(body);
  return sec;
}

// ---- Sozlamalar ----

let settingsSignature = ''; // the screen is rebuilt only when its data changes: a re-draw must not wipe what the user is typing

function errorText(S: SettingsStrings, kind: string | undefined): string {
  switch (kind) {
    case 'username': return S.usernameRule;
    case 'bio': return S.bioRule;
    case 'taken': return S.usernameTaken;
    case 'banned': return S.usernameBanned;
    case 'wrongPassword': return S.wrongPassword;
    case 'required': return S.pwRequired;
    case 'min': return S.pwMinLength;
    case 'max': return S.pwMaxLength;
    case 'mismatch': return S.pwMismatch;
    case 'type': return S.photoTypeError;
    case 'size': return S.avatarTooLarge;
    case 'unauthorized': return S.sessionExpired;
    default: return S.saveError;
  }
}

function field(label: string, input: HTMLInputElement | HTMLTextAreaElement, hint?: string): HTMLElement {
  const wrap = el('label', 'field');
  wrap.appendChild(el('span', 'field-label', label));
  wrap.appendChild(input);
  if (hint) wrap.appendChild(el('span', 'field-hint', hint));
  return wrap;
}

function textInput(type: string, value = '', max?: number): HTMLInputElement {
  const i = el('input', 'input');
  i.type = type;
  i.value = value;
  i.autocomplete = 'off';
  i.spellcheck = false;
  if (max) i.maxLength = max;
  return i;
}

function card2(title: string, danger = false): { box: HTMLElement; body: HTMLElement } {
  const box = el('section', danger ? 'panel danger' : 'panel');
  box.appendChild(el('h2', undefined, title));
  const body = el('div', 'panel-body');
  box.appendChild(body);
  return { box, body };
}

/** Run an action on a button: disable it while it works; show the result as a toast (errors in the user's language). */
function act(btn: HTMLButtonElement, S: SettingsStrings, run: () => Promise<Outcome>, okText?: string, after?: () => void): void {
  btn.addEventListener('click', () => {
    btn.disabled = true;
    void run().then((r) => {
      btn.disabled = false;
      if (r.ok) {
        if (okText) toast(okText);
        after?.();
      } else if (r.kind !== 'cancelled') {
        toast(errorText(S, r.kind));
      }
    });
  });
}

function profilePanel(d: SettingsDto): HTMLElement {
  const S = d.s;
  const p = d.profile as NonNullable<SettingsDto['profile']>;
  const { box, body } = card2(S.profileTitle);
  const top = el('div', 'avatar-row');
  const av = el('div', 'avatar-big');
  av.appendChild(el('span', undefined, p.initial));
  if (p.avatarUrl) {
    const img = el('img');
    img.alt = '';
    img.addEventListener('error', () => img.remove()); // the picture file may be gone: the initial stays
    img.src = p.avatarUrl;
    av.appendChild(img);
  }
  const side = el('div', 'avatar-side');
  const pick = el('button', 'btn ghost', S.photoButton);
  act(pick, S, () => bridge.settings.pickAvatar(), S.avatarUpdated);
  side.append(pick, el('span', 'field-hint pre', S.photoHint));
  top.append(av, side);
  body.appendChild(top);

  const name = textInput('text', p.username, 20);
  const bio = el('textarea', 'input');
  bio.value = p.bio;
  bio.maxLength = 200;
  bio.rows = 3;
  body.append(field(S.usernameLabel, name, S.usernameRule), field(S.bioLabel, bio, S.bioRule));
  const save = el('button', 'btn primary', S.save);
  act(save, S, () => bridge.settings.saveProfile(name.value.trim(), bio.value), S.saved);
  body.appendChild(save);
  return box;
}

function languagePanel(d: SettingsDto): HTMLElement {
  const S = d.s;
  const { box, body } = card2(S.language);
  const row = el('div', 'seg');
  for (const l of ['uz', 'ru', 'en'] as const) {
    const b = el('button', l === d.locale ? 'seg-item active' : 'seg-item', S.languageNames[l]);
    b.addEventListener('click', () => void bridge.settings.setLanguage(l));
    row.appendChild(b);
  }
  body.appendChild(row);
  return box;
}

function passwordPanel(S: SettingsStrings): HTMLElement {
  const { box, body } = card2(S.changePassword);
  const cur = textInput('password', '', 128);
  const next = textInput('password', '', 128);
  const again = textInput('password', '', 128);
  body.append(field(S.currentPassword, cur), field(S.newPassword, next, S.pwMinLength), field(S.confirmNewPassword, again));
  const btn = el('button', 'btn primary', S.save);
  act(btn, S, () => bridge.settings.changePassword(cur.value, next.value, again.value), `${S.pwChanged}. ${S.reloginNote}`, () => {
    cur.value = '';
    next.value = '';
    again.value = '';
  });
  body.appendChild(btn);
  return box;
}

/** A button that asks "are you sure?" first (inline, no dialog): [text] [Tasdiqlash] [Bekor qilish]. */
function confirmable(label: string, question: string, S: SettingsStrings, run: () => Promise<Outcome>, danger = false): HTMLElement {
  const wrap = el('div', 'confirmable');
  const first = el('button', danger ? 'btn danger' : 'btn ghost', label);
  const ask = el('div', 'confirm-row');
  ask.hidden = true;
  ask.appendChild(el('span', 'field-hint', question));
  const yes = el('button', danger ? 'btn danger' : 'btn primary', S.confirm);
  const no = el('button', 'btn ghost', S.cancel);
  ask.append(yes, no);
  first.addEventListener('click', () => {
    first.hidden = true;
    ask.hidden = false;
  });
  no.addEventListener('click', () => {
    ask.hidden = true;
    first.hidden = false;
  });
  act(yes, S, run);
  wrap.append(first, ask);
  return wrap;
}

function sessionPanel(S: SettingsStrings): HTMLElement {
  const { box, body } = card2(S.sessions);
  body.appendChild(confirmable(S.signOutAll, S.signOutConfirm, S, () => bridge.settings.signOutAll()));
  const out = el('button', 'btn ghost', S.logout);
  act(out, S, () => bridge.settings.logout());
  body.append(out, el('p', 'field-hint', S.logoutInfo));
  return box;
}

function dangerPanel(d: SettingsDto): HTMLElement {
  const S = d.s;
  const p = d.profile as NonNullable<SettingsDto['profile']>;
  const { box, body } = card2(S.dangerZone, true);
  body.appendChild(el('p', 'field-hint', S.deleteHint));
  const open = el('button', 'btn danger', S.deleteAccount);
  const form = el('div', 'delete-form');
  form.hidden = true;
  const typed = textInput('text', '', 40);
  const pw = textInput('password', '', 128);
  form.append(field(S.deleteTypeName.replace('{n}', p.username), typed), field(`${S.yourPassword} — ${S.deleteConfirm}`, pw));
  const go = el('button', 'btn danger', S.deleteMyAccount);
  go.disabled = true;
  const sync = (): void => {
    go.disabled = typed.value.trim() !== p.username || pw.value === '';
  };
  typed.addEventListener('input', sync);
  pw.addEventListener('input', sync);
  act(go, S, () => bridge.settings.deleteAccount(pw.value));
  const cancel = el('button', 'btn ghost', S.cancel);
  cancel.addEventListener('click', () => {
    form.hidden = true;
    open.hidden = false;
    typed.value = '';
    pw.value = '';
    sync();
  });
  form.append(go, cancel);
  open.addEventListener('click', () => {
    open.hidden = true;
    form.hidden = false;
  });
  body.append(open, form);
  return box;
}

function renderSettings(d: HomeDataDto): void {
  const s = d.settings;
  if (!s) return;
  const sig = JSON.stringify([s.status, s.profile, s.locale]);
  if (sig === settingsSignature && root.firstElementChild?.classList.contains('settings')) return;
  settingsSignature = sig;
  root.replaceChildren();
  const page = el('div', 'settings');
  page.appendChild(el('h1', 'settings-title', s.s.title));
  if (s.status === 'loading' && !s.profile) {
    page.appendChild(el('div', 'skeleton'));
  } else if (s.status === 'error' || !s.profile) {
    const m = message(s.s.loadError, undefined, { label: s.s.retry, run: () => void bridge.settings.reload() });
    page.appendChild(m);
  } else {
    page.append(profilePanel(s), languagePanel(s), passwordPanel(s.s), sessionPanel(s.s), dangerPanel(s));
  }
  root.appendChild(page);
}

function render(d: HomeDataDto): void {
  dialogStrings = d.roomDialog;
  if (d.screen === 'settings') {
    renderSettings(d);
    return;
  }
  settingsSignature = '';
  const S = d.strings;
  const scroll = window.scrollY;
  root.replaceChildren();
  if (d.status === 'loading') {
    root.appendChild(el('div', 'skeleton'));
    return;
  }
  if (d.status === 'error') {
    root.appendChild(message(S.errorTitle, S.errorDesc, { label: S.retry, run: () => void bridge.retry() }));
    return;
  }
  if (d.screen === 'history') {
    root.appendChild(sectionHead(S.railHistory, '', null, S));
    const grid = el('div', 'grid');
    d.history.forEach((c, i) => grid.appendChild(watchCard(c, 'history', i, S)));
    root.appendChild(grid);
    return;
  }
  const hasRails = d.trending.length > 0 || d.history.length > 0;
  const homeIdle = d.screen === 'home' && d.query.trim() === ''; // Bosh sahifa, no search: header + banner-or-start-block + rails
  if (homeIdle) {
    root.appendChild(homeHeader(d, S));
    root.appendChild(d.spotlight ? banner(d.spotlight, S) : startHero(S));
  } else if (d.total === 0) {
    root.appendChild(message(S.emptyTitle, S.emptyDesc, undefined, hasRails));
  } else if (!d.spotlight && d.rooms.length === 0) {
    root.appendChild(message(S.noMatch));
    return;
  }
  if (!homeIdle && d.spotlight) root.appendChild(banner(d.spotlight, S));
  if (d.rooms.length > 0) {
    root.appendChild(sectionHead(S.sectionTitle, S.sectionSub, d, S));
    const grid = el('div', 'grid');
    for (const room of d.rooms) grid.appendChild(card(room, S, d.owners));
    root.appendChild(grid);
  }
  if (d.trending.length > 0) root.appendChild(rail(S.railTrending, d.trending, 'trending', S));
  if (d.history.length > 0) root.appendChild(rail(S.railHistory, d.history, 'history', S));
  window.scrollTo(0, scroll); // owner names / sorting re-draw the page: stay where the user was
}

bridge.onData(render);
void bridge.ready();
})();
