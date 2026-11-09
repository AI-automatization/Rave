// Dev/smoke-only drivers: they run ONLY when WW_SMOKE_OUT is set (devEnv() is '' in the packaged app).
// They press buttons in the native views like a user would and record what is on screen after each step.
import { session } from 'electron';
import { APP_URL, devEnv } from './config';
import { authStringsFor, type AuthStringKey } from './auth-strings';
import { inspectShell, smokeEval, smokeShots } from './shell';

type Smoke = (event: string, data?: Record<string, unknown>) => void;

const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
/**
 * Poll until `expr` is truthy inside a view (or give up after `ms`). A window that sits behind other apps has its page
 * timers throttled by Chromium, so a fixed sleep after typing into the search box is not reliable.
 */
async function until(target: 'shell' | 'home' | 'help' | 'auth' | 'content', expr: string, ms = 5000): Promise<boolean> {
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
const click = (target: 'shell' | 'home' | 'help' | 'auth', selector: string): Promise<unknown> =>
  smokeEval(target, `document.querySelector(${JSON.stringify(selector)}).click()`);
const clickItem = (id: string): Promise<unknown> => click('shell', `[data-id="${id}"]`);
const authLabel = (k: AuthStringKey): string => authStringsFor('uz')[k]; // the sign-in screen's Uzbek words

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
      await smokeEval('content', "location.href = '/profile'"); // the web app moving to another of its pages by itself
      await wait(1200);
      await look('shell-page2');
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
      await smokeEval('content', "location.href = '/login'"); // a login page: no sidebar, no sidebar toggle
      await wait(1500);
      await look('shell-login');
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
      await until('home', "!!document.querySelector('.rd-overlay')", 8000);
      await look('design-new-room');
      await smokeEval('home', 'window.wwRoomDialog.close()');
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
  } else if (action === 'settings') {
    // Sozlamalar: profile save, language, password change (-> signed out).
    void (async () => {
      await wait(2500);
      await until('home', "document.querySelectorAll('.card').length > 0");
      await clickItem('settings');
      await until('home', "!!document.querySelector('.settings input.input')");
      await look('settings-initial');
      await wait(800); // let the page paint before the picture is taken
      await shot();
      await smokeEval('home', "(() => { const i = document.querySelector('.settings input.input'); i.value = 'yangi_ism'; i.dispatchEvent(new Event('input')); document.querySelector('.settings textarea').value = 'Yangi bio'; })()");
      await click('home', '.panel .btn.primary');
      await until('shell', "document.querySelector('#who-name').textContent === 'yangi_ism'");
      await look('settings-saved');
      const bad: unknown[] = [];
      for (const [u, b] of [['a b', ''], ['ab', ''], ['taken_name', ''], ['okname', 'x'.repeat(201)], [5, 'x'], ['okname', null]]) {
        bad.push(await smokeEval('home', `window.wewatchHome.settings.saveProfile(${JSON.stringify(u)}, ${JSON.stringify(b)})`));
      }
      smoke('settings-bad-profile', { replies: bad });
      await smokeEval('home', "document.querySelectorAll('.seg-item')[1].click()"); // Русский
      await until('home', "document.querySelector('.settings-title')?.textContent === 'Настройки'");
      await look('settings-ru');
      const pw: unknown[] = [];
      for (const [c, n, k] of [['bad', 'newpass1', 'newpass1'], ['old', 'newpass1', 'x'], ['old', '12345', '12345'], ['', 'newpass1', 'newpass1']]) {
        pw.push(await smokeEval('home', `window.wewatchHome.settings.changePassword(${JSON.stringify(c)}, ${JSON.stringify(n)}, ${JSON.stringify(k)})`));
      }
      smoke('settings-bad-password', { replies: pw });
      const hostile = await smokeEval('home', "window.wewatchHome.settings.setLanguage('xx')");
      smoke('settings-bad-language', { reply: hostile });
      smoke('settings-password-ok', { reply: await smokeEval('home', "window.wewatchHome.settings.changePassword('old', 'newpass1', 'newpass1')") });
      await wait(4000); // the screen shows the message for a moment, then the app signs out
      await look('settings-after-password');
    })();
  } else if (action === 'settings-b') {
    // Avatar upload (the picked file comes from WW_SMOKE_AVATAR), sign out of all devices.
    void (async () => {
      await wait(2500);
      await until('home', "document.querySelectorAll('.card').length > 0");
      await clickItem('settings');
      await until('home', "!!document.querySelector('.settings input.input')");
      smoke('settings-avatar', { reply: await smokeEval('home', 'window.wewatchHome.settings.pickAvatar()') });
      await wait(800);
      await look('settings-avatar-after');
      smoke('settings-signout-all', { reply: await smokeEval('home', 'window.wewatchHome.settings.signOutAll()') });
      await wait(1500);
      await look('settings-after-signout');
    })();
  } else if (action === 'settings-c') {
    // Delete the account, and plain sign-out.
    void (async () => {
      await wait(2500);
      await until('home', "document.querySelectorAll('.card').length > 0");
      await clickItem('settings');
      await until('home', "!!document.querySelector('.settings input.input')");
      smoke('settings-delete-empty', { reply: await smokeEval('home', "window.wewatchHome.settings.deleteAccount('')") });
      smoke('settings-delete', { reply: await smokeEval('home', "window.wewatchHome.settings.deleteAccount('secret1')") });
      await wait(1500);
      await look('settings-after-delete');
    })();
  } else if (action === 'home-nolive') {
    // Rooms exist but none is playing: Bosh sahifa has no banner, yet the rails must still show (not "Hech narsa topilmadi").
    void (async () => {
      await wait(2500);
      await until('home', "document.querySelectorAll('.card').length > 0");
      await clickItem('home');
      await until('home', "document.querySelectorAll('.watch').length >= 3");
      await look('nolive-home');
      // The start block's two buttons open the NATIVE create / join dialogs (no web page is loaded).
      await smokeEval('home', "document.querySelectorAll('.hero .btn.big')[0].click()");
      await until('home', "!!document.querySelector('.rd-overlay')");
      await look('nolive-create');
      await smokeEval('home', 'window.wwRoomDialog.close()');
      await until('home', "!document.querySelector('.rd-overlay')");
      await smokeEval('home', "document.querySelectorAll('.hero .btn.big')[1].click()");
      await until('home', "!!document.querySelector('.rd-overlay')");
      await look('nolive-join');
    })();
  } else if (action === 'auth') {
    // The native sign-in screens against a fake web app (BFF routes): hostile calls, language, errors, register + code,
    // forgot password, footer, Google (blocked / cancelled), a web page that asks for a sign-in, sign-in, sign-out.
    void (async () => {
      const type = (name: string, v: string): Promise<unknown> =>
        smokeEval('auth', `(() => { const i = document.querySelector('input[name="${name}"]'); i.value = ${JSON.stringify(v)}; i.dispatchEvent(new Event('input')); })()`);
      const submit = (): Promise<unknown> => smokeEval('auth', "document.querySelector('.card form').requestSubmit()");
      const screenIs = (v: string): string => `document.querySelector('.card')?.dataset.screen === ${JSON.stringify(v)}`;
      const clickText = (text: string): Promise<unknown> =>
        smokeEval('auth', `[...document.querySelectorAll('.card button')].find((b) => b.textContent.includes(${JSON.stringify(text)})).click()`);
      const noticeShown = "!!document.querySelector('.card .notice') && !document.querySelector('.card .notice').hidden";
      const cookieNames = async (): Promise<unknown> =>
        (await session.defaultSession.cookies.get({ url: APP_URL })).map((c) => ({ name: c.name, httpOnly: c.httpOnly })); // never values

      await wait(2000);
      await until('auth', screenIs('login'));
      await look('auth-initial');
      await shot();
      const replies: unknown[] = [];
      for (const js of ["login(5, null)", "login('', 'x')", "login('a@b.c', 'x'.repeat(2000))", "register('a b', 'x@y.z', 'secret1')", "register('okname', 'x@y.z', '12345')",
        "confirm('a@b.c', '12ab56')", "confirm('a@b.c', 123456)", "forgot(42)", "reset('secret1', 'secret1')"]) {
        replies.push(await smokeEval('auth', `window.wewatchAuth.${js}`));
      }
      smoke('auth-hostile', { replies });
      await click('shell', '#lang button[data-l="ru"]');
      await until('auth', "document.querySelector('.card h1')?.textContent === 'С возвращением'");
      await look('auth-ru');
      await click('shell', '#lang button[data-l="uz"]');
      await until('auth', "document.querySelector('.card h1')?.textContent === 'Xush kelibsiz'");
      // wrong password -> the server's own message
      await type('email', 'm7@example.com');
      await type('password', 'wrong-pass');
      await submit();
      await until('auth', noticeShown);
      await look('auth-wrong');
      await type('email', 'banned@example.com');
      await submit();
      await until('auth', "!!document.querySelector('.card .notice strong')");
      await look('auth-banned');
      // Google: the auth service says "blocked" -> the ban notice; then wait and cancel
      await smokeEval('auth', "document.querySelector('.btn.google').click()");
      await until('auth', screenIs('google'));
      await look('auth-google-wait');
      await until('auth', `${screenIs('login')} && !!document.querySelector('.card .notice strong')`, 8000);
      await look('auth-google-blocked');
      await smokeEval('auth', "document.querySelector('.btn.google').click()");
      await until('auth', screenIs('google'));
      await clickText(authLabel('forgotBackToLogin'));
      await until('auth', screenIs('login'));
      await look('auth-google-cancelled');
      // register: field rules, a taken name, then the e-mail code
      await clickText(authLabel('registerLink'));
      await until('auth', screenIs('register'));
      await type('username', 'a b');
      await type('regEmail', 'new@example.com');
      await type('regPassword', '12345');
      await look('auth-register-invalid');
      await type('username', ' taken_name ');
      await type('regPassword', 'secret12');
      await submit();
      await until('auth', noticeShown);
      await look('auth-register-taken');
      await type('username', 'yangi_user');
      await submit();
      await until('auth', screenIs('verify'));
      await look('auth-verify');
      await shot();
      await type('code0', '000000'); // pasted into the first box: spread over all six and sent
      await until('auth', noticeShown);
      await look('auth-code-wrong');
      // forgot password
      await clickText(authLabel('goToLogin'));
      await until('auth', screenIs('login'));
      await clickText(authLabel('forgotPassword'));
      await until('auth', screenIs('forgot'));
      await type('forgotEmail', 'm7@example.com');
      await submit();
      await until('auth', screenIs('forgotSent'));
      await look('auth-forgot-sent');
      await clickText(authLabel('forgotBackToLogin'));
      await until('auth', screenIs('login'));
      // footer
      await smokeEval('auth', "document.querySelectorAll('.foot button')[0].click()");
      await until('help', "!!document.querySelector('.faq')");
      await wait(300);
      await look('auth-help');
      await smokeEval('help', "document.querySelector('.back').click()");
      await wait(500);
      await look('auth-help-closed');
      await smokeEval('auth', "document.querySelectorAll('.foot button')[1].click()");
      await wait(500);
      // the e-mail code signs the new user in
      await clickText(authLabel('registerLink'));
      await until('auth', screenIs('register'));
      await type('username', 'yangi_user');
      await type('regEmail', 'new@example.com');
      await type('regPassword', 'secret12');
      await submit();
      await until('auth', screenIs('verify'));
      await type('code0', '123456');
      await until('home', "document.querySelectorAll('.card').length > 0", 8000);
      await wait(500);
      await look('auth-registered');
      smoke('auth-cookies', { cookies: await cookieNames() });
      // sign out -> the native sign-in screen, empty
      smoke('auth-logout', { reply: await smokeEval('home', 'window.wewatchHome.settings.logout()') });
      await until('auth', screenIs('login'));
      await look('auth-after-logout');
      // sign in with the password
      await type('email', 'm7@example.com');
      await type('password', 'right-pass');
      await submit();
      await until('home', "document.querySelectorAll('.card').length > 0", 8000);
      await wait(500);
      await look('auth-signed-in');
      // a web page that asks for a sign-in (the session died inside a room): native screen, then back to that room
      await clickItem('friends');
      await until('content', "location.pathname === '/friends'");
      await smokeEval('content', `location.href = '/login?redirect=' + encodeURIComponent('/room/6aec421eb9db0a8762bf6a03')`);
      await until('auth', screenIs('login'));
      await wait(300);
      await look('auth-intercepted');
      await type('email', 'm7@example.com');
      await type('password', 'right-pass');
      await submit();
      await until('content', "location.pathname.startsWith('/room/')", 8000);
      await wait(500);
      await look('auth-redirected');
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
