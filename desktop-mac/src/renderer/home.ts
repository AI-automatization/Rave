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
}
interface HomeDataDto {
  strings: HomeStrings; // every word on this screen, in the language of the web app (sent by the main process)
  status: 'loading' | 'ok' | 'error';
  screen: 'home' | 'rooms' | 'live' | 'history';
  sort: 'viewers' | 'newest';
  owners: Record<string, string>;
  spotlight: RoomCardDto | null;
  rooms: RoomCardDto[];
  total: number;
  query: string;
  trending: WatchCardDto[];
  history: WatchCardDto[];
}
interface HomeBridge {
  ready(): Promise<unknown>;
  open(id: string): Promise<unknown>;
  retry(): Promise<unknown>;
  watch(kind: string, index: number): Promise<{ ok: boolean; reason?: string }>;
  sort(key: string): Promise<unknown>;
  onData(cb: (d: HomeDataDto) => void): () => void;
}

const bridge = (window as unknown as { wewatchHome: HomeBridge }).wewatchHome;
const root = document.getElementById('root') as HTMLElement;

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

function render(d: HomeDataDto): void {
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
  if (d.total === 0) {
    root.appendChild(message(S.emptyTitle, S.emptyDesc, undefined, hasRails));
  } else if (!d.spotlight && d.rooms.length === 0) {
    // Bosh sahifa without a playing room has no banner but still has its rails; only a search / room list can be "empty".
    if (d.screen === 'home' && d.query.trim() === '' && hasRails) {
      /* fall through: show the rails */
    } else {
      root.appendChild(message(S.noMatch));
      return;
    }
  }
  if (d.spotlight) root.appendChild(banner(d.spotlight, S));
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
