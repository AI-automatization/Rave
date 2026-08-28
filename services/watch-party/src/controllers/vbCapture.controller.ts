// WeWatch — serves the in-memory VB capture buffer (services/vbCapture.service.ts) as a normal
// Range-capable HTTP video resource, so it can go through app-web's existing /api/content/
// proxy-stream pipeline exactly like any external CDN URL — no changes needed on that side.
import { Request, Response } from 'express';
import {
  readCaptureRange, hasCapture, getCaptureBytes, getCaptureCodecs, getAvailableCaptureTracks,
  hasCaptureTrack, getTrackCaptureBytes, getTrackCaptureCodecs, readTrackCaptureRange,
  type CaptureTrack,
} from '../services/vbCapture.service';

function parseRange(rangeHeader: string | undefined, totalBytes: number): { start: number; end: number } {
  let start = 0;
  let end = totalBytes - 1;
  if (rangeHeader) {
    const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
    if (match) {
      if (match[1]) start = parseInt(match[1], 10);
      if (match[2]) end = parseInt(match[2], 10);
    }
  }
  // Clamp to what's actually been captured so far — asking beyond that means "wait for more",
  // which we can't do synchronously here, so just clamp instead of hanging the request.
  end = Math.min(end, totalBytes - 1);
  if (start > end) start = end;
  return { start, end };
}

// Shared response-header setup for both the combined and per-track streaming responses — see
// each caller's own comments for why every one of these headers exists.
function writeRangeResponse(
  req: Request, res: Response, buffer: Buffer, totalBytes: number, start: number, end: number, codecs: string | null,
): void {
  const range = req.headers.range;
  res.status(range ? 206 : 200);
  // Real prod bug 2026-08-12: bare helmet() (app.ts) sets Cross-Origin-Resource-Policy:
  // same-origin on every response by default. This route is deliberately public/cross-
  // origin — app-web's <video>/MSE fetches it from a different origin (app.wewatch.uz,
  // or Bunny's wewatch-stream.b-cdn.net pull zone in front of this service) — so the
  // default silently made the browser refuse to hand the already-fetched bytes to the
  // player at all, independent of whatever the bytes actually contained. Confirmed live:
  // every vb-capture/vb-media-proxy request was "Cancelled ... violates the resource's
  // Cross-Origin-Resource-Policy response header" in the browser console despite the
  // server itself answering 200. Same fix needed on vbMediaProxy.controller.ts.
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Accept-Ranges', 'bytes');
  // Exact MSE codec string (mp4CodecSniff.service.ts), once known — lets the client attempt
  // proper MediaSource Extensions playback instead of a plain <video src>, which is what a
  // live-growing capture buffer actually needs on browsers (Chrome) whose native progressive-
  // download demuxer won't play it. Absent header (not just an empty one — Express drops a
  // header entirely when the value is null/undefined) means "not known yet, or not a codec we
  // can build an MSE string for" — the client's own contract for both is identical: don't
  // attempt MSE, fall back to what already existed.
  if (codecs) res.setHeader('X-Vb-Codecs', codecs);
  // Exposed explicitly — custom X- headers aren't in the CORS default-safelist, so a
  // cross-origin fetch() can see the header names below via response.headers.get(...) but
  // needs the server to opt them in here (same story as any other custom response header,
  // e.g. this codebase's own Content-Range on the same response).
  res.setHeader('Access-Control-Expose-Headers', 'X-Vb-Codecs, X-Vb-Tracks, Content-Range, Accept-Ranges, Content-Length');
  // NOT immutable/long-lived: totalBytes (the Content-Range denominator below) grows as capture
  // continues, so the exact same byte range can legitimately get a DIFFERENT total a few seconds
  // later — caching that as permanent would risk teaching a client the wrong final size, the
  // same class of bug as today's tfdt/mvhd duration fix, just via the cache this time instead of
  // the source player. A short TTL still gets the real win — several viewers in the same room,
  // synced, requesting near-identical ranges within the same couple of seconds — without ever
  // being stale enough to matter. Bytes themselves never change once written (append-only
  // buffer), only the total does, so even a stale-for-a-few-seconds response is never WRONG
  // data, just a stale metadata total that the next natural request corrects.
  res.setHeader('Cache-Control', 'public, max-age=3, stale-while-revalidate=2');
  // The global CORS middleware (app.ts) sets Vary: Origin on every response by design — its
  // origin check is a per-request function, which the cors package always pairs with a Vary
  // header. Correct for authenticated routes, but this one is deliberately public/no-auth (same
  // content regardless of caller's Origin) and Cloudflare's cache (this zone's plan) does not
  // cache ANY response carrying a non-default Vary value — confirmed live 2026-08-06: real
  // traffic through stream.wewatch.uz came back cf-cache-status: BYPASS on every request despite
  // a matching, active Cache Rule, until this was removed. Must come after cors() ran (it's
  // global middleware, applied before this controller) to actually override it.
  res.removeHeader('Vary');
  // Static `*`, set AFTER the Vary removal above and deliberately not origin-dependent (2026-08-28).
  // Two reasons it has to be the literal star here: (1) a <video crossOrigin="anonymous"> — which
  // VideoCandidatePicker now needs, so its canvas isn't tainted and a real thumbnail frame can be
  // grabbed — requires an explicit ACAO on the media response, and the global cors() allow-list
  // doesn't cover this public/no-auth route's callers (a CDN fetch sends no Origin at all);
  // (2) with Vary stripped for cacheability, an origin-dependent value would let the cache serve
  // one caller's ACAO to a different origin — a static `*` is the only value that stays correct
  // under a shared cache. Safe precisely because this route is already public and unauthenticated:
  // `*` grants nothing a plain unauthenticated GET didn't already grant.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Length', String(buffer.length));
  if (range) res.setHeader('Content-Range', `bytes ${start}-${end}/${totalBytes}`);
  res.end(buffer);
}

const CAPTURE_TRACK_PARAM: ReadonlySet<string> = new Set(['video', 'audio']);

export const vbCaptureController = {
  stream(req: Request, res: Response): void {
    const { roomId } = req.params;

    if (!hasCapture(roomId)) {
      res.status(404).json({ success: false, message: 'No capture for this room' });
      return;
    }

    const totalBytes = getCaptureBytes(roomId);
    if (totalBytes === 0) {
      res.status(503).json({ success: false, message: 'Capture not ready yet' });
      return;
    }

    const { start, end } = parseRange(req.headers.range, totalBytes);
    const result = readCaptureRange(roomId, start, end);
    if (!result) {
      res.status(404).json({ success: false, message: 'No capture for this room' });
      return;
    }

    // Tells a capable client that per-track sub-streams exist at /vb-capture/:roomId/:track —
    // see vbCapture.service.ts's own dual-track comment. Absent/empty means "only this combined
    // buffer exists" (WebSocket-sourced capture, or no tagged chunk has arrived yet) — same
    // "don't attempt the newer path" contract as a missing X-Vb-Codecs.
    const tracks = getAvailableCaptureTracks(roomId);
    if (tracks.length > 0) res.setHeader('X-Vb-Tracks', tracks.join(','));
    writeRangeResponse(req, res, result.buffer, result.totalBytes, start, end, getCaptureCodecs(roomId));
  },

  // /vb-capture/:roomId/:track — one of the two isolated, correctly-separated per-track buffers
  // (see vbCapture.service.ts). Only ever populated for category-B (appendBuffer hook) captures
  // whose source page tags cleanly as video/audio; a 404 here means "this room has no such track
  // captured" — same fallback contract as everywhere else in this feature: caller falls back to
  // the combined /vb-capture/:roomId endpoint instead.
  streamTrack(req: Request, res: Response): void {
    const { roomId, track } = req.params;
    if (!CAPTURE_TRACK_PARAM.has(track)) {
      res.status(404).json({ success: false, message: 'Unknown capture track' });
      return;
    }
    const t = track as CaptureTrack;

    if (!hasCaptureTrack(roomId, t)) {
      res.status(404).json({ success: false, message: 'No capture for this room/track' });
      return;
    }

    const totalBytes = getTrackCaptureBytes(roomId, t);
    if (totalBytes === 0) {
      res.status(503).json({ success: false, message: 'Capture not ready yet' });
      return;
    }

    const { start, end } = parseRange(req.headers.range, totalBytes);
    const result = readTrackCaptureRange(roomId, t, start, end);
    if (!result) {
      res.status(404).json({ success: false, message: 'No capture for this room/track' });
      return;
    }

    writeRangeResponse(req, res, result.buffer, result.totalBytes, start, end, getTrackCaptureCodecs(roomId, t));
  },
};
