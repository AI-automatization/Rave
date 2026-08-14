// WeWatch — serves the in-memory VB capture buffer (services/vbCapture.service.ts) as a normal
// Range-capable HTTP video resource, so it can go through app-web's existing /api/content/
// proxy-stream pipeline exactly like any external CDN URL — no changes needed on that side.
import { Request, Response } from 'express';
import { readCaptureRange, hasCapture, getCaptureBytes, getCaptureCodecs } from '../services/vbCapture.service';

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

    const range = req.headers.range;
    let start = 0;
    let end = totalBytes - 1;

    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      if (match) {
        if (match[1]) start = parseInt(match[1], 10);
        if (match[2]) end = parseInt(match[2], 10);
      }
    }
    // Clamp to what's actually been captured so far — asking beyond that means "wait for more",
    // which we can't do synchronously here, so just clamp instead of hanging the request.
    end = Math.min(end, totalBytes - 1);
    if (start > end) start = end;

    const result = readCaptureRange(roomId, start, end);
    if (!result) {
      res.status(404).json({ success: false, message: 'No capture for this room' });
      return;
    }

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
    const codecs = getCaptureCodecs(roomId);
    if (codecs) res.setHeader('X-Vb-Codecs', codecs);
    // Exposed explicitly — custom X- headers aren't in the CORS default-safelist, so a
    // cross-origin fetch() can see the header names below via response.headers.get(...) but
    // needs the server to opt them in here (same story as any other custom response header,
    // e.g. this codebase's own Content-Range on the same response).
    res.setHeader('Access-Control-Expose-Headers', 'X-Vb-Codecs, Content-Range, Accept-Ranges, Content-Length');
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
    res.setHeader('Content-Length', String(result.buffer.length));
    if (range) {
      res.setHeader('Content-Range', `bytes ${start}-${end}/${totalBytes}`);
    }
    res.end(result.buffer);
  },
};
