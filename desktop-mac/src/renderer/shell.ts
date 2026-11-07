// Renderer of the native shell (sidebar + toolbar). A plain browser script: no imports, no frameworks.
// All text is set with textContent / attributes — never innerHTML. Navigation is requested by item id only;
// the main process decides which URL that means (see src/main/shell.ts).

// Wrapped in a function so this script's names do not collide with the other renderer script (both are plain scripts).
(() => {
interface NavItemDto {
  id: string;
  label: string;
  route: string | null;
}
interface SectionDto {
  title: string;
  items: NavItemDto[];
}
interface ShellState {
  activeId: string | null;
  canGoBack: boolean;
  canGoForward: boolean;
  searchVisible: boolean;
  query: string;
}
interface ShellBridge {
  model(): Promise<{ sections: SectionDto[]; state: ShellState }>;
  navigate(id: string): Promise<unknown>;
  back(): Promise<unknown>;
  forward(): Promise<unknown>;
  search(q: string): Promise<unknown>;
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
  favorites: [['path', { d: 'M6 3h12v18l-6-4-6 4z' }]],
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
const buttons = new Map<string, HTMLButtonElement>();

function render(sections: SectionDto[]): void {
  for (const section of sections) {
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = section.title;
    nav.appendChild(title);
    for (const item of section.items) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nav-item';
      btn.dataset['id'] = item.id;
      btn.appendChild(icon(item.id));
      const label = document.createElement('span');
      label.textContent = item.label;
      btn.appendChild(label);
      if (item.route === null) {
        btn.disabled = true; // the web app has no such page yet
        btn.title = 'Tez orada';
      } else {
        btn.addEventListener('click', () => void bridge.navigate(item.id));
      }
      nav.appendChild(btn);
      buttons.set(item.id, btn);
    }
  }
}

function applyState(s: ShellState): void {
  for (const [id, btn] of buttons) {
    const active = id === s.activeId;
    btn.classList.toggle('active', active);
    if (active) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  }
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
bridge.onState(applyState);
void bridge.model().then(({ sections, state }) => {
  render(sections);
  applyState(state);
});
})();
