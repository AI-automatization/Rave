// Dev/smoke-only drivers: they run ONLY when WW_SMOKE_OUT is set (devEnv() is '' in the packaged app).
// They press buttons in the native views like a user would and record what is on screen after each step.
import { session } from 'electron';
import { APP_URL, devEnv } from './config';
import { inspectShell, smokeEval, smokeShots } from './shell';

type Smoke = (event: string, data?: Record<string, unknown>) => void;

const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
/**
 * Poll until `expr` is truthy inside a view (or give up after `ms`). A window that sits behind other apps has its page
 * timers throttled by Chromium, so a fixed sleep after typing into the search box is not reliable.
 */
async function until(target: 'shell' | 'home' | 'content', expr: string, ms = 5000): Promise<boolean> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      if (await smokeEval(target, expr)) return true;
    } catch {
      /* page not ready yet */
    }
    await wait(100);
  }
  return false;
}
const bannerIs = (title: string): string => `document.querySelector('.banner h1')?.textContent === ${JSON.stringify(title)}`;
const click = (target: 'shell' | 'home', selector: string): Promise<unknown> =>
  smokeEval(target, `document.querySelector(${JSON.stringify(selector)}).click()`);
const clickItem = (id: string): Promise<unknown> => click('shell', `[data-id="${id}"]`);

/** WW_SMOKE_COOKIES="access_token=a;refresh_token=b": fake session cookies, so a smoke run starts signed in. */
export async function presetSmokeCookies(): Promise<void> {
  const raw = devEnv('WW_SMOKE_COOKIES');
  if (!raw) return;
  const exp = Math.floor(Date.now() / 1000) + 3600;
  for (const pair of raw.split(';')) {
    const i = pair.indexOf('=');
    if (i > 0) {
      await session.defaultSession.cookies.set({ url: APP_URL, name: pair.slice(0, i), value: pair.slice(i + 1), path: '/', httpOnly: true, expirationDate: exp });
    }
  }
}

export function runSmokeAction(action: string, smoke: Smoke): void {
  const look = (event: string): Promise<void> =>
    inspectShell().then((r) => smoke(event, { inspect: r }), (e: unknown) => smoke(`${event}-error`, { error: String(e) }));
  const shot = async (): Promise<void> => {
    const dir = devEnv('WW_SMOKE_SHOT');
    if (dir) await smokeShots(dir);
  };

  if (action === 'shell') {
    // M5.1: the sidebar and toolbar, with the web page as content (the run starts on the web page: WW_START_WEB=1).
    void (async () => {
      await wait(2500);
      await look('shell-initial');
      await shot();
      await clickItem('friends');
      await wait(1200);
      await look('shell-friends');
      await clickItem('settings');
      await wait(1200);
      await look('shell-settings');
      await clickItem('rooms'); // disabled item: must do nothing
      await wait(600);
      await look('shell-rooms-click');
      // Hostile ids through the real bridge: only known sidebar ids may navigate.
      const replies: unknown[] = [];
      for (const bad of ['evil', 'https://evil.example/', '__proto__', 'rooms', 42, null]) {
        replies.push(await smokeEval('shell', `window.wewatchShell.navigate(${JSON.stringify(bad)})`));
      }
      await wait(600);
      smoke('shell-hostile-ids', { replies });
      await look('shell-after-hostile');
      await click('shell', '#back');
      await wait(1200);
      await look('shell-back');
      await click('shell', '#forward');
      await wait(1200);
      await look('shell-forward');
    })();
  } else if (action === 'home') {
    // M5.2: the native Home — data, search, opening a room, coming back.
    void (async () => {
      await wait(2500);
      await look('home-initial');
      await shot();
      const search = (q: string): Promise<unknown> =>
        smokeEval('shell', `(() => { const s = document.getElementById('search'); s.value = ${JSON.stringify(q)}; s.dispatchEvent(new Event('input')); })()`);
      await search('muq');
      await until('home', bannerIs('Muqaddima'));
      await look('home-search');
      await search('zzzzz-no-such-room');
      await until('home', "!!document.querySelector('.message h2')");
      await look('home-search-none');
      await search('');
      await until('home', bannerIs('Yulduzlar Jangi'));
      await look('home-search-cleared');
      // Hostile ids through the real Home bridge: nothing may navigate.
      const replies: unknown[] = [];
      for (const bad of ['../admin', '', 'a b', 42, null, { toString: 'x' }]) {
        replies.push(await smokeEval('home', `window.wewatchHome.open(${JSON.stringify(bad)})`));
      }
      await wait(600);
      smoke('home-hostile-ids', { replies });
      await look('home-after-hostile');
      await click('home', '.card .btn'); // join the first card in the grid
      await wait(1500);
      await look('home-room');
      await click('shell', '#back');
      await wait(1500);
      await look('home-back');
      await clickItem('friends');
      await wait(1200);
      await look('home-friends');
      await clickItem('home');
      await wait(1500);
      await look('home-via-sidebar');
    })();
  } else if (action === 'home-retry') {
    // The first load fails (server down); the user presses "Qayta urinish" and it works.
    void (async () => {
      await wait(2500);
      await look('retry-initial');
      await click('home', '.message .btn');
      await wait(1500);
      await look('retry-after');
    })();
  } else if (action === 'home-look') {
    // Just look at where the app ended up (signed out -> web login, refresh path, ...).
    void (async () => {
      await wait(3000);
      await look('look-initial');
      await shot();
    })();
  }
}
