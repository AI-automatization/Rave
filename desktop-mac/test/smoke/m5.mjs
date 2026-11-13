// Smoke test for the native shell (M5.1): real Electron + a fake site that imitates the web app's own left sidebar.
// Drives the sidebar like a user (clicks) and reads back what is on screen. No network, no login.
// Run: npm run smoke:m5   (builds first)
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const electronBin = require('electron');
const root = path.resolve(import.meta.dirname, '..', '..');
const SITE_PORT = 8135;

// Imitates app-web: a fixed left <aside> and a body padded by --ww-sidebar (see AppSidebar.tsx / layout.tsx).
const site = createServer((req, res) => {
  res.setHeader('content-type', 'text/html');
  res.end(`<!doctype html><title>WW ${req.url}</title>
<style>:root{--ww-sidebar:248px} body{margin:0;padding-left:var(--ww-sidebar);background:#05050a;color:#fff}
aside{position:fixed;left:0;top:0;bottom:0;width:var(--ww-sidebar);background:#900;display:flex}</style>
<aside class="fixed inset-y-0 left-0 z-40 hidden lg:flex">WEB-SIDEBAR</aside><main>page ${req.url}<span class="flex h-8 w-8 rounded-full overflow-hidden"><img alt="" src="/uploads/avatars/missing.png" class="h-full w-full"></span></main>`);
});
await new Promise((r) => site.listen(SITE_PORT, '127.0.0.1', r));

const out = path.join(os.tmpdir(), `ww-m5-${Date.now()}.jsonl`);
fs.writeFileSync(out, '');
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'ww-m5-ud-'));
const child = spawn(electronBin, [root, `--user-data-dir=${userData}`], {
  env: { ...process.env, WW_APP_URL: `http://127.0.0.1:${SITE_PORT}/home`, WW_START_WEB: '1', WW_SMOKE_COOKIES: 'wewatch-locale=uz', WW_VB_ALLOW_PRIVATE: '1', WW_SMOKE_OUT: out, WW_SMOKE_TTL: '16', WW_SMOKE_ACTION: 'shell' },
  stdio: 'ignore',
});
await new Promise((r) => child.on('exit', r));
site.close();
const ev = fs.readFileSync(out, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));

const failures = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); };
const get = (name) => ev.find((x) => x.event === name)?.inspect;
const pathOf = (u) => { try { return new URL(u).pathname; } catch { return ''; } };

const init = get('shell-initial');
check(!!init, 'shell rendered and could be inspected');
const items = init?.shell.items ?? [];
check(items.map((i) => i.label).join('|') === "Bosh sahifa|Xonalar|Do'stlar|Tarix|Sozlamalar", 'sidebar items, in design order');
check(init?.shell.titles.join('|') === "ASOSIY|DO'STLAR & HAMJAMIYAT|KUTUBXONA", 'section titles');
check(items.every((i) => !i.disabled), 'every sidebar item opens something (no dead items)');
check(items.find((i) => i.active)?.id === 'home', 'Bosh sahifa is active on /home');
check(init?.shell.backDisabled === true && init?.shell.forwardDisabled === true, 'back/forward disabled at start');
check(init?.shell.bridgeKeys.sort().join(',') === 'back,forward,model,navigate,newRoom,onState,search,setLocale', 'shell bridge exposes exactly model/navigate/back/forward/search/newRoom/setLocale/onState');
check(init?.shell.webBridge === 'undefined', 'shell has NO web-app bridge (wewatchDesktop)');
check(init?.content.shellBridge === 'undefined', 'web content has NO shell bridge (wewatchShell)');
check(init?.content.desktopBridge === 'object', 'web content still has the wewatchDesktop bridge');
check(init?.content.asideDisplay === 'none', "web app's own sidebar is hidden inside the content view");
check(init?.content.sidebarVar === '0px', 'web layout no longer reserves room for its sidebar (--ww-sidebar = 0px)');
const sb = init?.shellBounds, cb = init?.contentBounds;
check(sb?.x === 0 && sb?.y === 0, 'shell view covers the window');
check(cb?.x === 240 && cb?.y === 52, 'content view starts right of the 240 px sidebar, below the 52 px toolbar');
check(cb && sb && cb.width === sb.width - 240 && cb.height === sb.height - 52, 'content view fills the rest of the window');

check(init?.shell.brand === 'WeWatch', 'toolbar shows the WeWatch brand');
check(init?.shell.newRoom === 'Yangi xona', 'purple "Yangi xona" button, in the web app\'s language');
check(init?.shell.profile === null, 'no profile block when the profile could not be loaded');

check(init?.content.avatar?.hidden === true && init?.content.avatar?.marked === true && init?.content.avatar?.bg === 'radial-gradient(circ', 'a round avatar whose picture is missing: broken icon hidden, neutral silhouette shown instead');

const fr = get('shell-friends');
check(pathOf(fr?.content.url) === '/friends', "click Do'stlar -> content navigates to /friends");
check(fr?.shell.items.find((i) => i.active)?.id === 'friends', 'sidebar highlights Do\'stlar');
check(fr?.shell.backDisabled === false, 'back becomes enabled');
check(fr?.content.asideDisplay === 'none', "web sidebar still hidden after navigation (CSS re-applied)");

const st = get('shell-page2');
check(pathOf(st?.content.url) === '/profile', 'the web app moving to another page: the content follows');


const hostile = ev.find((x) => x.event === 'shell-hostile-ids')?.replies ?? [];
check(hostile.length === 6 && hostile.every((r) => r && r.ok === false), 'hostile / unknown / removed ids are all refused (6 of 6)');
const ah = get('shell-after-hostile');
check(pathOf(ah?.content.url) === '/profile', 'hostile ids did not navigate anywhere');

const bk = get('shell-back');
check(pathOf(bk?.content.url) === '/friends', 'back -> /friends');
check(bk?.shell.items.find((i) => i.active)?.id === 'friends', 'highlight follows back');
check(bk?.shell.forwardDisabled === false, 'forward becomes enabled');
const fw = get('shell-forward');
check(pathOf(fw?.content.url) === '/profile', 'forward -> /profile');
check(fw?.shell.forwardDisabled === true, 'forward disabled again at the end of history');

const lg = get('shell-login');
check(lg?.mode === 'auth' && lg?.content === null && lg?.auth?.screen === 'login', 'the web page going to /login is replaced by the native sign-in screen (web page unloaded)');
check(!ev.some((x) => x.event === 'loaded' && pathOf(x.url) === '/login'), 'the web /login page never loaded');
check(lg?.shell.collapsed === true && lg?.authBounds?.x === 0, 'sign-in screen: no sidebar, the screen fills the window');

console.log(failures.length ? `\n${failures.length} FAILED` : '\nALL PASSED');
process.exit(failures.length ? 1 : 0);
