// Renderer of the native shell (sidebar + toolbar). A plain browser script: no imports, no frameworks.
// All text is set with textContent / attributes — never innerHTML. Navigation is requested by item id only;
// the main process decides which URL that means (see src/main/shell.ts).

// Wrapped in a function so this script's names do not collide with the other renderer script (both are plain scripts).
(() => {
interface NavItemDto {
  id: string;
  label: string;
  route: string | null;
  native?: boolean; // one of the app's own screens (no web route needed)
}
interface SectionDto {
  title: string;
  items: NavItemDto[];
}
interface UiDto {
  locale: string;
  nav: Record<string, string>;
  sections: string[];
  back: string;
  forward: string;
  search: string;
  searchLabel: string;
  navLabel: string;
  toggleSidebar: string;
  newRoom: string;
}
interface SideDto {
  rooms: number | null;
  friends: number | null;
  live: boolean;
  profile: { name: string; initial: string; status: string } | null;
}
interface ShellState {
  activeId: string | null;
  canGoBack: boolean;
  canGoForward: boolean;
  searchVisible: boolean;
  sidebarOpen: boolean;
  query: string;
  ui: UiDto;
  side: SideDto;
}
interface ShellBridge {
  model(): Promise<{ sections: SectionDto[]; state: ShellState }>;
  navigate(id: string): Promise<unknown>;
  back(): Promise<unknown>;
  forward(): Promise<unknown>;
  search(q: string): Promise<unknown>;
  toggleSidebar(): Promise<unknown>;
  newRoom(): Promise<unknown>;
  onState(cb: (s: ShellState) => void): () => void;
}

type Shape = [tag: string, attrs: Record<string, string>];

// 16 px line icons (24 px grid). Home / monitor / broadcast / people / clock / bookmark / sliders.
const ICONS: Record<string, Shape[]> = {
  home: [['path', { d: 'M3 11l9-8 9 8' }], ['path', { d: 'M5 10v10h5v-6h4v6h5V10' }]],
  rooms: [['rect', { x: '3', y: '4', width: '18', height: '12', rx: '2' }], ['path', { d: 'M8 20h8M12 16v4' }]],
  live: [
    ['circle', { cx: '12', cy: '12', r: '2' }],
    ['path', { d: 'M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4' }],
    ['path', { d: 'M19.1 4.9a10 10 0 0 1 0 14.2M4.9 19.1a10 10 0 0 1 0-14.2' }],
  ],
  friends: [
    ['circle', { cx: '9', cy: '8', r: '3.5' }],
    ['path', { d: 'M2.5 20c.5-3.5 3.2-5.5 6.5-5.5s6 2 6.5 5.5' }],
    ['circle', { cx: '17', cy: '9', r: '2.5' }],
    ['path', { d: 'M17 14.5c2.5 0 4.2 1.5 4.5 4' }],
  ],
  history: [['circle', { cx: '12', cy: '12', r: '9' }], ['path', { d: 'M12 7v5l3 2' }]],
  settings: [
    ['path', { d: 'M4 8h10M18 8h2M4 16h2M10 16h10' }],
    ['circle', { cx: '16', cy: '8', r: '2' }],
    ['circle', { cx: '8', cy: '16', r: '2' }],
  ],
};

const SVG_NS = 'http://www.w3.org/2000/svg';

function icon(id: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  for (const [tag, attrs] of ICONS[id] ?? []) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    svg.appendChild(el);
  }
  return svg;
}

const bridge = (window as unknown as { wewatchShell: ShellBridge }).wewatchShell;
const nav = document.getElementById('nav') as HTMLElement;
const backBtn = document.getElementById('back') as HTMLButtonElement;
const forwardBtn = document.getElementById('forward') as HTMLButtonElement;
const searchBox = document.getElementById('search') as HTMLInputElement;
const toggleBtn = document.getElementById('toggle') as HTMLButtonElement;
const newRoomBtn = document.getElementById('new-room') as HTMLButtonElement;
const newRoomLabel = document.getElementById('new-room-label') as HTMLElement;
const profile = document.getElementById('profile') as HTMLElement;
const trailing = new Map<string, HTMLSpanElement>(); // the count / dot at the right end of a sidebar row
const buttons = new Map<string, HTMLButtonElement>();
const labels = new Map<string, HTMLSpanElement>();
const titles: HTMLElement[] = [];

function render(sections: SectionDto[]): void {
  for (const section of sections) {
    const title = document.createElement('div');
    title.className = 'section-title';
    nav.appendChild(title);
    titles.push(title);
    for (const item of section.items) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nav-item';
      btn.dataset['id'] = item.id;
      btn.appendChild(icon(item.id));
      const label = document.createElement('span');
      btn.appendChild(label);
      const tail = document.createElement('span');
      tail.className = 'tail';
      btn.appendChild(tail);
      trailing.set(item.id, tail);
      labels.set(item.id, label); // the words come from applyUi, in the user's language
      if (item.route === null && item.native !== true) {
        btn.disabled = true; // the web app has no such page yet
      } else {
        btn.addEventListener('click', () => void bridge.navigate(item.id));
      }
      nav.appendChild(btn);
      buttons.set(item.id, btn);
    }
  }
}

/** All the words of the shell, in the language of the web app (the main process sends them with every state). */
function applyUi(ui: UiDto): void {
  document.documentElement.lang = ui.locale;
  for (const [id, el] of labels) el.textContent = ui.nav[id] ?? '';
  titles.forEach((t, i) => {
    t.textContent = ui.sections[i] ?? '';
  });
  backBtn.setAttribute('aria-label', ui.back);
  forwardBtn.setAttribute('aria-label', ui.forward);
  toggleBtn.setAttribute('aria-label', ui.toggleSidebar);
  toggleBtn.title = ui.toggleSidebar;
  newRoomLabel.textContent = ui.newRoom;
  searchBox.placeholder = ui.search;
  searchBox.setAttribute('aria-label', ui.searchLabel);
  (document.getElementById('sidebar') as HTMLElement).setAttribute('aria-label', ui.navLabel);
}

/** Counts, the live dot and the profile block. Anything the main process could not load is simply not shown. */
function applySide(side: SideDto): void {
  const set = (id: string, text: string, kind: string): void => {
    const el = trailing.get(id);
    if (!el) return;
    el.textContent = text;
    el.className = text === '' && kind === '' ? 'tail' : `tail ${kind}`;
  };
  set('rooms', side.rooms !== null && side.rooms > 0 ? String(side.rooms) : '', 'count');
  set('friends', side.friends !== null && side.friends > 0 ? String(side.friends) : '', 'count');
  set('live', '', side.live ? 'dot' : '');
  profile.hidden = side.profile === null;
  if (side.profile) {
    (document.getElementById('avatar') as HTMLElement).textContent = side.profile.initial;
    (document.getElementById('who-name') as HTMLElement).textContent = side.profile.name;
    (document.getElementById('who-status') as HTMLElement).textContent = side.profile.status;
  }
}

function applyState(s: ShellState): void {
  applyUi(s.ui);
  for (const [id, btn] of buttons) {
    const active = id === s.activeId;
    btn.classList.toggle('active', active);
    if (active) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  }
  document.documentElement.style.setProperty('--sidebar', s.sidebarOpen ? '240px' : '0px');
  document.body.classList.toggle('collapsed', !s.sidebarOpen);
  toggleBtn.setAttribute('aria-pressed', String(s.sidebarOpen));
  applySide(s.side);
  backBtn.disabled = !s.canGoBack;
  forwardBtn.disabled = !s.canGoForward;
  // The search only exists while the room list is shown. The box belongs to the user: its text is restored from the
  // main process only when the box comes back into view (e.g. returning from a room), never overwritten while typing.
  if (s.searchVisible && searchBox.hidden) searchBox.value = s.query;
  searchBox.hidden = !s.searchVisible;
}

let searchTimer: number | undefined;
searchBox.addEventListener('input', () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => void bridge.search(searchBox.value), 120);
});
backBtn.addEventListener('click', () => void bridge.back());
forwardBtn.addEventListener('click', () => void bridge.forward());
toggleBtn.addEventListener('click', () => void bridge.toggleSidebar());
newRoomBtn.addEventListener('click', () => void bridge.newRoom());
bridge.onState(applyState);
void bridge.model().then(({ sections, state }) => {
  render(sections);
  applyState(state);
});
})();
