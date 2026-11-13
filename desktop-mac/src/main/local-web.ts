// Bundled web app (why and how: local-web-model.ts header).
//
//   Chromium ──https://app.wewatch.uz──▶ 127.0.0.1:<tlsPort>  (this process: TLS with a cert made on this Mac)
//                                          └──http──▶ 127.0.0.1:<internalPort>  (child: Next.js standalone server.js)
//                                                       └──https──▶ core / media backend (public production hosts)
//
// Only the packaged app does this, and only when the build carries the web app (Resources/web/server.js). A development
// run can point at a built copy with WW_LOCAL_WEB_DIR (dev only, like every WW_* variable).
import { app, session, utilityProcess, type UtilityProcess } from 'electron';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { APP_ORIGIN, devEnv } from './config';
import { certNeedsRenewal, isOurCertificate, resolverRule, webServerEnv, WEB_HOST } from './local-web-model';

type Log = (event: string, data?: Record<string, unknown>) => void;

const WEB_DIR = devEnv('WW_LOCAL_WEB_DIR') || (app.isPackaged ? path.join(process.resourcesPath, 'web') : '');
/** On only for the production address (a dev run against localhost has nothing to replace) with a web build present. */
export const LOCAL_WEB = APP_ORIGIN === `https://${WEB_HOST}` && WEB_DIR !== '' && fs.existsSync(path.join(WEB_DIR, 'server.js'));

let tlsPort = 0;
let internalPort = 0;
let child: UtilityProcess | null = null;
let quitting = false;

/** Two free loopback ports, found synchronously: the resolver switch must be set before `ready`. */
function freePortsSync(): [number, number] {
  const script =
    "const n=require('net');const a=n.createServer().listen(0,'127.0.0.1',()=>{const b=n.createServer().listen(0,'127.0.0.1',()=>{" +
    "console.log(a.address().port+' '+b.address().port);a.close();b.close();});});";
  const out = execFileSync(process.execPath, ['-e', script], { env: { ELECTRON_RUN_AS_NODE: '1' }, encoding: 'utf8', timeout: 10_000 });
  const [p1, p2] = out.trim().split(' ').map(Number);
  if (!p1 || !p2) throw new Error(`local-web: no free port (${out})`);
  return [p1, p2];
}

/** Must run before the app is ready. */
export function prepareLocalWeb(log: Log): void {
  if (!LOCAL_WEB) return;
  [tlsPort, internalPort] = freePortsSync();
  app.commandLine.appendSwitch('host-resolver-rules', resolverRule(tlsPort));
  log('local-web-prepare', { tlsPort, internalPort, dir: WEB_DIR });
}

/** A certificate for WEB_HOST made on this Mac (never shipped in the app), kept in the app's own data folder. */
function ensureCertificate(): { cert: Buffer; key: Buffer; fingerprint256: string } {
  const dir = path.join(app.getPath('userData'), 'local-web');
  const certFile = path.join(dir, 'cert.pem');
  const keyFile = path.join(dir, 'key.pem');
  let validTo: string | null = null;
  try {
    validTo = new crypto.X509Certificate(fs.readFileSync(certFile)).validTo;
    fs.accessSync(keyFile, fs.constants.R_OK);
  } catch {
    validTo = null;
  }
  if (certNeedsRenewal(validTo, new Date())) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    // RSA: BoringSSL (Electron) could not read LibreSSL's EC key encoding (DECODE_ERROR, 2026-11-13).
    execFileSync('/usr/bin/openssl', [
      'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', keyFile, '-out', certFile, '-days', '825',
      '-subj', `/CN=${WEB_HOST}`, '-addext', `subjectAltName=DNS:${WEB_HOST}`, '-addext', 'extendedKeyUsage=serverAuth',
    ], { stdio: 'pipe', timeout: 30_000 });
    fs.chmodSync(keyFile, 0o600);
  }
  const cert = fs.readFileSync(certFile);
  return { cert, key: fs.readFileSync(keyFile), fingerprint256: new crypto.X509Certificate(cert).fingerprint256 };
}

// Electron's utilityProcess, not child_process.spawn(process.execPath): a spawned copy of the app's own executable (run as
// Node) registered with macOS as an app of its own — Next renames it "next-server (v14.2.35)" — and showed a blank "exec"
// icon in the Dock on every launch (2026-11-13). A utility process runs as the app's helper, which has no Dock icon.
function startServer(log: Log): void {
  const env = { ...webServerEnv(internalPort), HOME: process.env.HOME ?? '', PATH: '/usr/bin:/bin' };
  const c = utilityProcess.fork(path.join(WEB_DIR, 'server.js'), [], { cwd: WEB_DIR, env, stdio: 'pipe', serviceName: 'WeWatch Web' });
  child = c;
  c.stderr?.on('data', (d: Buffer) => log('local-web-stderr', { line: d.toString().slice(0, 300) }));
  c.on('exit', (code) => {
    log('local-web-exit', { code });
    if (child === c) child = null;
    if (!quitting) setTimeout(() => { if (!quitting && !child) startServer(log); }, 1000); // came down: bring it back
  });
}

async function waitReady(timeoutMs: number): Promise<boolean> {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const ok = await new Promise<boolean>((resolve) => {
      const r = http.get({ host: '127.0.0.1', port: internalPort, path: '/api/config', timeout: 2000 }, (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      });
      r.on('error', () => resolve(false));
      r.on('timeout', () => { r.destroy(); resolve(false); });
    });
    if (ok) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

/** After `ready`, before the first window. Resolves once the local web app answers (or after the timeout, logged). */
export async function startLocalWeb(log: Log): Promise<void> {
  if (!LOCAL_WEB) return;
  const { cert, key, fingerprint256 } = ensureCertificate();

  // Trust our certificate for WEB_HOST in the main session only; every other host keeps Chromium's own verdict (-3).
  // The VB session has no such rule, so a page there can never be served by the local app under the real name.
  session.defaultSession.setCertificateVerifyProc((req, cb) => {
    if (req.hostname !== WEB_HOST) return cb(-3);
    cb(isOurCertificate(req.certificate.fingerprint, fingerprint256) ? 0 : -2);
  });

  const tls = https.createServer({ cert, key }, (req, res) => {
    const headers = { ...req.headers, 'x-forwarded-proto': 'https', 'x-forwarded-host': WEB_HOST, 'x-forwarded-for': '127.0.0.1' };
    const up = http.request({ host: '127.0.0.1', port: internalPort, method: req.method, path: req.url, headers }, (ur) => {
      res.writeHead(ur.statusCode ?? 502, ur.headers);
      ur.pipe(res);
    });
    up.on('error', () => {
      if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('WeWatch: local web app is not running');
    });
    req.pipe(up);
  });
  await new Promise<void>((resolve, reject) => tls.once('error', reject).listen(tlsPort, '127.0.0.1', () => resolve()));

  startServer(log);
  app.on('before-quit', () => {
    quitting = true;
    child?.kill();
    tls.close();
  });
  const t0 = Date.now();
  const ready = await waitReady(30_000);
  log('local-web-ready', { ready, ms: Date.now() - t0 });
}
