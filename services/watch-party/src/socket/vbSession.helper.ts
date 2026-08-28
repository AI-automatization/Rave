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
import { VB_VIEWPORT, startSession, stopSession, pauseScreencast, markSessionCommitted, getSessionPageTitle, MediaType } from '../services/virtualBrowser.service';
import { WatchPartyRoom } from '../models/watchPartyRoom.model';
import { WatchPartyService } from '../services/watchParty.service';
import { isLikelyFaststart } from '../services/faststartCheck.service';
import { getFaststartFixedFileName } from '../services/faststartRemux.service';

// TTL for the candidates Redis entry — matches how long "the current video session" is a
// meaningful concept; deliberately generous since a room can sit on one video for hours. Defined
// here (not in roomEvents.handler.ts, which also uses it) because that file already imports
// startVBForRoom from this one — importing back would be a circular dependency.
export const CANDIDATES_TTL_SEC = 6 * 60 * 60; // 6h

// 2026-08-28 (Saidazim, live-tested against Kosmi): Kosmi never shows a candidate picker — the
// owner clicks play on the real video inside the live VB session, and ~4-5s later everyone gets
// auto-switched to it, no manual confirm step. T-S196's real-playback confirmation
// (onRealPlaybackConfirmed below) already detects exactly that "a real <video>/<audio> element
// actually started playing" signal — until now it only ever used that to rank a candidate higher
// in the picker, never to skip the picker outright. TEST (Saidazim, 2026-08-28): auto-commit once
// a real-playback-confirmed candidate has been stable for this long, instead of always waiting for
// the full collection window + a manual pick. Revert to always-show-picker (drop this block) if
// this turns out to fire on the wrong candidate in practice.
const AUTO_COMMIT_DELAY_MS = 4500;

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
// Real prod finding 2026-08-10: some VB-caught mp4 hosts (fayllar1.ru and similar Uzbek
// file-mirror CDNs) block/throttle THIS service's Railway egress IP specifically — confirmed by
// comparing a direct curl from a residential IP (200 OK, real Content-Length, Accept-Ranges)
// against the identical request from Railway (2-byte stub body, or the connection just hangs).
// Blocking major CDN edge-IP ranges is self-defeating for a site (it would reject a meaningful
// slice of all legitimate web traffic that happens to route through the same CDN), so sites doing
// datacenter-IP filtering generally don't bother fingerprinting/blocking them. VB_EDGE_FETCH_URL
// (services/watch-party/bunny-edge/vb-media-fetch.ts, a Bunny Edge Script on the SAME
// already-paid-for wewatch-stream pull zone account) re-does this exact fetch from Bunny's edge
// IP instead — same HMAC signature scheme, same client-facing shape, only the egress IP changes.
// Scoped to 'mp4' only: that script only does raw byte passthrough, not HLS/DASH manifest
// rewriting (vb-media-proxy's more complex, security-sensitive logic) — those keep going through
// Railway unchanged. Falls back to the existing Railway route automatically if the env var isn't
// set (e.g. local dev, or before this is configured in a given environment).
const vbEdgeFetchUrl = process.env.VB_EDGE_FETCH_URL;

function proxiedMediaUrl(mediaUrl: string, mediaType: MediaType, roomId: string): string {
  const { exp, sig } = signProxyUrl(mediaUrl);
  const encodedUrl = Buffer.from(mediaUrl, 'utf8').toString('base64url');

  if (mediaType === 'mp4' && vbEdgeFetchUrl) {
    // 2026-08-23 follow-up: this used to hand the client a bare Bunny URL directly (bypassing
    // Railway's vb-media-proxy entirely) — but Bunny's edge platform strips the incoming `Range`
    // header before the script ever sees it (confirmed live via a debug console.log dump of
    // request.headers.forEach — 'range' is simply absent from what the script receives, no matter
    // what the client sent). No code inside the Bunny script can work around that; it never gets
    // the information. So mp4 now goes through Railway's vb-media-proxy exactly like HLS/DASH does
    // (same URL shape, same isOwnVbUrl/isOwnVbMediaUrl self-reference recognition below — the
    // 2026-08-10 "no distinguishing path segment" bug this comment used to describe doesn't apply
    // anymore, since this is now a completely normal vb-media-proxy/stream.mp4 URL). Railway DOES
    // receive Range correctly from the client; it just can't always reach the origin directly for
    // IP-blocked hosts (fayllar1.ru-class) — vbMediaProxy.controller.ts's attemptFetch() re-sends
    // that same request through Bunny server-to-server when `viaBunny=1`, passing Range as a query
    // param instead of a header (Bunny strips it either way, but a query param survives).
    return `${vbStreamPublicUrl}/api/v1/watch-party/vb-media-proxy/stream.mp4`
         + `?url=${encodedUrl}&exp=${exp}&sig=${sig}&roomId=${encodeURIComponent(roomId)}&viaBunny=1`;
  }

  const ext = mediaType === 'hls' ? 'm3u8' : 'mpd';
  return `${vbStreamPublicUrl}/api/v1/watch-party/vb-media-proxy/stream.${ext}`
       + `?url=${encodedUrl}&exp=${exp}&sig=${sig}&roomId=${encodeURIComponent(roomId)}`;
}

export async function startVBForRoom(
  io: SocketServer,
  redis: Redis,
  roomId: string,
  ownerId: string,
  url: string,
  // Determined by the caller via getUserPlan(ownerId) — see vbEvents.handler.ts. Threaded straight
  // through to startSession()'s concurrency check (virtualBrowser.service.ts).
  tier: 'free' | 'pro' = 'free',
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

  // TEST (2026-08-28): guards the auto-commit path below — set once we've committed a candidate
  // directly, so the normal end-of-collection-window picker doesn't also fire for the same room.
  let committed = false;
  let autoCommitTimer: NodeJS.Timeout | null = null;
  // Set the moment the 40s collection window closes. Two things depend on it: auto-commit must
  // not fire after the owner has been handed the picker (it would silently overwrite whatever they
  // just chose), and the rollback path inside commitCandidate needs to know whether the picker has
  // already been presented or whether it still has to present it itself.
  let collectionEnded = false;

  // Hands the owner the picker with whatever was found. Extracted from the collection-window
  // callback (2026-08-28) so the auto-commit rollback path can call it too: if the window closed
  // while a commit attempt was still in flight, that callback already returned early on
  // committed=true, and without this nobody would ever present anything.
  async function presentCandidates(): Promise<void> {
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
  }

  async function commitCandidate(candidate: VideoCandidate): Promise<void> {
    if (committed) return;
    committed = true;
    if (autoCommitTimer) { clearTimeout(autoCommitTimer); autoCommitTimer = null; }

    // Same faststart check CHANGE_MEDIA's manual-pick path runs (roomEvents.handler.ts) — a
    // non-faststart 'url'-kind candidate needs the remux cache before it's safe to hand to
    // mobile's sequential-read player. vb-capture candidates never need this (already our own
    // buffer, always faststart by construction).
    let videoUrlToUse = candidate.url;
    if (!candidate.url.includes('/vb-capture/')) {
      const faststartOk = await isLikelyFaststart(candidate.url);
      if (!faststartOk) {
        const fixedFileName = await getFaststartFixedFileName(redis, candidate.url);
        if (fixedFileName) {
          videoUrlToUse = `${vbStreamPublicUrl}/api/v1/watch-party/vb-media-proxy/faststart/${fixedFileName}`;
        } else {
          // Can't auto-commit cleanly — fall back to the normal picker instead of switching the
          // room to something that won't play. Un-flip `committed` so onCollectionEnd proceeds.
          committed = false;
          logger.warn('VB auto-commit: non-faststart candidate with no remux available, falling back to picker', { roomId });
          // ...but if the window ALREADY closed while the faststart probe was running, then
          // onCollectionEnd saw committed=true and returned early — nobody is left to present the
          // picker, and the room would sit on a dead screencast forever. Present it here instead.
          if (collectionEnded) await presentCandidates();
          return;
        }
      }
    }

    try {
      const watchPartyService = new WatchPartyService(redis);
      const updated = await watchPartyService.updateRoomMedia(ownerId, roomId, {
        videoUrl: videoUrlToUse,
        videoTitle: candidate.title ?? null,
        videoPlatform: null,
      });

      // Real bug 2026-08-28 (Saidazim, live on mobile: "когда я уже выбрал видео, он опять
      // открывает вб"). The screencast MUST be silenced BEFORE VB_STOPPED goes out, not after.
      // Clients treat any arriving VB_FRAME as proof the session is live and flip the overlay back
      // on (use-virtual-browser.ts / useVirtualBrowser.ts set active=true on every frame — a
      // deliberate self-healing behaviour for a missed VB_STARTED). So a frame still in flight
      // after VB_STOPPED silently re-opens the VB overlay over the video we just switched to, and
      // since no further VB_STOPPED is ever sent, it stays there.
      //   - capture candidates: the browser must keep running (it IS the growing byte buffer), so
      //     pauseScreencast — which is exactly what the manual-pick path relies on. This case was
      //     missing entirely before, so the overlay came back for the whole rest of the window.
      //   - everything else: stopSession, same as the manual path (roomEvents.handler.ts), which
      //     always stopped the session BEFORE emitting. Matching that order here is the fix.
      if (candidate.url.includes('/vb-capture/')) {
        // Order matters: mark BEFORE the awaits below, so a client reconnecting in between can't
        // catch a snapshot that still advertises a joinable VB (see VBSession.committed).
        markSessionCommitted(roomId);
        await pauseScreencast(roomId).catch((e) => {
          logger.warn('VB auto-commit: failed to pause screencast after commit', { roomId, error: (e as Error).message });
        });
      } else {
        await stopSession(roomId).catch((e) => {
          logger.warn('VB auto-commit: failed to stop session after commit', { roomId, error: (e as Error).message });
        });
      }

      io.to(roomId).emit(SERVER_EVENTS.ROOM_UPDATED, updated);
      // Deliberately NOT 'media_found' — that reason is what makes the frontend open the picker
      // (use-virtual-browser.ts/useVirtualBrowser.ts: `reason === 'media_found' && needsConfirmation`).
      // Any other reason just closes the VB overlay, which is exactly right here since ROOM_UPDATED
      // above already switched everyone to the real player.
      io.to(roomId).emit(SERVER_EVENTS.VB_STOPPED, { reason: 'auto_confirmed' });
      logger.info('VB auto-commit: switched room to real-playback-confirmed candidate without picker', { roomId, videoUrl: videoUrlToUse });
    } catch (e) {
      logger.error('VB auto-commit failed', { roomId, error: (e as Error).message });
    }
  }

  function scheduleAutoCommit(): void {
    // collectionEnded: once the owner has the picker in front of them, the choice is theirs. A
    // capture-kind session keeps its page alive and playing after the window closes, so
    // onRealPlaybackConfirmed can still fire minutes later — without this guard that late signal
    // would auto-commit over whatever the owner had already picked, and tear down the session.
    if (committed || collectionEnded) return;
    if (autoCommitTimer) clearTimeout(autoCommitTimer);
    autoCommitTimer = setTimeout(() => {
      const best = candidates.find((c) => c.confirmed);
      if (best) void commitCandidate(best);
    }, AUTO_COMMIT_DELAY_MS);
  }

  // Same TTL as the candidates themselves — lets vb-media-proxy re-probe this exact page later
  // (possibly hours later, if the room sits on the picker or a viewer joins late) if a candidate
  // it minted has gone stale by then. Set-and-forget — never read back in this file, only by
  // vbMediaProxy.controller.ts's refresh path.
  await redis.setex(REDIS_KEYS.vbSourceUrl(roomId), CANDIDATES_TTL_SEC, url).catch((e) => {
    logger.warn('VB: failed to store source page URL for later refresh', { roomId, error: (e as Error).message });
  });

  await startSession(roomId, ownerId, url, (base64Jpeg) => {
    // Owner only (2026-08-25, Saidazim: "виден только владельцу"). Was io.to(roomId) — every
    // member decoded every 1280x720 JPEG frame just to watch the owner pick a video, multiplying
    // server bandwidth by room size for something non-owners can't even interact with. Every
    // socket already joins `user:${userId}` on connect (watchParty.socket.ts) — reuse that
    // instead of the room broadcast. volatile: a lagging owner client jumps to the latest frame
    // instead of draining a backlog.
    io.to(`user:${ownerId}`).volatile.emit(SERVER_EVENTS.VB_FRAME, { data: base64Jpeg });
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
    // TEST (2026-08-28): the collection window closing naturally means auto-commit didn't get a
    // clean confirmed candidate in time — always fall back to the normal picker from here,
    // regardless of what the auto-commit timer might still be about to do.
    collectionEnded = true;
    if (autoCommitTimer) { clearTimeout(autoCommitTimer); autoCommitTimer = null; }
    if (committed) return;
    void presentCandidates();
  }, (src) => {
    if (src.startsWith('blob:')) {
      mseConfirmed = true;
      candidates.forEach((c, i) => { if (c.url.includes('/vb-capture/')) candidates[i] = { ...c, confirmed: true }; });
      scheduleAutoCommit();
      return;
    }
    confirmedRawUrls.add(src);
    rawUrlByCandidateIndex.forEach((rawUrl, i) => {
      if (rawUrl === src) candidates[i] = { ...candidates[i], confirmed: true };
    });
    scheduleAutoCommit();
  }, (cookieHeader) => {
    // Same TTL/lookup pattern as vbSourceUrl above — read back by vbMediaProxy.controller.ts to
    // replay the session a 'url'-kind candidate turned out to need (see virtualBrowser.service.ts's
    // onSessionCookies doc comment for the uzmovi.net finding this exists for).
    void redis.setex(REDIS_KEYS.vbSessionCookies(roomId), CANDIDATES_TTL_SEC, cookieHeader).catch((e) => {
      logger.warn('VB: failed to store session cookies for later replay', { roomId, error: (e as Error).message });
    });
  }, (reason) => {
    // Best-effort, room-wide (not the requesting socket — this fires from deep inside the async
    // session, long after the original VB_START request/response round-trip is over). Frontend
    // shows a corner badge on the live screencast rather than trying to solve/bypass the challenge.
    io.to(roomId).emit(SERVER_EVENTS.VB_BLOCKED, { reason });
    logger.info('VB: bot challenge detected, notified room', { roomId, reason });
  }, tier);

  io.to(roomId).emit(SERVER_EVENTS.VB_STARTED, { url, width: VB_VIEWPORT.width, height: VB_VIEWPORT.height, ownerId });
}
