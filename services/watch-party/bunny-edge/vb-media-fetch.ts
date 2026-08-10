// Bunny Edge Script (Standalone) — vb-media-fetch
//
// T-S196 follow-up, 2026-08-10: some VB-caught media hosts (fayllar1.ru and similar Uzbek
// file-mirror CDNs) block/throttle Railway's datacenter egress IP specifically — confirmed live
// by comparing a direct curl from a residential IP (200 OK, real Content-Length, Accept-Ranges)
// against the same request from Railway (2-byte stub body, or the connection just hangs/aborts).
// Blocking major CDN edge-IP ranges is self-defeating for a site (it would reject a meaningful
// slice of all legitimate web traffic that happens to route through the same CDN), so sites doing
// datacenter-IP filtering generally don't bother fingerprinting/blocking them — this script moves
// the actual origin fetch from Railway's IP to Bunny's edge IP, keeping everything else (auth,
// signing, client-facing URL shape) identical to vbMediaProxy.controller.ts.
//
// Scope: progressive MP4 'url'-kind passthrough only (the actually-failing case) — HLS/DASH
// manifest rewriting stays on Railway (vbMediaProxy.controller.ts), unchanged, more complex
// security/rewrite logic not worth duplicating here for a case that isn't broken.
//
// Signature scheme is byte-for-byte identical to shared/src/utils/proxySignature.ts
// (signProxyUrl/verifyProxyUrlDetailed) — same HMAC-SHA256(`${target}|${exp}`), same secret
// (INTERNAL_SECRET, set as an environment variable in this script's Bunny dashboard settings,
// not committed here). Railway mints the URL exactly as before; this script only re-verifies it.
import * as BunnySDK from 'npm:@bunny.net/edgescript-sdk@0.12.1';
import crypto from 'node:crypto';
import process from 'node:process';

const MAX_RANGE_CHUNK_BYTES = 4 * 1024 * 1024; // 4MB — same cap as vbMediaProxy.controller.ts
const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

function cappedRange(rangeHeader: string, maxBytes: number): string {
  const match = /^bytes=(\d+)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) return rangeHeader;
  const start = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : undefined;
  const cappedEnd = start + maxBytes - 1;
  const end = requestedEnd !== undefined ? Math.min(requestedEnd, cappedEnd) : cappedEnd;
  return `bytes=${start}-${end}`;
}

// Same HMAC verification as proxySignature.ts's verifyProxyUrlDetailed — fails closed on any
// missing secret, expired exp, or malformed/mismatched sig.
function verifySignature(target: string, exp: number, sig: string): boolean {
  const secret = process.env.INTERNAL_SECRET ?? '';
  if (!secret) return false;
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(exp) || exp < now) return false;
  if (typeof sig !== 'string' || !/^[0-9a-f]{64}$/i.test(sig)) return false;

  const expected = crypto.createHmac('sha256', secret).update(`${target}|${exp}`).digest('hex');
  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ success: false, message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

BunnySDK.net.http.serve(async (request: Request): Promise<Response> => {
  const reqUrl = new URL(request.url);
  const urlParam = reqUrl.searchParams.get('url');
  const expParam = Number(reqUrl.searchParams.get('exp'));
  const sigParam = reqUrl.searchParams.get('sig') ?? '';

  if (!urlParam) return jsonError(400, 'url required');

  let target: string;
  try {
    target = new TextDecoder().decode(
      Uint8Array.from(atob(urlParam.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)),
    );
  } catch {
    return jsonError(400, 'Invalid url encoding');
  }

  if (!verifySignature(target, expParam, sigParam)) {
    return jsonError(403, 'Forbidden');
  }

  let parsedTarget: URL;
  try {
    parsedTarget = new URL(target);
    if (parsedTarget.protocol !== 'http:' && parsedTarget.protocol !== 'https:') {
      return jsonError(400, 'Invalid target scheme');
    }
  } catch {
    return jsonError(400, 'Invalid target URL');
  }

  const headers: Record<string, string> = {
    'User-Agent': CHROME_UA,
    'Accept': '*/*',
    'Accept-Encoding': 'identity',
  };
  const range = request.headers.get('range');
  if (range) headers['Range'] = cappedRange(range, MAX_RANGE_CHUNK_BYTES);

  let upstream: Response;
  try {
    upstream = await fetch(parsedTarget.href, { headers, redirect: 'follow' });
  } catch (e) {
    return jsonError(502, `Upstream fetch failed: ${(e as Error).message}`);
  }

  if (!upstream.ok && upstream.status !== 206) {
    return jsonError(502, `Upstream returned ${upstream.status}`);
  }
  if (!upstream.body) {
    return new Response(null, { status: upstream.status });
  }

  const rawCT = upstream.headers.get('content-type') ?? '';
  const ct = rawCT.startsWith('video/') || rawCT === 'application/octet-stream' ? rawCT : 'video/mp4';
  const respHeaders: Record<string, string> = {
    'Content-Type': ct,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=3600, immutable',
  };
  const cr = upstream.headers.get('content-range');
  if (cr) respHeaders['Content-Range'] = cr;
  const cl = upstream.headers.get('content-length');
  if (cl) respHeaders['Content-Length'] = cl;

  return new Response(upstream.body, {
    status: upstream.status === 206 ? 206 : 200,
    headers: respHeaders,
  });
});
