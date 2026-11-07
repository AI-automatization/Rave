// M3 e2e smoke, no server and no network: real Electron + a fake web app that acts as the room owner AND
// the viewer (WebRTC loopback in one page). Proves: VB opens only http(s); the share carries the VB's
// picture and ONLY its sound (the app's own 880 Hz tone must not leak); it keeps working while the VB is
// minimised; after the VB closes nothing can be shared.   Run: npm run smoke:m3   (builds first)
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
const APP_PORT = 8125; // the "web app" origin (= APP_URL)
const FILM_PORT = 8127; // the film site (another origin, like a real movie site)

let steps = [];
let finished = () => {};

const appSrv = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/report') {
    let b = '';
    req.on('data', (d) => (b += d));
    req.on('end', () => {
      try { const m = JSON.parse(b); steps.push(m); if (m.step === 'done') finished(); } catch { /* ignore */ }
      res.end('ok');
    });
    return;
  }
  res.setHeader('content-type', 'text/html');
  res.end(fs.readFileSync(path.join(here, 'm3-app.html')));
});
const filmSrv = createServer((_req, res) => {
  res.setHeader('content-type', 'text/html');
  res.end(fs.readFileSync(path.join(here, 'm3-film.html')));
});
await Promise.all([
  new Promise((r) => appSrv.listen(APP_PORT, '127.0.0.1', r)),
  new Promise((r) => filmSrv.listen(FILM_PORT, '127.0.0.1', r)),
]);

async function run(minimized) {
  steps = [];
  const out = path.join(os.tmpdir(), `ww-m3-${Date.now()}.jsonl`);
  fs.writeFileSync(out, '');
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'ww-m3-ud-'));
  const child = spawn(electronBin, [root, `--user-data-dir=${userData}`], {
    env: {
      ...process.env,
      WW_APP_URL: `http://127.0.0.1:${APP_PORT}/`,
      WW_SMOKE_OUT: out,
      WW_SMOKE_TTL: '70',
      ...(minimized ? { WW_SMOKE_VB_MINIMIZE: '1' } : {}),
    },
    stdio: 'ignore',
  });
  await new Promise((res) => {
    finished = res;
    child.on('exit', res);
    setTimeout(res, 65_000);
  });
  child.kill();
  await new Promise((r) => setTimeout(r, 500));
  return steps;
}

const failures = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); };
const get = (s, name) => s.find((x) => x.step === name)?.data;

for (const minimized of [false, true]) {
  console.log(`--- VB ${minimized ? 'MINIMISED' : 'visible'}`);
  const s = await run(minimized);
  const bridge = get(s, 'bridge');
  check(bridge?.platform === 'macos' && bridge?.version === 1, 'bridge: platform macos, version 1');
  check(JSON.stringify(bridge?.vbKeys) === JSON.stringify(['open', 'close', 'focus', 'onState', 'onBlocked', 'metrics']), 'bridge: vb contract keys');
  check(get(s, 'open-file')?.reason === 'protocol_not_allowed', 'vb.open(file://) refused');
  check(get(s, 'open-js')?.reason === 'protocol_not_allowed', 'vb.open(javascript:) refused');
  check(get(s, 'open-garbage')?.reason === 'invalid_url', 'vb.open(garbage) refused');
  check(get(s, 'open-nonstring')?.reason === 'invalid_url', 'vb.open(non-string) refused');
  check(get(s, 'capture-without-vb')?.ok === false, 'sharing refused while no VB window exists');
  check(get(s, 'open-film')?.ok === true, 'vb.open(http film) ok');
  check(get(s, 'metrics')?.ok === true && get(s, 'metrics')?.ramMb > 0, 'vb.metrics works');
  const cap = get(s, 'capture');
  check(cap?.audio === 1 && cap?.video === 1, `capture: 1 audio + 1 video track (${cap?.error ?? cap?.label})`);
  const rtc = get(s, 'webrtc');
  check(rtc?.remoteAudio === 1 && rtc?.remoteVideo === 1, 'viewer received audio + video over WebRTC');
  const m = get(s, 'measure');
  // WebRTC audio needs a moment to start (first packets / jitter buffer): tolerate ≤ 3 s of leading silence,
  // but once sound has started it must not drop out.
  const first = m ? m.pattern.indexOf('1') : -1;
  const after = first >= 0 ? m.pattern.slice(first) : '';
  check(first >= 0 && first * 0.2 <= 3, `viewer audio starts within 3 s (first live sample after ${first >= 0 ? first * 0.2 : '∞'} s)`);
  check(after.length > 0 && after.split('').filter((c) => c === '1').length / after.length >= 0.95, `viewer audio does not drop out once started (${m?.pattern})`);
  check(m && m.e440dB > -60, `viewer hears the VB's 440 Hz tone (${m?.e440dB} dB)`);
  check(m && m.e880dB < m.e440dB - 25, `app's own 880 Hz tone did NOT leak into the share (${m?.e880dB} dB vs ${m?.e440dB} dB)`);
  check(m && m.frames >= 120, `viewer video flowing (${m?.frames} frames in 8 s)`);
  check(m && m.luma > 15 && m.luma < 245, `viewer picture is not black/white (luma ${m?.luma})`);
  check(get(s, 'close')?.ok === true, 'vb.close ok');
  check(get(s, 'closed-event') === true, 'vb:state {open:false} delivered');
  check(get(s, 'close-again')?.ok === false, 'closing twice reports not_open');
  check(get(s, 'capture-after-close')?.ok === false, 'sharing refused after the VB is closed');
  const st = get(s, 'states') ?? [];
  check(st.some((x) => x.open === true && String(x.url).includes('/film.html')), 'vb:state open event with the film url');
  check(!s.some((x) => x.step === 'fatal'), 'no fatal error in the fake app');
}

appSrv.close();
filmSrv.close();
console.log(failures.length ? `\n${failures.length} FAILED` : '\nALL PASSED');
process.exit(failures.length ? 1 : 0);
