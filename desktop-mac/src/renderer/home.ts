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
}
interface HomeDataDto {
  strings: HomeStrings; // every word on this screen, in the language of the web app (sent by the main process)
  status: 'loading' | 'ok' | 'error';
  spotlight: RoomCardDto | null;
  rooms: RoomCardDto[];
  total: number;
  query: string;
}
interface HomeBridge {
  ready(): Promise<unknown>;
  open(id: string): Promise<unknown>;
  retry(): Promise<unknown>;
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

function poster(room: RoomCardDto, S: HomeStrings): HTMLElement {
  const p = el('div', 'poster');
  if (room.thumbnail) {
    const img = el('img');
    img.src = room.thumbnail; // https only (checked in the main process); CSP allows img-src https: and nothing else
    img.alt = '';
    img.referrerPolicy = 'no-referrer';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', () => img.remove()); // keep the gradient placeholder
    p.appendChild(img);
  }
  const badge = { live: S.badgeLive, starting: S.badgeStarting, paused: S.badgePaused }[room.badge];
  p.appendChild(el('span', `badge ${room.badge}`, badge));
  const count = el('span', 'count');
  count.append(peopleIcon(), document.createTextNode(fill(S.people, room.members)));
  p.appendChild(count);
  return p;
}

function card(room: RoomCardDto, S: HomeStrings): HTMLElement {
  const c = el('article', 'card');
  c.appendChild(poster(room, S));
  const body = el('div', 'body');
  body.appendChild(el('div', 'title', room.title || S.untitled));
  if (room.subtitle) body.appendChild(el('div', 'subtitle', room.subtitle));
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
  b.appendChild(el('h1', undefined, room.title || S.untitled));
  if (room.subtitle) b.appendChild(el('p', 'sub', room.subtitle));
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

function message(title: string, desc?: string, action?: { label: string; run: () => void }): HTMLElement {
  const m = el('section', 'message');
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

function render(d: HomeDataDto): void {
  const S = d.strings;
  root.replaceChildren();
  if (d.status === 'loading') {
    root.appendChild(el('div', 'skeleton'));
    return;
  }
  if (d.status === 'error') {
    root.appendChild(message(S.errorTitle, S.errorDesc, { label: S.retry, run: () => void bridge.retry() }));
    return;
  }
  if (d.total === 0) {
    root.appendChild(message(S.emptyTitle, S.emptyDesc));
    return;
  }
  if (!d.spotlight && d.rooms.length === 0) {
    root.appendChild(message(S.noMatch));
    return;
  }
  if (d.spotlight) root.appendChild(banner(d.spotlight, S));
  if (d.rooms.length > 0) {
    const head = el('div', 'section-head');
    head.append(el('h2', undefined, S.sectionTitle), el('p', undefined, S.sectionSub));
    const grid = el('div', 'grid');
    for (const room of d.rooms) grid.appendChild(card(room, S));
    root.append(head, grid);
  }
}

bridge.onData(render);
void bridge.ready();
})();
