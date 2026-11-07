// M4 smoke: real Electron. (A) ad networks inside the VB are cancelled, a normal CDN loads, YouTube keeps its
// ads, the VB gets no camera/mic/location/notifications and no "Electron" in its UA, <webview> never attaches.
// (B) DNS-over-HTTPS is really in the path: with 'secure' mode and a dead DoH server name resolution FAILS
// (system DNS alone would succeed); with 'automatic' it falls back and succeeds.
// Ad/legit domains are fake (mapped to 127.0.0.1 with --host-resolver-rules); (B) needs internet and is skipped without it.
// Run: npm run smoke:m4   (builds first; a few short sounds-free windows open)
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import dns from 'node:dns/promises';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const electronBin = require('electron');
const root = path.resolve(import.meta.dirname, '..', '..');
const here = import.meta.dirname;
const page = (f) => fs.readFileSync(path.join(here, f));

let steps = [];
let finished = () => {};
let plainApp = false; // DNS scenarios: the app page does nothing
const hits = []; // requests that reached the fake ad/legit server

const html = (res, body) => { res.setHeader('content-type', 'text/html'); res.end(body); };
const servers = [
  [8125, (req, res) => {
    if (req.method === 'POST' && req.url === '/report') {
      let b = '';
      req.on('data', (d) => (b += d));
      req.on('end', () => { try { const m = JSON.parse(b); steps.push(m); if (m.step === 'done') finished(); } catch { /* ignore */ } res.end('ok'); });
      return;
    }
    html(res, plainApp ? '<!doctype html><title>PLAIN</title>' : page('m4-app.html'));
  }],
  [8127, (_req, res) => html(res, page('m4-film.html'))],
  [8128, (req, res) => { hits.push({ host: String(req.headers.host), path: req.url }); res.setHeader('content-type', 'text/plain'); res.end('x'); }],
  [8129, (_req, res) => html(res, page('m4-yt.html'))],
].map(([port, h]) => createServer(h).listen(port, '127.0.0.1'));
await new Promise((r) => setTimeout(r, 300));

async function run(env, { ttl = 40, args = [] } = {}) {
  steps = []; hits.length = 0;
  const out = path.join(os.tmpdir(), `ww-m4-${Date.now()}.jsonl`);
  fs.writeFileSync(out, '');
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'ww-m4-ud-'));
  const child = spawn(electronBin, [root, `--user-data-dir=${userData}`, ...args], {
    env: { ...process.env, WW_APP_URL: 'http://127.0.0.1:8125/', WW_START_WEB: '1', WW_SMOKE_OUT: out, WW_SMOKE_TTL: String(ttl), ...env },
    stdio: 'ignore',
  });
  await new Promise((res) => { finished = res; child.on('exit', res); setTimeout(res, (ttl + 10) * 1000); });
  if (!plainApp) await new Promise((r) => setTimeout(r, 800));
  child.kill();
  await new Promise((r) => setTimeout(r, 500));
  return { steps: [...steps], hits: [...hits], events: fs.readFileSync(out, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) };
}

const failures = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); };
const get = (s, n) => s.find((x) => x.step === n)?.data;

console.log('--- A: VB protections');
{
  const r = await run({}, { args: ['--host-resolver-rules=MAP ads.doubleclick.net 127.0.0.1, MAP cdn.legit.test 127.0.0.1, MAP youtu.be 127.0.0.1'] });
  const s = r.steps;
  const film = r.hits.filter((h) => h.path.startsWith('/film-'));
  const yt = r.hits.filter((h) => h.path.startsWith('/yt-'));
  check(get(s, 'open-film')?.ok === true, 'film opened in the VB');
  check(film.some((h) => h.path === '/film-ok' && h.host.startsWith('cdn.legit.test')), 'a normal CDN request on the film site LOADED');
  check(film.filter((h) => h.host.startsWith('ads.doubleclick.net')).length === 0, `no ad request reached the ad server from the film site (fetch/img/script/iframe/popunder) — hits: ${JSON.stringify(film.map((h) => h.path))}`);
  const mf = get(s, 'metrics-film');
  check(mf?.adsBlocked >= 4, `ads were counted as blocked (metrics.adsBlocked=${mf?.adsBlocked}, expected ≥ 4)`);
  check(get(s, 'open-yt')?.ok === true, 'YouTube page opened in the VB');
  check(yt.filter((h) => h.host.startsWith('ads.doubleclick.net')).length >= 1, `YouTube page keeps its ads (product decision) — hits: ${JSON.stringify(yt.map((h) => h.path))}`);
  check(get(s, 'metrics-yt')?.adsBlocked === mf?.adsBlocked, 'no ad counted as blocked on the YouTube page');
  const perms = get(s, 'film-perms');
  check(perms?.gum === 'NotAllowedError', `VB: microphone refused (${perms?.gum})`);
  check(perms?.geo === 'code1', `VB: location refused (${perms?.geo})`);
  check(perms?.notif === 'denied', `VB: notifications refused (${perms?.notif})`);
  check(perms && !/electron|wewatch/i.test(perms.ua), `VB: UA hides Electron/WeWatch (${perms?.ua?.slice(0, 70)}…)`);
  check(get(s, 'webview')?.attached === false, '<webview> is unavailable to pages (webviewTag is off by default; the will-attach-webview handler is only a second lock and is not exercised here)');
  check(!s.some((x) => x.step === 'fatal'), 'no fatal error in the fake app');
}

console.log('--- B: DNS-over-HTTPS');
let online = true;
try { await dns.lookup('example.com'); } catch { online = false; }
if (!online) {
  console.log('SKIP  no internet — DoH scenarios not run');
} else {
  plainApp = true;
  const resolve = (ev) => ev.events.find((e) => e.event === 'resolve');
  const dead = 'https://127.0.0.1:8130/dns-query';
  {
    const r = await run({ WW_DOH_MODE: 'secure', WW_DOH_URL: dead }, { ttl: 8 });
    check(resolve(r)?.ok === false, `secure mode + dead DoH server → resolution FAILS (proves DoH is in the path) [${resolve(r)?.error ?? 'resolved'}]`);
  }
  {
    const r = await run({ WW_DOH_URL: dead }, { ttl: 8 });
    check(resolve(r)?.ok === true, 'automatic mode + dead DoH server → falls back to system DNS and resolves');
  }
  {
    const r = await run({}, { ttl: 8 });
    check(resolve(r)?.ok === true, `default config (Cloudflare DoH, automatic) resolves (${resolve(r)?.ms} ms)`);
  }
  plainApp = false;
}

for (const s of servers) s.close();
console.log(failures.length ? `\n${failures.length} FAILED` : '\nALL PASSED');
process.exit(failures.length ? 1 : 0);
