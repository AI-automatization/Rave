// WeWatch — non-faststart MP4 detection (2026-08-26, live incident: fayllar1.ru sources)
//
// Root cause found live: some CDN mirrors (fayllar1.ru-class movie rips) write the `moov` atom
// (the sample-table index a player needs before it can decode ANY frame) at the very end of the
// file instead of the front ("faststart"). Confirmed live that Android's player here reads such
// files strictly sequentially from byte 0 and never jumps ahead to fetch the tail — for a
// 600MB+ movie that means "loading" for as long as it takes to download nearly the whole file,
// which blows past the player's own load timeout and surfaces as a generic "video failed to
// load" with no indication why. A real remux-to-faststart fix is a separate, bigger piece of
// work (needs ffmpeg in the container, disk-bounded caching, and a client-side change so the
// player never even sees the raw URL) — this is the interim, safe, backend-only version: detect
// the condition cheaply and fail with an honest, immediate message instead of a silent 2-3
// minute hang.
//
// Deliberately probes the ORIGIN directly (not through our own vb-media-proxy) — this is a
// small, one-shot server-to-server read to inspect box headers, not something that needs our
// proxy's SSRF/signature machinery (the URL being checked was already vetted when VB captured
// it), and going through the proxy here would just add a redundant hop.
import { logger } from '@shared/utils/logger';

const PROBE_BYTES = 2 * 1024 * 1024; // 2MB — comfortably covers ftyp/free/moov for a
// faststart-optimized file; a non-faststart file's moov won't appear in this window at all,
// which is exactly the signal this function looks for.
const PROBE_TIMEOUT_MS = 8_000;
const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

/** Extracts the real upstream URL from one of our own vb-media-proxy URLs (the `url=` query
 * param, base64url-encoded — same scheme vbMediaProxy.controller.ts itself decodes). Returns
 * null if `proxyUrl` isn't one of ours or the param is missing/malformed. */
function extractUpstreamUrl(proxyUrl: string): string | null {
  try {
    const parsed = new URL(proxyUrl);
    const encoded = parsed.searchParams.get('url');
    if (!encoded) return null;
    return Buffer.from(encoded, 'base64url').toString('utf8');
  } catch {
    return null;
  }
}

/** Walks MP4 box headers in `buf` looking for `moov` before running out of bytes or hitting a
 * `mdat` box declared larger than what's left in the buffer (the actual non-faststart signal —
 * mdat's own declared size says the next box, whatever it is, lies far beyond what we fetched). */
function moovFoundEarly(buf: Buffer): boolean {
  let offset = 0;
  while (offset + 8 <= buf.length) {
    const size = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    if (type === 'moov') return true;
    if (size === 0) return false; // "box extends to EOF" — never faststart
    if (size === 1) return false; // 64-bit largesize — vanishingly rare here, don't chase it
    if (offset + size > buf.length) {
      // This box (commonly `mdat`) is bigger than our whole probe window — whatever comes next
      // (moov, in the non-faststart case) is out of reach without fetching much further in.
      return false;
    }
    offset += size;
  }
  return false; // ran out of boxes without finding moov — same signal as above
}

/**
 * Returns true if `proxyUrl`'s underlying source looks faststart-safe (moov found within the
 * first PROBE_BYTES), false if it's a confirmed non-faststart file the player can't handle.
 * Fails OPEN (returns true) on any probe error — a network hiccup or a URL this function can't
 * parse must never block an otherwise-fine source; this is a best-effort early warning, not a
 * correctness gate.
 */
export async function isLikelyFaststart(proxyUrl: string): Promise<boolean> {
  const upstreamUrl = extractUpstreamUrl(proxyUrl);
  if (!upstreamUrl) return true;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(upstreamUrl, {
      headers: { 'User-Agent': CHROME_UA, Range: `bytes=0-${PROBE_BYTES - 1}` },
      signal: controller.signal,
    });
    if (!res.ok && res.status !== 206) return true; // can't probe — don't block on it
    const buf = Buffer.from(await res.arrayBuffer());
    return moovFoundEarly(buf);
  } catch (e) {
    logger.warn('faststart probe failed — assuming OK', { url: upstreamUrl.slice(0, 120), error: (e as Error).message });
    return true;
  } finally {
    clearTimeout(timer);
  }
}
