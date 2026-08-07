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
import { VB_VIEWPORT, startSession, getSessionPageTitle } from '../services/virtualBrowser.service';
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
function proxiedMediaUrl(mediaUrl: string, mediaType: 'mp4' | 'hls'): string {
  const ext = mediaType === 'hls' ? 'm3u8' : 'mp4';
  const { exp, sig } = signProxyUrl(mediaUrl);
  const encodedUrl = Buffer.from(mediaUrl, 'utf8').toString('base64url');
  return `${vbStreamPublicUrl}/api/v1/watch-party/vb-media-proxy/stream.${ext}`
       + `?url=${encodedUrl}&exp=${exp}&sig=${sig}`;
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

  await startSession(roomId, ownerId, url, (base64Jpeg) => {
    // volatile: a lagging viewer jumps to the latest frame instead of draining a backlog.
    io.to(roomId).volatile.emit(SERVER_EVENTS.VB_FRAME, { data: base64Jpeg });
  }, (mediaUrl, mediaType, kind) => {
    // 'capture' mediaUrl already points at our own vb-capture endpoint — only 'url' (a raw,
    // independently-fetchable CDN URL) needs the same-IP proxy wrapper.
    const roomVideoUrl = kind === 'url' ? proxiedMediaUrl(mediaUrl, mediaType) : mediaUrl;
    // Real prod report 2026-08-07: every VB-found room stayed on the generic default name
    // forever, since nothing in this path ever set videoTitle — the source page's own <title>
    // (captured once navigation succeeds, virtualBrowser.service.ts) is the only title info VB
    // ever has, so every candidate from the same session gets the same one.
    candidates.push({ url: roomVideoUrl, type: mediaType, source: 'vb', title: getSessionPageTitle(roomId) });
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
  });

  io.to(roomId).emit(SERVER_EVENTS.VB_STARTED, { url, width: VB_VIEWPORT.width, height: VB_VIEWPORT.height, ownerId });
}
