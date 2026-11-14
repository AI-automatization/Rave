// Picker smoke ("Videoni olish", src/main/picker.ts): real Electron + a fake web app driving the picker bridge against
// REAL public sites (needs internet). The fake app asks the harness to press play inside the panel (CDP-free: the main
// process smoke hook runs the click). Proves: bad URLs refused; the panel opens, takes a stream where the site gives one
// (archive.org, mover.uz: an mp4 film) and closes. Run: npm run smoke:picker
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const electronBin = require('electron');
const root = path.resolve(import.meta.dirname, '..', '..');
const here = import.meta.dirname;
const APP_PORT = 8131;
let steps = [];
let finished = () => {};
let smokeOut = '';
createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/report') {
    let b = '';
    req.on('data', (d) => (b += d));
    req.on('end', () => { try { const m = JSON.parse(b); steps.push(m); if (m.step === 'done') finished(); } catch { /* */ } res.end('ok'); });
    return;
  }
  if (req.url === '/play') { fs.appendFileSync(smokeOut + '.cmd', 'play\n'); res.end('asked'); return; }
  res.setHeader('content-type', 'text/html');
  res.end(fs.readFileSync(path.join(here, 'picker-app.html')));
}).listen(APP_PORT, '127.0.0.1');

const SITES = [
  ['https://archive.org/details/BigBuckBunny_124', 'mp4'],
  ['https://mover.uz/watch/mr9taI44', 'mp4'],
];
const failures = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); };
for (const [site, want] of SITES) {
  steps = [];
  smokeOut = path.join(os.tmpdir(), `ww-picker-${Date.now()}.jsonl`);
  fs.writeFileSync(smokeOut, '');
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'ww-picker-ud-'));
  const child = spawn(electronBin, [root, `--user-data-dir=${userData}`], {
    env: { ...process.env, WW_APP_URL: `http://127.0.0.1:${APP_PORT}/?site=${encodeURIComponent(site)}`, WW_START_WEB: '1', WW_SMOKE_OUT: smokeOut, WW_SMOKE_TTL: '60', WW_SMOKE_ACTION: 'picker-play' },
    stdio: 'ignore',
  });
  await new Promise((res) => { finished = res; child.on('exit', res); setTimeout(res, 58_000); });
  child.kill();
  const get = (n) => steps.find((x) => x.step === n)?.data;
  console.log(`--- ${site}`);
  check(JSON.stringify(get('bridge')?.keys) === JSON.stringify(['open', 'setBounds', 'nav', 'take', 'close', 'onState']), 'picker bridge: the Windows contract keys');
  check(get('open-file')?.reason === 'protocol_not_allowed' && get('open-js')?.reason === 'protocol_not_allowed', 'file: / javascript: refused');
  check(get('open')?.ok === true && get('bounds')?.ok === true, 'panel opens and takes the box');
  const t = get('take');
  // player=true needs a <video> that has started; archive.org's paused after our scripted play (same as Polat's code,
  // sandbox 2026-11-14) — the stream is what the room uses.
  check(t?.ok === true && /^https:/.test(t?.url ?? ''), `take: ok with the page/player link (${JSON.stringify(t)?.slice(0, 160)})`);
  check(t?.stream?.type === want && (t?.stream?.durationSec ?? 0) >= 120, `take: the film stream (${t?.stream?.type} ${t?.stream?.durationSec}s)`);
  check(get('states')?.some((s) => s.open && s.nav === 'load'), 'state events reach the page (nav: load)');
  check(get('close')?.ok === true, 'close ok');
}
console.log(failures.length ? `\n${failures.length} FAILED` : '\nALL PASSED');
process.exit(failures.length ? 1 : 0);
