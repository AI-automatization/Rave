// Smoke test for the Google sign-in flow (M2b): real Electron + a fake site + a fake auth service.
// Run: npm run smoke:m2b   (builds first). No real Google, no system browser, no network.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const electronBin = require('electron'); // path to the Electron binary
const root = path.resolve(import.meta.dirname, '..', '..');
const SITE_PORT = 8125;
const AUTH_PORT = 8126;
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abcdefghijklmnopqrstuv';
const STATE = '11111111-2222-3333-4444-555555555555';

let scenario = 'success';
let polls = 0;
const authCalls = [];

const site = createServer((req, res) => {
  res.setHeader('content-type', 'text/html');
  res.end('<!doctype html><title>WW-SITE</title><body>site</body>');
});
const auth = createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  authCalls.push(`${req.method} ${url.pathname}`);
  res.setHeader('content-type', 'application/json');
  if (req.method === 'POST' && url.pathname === '/api/v1/auth/google/init') {
    polls = 0;
    return res.end(JSON.stringify({ data: { state: STATE } }));
  }
  if (req.method === 'GET' && url.pathname === '/api/v1/auth/google/poll' && url.searchParams.get('state') === STATE) {
    polls++;
    if (polls < 3) { res.statusCode = 202; return res.end(JSON.stringify({ data: null })); }
    if (polls > 3) { res.statusCode = 202; return res.end(JSON.stringify({ data: null })); } // read once
    if (scenario === 'blocked') return res.end(JSON.stringify({ data: { error: 'ACCOUNT_BLOCKED', reason: 'spam' } }));
    return res.end(JSON.stringify({ data: { user: {}, accessToken: TOKEN, refreshToken: TOKEN } }));
  }
  res.statusCode = 404;
  res.end('{}');
});
await Promise.all([
  new Promise((r) => site.listen(SITE_PORT, '127.0.0.1', r)),
  new Promise((r) => auth.listen(AUTH_PORT, '127.0.0.1', r)),
]);

async function run(name) {
  scenario = name;
  authCalls.length = 0;
  const out = path.join(os.tmpdir(), `ww-m2b-${name}-${Date.now()}.jsonl`);
  fs.writeFileSync(out, '');
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'ww-m2b-ud-'));
  const child = spawn(electronBin, [root, `--user-data-dir=${userData}`], {
    env: {
      ...process.env,
      WW_APP_URL: `http://127.0.0.1:${SITE_PORT}/`,
      WW_START_WEB: '1', // these smokes test the web page's features, not the native Home
      WW_AUTH_URL: `http://127.0.0.1:${AUTH_PORT}/api/v1/auth`,
      WW_AUTH_NO_BROWSER: '1',
      WW_AUTH_POLL_MS: '300',
      WW_SMOKE_OUT: out,
      WW_SMOKE_TTL: '12',
      WW_SMOKE_ACTION: 'google-login',
    },
    stdio: 'ignore',
  });
  await new Promise((r) => child.on('exit', r));
  const events = fs.readFileSync(out, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
  return { events, authCalls: [...authCalls] };
}

const failures = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); };
const pathOf = (u) => { try { return new URL(u).pathname; } catch { return ''; } };

console.log('--- scenario: success');
{
  const { events: ev, authCalls: calls } = await run('success');
  const has = (e) => ev.some((x) => x.event === e);
  check(has('ready'), 'app started');
  check(ev.some((x) => x.event === 'loaded' && pathOf(x.url) === '/'), 'site loaded');
  check(!ev.some((x) => x.event === 'loaded' && pathOf(x.url) === '/api/auth/google/start'), 'google/start was intercepted (never loaded in-app)');
  check(calls[0] === 'POST /api/v1/auth/google/init', 'called google/init first');
  check(calls.filter((c) => c.includes('/google/poll')).length >= 3, 'polled until tokens arrived');
  check(has('login-browser') && ev.find((x) => x.event === 'login-browser').opened === false, 'browser step reached (suppressed in smoke)');
  check(has('login-success'), 'login-success logged');
  check(ev.some((x) => x.event === 'loaded' && pathOf(x.url) === '/room/xyz789'), 'main window went to the post-login redirect /room/xyz789');
  const c = ev.filter((x) => x.event === 'cookies' && pathOf(x.url) === '/room/xyz789').at(-1);
  const get = (n) => c?.cookies.find((k) => k.name === n);
  check(!!get('access_token') && get('access_token').httpOnly === true, 'access_token cookie set, httpOnly');
  check(!!get('refresh_token') && get('refresh_token').httpOnly === true, 'refresh_token cookie set, httpOnly');
  check(get('access_token')?.sameSite === 'lax', 'cookies sameSite=lax');
  check(Math.abs((get('access_token')?.ttlSec ?? 0) - 900) < 60, 'access_token ttl ≈ 15 min');
  check(Math.abs((get('refresh_token')?.ttlSec ?? 0) - 2592000) < 120, 'refresh_token ttl ≈ 30 days');
  check(!JSON.stringify(ev).includes(TOKEN), 'tokens never written to the log');
}

console.log('--- scenario: blocked account');
{
  const { events: ev } = await run('blocked');
  check(ev.some((x) => x.event === 'login-blocked'), 'login-blocked logged');
  check(!ev.some((x) => x.event === 'login-success'), 'no login-success');
  const last = ev.filter((x) => x.event === 'cookies').at(-1);
  check(!last?.cookies.some((k) => k.name === 'access_token'), 'no access_token cookie');
  check(!ev.some((x) => x.event === 'loaded' && pathOf(x.url) === '/room/xyz789'), 'stayed on the site (no redirect)');
}

site.close();
auth.close();
console.log(failures.length ? `\n${failures.length} FAILED` : '\nALL PASSED');
process.exit(failures.length ? 1 : 0);
