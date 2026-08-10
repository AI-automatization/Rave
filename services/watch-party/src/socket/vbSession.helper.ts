// WeWatch — shared VB session start/switch logic, used by both:
//   - vbEvents.handler.ts (owner manually clicks "Виртуальный браузер")
//   - roomEvents.handler.ts (CHANGE_MEDIA auto-falls back to VB when content-service's
//     extraction pipeline can't produce a playable result for a submitted URL)
// Same lifecycle either way: start the session, broadcast frames, and switch the room over to
// whatever media the live network/capture sniffer eventually catches.
import { Server as SocketServer } from 'socket.io';
import Redis from 'ioredis';
import { logger } from '@shared/utils/logger';
import { SERVER_EVENTS } from '@shared/constants/socketEvents';
import { REDIS_KEYS } from '@shared/constants';
import { VideoCandidate } from '@shared/types';
import { vbStreamPublicUrl } from '@shared/utils/serviceConfig';
import { signProxyUrl } from '@shared/utils/proxySignature';
import { VB_VIEWPORT, startSession, getSessionPageTitle, MediaType } from '../services/virtualBrowser.service';
import { WatchPartyRoom } from '../models/watchPartyRoom.model';

// TTL for the candidates Redis entry — matches how long "the current video session" is a
// meaningful concept; deliberately generous since a room can sit on one video for hours. Defined
// here (not in roomEvents.handler.ts, which also uses it) because that file already imports
// startVBForRoom from this one — importing back would be a circular dependency.
export const CANDIDATES_TTL_SEC = 6 * 60 * 60; // 6h

// Some CDNs 403 anything not coming from the IP that first requested the URL (same class of
// protection already seen on VK/Rutube). VB's Playwright browser ran inside THIS service's
// container, so re-fetching through vbMediaProxy (also this service) keeps playback on the same
// egress IP the CDN saw — handing app-web's proxy-stream the raw CDN URL directly would fetch
// from a different Railway service/IP and 403 on CDNs that check this.
//
// The URL is signed (GitHub issue #76) because vb-media-proxy is deliberately public/no-auth
// (same trust model as vb-capture — see watchParty.routes.ts) — without a signature it would be
// an open proxy anyone could point at an arbitrary URL. vbMediaProxy.controller.ts verifies the
// exp/sig pair before fetching anything.
//
// Root-caused 2026-08-05 (was the unexplained "signature mismatch" from GitHub issue #76's
// diagnostic logging): some layer between here and vbMediaProxy.controller.ts (Railway's edge,
// most likely) normalizes/decodes the query string once before Express's own parser decodes it
// again — one decode too many. Invisible for a plain URL, but for a mediaUrl that itself contains
// a %-escape (e.g. a filename with a space, "%20"), encodeURIComponent turns that into "%2520",
// and the extra decode collapses it all the way to a literal space — a completely different byte
// string than what was signed, so the HMAC can never match. base64url has no '%' in its alphabet,
// so it's inert to however many decode passes happen in between.
// roomId is plain/unsigned (not part of the HMAC payload) — it's not itself a capability, only
// a lookup key vb-media-proxy uses to find REDIS_KEYS.vbSourceUrl(roomId) if the primary fetch
// fails and a live refresh is worth attempting (see vbMediaProxy.controller.ts). Worst case a
// tampered roomId just makes the refresh attempt look up (or fail to find) the wrong room's
// source page — the signed url/exp/sig triple still fully gates what the PRIMARY fetch can ever
// reach, same as before this existed.
function proxiedMediaUrl(mediaUrl: string, mediaType: MediaType, roomId: string): string {
  const ext = mediaType === 'hls' ? 'm3u8' : mediaType === 'dash' ? 'mpd' : 'mp4';
  const { exp, sig } = signProxyUrl(mediaUrl);
  const encodedUrl = Buffer.from(mediaUrl, 'utf8').toString('base64url');
  return `${vbStreamPublicUrl}/api/v1/watch-party/vb-media-proxy/stream.${ext}`
       + `?url=${encodedUrl}&exp=${exp}&sig=${sig}&roomId=${encodeURIComponent(roomId)}`;
}

export async function startVBForRoom(
  io: SocketServer,
  redis: Redis,
  roomId: string,
  ownerId: string,
  url: string,
): Promise<void> {
  // Real prod case 2026-08-06 (uzmovi.net): VB is a best-effort sniffer — ads, related-content
  // widgets, and (separately) a duration bug on captured streams can all pass its heuristics —
  // so it no longer auto-commits to the room. Every candidate found during the collection window
  // (virtualBrowser.service.ts, COLLECTION_WINDOW_MS) accumulates here; session lifecycle
  // (stop vs. keep-alive-for-capture) is virtualBrowser.service.ts's own call, made once the
  // window closes — this function only cares about presenting what was found.
  const candidates: VideoCandidate[] = [];
  // T-S196 — parallel to `candidates`, same index: the RAW (pre-proxy) mediaUrl each candidate
  // was found under, so a later real-playback confirmation (which only ever sees real network
  // URLs, never our own signed vbMediaProxy wrapper) can still be matched against it.
  const rawUrlByCandidateIndex: string[] = [];
  const confirmedRawUrls = new Set<string>();
  // MSE-played candidates (category B/C, 'capture'-kind) never surface their real CDN URL to the
  // page at all — the browser's <video> element plays a `blob:` URL backed by SourceBuffer, which
  // is exactly what capture-kind already exists to handle. A `blob:` real-playback report can't be
  // matched by URL, so it's treated as "whatever capture-kind candidate exists is confirmed".
  let mseConfirmed = false;

  // Same TTL as the candidates themselves — lets vb-media-proxy re-probe this exact page later
  // (possibly hours later, if the room sits on the picker or a viewer joins late) if a candidate
  // it minted has gone stale by then. Set-and-forget — never read back in this file, only by
  // vbMediaProxy.controller.ts's refresh path.
  await redis.setex(REDIS_KEYS.vbSourceUrl(roomId), CANDIDATES_TTL_SEC, url).catch((e) => {
    logger.warn('VB: failed to store source page URL for later refresh', { roomId, error: (e as Error).message });
  });

  await startSession(roomId, ownerId, url, (base64Jpeg) => {
    // volatile: a lagging viewer jumps to the latest frame instead of draining a backlog.
    io.to(roomId).volatile.emit(SERVER_EVENTS.VB_FRAME, { data: base64Jpeg });
  }, (mediaUrl, mediaType, kind, duration) => {
    // 'capture' mediaUrl already points at our own vb-capture endpoint — only 'url' (a raw,
    // independently-fetchable CDN URL) needs the same-IP proxy wrapper.
    const roomVideoUrl = kind === 'url' ? proxiedMediaUrl(mediaUrl, mediaType, roomId) : mediaUrl;
    // Real prod report 2026-08-07: every VB-found room stayed on the generic default name
    // forever, since nothing in this path ever set videoTitle — the source page's own <title>
    // (captured once navigation succeeds, virtualBrowser.service.ts) is the only title info VB
    // ever has, so every candidate from the same session gets the same one.
    // duration (hls/dash only — parsed from the manifest, see virtualBrowser.service.ts's
    // MIN_MANIFEST_DURATION_SECS check) is a real value already computed to decide ad-vs-real in
    // the first place; passing it through means the picker can show it immediately instead of the
    // "??:??" gap it had before 2026-08-08. No source for mp4 candidates server-side — the client
    // gets that one for free from the <video> element itself once it loads (VideoCandidatePicker.tsx).
    const confirmed = kind === 'url' ? confirmedRawUrls.has(mediaUrl) : mseConfirmed;
    candidates.push({ url: roomVideoUrl, type: mediaType, source: 'vb', title: getSessionPageTitle(roomId), duration, confirmed });
    rawUrlByCandidateIndex.push(mediaUrl);
  }, () => {
    void (async () => {
      // Real prod case 2026-08-07: a room got swept as "inactive" 15 seconds after candidates
      // became ready — closeInactiveRooms's hasSession() guard only covers the search itself, but
      // lastActivityAt never moved even once during the ENTIRE VB run (no play/pause/seek/
      // heartbeat happened, since nothing was playing yet), so the room was already past the
      // 5-minute cutoff the instant VB finished. The owner needs real time to actually look at the
      // picker and decide — touch the timestamp now so that time isn't borrowed from a clock that
      // was already expired before they got a chance to see anything.
      await WatchPartyRoom.updateOne({ _id: roomId }, { lastActivityAt: new Date() }).catch((e) => {
        logger.warn('VB: failed to refresh room activity before presenting candidates', { roomId, error: (e as Error).message });
      });
      if (candidates.length > 0) {
        // Real prod finding 2026-08-07 (uzmovi.net/uzdown.space): this site re-signs its .mpd
        // URLs roughly every 10s (anti-hotlink) — by the time a 'url'-kind candidate survives
        // the collection window + Redis round-trip + the owner actually opening the picker, the
        // token baked into it is already dead, and vb-media-proxy 502s trying to fetch it. A
        // 'capture'-kind candidate (vb-capture URL) has no such problem — it serves bytes VB's
        // own browser already played, not a re-fetch of the original signed URL — so it's
        // strictly more reliable whenever both kinds were found in the same session. Put it
        // first so it's what the owner sees/tries first instead of an expiring one buried in a
        // stack of them.
        // T-S196: a candidate confirmed by real play/timeupdate activity (see
        // onRealPlaybackConfirmed above) is a strictly stronger signal than "network response
        // shaped like media" — rank it first. Falls back to the existing vb-capture tiebreak
        // among non-confirmed candidates, unchanged.
        candidates.sort((a, b) => Number(b.confirmed) - Number(a.confirmed)
          || Number(b.url.includes('/vb-capture/')) - Number(a.url.includes('/vb-capture/')));
        try {
          await redis.setex(REDIS_KEYS.videoCandidates(roomId), CANDIDATES_TTL_SEC, JSON.stringify(candidates));
        } catch (e) {
          logger.warn('VB: failed to store candidates in Redis', { roomId, error: (e as Error).message });
        }
      } else {
        void redis.del(REDIS_KEYS.videoCandidates(roomId)).catch(() => {});
      }
      // needsConfirmation: true even when empty — auto-opens the SAME picker (its existing "нет
      // вариантов" state, see VideoCandidatePicker.tsx) instead of the screencast just quietly
      // stopping with no feedback at all.
      io.to(roomId).emit(SERVER_EVENTS.VIDEO_CANDIDATES, { candidates });
      io.to(roomId).emit(SERVER_EVENTS.VB_STOPPED, { reason: 'media_found', needsConfirmation: true });
      logger.info('VB: collection window closed, candidates ready for owner confirmation', { roomId, count: candidates.length });
    })();
  }, (src) => {
    if (src.startsWith('blob:')) {
      mseConfirmed = true;
      candidates.forEach((c, i) => { if (c.url.includes('/vb-capture/')) candidates[i] = { ...c, confirmed: true }; });
      return;
    }
    confirmedRawUrls.add(src);
    rawUrlByCandidateIndex.forEach((rawUrl, i) => {
      if (rawUrl === src) candidates[i] = { ...candidates[i], confirmed: true };
    });
  });

  io.to(roomId).emit(SERVER_EVENTS.VB_STARTED, { url, width: VB_VIEWPORT.width, height: VB_VIEWPORT.height, ownerId });
}
