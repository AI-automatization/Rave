// Renderer of the native Help screen (login page footer). A plain browser script: no imports, no frameworks.
// It only DRAWS what the main process pushes. All text is set with textContent — never innerHTML — and the only things
// it can ask for are "back to the login" and "open contact <id>" (main maps the id to its fixed link).

// Wrapped in a function so this script's names do not collide with the other renderer scripts (all are plain scripts).
(() => {
interface HelpStringsDto {
  lang: 'uz' | 'ru';
  title: string;
  back: string;
  heading: string;
  subtitle: string;
  faqTitle: string;
  faq: { q: string; a: string }[];
  contactTitle: string;
  contactSub: string;
  open: string;
  contacts: { id: string; label: string; handle: string }[];
}
interface HelpDataDto {
  strings: HelpStringsDto;
  /** True when the screen has just been opened: start at the top with every answer closed. */
  fresh: boolean;
}
interface HelpBridge {
  ready(): Promise<unknown>;
  back(): Promise<unknown>;
  openContact(id: string): Promise<unknown>;
  onData(cb: (d: HelpDataDto) => void): () => void;
}

const bridge = (window as unknown as { wewatchHelp: HelpBridge }).wewatchHelp;
const root = document.getElementById('root') as HTMLElement;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
function icon(d: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  svg.appendChild(path);
  return svg;
}

function render(d: HelpDataDto): void {
  const S = d.strings;
  // A language switch redraws the page: keep the answers the user opened and the scroll position.
  const open = new Set<number>();
  if (!d.fresh) root.querySelectorAll('details').forEach((x, i) => { if (x.open) open.add(i); });
  const scroll = d.fresh ? 0 : window.scrollY;
  document.documentElement.lang = S.lang;
  root.replaceChildren();

  const col = el('div', 'col');

  const back = el('button', 'back');
  back.type = 'button';
  back.appendChild(icon('M15 5l-7 7 7 7'));
  back.appendChild(el('span', undefined, S.back));
  back.addEventListener('click', () => void bridge.back());
  col.appendChild(back);

  const head = el('header', 'head');
  head.appendChild(el('h1', undefined, S.title));
  head.appendChild(el('p', 'lead', S.heading));
  head.appendChild(el('p', 'sub', S.subtitle));
  col.appendChild(head);

  const faq = el('section', 'block');
  faq.appendChild(el('h2', undefined, S.faqTitle));
  S.faq.forEach((item, i) => {
    const det = el('details', 'faq');
    det.open = open.has(i);
    const sum = el('summary');
    sum.appendChild(el('span', 'q', item.q));
    sum.appendChild(el('span', 'plus'));
    det.appendChild(sum);
    det.appendChild(el('p', 'a', item.a));
    faq.appendChild(det);
  });
  col.appendChild(faq);

  const contact = el('section', 'block');
  contact.appendChild(el('h2', undefined, S.contactTitle));
  contact.appendChild(el('p', 'sub', S.contactSub));
  const list = el('div', 'contacts');
  for (const c of S.contacts) {
    const row = el('div', 'contact');
    const who = el('div', 'who');
    who.appendChild(el('span', 'label', c.label));
    who.appendChild(el('span', 'handle', c.handle));
    row.appendChild(who);
    const btn = el('button', 'btn', S.open);
    btn.type = 'button';
    btn.addEventListener('click', () => void bridge.openContact(c.id));
    row.appendChild(btn);
    list.appendChild(row);
  }
  contact.appendChild(list);
  col.appendChild(contact);

  root.appendChild(col);
  window.scrollTo(0, scroll);
  if (d.fresh) requestAnimationFrame(() => window.scrollTo(0, 0)); // after the view has been shown and laid out
}

bridge.onData(render);
void bridge.ready();
})();
