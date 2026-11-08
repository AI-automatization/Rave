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
const labelIs = (id: string, text: string): string => `document.querySelector('[data-id="${id}"] span')?.textContent === ${JSON.stringify(text)}`;
const setLocaleCookie = (value: string): Promise<void> =>
  session.defaultSession.cookies.set({ url: APP_URL, name: 'wewatch-locale', value, path: '/', expirationDate: Math.floor(Date.now() / 1000) + 3600 });
const bannerIs = (title: string): string => `document.querySelector('.banner h1')?.textContent === ${JSON.stringify(title)}`;
const STAR_WARS = 'Yulduzlar Jangi (Interstellar)'; // the fake server's busiest room: "name (video title)"
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
      const name = pair.slice(0, i);
      // like the real web app: the language cookie is written by the page (document.cookie), so it is not HttpOnly
      await session.defaultSession.cookies.set({ url: APP_URL, name, value: pair.slice(i + 1), path: '/', httpOnly: name !== 'wewatch-locale', expirationDate: exp });
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
      // Hostile ids through the real bridge: only known sidebar ids may navigate.
      const replies: unknown[] = [];
      for (const bad of ['evil', 'https://evil.example/', '__proto__', 'favorites', 42, null]) {
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
      await until('home', bannerIs(STAR_WARS));
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
  } else if (action === 'lang') {
    // Language follows the web app's cookie, live; the subscription panel and /pricing are gone. Starts on the web
    // /settings page, signed in, with NO language cookie (so the default, Russian, applies).
    void (async () => {
      await wait(2500);
      await look('lang-ru');
      await smokeEval('content', "location.href = '/pricing'"); // must be refused
      await wait(1200);
      await look('lang-pricing');
      await smokeEval('content', "document.cookie = 'wewatch-locale=uz; path=/'"); // what the web Settings language switch does
      await until('shell', labelIs('home', 'Bosh sahifa'));
      await look('lang-uz');
      await smokeEval('content', "document.cookie = 'wewatch-locale=en; path=/'");
      await until('shell', labelIs('home', 'Home'));
      await look('lang-en');
      await clickItem('rooms'); // the native room list, in English
      await until('home', "document.querySelector('.kicker')?.textContent === 'LIVE RIGHT NOW'");
      await look('lang-home-en');
      await setLocaleCookie('ru'); // changed while Home is shown: both native screens follow at once
      await until('home', "document.querySelector('.kicker')?.textContent === 'СЕЙЧАС В ЭФИРЕ'");
      await look('lang-home-ru');
    })();
  } else if (action === 'rails') {
    // M5.3: the weekly-top and history rails; a click creates a room (201), reuses the open one (409) or fails (500).
    void (async () => {
      const clickWatch = (rail: number, i: number): Promise<unknown> =>
        smokeEval('home', `document.querySelectorAll('.rail')[${rail}].querySelectorAll('.watch')[${i}].click()`);
      const search = (q: string): Promise<unknown> =>
        smokeEval('shell', `(() => { const s = document.getElementById('search'); s.value = ${JSON.stringify(q)}; s.dispatchEvent(new Event('input')); })()`);
      await wait(2500);
      await until('home', "document.querySelectorAll('.card').length > 0"); // the first screen (Xonalar) is up
      await clickItem('home'); // the rails live on Bosh sahifa
      await until('home', "document.querySelectorAll('.watch').length >= 3");
      await look('rails-initial');
      await shot();
      // Hostile calls through the real Home bridge: only an existing card of an existing rail may start anything.
      const replies: unknown[] = [];
      for (const [k, i] of [['evil', 0], ['trending', 99], ['trending', -1], ['trending', '0'], ['trending', 1.5], [null, null], [{}, {}], ['__proto__', 0]]) {
        replies.push(await smokeEval('home', `window.wewatchHome.watch(${JSON.stringify(k)}, ${JSON.stringify(i)})`));
      }
      await wait(600);
      smoke('rails-hostile', { replies });
      await look('rails-after-hostile');
      await clickWatch(0, 0); // 1st trending card -> a new private room (201)
      await wait(1500);
      await look('rails-room');
      await click('shell', '#back');
      await until('home', "document.querySelectorAll('.watch').length >= 3");
      await look('rails-back');
      await clickWatch(0, 1); // 2nd trending card -> the server says 409: open that room with ?play=
      await wait(1500);
      await look('rails-conflict');
      await click('shell', '#back');
      await until('home', "document.querySelectorAll('.watch').length >= 3");
      await clickWatch(1, 0); // history card -> the server fails (500): stay on Home and say so
      await until('home', "!!document.querySelector('.toast')");
      await look('rails-fail');
      await search('zzzzz-no-such-room'); // the search is about rooms: the rails step aside
      await until('home', "document.querySelectorAll('.watch').length === 0");
      await look('rails-search');
    })();
  } else if (action === 'design') {
    // The Stitch design: sidebar counters + profile, toolbar, sort, the other screens, collapsing, "Yangi xona".
    void (async () => {
      await wait(2500);
      await until('shell', "document.getElementById('profile').hidden === false && !!document.querySelector('[data-id=rooms] .tail.count')");
      await until('home', "document.querySelectorAll('.card .subtitle').length >= 2");
      await look('design-initial');
      await shot();
      await smokeEval('home', "(() => { const s = document.querySelector('.sort select'); s.value = 'newest'; s.dispatchEvent(new Event('change')); })()");
      await until('home', "document.querySelector('.sort select')?.value === 'newest'");
      await look('design-newest');
      const replies: unknown[] = [];
      for (const bad of ['oldest', '', 42, null, {}, '__proto__']) replies.push(await smokeEval('home', `window.wewatchHome.sort(${JSON.stringify(bad)})`));
      smoke('design-sort-hostile', { replies });
      await click('shell', '#toggle');
      await until('shell', "document.body.classList.contains('collapsed')");
      await wait(300);
      await look('design-collapsed');
      await shot();
      await click('shell', '#toggle');
      await until('shell', "!document.body.classList.contains('collapsed')");
      await wait(300);
      await look('design-expanded');
      await clickItem('live');
      await until('home', "!!document.querySelector('.banner') && document.querySelectorAll('.card').length === 0");
      await look('design-live');
      await clickItem('history');
      await until('home', "document.querySelectorAll('.grid .watch').length >= 1");
      await look('design-history');
      await shot();
      await clickItem('home');
      await until('home', "document.querySelectorAll('.rail-section').length === 2");
      await look('design-home');
      await click('shell', '#new-room');
      await until('content', "!!document.querySelector('[role=dialog]')", 8000);
      await look('design-new-room');
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
  } else if (action === 'home-nolive') {
    // Rooms exist but none is playing: Bosh sahifa has no banner, yet the rails must still show (not "Hech narsa topilmadi").
    void (async () => {
      await wait(2500);
      await until('home', "document.querySelectorAll('.card').length > 0");
      await clickItem('home');
      await until('home', "document.querySelectorAll('.watch').length >= 3");
      await look('nolive-home');
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
