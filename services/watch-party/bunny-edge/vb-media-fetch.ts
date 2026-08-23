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
//
// 2026-08-23: this used to read the client's Range header directly (`request.headers.get('range')`)
// — confirmed live (debug console.log dumping every key in request.headers.forEach) that Bunny's
// own edge/CDN layer strips Range before this script ever runs; it was always reading `null`, no
// matter what the real client sent, so the 206/Content-Range logic below never actually fired.
// Nothing inside this script can fix that — the information just isn't there. Railway's
// vbMediaProxy.controller.ts (this script's only caller now, never a client directly — see that
// file's fetchViaBunny) works around it by sending the SAME already-capped Range value as a
// `range` QUERY PARAM instead, which survives fine. Referer/Cookie travel the same way, since
// there's no other channel for them either. Because the caller is always Railway now (not a
// browser/player), these extra params don't need their own signature — url/exp/sig already gate
// whether ANY of this happens at all; range/referer/cookie only affect what Railway asks for once
// it's already allowed through.
import * as BunnySDK from 'npm:@bunny.net/edgescript-sdk@0.12.1';
import crypto from 'node:crypto';
import process from 'node:process';

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

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

function decodeBase64url(value: string): string {
  return new TextDecoder().decode(
    Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)),
  );
}

BunnySDK.net.http.serve(async (request: Request): Promise<Response> => {
  const reqUrl = new URL(request.url);
  const urlParam = reqUrl.searchParams.get('url');
  const expParam = Number(reqUrl.searchParams.get('exp'));
  const sigParam = reqUrl.searchParams.get('sig') ?? '';
  // See the 2026-08-23 comment at the top of this file — Bunny strips the real Range/Referer/
  // Cookie headers before this script ever runs, so Railway (the only caller) sends them as query
  // params instead. `range` travels plain (it's just `bytes=0-4194303`, no unsafe URL characters);
  // referer/cookie are base64url same as `url` since a raw Referer/Cookie value could contain
  // '&' or other characters that would otherwise corrupt the query string.
  const rangeParam = reqUrl.searchParams.get('range');
  const refererParam = reqUrl.searchParams.get('referer');
  const cookieParam = reqUrl.searchParams.get('cookie');

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
  // 2026-08-23 correction: this used to re-cap rangeParam to MAX_RANGE_CHUNK_BYTES (4MB) here,
  // on the assumption that was "just a harmless safety net" since Railway already capped it —
  // wrong. Railway's cappedRange (vbMediaProxy.controller.ts) allows up to 24MB for an EXPLICIT
  // bounded request (Safari/native players fetching a non-faststart file's moov atom, which can
  // legitimately be several MB, near the end of the file) and only 4MB for an open-ended one.
  // Re-capping everything back down to 4MB here silently threw that headroom away — an explicit
  // 24MB request Railway had already decided was safe came back truncated to 4MB anyway, which
  // is exactly the "player keeps re-requesting the same first chunk and never actually starts"
  // symptom seen live (fayllar1.ru, 2026-08-23: repeated identical 4194304-byte 206 responses,
  // playback never progressed). Railway is this script's only caller now — trust its cap as-is.
  if (rangeParam) headers['Range'] = rangeParam;
  if (refererParam) {
    try { headers['Referer'] = decodeBase64url(refererParam); } catch { /* malformed — skip, not fatal */ }
  }
  if (cookieParam) {
    try { headers['Cookie'] = decodeBase64url(cookieParam); } catch { /* malformed — skip, not fatal */ }
  }

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
