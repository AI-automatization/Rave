'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Play, Pause, Maximize, Minimize, Volume2, VolumeX, Volume1, Clapperboard } from 'lucide-react';
import { useWatchPartyStore } from '@/store/watch-party.store';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/hooks/use-toast';
import { trackClick } from '@/lib/analytics';
import { formatDuration } from '@/lib/format-duration';
import { YouTubePlayer } from './YouTubePlayer';
import { VKPlayer } from './VKPlayer';
import { RutubePlayer } from './RutubePlayer';
import { TwitchPlayer } from './TwitchPlayer';
import { VimeoPlayer } from './VimeoPlayer';
import { DailymotionPlayer } from './DailymotionPlayer';
import { TikTokPlayer } from './TikTokPlayer';
import { PeerTubePlayer } from './PeerTubePlayer';
import { TrovoPlayer } from './TrovoPlayer';

// Shared loading visual for every "video not playable yet" moment (initial room load, VB still
// resolving a candidate). Never resolves into a user-facing "Не удалось загрузить видео" — the
// room either gets a VB session moments later or the video changes, so this just keeps looking
// like loading until room state moves on.
// Cycles through playerLoading + playerLoadingCycle1..7 every 2.2s when no explicit `label` is
// given — the caller-supplied cases (e.g. "Открываем виртуальный браузер...") describe a specific
// known state and stay static; only the generic "we don't know exactly what's happening yet, just
// wait" case benefits from rotating through what VB might actually be doing.
const LOADING_CYCLE_KEYS = [
  'playerLoading',
  'playerLoadingCycle1',
  'playerLoadingCycle2',
  'playerLoadingCycle3',
  'playerLoadingCycle4',
  'playerLoadingCycle5',
  'playerLoadingCycle6',
  'playerLoadingCycle7',
  'playerLoadingCycle8',
  'playerLoadingCycle9',
  'playerLoadingCycle10',
  'playerLoadingCycle11',
  'playerLoadingCycle12',
  'playerLoadingCycle13',
] as const;
const LOADING_CYCLE_INTERVAL_MS = 2200;

function useCyclingLoadingLabel(active: boolean): string {
  const t = useTranslations('party');
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!active) return;
    setIndex(0);
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % LOADING_CYCLE_KEYS.length);
    }, LOADING_CYCLE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [active]);
  return t(LOADING_CYCLE_KEYS[index]);
}

function VideoLoading({ label }: { label?: string }) {
  const cyclingLabel = useCyclingLoadingLabel(!label);
  return (
    <div className="aspect-video bg-[#0A0A12] rounded-xl flex flex-col items-center justify-center gap-4">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <span
          className="absolute inset-0 rounded-full animate-ping"
          style={{ background: 'rgba(124,58,237,0.25)', animationDuration: '1.8s' }}
        />
        <span
          className="absolute inset-0 rounded-full"
          style={{ background: 'rgba(124,58,237,0.12)', boxShadow: '0 0 32px rgba(124,58,237,0.35)' }}
        />
        <Loader2 size={26} className="relative animate-spin text-violet-400" />
      </div>
      <p
        key={label ?? cyclingLabel}
        className="text-slate-300 text-lg font-semibold tracking-wide animate-[loadingLabelIn_0.5s_ease-out]"
      >
        {label ?? cyclingLabel}
      </p>
    </div>
  );
}

// Shown to the OWNER when playback has genuinely failed. The silent VB auto-fallback (RoomContent's
// handleVideoFatalError → vbStart) is already running in the background — this used to be the
// owner's ONLY option, a bare "Opening virtual browser..." spinner with no escape hatch if VB also
// comes up empty. The badge gives the owner a direct way to jump straight to the candidate picker
// (same one "Это не то видео" already opens) instead of waiting out a VB session that might not
// find anything either.
function OwnerVideoStuckOverlay({ onPickDifferentVideo }: { onPickDifferentVideo?: () => void }) {
  const t = useTranslations('party');
  return (
    <div className="relative">
      <VideoLoading label={t('playerOpeningVB')} />
      {onPickDifferentVideo && (
        <button
          type="button"
          onClick={() => { trackClick('video:stuck_pick_different'); onPickDifferentVideo(); }}
          className="absolute bottom-4 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-[12px] font-medium text-white/80 backdrop-blur-sm cursor-pointer transition-colors hover:bg-black/85 hover:text-white"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
          {t('playerVideoStuck')} — {t('playerPickAnother')}
        </button>
      )}
    </div>
  );
}

// Shown to a NON-owner viewer when playback has genuinely failed. The owner-only VB auto-fallback
// (RoomContent's handleVideoFatalError → vbStart) is what actually recovers this room — a non-
// owner can never trigger that themselves (vbStart is gated on isOwner), so leaving them on the
// owner-facing "Открываем виртуальный браузер..." VideoLoading state is a dead end: nobody will
// ever open VB on their behalf, and that state only ever clears when videoUrl changes. This overlay
// gives them the same click-to-retry affordance the autoplay-blocked overlay already has — clicking
// it clears `fatalPlaybackError`, which remounts NativeVideoPlayer against the same src and lets the
// owner's meanwhile-arrived VB session (or a transient failure resolving itself) actually surface.
function FatalErrorRetryOverlay({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations('party');
  return (
    <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
      <button
        onClick={onRetry}
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 cursor-pointer group/btn"
        aria-label={t('playerRetryPlayback')}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center transition-all group-hover/btn:scale-110"
          style={{ background: 'rgba(124,58,237,0.85)', boxShadow: '0 0 40px rgba(124,58,237,0.5)' }}
        >
          <Play size={32} className="text-white ml-1.5" fill="white" />
        </div>
        <span className="text-white/60 text-sm font-medium">{t('playerRetryPlayback')}</span>
      </button>
    </div>
  );
}

interface Props {
  onPlay: (time: number) => void;
  onPause: (time: number) => void;
  onSeek: (time: number) => void;
  onHeartbeat: (time: number, frame?: string) => void;
  onBufferStart: () => void;
  onBufferEnd: () => void;
  /** Real playback failure (not just autoplay needing a click) on the generic extract+proxy path
   * — owner-only VB auto-fallback lives in the caller (RoomContent), mirroring mobile's
   * UniversalPlayer → WatchPartyScreen `onFatalError` chain. Official embeds (YouTube/VK/Twitch/
   * etc.) don't report through this — they're not part of the extraction-vs-playback gap this
   * closes, same scope mobile's version has. */
  onFatalError?: () => void;
  /** Owner-only escape hatch shown alongside the fatal-error "Opening virtual browser..." state —
   * opens the same video-candidate picker as RoomHeader's "Это не то видео" menu item, so the
   * owner isn't stuck waiting on a VB session that might not find anything either. */
  onPickDifferentVideo?: () => void;
  /** True while at least one voice-chat participant is speaking — ducks the video's volume down
   * so the voice call and video audio don't compete. Threaded down to NativeVideoPlayer only;
   * official embeds (YouTube/etc.) don't expose volume control across the iframe boundary. */
  duckAudio?: boolean;
}

// Mirrors mobile's extractYouTubeVideoId (apps/mobile/src/utils/videoPlayer.ts): matches `v=`
// anywhere in the query string, not just as the literal first param after "watch?" — a share
// link with another param first (e.g. "?list=...&v=..." from a playlist, or "?si=...&v=...")
// made the old anchored regex fail entirely, silently falling through to generic CDN extraction
// (never meant for YouTube) and spinning forever instead of rendering the YouTube player.
function getYouTubeId(url: string): string | null {
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];
  const embedMatch = url.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  return null;
}

// Mirrors mobile's extractTwitchId (apps/mobile/src/components/video/WebViewAdapters.ts) —
// twitch.tv/videos/{id} is a VOD, twitch.tv/{channel} is a live channel.
function getTwitchIds(url: string): { id: string; type: 'channel' | 'vod' } | null {
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.replace(/^www\./, '');
    if (host !== 'twitch.tv') return null;
    const vodMatch = pathname.match(/^\/videos\/(\d+)/);
    if (vodMatch) return { id: vodMatch[1], type: 'vod' };
    const channelMatch = pathname.match(/^\/([a-zA-Z0-9_]+)\/?$/);
    if (channelMatch && !['videos', 'directory', 'p', 'settings'].includes(channelMatch[1])) {
      return { id: channelMatch[1], type: 'channel' };
    }
    return null;
  } catch {
    return null;
  }
}

// Mirrors mobile's extractVimeoId (apps/mobile/src/components/video/WebViewAdapters.ts).
function getVimeoId(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.replace(/^www\./, '');
    if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null;
    const match = pathname.match(/\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Mirrors mobile's extractDailymotionId (apps/mobile/src/components/video/WebViewAdapters.ts).
function getDailymotionId(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.replace(/^www\./, '');
    if (!host.includes('dailymotion.com') && host !== 'dai.ly') return null;
    const match = pathname.match(/\/(?:video\/|embed\/video\/)?([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// TikTok video IDs are the numeric id in /video/{id} or /player/v1/{id} paths.
function getTikTokId(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.replace(/^www\./, '');
    if (!host.includes('tiktok.com')) return null;
    const match = pathname.match(/\/(?:video|player\/v1)\/(\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// PeerTube is federated — any domain can run an instance, so detection is by URL PATH shape
// (/videos/watch/{uuid} or /w/{shortId}), not by a fixed hostname. This is a heuristic: some
// other, unrelated site could theoretically share this exact path pattern, but it's specific
// enough in practice (real UUID or PeerTube's base58-style short-ID format) to be reliable.
function getPeerTubeIds(url: string): { instance: string; videoId: string } | null {
  try {
    const { hostname, pathname } = new URL(url);
    const watchMatch = pathname.match(/\/videos\/watch\/([0-9a-f-]{36})/i);
    if (watchMatch) return { instance: hostname, videoId: watchMatch[1] };
    const shortMatch = pathname.match(/\/w\/([a-zA-Z0-9]{22})$/);
    if (shortMatch) return { instance: hostname, videoId: shortMatch[1] };
    return null;
  } catch {
    return null;
  }
}

// Trovo channel URL: trovo.live/{streamername} (or /s/{streamername} for some share links).
function getTrovoStreamername(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.replace(/^www\./, '');
    if (host !== 'trovo.live') return null;
    const match = pathname.match(/^\/(?:s\/)?([a-zA-Z0-9_]+)\/?$/);
    if (match && !['video', 'clip', 'discover', 'search'].includes(match[1])) return match[1];
    return null;
  } catch {
    return null;
  }
}

// Mirrors mobile's extractVKVideoIds (apps/mobile/src/components/video/WebViewAdapters.ts) —
// supports both the path form (vk.com/video-12345_67890) and the share-link query form
// (?z=video-12345_67890...).
function getVKVideoIds(url: string): { ownerId: string; videoId: string } | null {
  try {
    const { hostname, pathname, searchParams } = new URL(url);
    const host = hostname.replace(/^(www\.|m\.)/, '');
    if (host !== 'vk.com' && host !== 'vkvideo.ru') return null;
    const rawId =
      searchParams.get('z')?.replace(/^video/, '') ??
      pathname.match(/\/video(-?\d+_\d+)/)?.[1] ??
      null;
    if (!rawId) return null;
    const parts = rawId.split('_');
    if (parts.length !== 2) return null;
    return { ownerId: parts[0], videoId: parts[1] };
  } catch {
    return null;
  }
}

// Mirrors mobile's extractRutubeId (apps/mobile/src/components/video/WebViewAdapters.ts).
function getRutubeVideoId(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.replace(/^www\./, '');
    if (host !== 'rutube.ru') return null;
    const match = pathname.match(/\/(?:video|play\/embed)\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// bl.rutube.ru signs its HLS URLs to an IP — confirmed live 2026-08-02 (real VB catch, watch-party
// service logs) that our own proxy-stream (running on app-web) gets a 403 fetching it, while
// content-service's existing hls-proxy (services/content/src/controllers/hlsProxy.controller.ts —
// SSRF-guarded, DNS-rebinding-protected, already used for the mobile HLS path) fetches the exact
// same URL fine — verified with a direct curl test against both before writing this. Whatever
// Rutube's lock actually keys on, content-service's proxy already satisfies it and app-web's
// doesn't; route through the proven one instead of debugging app-web's from scratch.
const IP_LOCKED_CDN_HOSTS = [/(^|\.)rutube\.ru$/i];

function isIpLockedCdn(cdnUrl: string): boolean {
  try {
    const host = new URL(cdnUrl).hostname;
    return IP_LOCKED_CDN_HOSTS.some((re) => re.test(host));
  } catch {
    return false;
  }
}

// Real prod case 2026-08-10: a confirmed VB candidate is already one of OUR OWN resolved
// endpoints (vb-media-proxy's signed passthrough, or vb-capture's raw buffer — see
// roomEvents.handler.ts's isOwnVbUrl, the server-side twin of this check) — wrapping it through
// content-service's extraction/proxy-stream AGAIN is nonsensical (it's not a page to scrape, and
// double-proxying an already-proxied, already-signed URL just adds a failure-prone extra hop) and
// was the direct cause of a confirmed candidate never actually playing in the room: the client-side
// extraction path this component used to have (removed 2026-08-19, see directSrc below) had no
// exclusion for this, so every VB url got POSTed to /api/content/extract as if it were a raw page,
// which 502s (it isn't one). Path-only match
// (not the full vbStreamPublicUrl host) since the client bundle has no reliable access to that
// server-side env value, and the path segment alone is already an unambiguous signature — nothing
// else in the app ever mints a URL containing it.
function isOwnVbMediaUrl(url: string): boolean {
  return url.includes('/api/v1/watch-party/vb-media-proxy/')
      || url.includes('/api/v1/watch-party/vb-capture/')
      // Same twin check as roomEvents.handler.ts's isOwnVbUrl (server-side) — a confirmed mp4
      // candidate can now point at the Bunny Edge Script fetch path instead of this service's own
      // vb-media-proxy route (vbSession.helper.ts's proxiedMediaUrl, VB_EDGE_FETCH_URL).
      || url.includes('/vb-edge-fetch');
}

// Exported for VideoCandidatePicker.tsx's preview — a candidate.url (whether a raw CDN url from
// content-service's extraction, or our own watch-party service's vb-capture/vb-media-proxy) is a
// cross-origin request from the browser's point of view, same as room.videoUrl always is. Reusing
// this instead of setting candidate.url directly on <video src> avoids a CORS failure identical to
// what this function already exists to solve for the main player.
export async function buildProxyUrl(cdnUrl: string, headers?: Record<string, string>): Promise<string> {
  if (isOwnVbMediaUrl(cdnUrl)) return cdnUrl;
  if (isIpLockedCdn(cdnUrl)) {
    const contentBase = process.env.NEXT_PUBLIC_CONTENT_SERVICE_URL;
    if (contentBase) {
      try {
        const res = await fetch('/api/auth/token', { credentials: 'include' });
        const data = (await res.json()) as { data?: { token?: string } };
        const token = data.data?.token;
        if (token) {
          return `${contentBase}/hls-proxy?url=${encodeURIComponent(cdnUrl)}&referer=${encodeURIComponent(cdnUrl)}&token=${encodeURIComponent(token)}`;
        }
      } catch {
        // Fall through to the normal proxy below rather than leave the player with no src at all.
      }
    }
  }
  const h = headers ? encodeURIComponent(JSON.stringify(headers)) : '';
  return `/api/content/proxy-stream?url=${encodeURIComponent(cdnUrl)}&h=${h}`;
}

interface CaptureMseResult {
  mediaSource: MediaSource;
  objectUrl: string;
  /** Stops all background tail-fetch loops (one or two, single- vs dual-track). Idempotent. Does
   * NOT touch mediaSource/objectUrl lifecycle — the caller (the effect's own cleanup) owns
   * revoking/ending those, since it's the one that created them and may want to do so in a
   * specific order relative to other cleanup. */
  teardown: () => void;
}

async function probeCodecs(url: string): Promise<{ codecs: string | null; tracks: string[] }> {
  // A tiny range, not a HEAD — vbCapture.controller.ts only sets X-Vb-Codecs/X-Vb-Tracks on the
  // same stream()/streamTrack() handler a real playback request hits; a HEAD isn't guaranteed to
  // run the same path depending on how far up the stack (Bunny, Railway's edge) something might
  // intercept it.
  const res = await fetch(url, { headers: { Range: 'bytes=0-0' } });
  const tracksHeader = res.headers.get('X-Vb-Tracks');
  return {
    codecs: res.headers.get('X-Vb-Codecs'),
    tracks: tracksHeader ? tracksHeader.split(',').map((t) => t.trim()).filter(Boolean) : [],
  };
}

// Repeatedly range-fetches `url` from wherever it left off and appends each new chunk to
// `sourceBuffer`, serialized through `updateend` (never calls appendBuffer while `.updating` is
// true). One instance of this loop per SourceBuffer — single-track capture runs one, dual-track
// (see vbCapture.service.ts) runs two independently, one per track URL.
function runCaptureTailPump(
  video: HTMLVideoElement,
  url: string,
  sourceBuffer: SourceBuffer,
  cb: { onFatal: () => void; onFirstAppend: () => void; isCancelled: () => boolean },
): () => void {
  let stopped = false;
  const appendQueue: Uint8Array[] = [];
  let appending = false;
  let readySignaled = false;

  function pump() {
    if (stopped || appending || sourceBuffer.updating || appendQueue.length === 0) return;
    const chunk = appendQueue.shift();
    if (!chunk) return;
    appending = true;
    try {
      // fetch's ReadableStream reader types chunks as Uint8Array<ArrayBufferLike> (DOM lib allows
      // a SharedArrayBuffer-backed view in principle); appendBuffer wants ArrayBuffer specifically.
      // Never actually SharedArrayBuffer-backed at runtime here — plain type-level mismatch.
      sourceBuffer.appendBuffer(chunk as BufferSource);
    } catch (e) {
      appending = false;
      // Real, expected failure mode for a long-running capture: the buffered range grows
      // unbounded otherwise. Trim everything more than 30s behind the current playback position
      // and let the next tail-fetch cycle re-queue naturally — remove() itself fires its own
      // updateend, which re-triggers pump() via the listener below.
      if (e instanceof DOMException && e.name === 'QuotaExceededError' && video.currentTime > 30) {
        try { sourceBuffer.remove(0, video.currentTime - 30); } catch { /* already removing */ }
      }
    }
  }

  sourceBuffer.addEventListener('updateend', () => {
    appending = false;
    if (!readySignaled) { readySignaled = true; cb.onFirstAppend(); }
    pump();
  });

  const POLL_MS = 1000;
  let position = 0;

  void (async () => {
    while (!stopped && !cb.isCancelled()) {
      let res: Response;
      try {
        res = await fetch(url, { headers: { Range: `bytes=${position}-` } });
      } catch {
        await new Promise((r) => setTimeout(r, POLL_MS));
        continue;
      }
      if (stopped || cb.isCancelled()) return;
      if (!res.ok || !res.body) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        continue;
      }
      // vbCapture.controller.ts clamps `start` down to `totalBytes - 1` when asked for a range
      // that doesn't exist YET (no new bytes since the last poll) rather than hanging the
      // request — that response re-serves already-appended bytes, not new ones. Content-Range's
      // own reported start is the ground truth for what actually came back; only trust the body
      // as new data when it matches what was requested.
      const contentRange = res.headers.get('Content-Range');
      const rangeStart = contentRange ? Number(/bytes (\d+)-/.exec(contentRange)?.[1]) : position;
      const isStaleReplay = Number.isFinite(rangeStart) && rangeStart < position;

      const reader = res.body.getReader();
      let gotNewBytes = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (stopped || cb.isCancelled()) { void reader.cancel(); return; }
        if (value && value.length > 0 && !isStaleReplay) {
          gotNewBytes = true;
          position += value.length;
          appendQueue.push(value);
          pump();
        }
      }
      if (!gotNewBytes) await new Promise((r) => setTimeout(r, POLL_MS));
    }
  })();

  return () => { stopped = true; };
}

// VB capture (categories B/C, vbCapture.service.ts) is a live-growing raw fMP4 byte stream with
// no independently-fetchable URL of its own — see that file's own header comment. A plain
// `video.src = captureUrl` works on Safari but not Chrome (confirmed live 2026-08-14: native
// MEDIA_ERR_SRC_NOT_SUPPORTED, "Format error" — Chrome's progressive-download prober won't commit
// to a format for a resource whose total size changes between requests the way this one does).
// This feeds the same bytes to a MediaSource/SourceBuffer instead, which works identically on
// every browser since the caller (not the browser's own guesswork) controls exactly what gets
// decoded and when.
//
// Dual-track (2026-08-14): some sources feed the source page's player through TWO independent
// SourceBuffers (separate video/audio), which the ORIGINAL single combined vb-capture buffer
// stores interleaved — not a valid single MP4 stream. vbCapture.service.ts's per-track buffers
// (X-Vb-Tracks header, /vb-capture/:roomId/:track endpoints) give each track its own clean byte
// stream; when both are available this creates TWO real SourceBuffers instead of one. Falls back
// to the original single-buffer path when only the combined buffer exists (X-Vb-Tracks absent —
// WebSocket-sourced captures, or a page using only one SourceBuffer to begin with).
//
// Returns null if MSE playback isn't attemptable for any reason (no MediaSource support, no/
// unrecognized codec from the server — see mp4CodecSniff.service.ts's own contract for when that
// happens, unsupported by THIS browser's MSE implementation, or the initial probe request
// failed) — the caller's contract is: null means "fall back to plain video.src", never worse than
// not having this at all.
async function setupCaptureMse(
  video: HTMLVideoElement,
  src: string,
  cb: { onFatal: () => void; onReady: () => void; isCancelled: () => boolean },
): Promise<CaptureMseResult | null> {
  if (typeof MediaSource === 'undefined') return null;

  let probe: { codecs: string | null; tracks: string[] };
  try {
    probe = await probeCodecs(src);
  } catch {
    return null;
  }
  if (cb.isCancelled()) return null;

  const dualTrack = probe.tracks.includes('video') && probe.tracks.includes('audio');

  // Dual-track setup: probe each track's own endpoint for its own codec, verify both are usable
  // BEFORE creating anything — same all-or-nothing contract as the single-buffer path, just
  // checked twice. Any failure here falls through to the single-buffer attempt below rather than
  // giving up outright, since the combined buffer might still work fine on its own.
  if (dualTrack && !cb.isCancelled()) {
    try {
      const [videoProbe, audioProbe] = await Promise.all([
        probeCodecs(`${src}/video`),
        probeCodecs(`${src}/audio`),
      ]);
      const videoMime = videoProbe.codecs ? `video/mp4; codecs="${videoProbe.codecs}"` : null;
      const audioMime = audioProbe.codecs ? `audio/mp4; codecs="${audioProbe.codecs}"` : null;
      if (
        videoMime && audioMime && !cb.isCancelled()
        && MediaSource.isTypeSupported(videoMime) && MediaSource.isTypeSupported(audioMime)
      ) {
        const mediaSource = new MediaSource();
        const objectUrl = URL.createObjectURL(mediaSource);
        video.src = objectUrl;

        await new Promise<void>((resolve) => {
          mediaSource.addEventListener('sourceopen', () => resolve(), { once: true });
        });
        if (!cb.isCancelled() && mediaSource.readyState === 'open') {
          let videoBuffer: SourceBuffer;
          let audioBuffer: SourceBuffer;
          try {
            videoBuffer = mediaSource.addSourceBuffer(videoMime);
            audioBuffer = mediaSource.addSourceBuffer(audioMime);
          } catch {
            // isTypeSupported passing isn't a 100% guarantee the browser will actually accept the
            // string in addSourceBuffer (same caveat the single-buffer path below already notes).
            // This MediaSource/objectUrl were never handed off to a running pump — nothing to stop,
            // just release the blob URL before falling through to the single-buffer attempt, which
            // creates its own fresh MediaSource and overwrites video.src again.
            URL.revokeObjectURL(objectUrl);
            throw new Error('dual-track addSourceBuffer rejected');
          }
          // Only one onReady() call regardless of which track's first chunk lands first —
          // attemptOwnerAutoplay only needs to fire once.
          let readyFired = false;
          const fireReadyOnce = () => { if (!readyFired) { readyFired = true; cb.onReady(); } };
          const stopVideo = runCaptureTailPump(video, `${src}/video`, videoBuffer, { onFatal: cb.onFatal, onFirstAppend: fireReadyOnce, isCancelled: cb.isCancelled });
          const stopAudio = runCaptureTailPump(video, `${src}/audio`, audioBuffer, { onFatal: cb.onFatal, onFirstAppend: fireReadyOnce, isCancelled: cb.isCancelled });
          return { mediaSource, objectUrl, teardown: () => { stopVideo(); stopAudio(); } };
        }
        // Cancelled or the source closed itself while awaiting sourceopen — still return a real
        // result so the caller's cleanup can revoke/close it, matching the single-buffer path.
        return { mediaSource, objectUrl, teardown: () => {} };
      }
    } catch {
      // Either the per-track probe fetch failed outright, or addSourceBuffer rejected the sniffed
      // codec (its own catch above already released the objectUrl before rethrowing into here) —
      // either way, fall through to the single-buffer attempt below.
    }
  }

  if (cb.isCancelled()) return null;
  const codecs = probe.codecs;
  if (!codecs) return null;

  const mimeType = `video/mp4; codecs="${codecs}"`;
  if (!MediaSource.isTypeSupported(mimeType)) return null;

  const mediaSource = new MediaSource();
  const objectUrl = URL.createObjectURL(mediaSource);
  video.src = objectUrl;

  await new Promise<void>((resolve) => {
    mediaSource.addEventListener('sourceopen', () => resolve(), { once: true });
  });
  if (cb.isCancelled() || mediaSource.readyState !== 'open') return { mediaSource, objectUrl, teardown: () => {} };

  let sourceBuffer: SourceBuffer;
  try {
    sourceBuffer = mediaSource.addSourceBuffer(mimeType);
  } catch {
    // Codec string parsed as valid MIME but the browser's MSE implementation still rejected it
    // outright (rare, but isTypeSupported isn't a 100% guarantee across all engines) — this is
    // past the point where falling back to plain video.src still makes sense (video.src is
    // already the blob: URL), so treat it as a genuine playback failure instead.
    cb.onFatal();
    return { mediaSource, objectUrl, teardown: () => {} };
  }

  const stop = runCaptureTailPump(video, src, sourceBuffer, { onFatal: cb.onFatal, onFirstAppend: cb.onReady, isCancelled: cb.isCancelled });
  return { mediaSource, objectUrl, teardown: stop };
}

// iOS (every browser engine on it — Chrome/Firefox/Edge for iOS are all WebKit under the hood)
// hard-ignores `HTMLMediaElement.volume` assignments: Apple restricts in-page volume control to
// the hardware buttons only, by design. A custom volume slider silently does nothing there —
// confirmed via real-device test (2026-07-27). `mute`/`muted`, unlike `.volume`, IS respected by
// iOS, so that control still works and stays. iPadOS 13+ reports as desktop Safari but carries the
// same restriction — maxTouchPoints is the standard way to tell it apart from a real Mac.
// `video.play()` rejects for two very different reasons that were previously treated as the same
// thing (both just set `autoplayBlocked`, showing a "Нажмите чтобы начать" button): the browser's
// autoplay policy withholding playback until a real user gesture (NotAllowedError — genuinely
// fixed by a click), vs the source actually being unplayable (NotSupportedError, NetworkError, or
// anything else — clicking again just replays the exact same failure). Real report 2026-08-03/04:
// the click-to-start button "hangs and doesn't respond" — it WAS responding, just retrying a
// doomed play() call and landing back on the identical overlay every time, indistinguishable from
// broken. AbortError isn't a failure at all (play() interrupted by a rapid pause) — call sites
// filter it out before reaching this.
function isAutoplayPolicyError(e: unknown): boolean {
  return (e as DOMException)?.name === 'NotAllowedError';
}

function isVolumeSliderUnusable(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

// Must use noop () => {} handlers — null reverts to browser defaults (shows OS player).
// Empty handlers tell the OS "app handles media itself → no system UI needed".
const MEDIA_ACTIONS: MediaSessionAction[] = [
  'play', 'pause', 'seekto', 'seekbackward', 'seekforward',
  'previoustrack', 'nexttrack', 'stop',
];
const noop = () => {};

function suppressMacOsPlayer() {
  if (typeof navigator === 'undefined') return;
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = 'none';
    for (const action of MEDIA_ACTIONS) {
      try { navigator.mediaSession.setActionHandler(action, noop); } catch { /* unsupported */ }
    }
  }
}

// ── Custom video player — no native controls ───────────────────────────────────
// Using native `controls` attribute triggers: macOS AirPlay/PiP buttons, Android Chrome
// built-in controls, and macOS "Now Playing" HUD. Custom controls avoid all of this.

interface NativeProps {
  src: string;
  isHls: boolean;
  isDash: boolean;
  poster?: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  autoplayBlocked: boolean;
  isOwner: boolean;
  startPosition?: number; // seek here immediately on load (join late → skip to owner position)
  onPlay: () => void;
  onPause: () => void;
  onSeeked: () => void;
  onBufferStart: () => void;
  onBufferEnd: () => void;
  onOverlayClick: () => void;
  onAutoplayBlocked: () => void;
  /** Fires once when playback has genuinely failed (native `<video>` error, or an HLS.js fatal
   * error network/media recovery couldn't fix) — distinct from `autoplayBlocked`, which just
   * needs a click, not a different source. Mirrors mobile's UniversalPlayer `onFatalError`; the
   * caller (RoomContent) decides what to do with it (owner-only VB fallback). */
  onFatalError?: () => void;
  /** True while at least one voice-chat participant is speaking — ducks video volume down so the
   * two audio sources don't compete. See userVolumeRef/isDuckedRef comment above `volume` state. */
  duckAudio?: boolean;
}

function NativeVideoPlayer({
  src,
  isHls,
  isDash,
  poster,
  videoRef,
  autoplayBlocked,
  isOwner,
  startPosition,
  onPlay,
  onPause,
  onSeeked,
  onBufferStart,
  onBufferEnd,
  onOverlayClick,
  onAutoplayBlocked,
  onFatalError,
  duckAudio,
}: NativeProps) {
  const t = useTranslations('party');
  const hlsRef = useRef<import('hls.js').default | null>(null);
  const dashRef = useRef<import('dashjs').MediaPlayerClass | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Ref so the HLS/DASH-setup effect (deps: [src, isHls, isDash, videoRef]) always calls the CURRENT
  // onFatalError without needing it in that dependency array (it's an inline arrow from the
  // parent on every render — adding it directly would tear down/rebuild the whole HLS session
  // every render).
  const onFatalErrorRef = useRef(onFatalError);
  onFatalErrorRef.current = onFatalError;
  // Guards against firing twice for the same fatal event (native `error` event AND a
  // still-pending HLS fatal-error callback could both land for the same underlying failure).
  const fatalFiredRef = useRef(false);
  // One silent same-URL retry before actually escalating to onFatalError (which triggers the
  // owner-only VB restart). Real prod pattern confirmed live 2026-08-04, twice, on unrelated
  // sources (rutube HLS, fayllar1.ru mp4): a freshly-signed vb-media-proxy URL 403s on its very
  // first fetch, then succeeds every time on a manual replay seconds later — the HMAC signature
  // itself is provably correct both times (recomputed against the real secret, matched), so
  // whatever causes it isn't a logic bug, it's transient. A VB restart is expensive (relaunches a
  // whole headless browser) for something a plain reload usually clears on its own.
  const retriedRef = useRef(false);
  // Real prod pattern confirmed live 2026-08-11 (yummyani.me): a decode/parse error on a fresh
  // capture-buffer src can fire both the native `error` event AND the retry's own reload failure
  // within ~1s of the src being set — reportFatal's one retry above still only spans that same
  // ~1s, nowhere near enough time for a still-filling capture buffer or a slow CDN to prove itself.
  // The result was 3 owner-facing media switches in 12 seconds (vb-capture → vb-media-proxy →
  // vb-media-proxy again), each one pre-empting the last before it had a real chance to buffer —
  // the video never had a stable few seconds to actually start. Enforcing a floor on how soon
  // escalation can happen (independent of the retry count) fixes that regardless of which layer
  // is timing out — this is a UX/pacing floor, not a fix for whatever the underlying decode/CDN
  // issue is.
  const srcSetAtRef = useRef(0);
  const escalateTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const MIN_PLAYBACK_ATTEMPT_MS = 4000;
  useEffect(() => {
    fatalFiredRef.current = false;
    retriedRef.current = false;
    srcSetAtRef.current = Date.now();
    clearTimeout(escalateTimerRef.current);
  }, [src]);
  useEffect(() => () => clearTimeout(escalateTimerRef.current), []);
  const reportFatal = () => {
    if (fatalFiredRef.current) return;
    if (!retriedRef.current) {
      retriedRef.current = true;
      const video = videoRef.current;
      if (video && src) {
        if (hlsRef.current) hlsRef.current.loadSource(src);
        else if (dashRef.current) dashRef.current.attachSource(src);
        else video.src = src;
        attemptOwnerAutoplay(video);
      }
      return; // give the retry a chance — a second fatal signal falls through to the branch below
    }
    fatalFiredRef.current = true;
    const elapsed = Date.now() - srcSetAtRef.current;
    const remaining = MIN_PLAYBACK_ATTEMPT_MS - elapsed;
    if (remaining > 0) {
      escalateTimerRef.current = setTimeout(() => onFatalErrorRef.current?.(), remaining);
    } else {
      onFatalErrorRef.current?.();
    }
  };

  const [isPaused, setIsPaused] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  // Voice ducking — lower the video's volume while someone is talking in the room's voice chat,
  // so the two audio sources don't compete. `video.volume` writes fire the native `volumechange`
  // event (see onVolChange below), which normally mirrors INTO `volume` state to keep the slider
  // in sync with genuine user changes — without `userVolumeRef` + `isDuckedRef` guarding it, the
  // ramped-down values a duck animation writes would corrupt that state, and the next duck/undock
  // cycle would ramp relative to an already-ducked "user" volume instead of their real preference.
  // iOS Safari ignores `.volume` entirely (see volumeSliderUnusable below) — this silently no-ops
  // there rather than needing its own platform check.
  const DUCK_FACTOR = 0.35;
  const DUCK_RAMP_MS = 250;
  const userVolumeRef = useRef(1);
  const isDuckedRef = useRef(false);
  const duckRafRef = useRef<number | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // True from the moment a new src is handed to us until the browser actually has enough data
  // to play — without this, a fresh video (e.g. right after the VB handoff) just sits on a black
  // frame at 0:00 with no feedback while the browser silently buffers, reading as "broken".
  const [isBuffering, setIsBuffering] = useState(true);
  const bufferingLabel = useCyclingLoadingLabel(isBuffering);
  // "Плохой интернет" badge — a SINGLE rebuffer is normal (seek, a fresh src, a brief stall) and
  // already covered by the full-screen buffering spinner above; this is about a PATTERN of them,
  // which is what actually signals a bad connection rather than a one-off blip. Tracks rebuffer
  // timestamps in a sliding window; crossing the threshold shows a small persistent badge (not
  // gated on `isBuffering` itself, since the point is "you may keep having problems", not just
  // "buffering right now") that clears itself after a cooldown once rebuffers stop recurring.
  const REBUFFER_WINDOW_MS = 30_000;
  const REBUFFER_THRESHOLD = 3;
  const POOR_CONNECTION_COOLDOWN_MS = 20_000;
  const rebufferTimestampsRef = useRef<number[]>([]);
  const poorConnectionClearTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [poorConnection, setPoorConnection] = useState(false);
  // Starts false (assume controllable) so SSR/first client render match — corrected right after
  // mount, before the user could plausibly touch the slider.
  const [volumeSliderUnusable, setVolumeSliderUnusable] = useState(false);
  useEffect(() => { setVolumeSliderUnusable(isVolumeSliderUnusable()); }, []);

  // Fresh src → back to "loading", until canplay/playing says otherwise (mirror-state effect below).
  // Also resets the rebuffer-frequency tracker — a new source (video change, VB handoff) starting
  // slow isn't evidence of a bad connection, it's just a cold start.
  useEffect(() => {
    setIsBuffering(true);
    rebufferTimestampsRef.current = [];
    setPoorConnection(false);
    clearTimeout(poorConnectionClearTimerRef.current);
  }, [src]);
  useEffect(() => () => clearTimeout(poorConnectionClearTimerRef.current), []);

  // Only the owner's own action should decide whether the room starts playing — members follow
  // via the sync effect below once the owner's play event round-trips through the server. A
  // recent real click (VB's own play button, or the room's play button) counts as user activation
  // for autoplay purposes in every mainstream browser, so this reliably succeeds; the existing
  // autoplayBlocked overlay is the fallback for the rare case a browser still refuses it.
  function attemptOwnerAutoplay(video: HTMLVideoElement) {
    if (!isOwner) return;
    video.play().catch((e: unknown) => {
      // AbortError = play() interrupted by a near-simultaneous pause() (e.g. the room-sync
      // effect deciding the actual state is paused right as this fires) — not a real failure.
      // Missing here (2026-08-04) sent every such race straight to reportFatal(), which
      // triggers the owner-only VB fallback — real prod symptom: sources that played fine
      // immediately re-triggered a VB restart on nearly every load.
      if ((e as DOMException)?.name === 'AbortError') return;
      if (isAutoplayPolicyError(e)) onAutoplayBlocked();
      else reportFatal();
    });
  }

  // HLS/DASH setup + macOS suppression
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    suppressMacOsPlayer();

    // VB capture (categories B/C — a live-growing raw fMP4 byte stream, not a real independently-
    // fetchable URL, see vbCapture.service.ts) played fine on Safari via a plain `video.src = src`
    // but failed on Chrome with a native MEDIA_ERR_SRC_NOT_SUPPORTED ("Format error") — confirmed
    // live 2026-08-14. Root cause: Chrome's own progressive-download prober won't commit to a
    // format for a resource whose total size (and exact byte availability) changes between
    // requests the way this one does; Safari's happens to be more forgiving of that. Real fix is
    // to hand Chrome (and everyone else, it works cross-browser) the bytes explicitly via
    // MediaSource Extensions instead of letting the browser's own prober guess. Falls straight
    // through to the existing plain-`video.src` path below on ANY failure (missing/unrecognized
    // codec header, MSE unsupported, fetch error) — never worse than before this existed, just not
    // improved for whatever edge case tripped the fallback.
    if (src.includes('/vb-capture/')) {
      let cancelled = false;
      let mediaSource: MediaSource | null = null;
      let objectUrl: string | null = null;
      void setupCaptureMse(video, src, {
        onFatal: reportFatal,
        onReady: () => { suppressMacOsPlayer(); attemptOwnerAutoplay(video); },
        isCancelled: () => cancelled,
      }).then((result) => {
        if (cancelled) { result?.teardown(); return; }
        if (result) {
          mediaSource = result.mediaSource;
          objectUrl = result.objectUrl;
        } else {
          // MSE setup declined (see setupCaptureMse's own contract) — fall back exactly like the
          // plain-src branch below does for every other source type.
          video.src = src;
          attemptOwnerAutoplay(video);
        }
      });
      video.addEventListener('play', suppressMacOsPlayer, { passive: true });

      return () => {
        cancelled = true;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        if (mediaSource && mediaSource.readyState === 'open') {
          try { mediaSource.endOfStream(); } catch { /* already closed */ }
        }
      };
    }

    if (isDash) {
      import('dashjs').then((dashjs) => {
        dashRef.current?.reset();
        const player = dashjs.MediaPlayer().create();
        dashRef.current = player;
        player.initialize(video, src, false);
        if (startPosition && startPosition > 0.5) {
          player.on(dashjs.MediaPlayer.events.CAN_PLAY, () => {
            if (Math.abs(video.currentTime - startPosition) > 0.3) video.currentTime = startPosition;
          }, undefined, { once: true });
        }
        player.on(dashjs.MediaPlayer.events.CAN_PLAY, () => {
          suppressMacOsPlayer();
          attemptOwnerAutoplay(video);
        });
        // dash.js doesn't expose hls.js's fatal/non-fatal split — any ERROR here means playback
        // genuinely can't continue (dash.js already retries recoverable network hiccups
        // internally without emitting this event), same "give up" signal reportFatal expects.
        player.on(dashjs.MediaPlayer.events.ERROR, () => { reportFatal(); });
        video.addEventListener('play', suppressMacOsPlayer, { passive: true });
      }).catch(() => { video.src = src; attemptOwnerAutoplay(video); });

      return () => {
        dashRef.current?.reset();
        dashRef.current = null;
      };
    }

    if (!isHls || video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS or plain MP4 — seek after metadata loads
      video.src = src;
      if (startPosition && startPosition > 0.5) {
        video.addEventListener('loadedmetadata', () => {
          if (Math.abs(video.currentTime - startPosition) > 0.3) video.currentTime = startPosition;
        }, { once: true });
      }
      video.addEventListener('play', suppressMacOsPlayer, { passive: true });
      attemptOwnerAutoplay(video);
      return;
    }

    import('hls.js').then(({ default: Hls }) => {
      if (!Hls.isSupported()) { video.src = src; attemptOwnerAutoplay(video); return; }
      hlsRef.current?.destroy();
      // startPosition in config tells HLS.js to buffer segments from owner's
      // current position instead of from 0 — crucial when joining mid-playback
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        startPosition: (startPosition && startPosition > 0.5) ? startPosition : -1,
        maxBufferLength: 8,      // fire canplay after 8s buffered, not default 30s
        maxMaxBufferLength: 30,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.once(Hls.Events.MANIFEST_PARSED, () => {
        suppressMacOsPlayer();
        attemptOwnerAutoplay(video);
      });
      // hls.js has its own retry/recovery ladder for non-fatal errors (segment stalls, etc.) —
      // only a `fatal` error means it's given up, which is the actual "video didn't load" signal.
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) reportFatal();
      });
      video.addEventListener('play', suppressMacOsPlayer, { passive: true });
    }).catch(() => { video.src = src; attemptOwnerAutoplay(video); });

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src, isHls, isDash, videoRef]);

  // Mirror video state for custom controls UI
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlayEvt = () => setIsPaused(false);
    const onPauseEvt = () => {
      setIsPaused(true);
      // Keep HLS.js loading even when paused so segments are ready on resume.
      // Without this, democratic pause (sync-effect video.pause) stops HLS loading,
      // canplay never fires, BUFFER_END is never sent, and 30s safety timeout loops.
      if (hlsRef.current) hlsRef.current.startLoad();
    };
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onMeta = () => { if (isFinite(video.duration)) setDuration(video.duration); };
    const onVolChange = () => {
      // Skip mirroring while a duck ramp is actively writing — those are ours, not the user's,
      // and would otherwise corrupt the slider's displayed value (see userVolumeRef comment above).
      if (isDuckedRef.current) { setIsMuted(video.muted); return; }
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    const onWaitingEvt = () => {
      setIsBuffering(true);
      const now = Date.now();
      const recent = rebufferTimestampsRef.current.filter((ts) => now - ts < REBUFFER_WINDOW_MS);
      recent.push(now);
      rebufferTimestampsRef.current = recent;
      if (recent.length >= REBUFFER_THRESHOLD) {
        setPoorConnection(true);
        clearTimeout(poorConnectionClearTimerRef.current);
        poorConnectionClearTimerRef.current = setTimeout(() => setPoorConnection(false), POOR_CONNECTION_COOLDOWN_MS);
      }
    };
    const onReadyEvt = () => setIsBuffering(false);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    video.addEventListener('play', onPlayEvt);
    video.addEventListener('pause', onPauseEvt);
    video.addEventListener('timeupdate', onTimeUpdate, { passive: true });
    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('durationchange', onMeta);
    video.addEventListener('volumechange', onVolChange);
    video.addEventListener('waiting', onWaitingEvt);
    video.addEventListener('canplay', onReadyEvt);
    video.addEventListener('playing', onReadyEvt);
    return () => {
      video.removeEventListener('play', onPlayEvt);
      video.removeEventListener('pause', onPauseEvt);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('durationchange', onMeta);
      video.removeEventListener('volumechange', onVolChange);
      video.removeEventListener('waiting', onWaitingEvt);
      video.removeEventListener('canplay', onReadyEvt);
      video.removeEventListener('playing', onReadyEvt);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [videoRef]);

  // Voice ducking ramp — smooth over DUCK_RAMP_MS rather than an instant volume jump, which reads
  // as a jarring cut. Muted or iOS (where .volume writes are a no-op anyway) skip the animation
  // work entirely; still tracks isDuckedRef so handleVolume's mid-duck branch stays correct.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    isDuckedRef.current = !!duckAudio;
    if (video.muted) return;

    if (duckRafRef.current !== null) cancelAnimationFrame(duckRafRef.current);
    const from = video.volume;
    const to = duckAudio ? userVolumeRef.current * DUCK_FACTOR : userVolumeRef.current;
    if (Math.abs(from - to) < 0.01) return;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / DUCK_RAMP_MS);
      video.volume = from + (to - from) * progress;
      if (progress < 1) {
        duckRafRef.current = requestAnimationFrame(tick);
      } else {
        duckRafRef.current = null;
      }
    };
    duckRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (duckRafRef.current !== null) cancelAnimationFrame(duckRafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- userVolumeRef is a ref, DUCK_FACTOR/DUCK_RAMP_MS are constants
  }, [duckAudio, videoRef]);

  // Show controls temporarily (for mobile tap)
  function revealControls() {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }

  function handleVideoAreaClick() {
    revealControls();
    if (!isOwner) return;
    const v = videoRef.current;
    if (!v) return;
    trackClick('video:toggle_play_pause');
    if (v.paused) onOverlayClick();
    else v.pause();
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    if (!isOwner) return;
    const v = videoRef.current;
    if (v) v.currentTime = Number(e.target.value);
  }

  function handleVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current;
    if (!v) return;
    const val = Number(e.target.value);
    userVolumeRef.current = val;
    // Mid-duck, the slider still shows/sets the TARGET (un-ducked) level the user actually wants —
    // applying it immediately at full strength would defeat the point of ducking, so land on the
    // ducked equivalent instead; the ramp back up on undock already reads userVolumeRef fresh.
    v.volume = isDuckedRef.current ? val * DUCK_FACTOR : val;
    v.muted = val === 0;
    setIsMuted(val === 0);
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    trackClick('video:toggle_mute');
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }

  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    trackClick('video:toggle_fullscreen');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen().catch(() => {});
  }

  function VolumeIcon({ size }: { size: number }) {
    if (isMuted || volume === 0) return <VolumeX size={size} />;
    if (volume < 0.5) return <Volume1 size={size} />;
    return <Volume2 size={size} />;
  }

  const controlsVisible = showControls;

  return (
    <div
      ref={containerRef}
      className="aspect-video bg-black rounded-xl overflow-hidden relative group select-none"
    >
      {/* Video element */}
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        preload="none"
        disableRemotePlayback
        disablePictureInPicture
        {...({ 'x-webkit-airplay': 'deny' } as Record<string, string>)}
        className="w-full h-full"
        onPlay={isOwner ? onPlay : undefined}
        onPause={isOwner ? onPause : undefined}
        onSeeked={isOwner ? onSeeked : undefined}
        onWaiting={() => {
          const v = videoRef.current;
          if (!v || v.paused) return;
          if (!isOwner) onBufferStart();
        }}
        onCanPlay={() => {
          if (!isOwner) onBufferEnd();
        }}
        onError={reportFatal}
      />

      {/* Buffering — video has a src but the browser doesn't have enough data yet (fresh VB
          handoff, seek, network stall). Without this the video area is just a black rectangle
          at 0:00 with no signal that anything is happening. Autoplay-blocked takes priority —
          no point showing "loading" over a state that needs a click, not a wait. */}
      {isBuffering && !autoplayBlocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 pointer-events-none">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: 'rgba(124,58,237,0.25)', animationDuration: '1.8s' }}
            />
            <span
              className="absolute inset-0 rounded-full"
              style={{ background: 'rgba(124,58,237,0.12)', boxShadow: '0 0 32px rgba(124,58,237,0.35)' }}
            />
            <Loader2 size={26} className="relative animate-spin text-violet-400" />
          </div>
          <p
            key={bufferingLabel}
            className="text-slate-300 text-lg font-semibold tracking-wide animate-[loadingLabelIn_0.5s_ease-out]"
          >
            {bufferingLabel}
          </p>
        </div>
      )}

      {/* Плохое соединение — persists independently of `isBuffering` (which only reflects the
          CURRENT stall) since the point is "this connection is likely to keep having problems",
          not just "buffering right now". Small corner pill, never blocks the video/controls. */}
      {poorConnection && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-amber-300 backdrop-blur-sm pointer-events-none">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
          {t('playerPoorConnection')}
        </div>
      )}

      {/* Autoplay blocked overlay */}
      {autoplayBlocked && (
        <button
          onClick={() => { trackClick('video:autoplay_overlay'); onOverlayClick(); }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 cursor-pointer group/btn"
          aria-label={t('playerTapToPlay')}
        >
          <div className="w-20 h-20 rounded-full flex items-center justify-center transition-all group-hover/btn:scale-110"
            style={{ background: 'rgba(124,58,237,0.85)', boxShadow: '0 0 40px rgba(124,58,237,0.5)' }}>
            <Play size={32} className="text-white ml-1.5" fill="white" />
          </div>
          <span className="text-white/60 text-sm font-medium">{t('playerTapToStart')}</span>
        </button>
      )}

      {/* Click area */}
      {!autoplayBlocked && (
        <div className="absolute inset-0 cursor-pointer" onClick={handleVideoAreaClick} />
      )}

      {/* Controls overlay */}
      {!autoplayBlocked && (
        <div
          className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 pointer-events-none ${
            controlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto'
          }`}
        >
          {/* Deep gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

          <div className="relative px-4 pb-4 pt-10">
            {/* Progress bar */}
            <div className="relative mb-3 group/progress">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.5}
                value={currentTime}
                onChange={handleSeek}
                disabled={!isOwner || !duration}
                className="w-full cursor-pointer disabled:cursor-default"
                style={{
                  accentColor: '#7c3aed',
                  height: '3px',
                  appearance: 'none',
                  background: `linear-gradient(to right, #7c3aed ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) 0%)`,
                  borderRadius: '2px',
                }}
                aria-label={t('playerProgress')}
              />
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-3">
              {/* Play/Pause — owner only */}
              {isOwner && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleVideoAreaClick(); }}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all hover:bg-white/10 active:scale-90 flex-shrink-0"
                  aria-label={isPaused ? t('playerPlay') : t('playerPause')}
                >
                  {isPaused
                    ? <Play size={20} fill="currentColor" />
                    : <Pause size={20} fill="currentColor" />}
                </button>
              )}

              {/* Volume */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                  className="text-white/70 hover:text-white transition-colors"
                  aria-label="Mute"
                >
                  <VolumeIcon size={16} />
                </button>
                {/* iOS ignores .volume from JS (hardware buttons only) — a slider that visibly
                    moves but audibly does nothing is worse than no slider; mute above still works. */}
                {!volumeSliderUnusable && (
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolume}
                    onClick={(e) => e.stopPropagation()}
                    className="w-16 cursor-pointer"
                    style={{
                      accentColor: '#7c3aed',
                      height: '3px',
                      appearance: 'none',
                      background: `linear-gradient(to right, rgba(255,255,255,0.8) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 0%)`,
                      borderRadius: '2px',
                    }}
                    aria-label={t('playerVolume')}
                  />
                )}
              </div>

              {/* Time */}
              <span className="text-white/60 text-xs tabular-nums flex-shrink-0">
                {formatDuration(currentTime)}
                {duration > 0 && <span className="text-white/30"> / {formatDuration(duration)}</span>}
              </span>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Non-owner indicator — was hardcoded English "viewing" regardless of app locale */}
              {!isOwner && (
                <span className="text-[10px] text-white/30 font-medium flex-shrink-0">
                  {t('playerViewing')}
                </span>
              )}

              {/* Fullscreen */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                className="text-white/60 hover:text-white transition-colors flex-shrink-0"
                aria-label={isFullscreen ? t('playerFullscreenExit') : t('playerFullscreen')}
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function VideoPlayer({
  onPlay,
  onPause,
  onSeek,
  onHeartbeat,
  onBufferStart,
  onBufferEnd,
  onFatalError,
  onPickDifferentVideo,
  duckAudio,
}: Props) {
  const t = useTranslations('party');
  const room = useWatchPartyStore((s) => s.room);
  const isConnected = useWatchPartyStore((s) => s.isConnected);
  const syncState = useWatchPartyStore((s) => s.syncState);
  const heartbeat = useWatchPartyStore((s) => s.heartbeat);
  const currentUser = useAuthStore((s) => s.user);
  const isOwner = !!(room && currentUser && room.ownerId === currentUser._id);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isRemoteAction = useRef(false);
  // Tracks owner's deliberate pause to prevent democratic buffer resume from auto-playing.
  // Set true only when owner explicitly pauses (!isRemoteAction), false when they explicitly play.
  // This avoids the race condition where sync-effect pause (isRemoteAction=true) sets roomUserPaused
  // on the server and then resumeRoom is permanently blocked.
  const ownerExplicitlyPausedRef = useRef(false);
  // Prevents calling video.play() a second time while the first promise is still pending.
  // v.paused stays true until play() resolves, so rapid clicks would queue multiple play() calls
  // each firing onPlay → sendPlay, causing a storm of PLAY events and viewer chaos.
  const playPendingRef = useRef(false);
  // Debounces socket emissions: rapid play→pause→play within 80ms collapses to one final event.
  // Without this, each browser play/pause event fires a socket event, flooding the server
  // and delivering conflicting VIDEO_PLAY/VIDEO_PAUSE to viewers faster than they can process.
  const pendingEmitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  // True once playback has genuinely failed (not just autoplay policy) — swaps the "Нажмите чтобы
  // начать" overlay (which was misleading here: clicking it just replayed the same doomed
  // play() call, looking "frozen") for a proper "Открываем виртуальный браузер..." loading state
  // while the owner-only fallback in RoomContent (onFatalError → vbStart) kicks in.
  const [fatalPlaybackError, setFatalPlaybackError] = useState(false);
  const reportPlaybackFatal = useCallback(() => {
    setFatalPlaybackError(true);
    onFatalError?.();
  }, [onFatalError]);
  const [isHls, setIsHls] = useState(false);
  const [isDash, setIsDash] = useState(false);
  const progressLoadedRef = useRef<string>('');
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const videoUrl = room?.videoUrl ?? '';
  // Reset once the room moves to a different video — otherwise a fatal error from the previous
  // video stays stuck true and blocks the new one behind the same stuck-overlay. The old client-
  // side extraction effect used to do this as a side effect of running on every new videoUrl;
  // removed with it (see directSrc below), so it needs its own effect now.
  useEffect(() => setFatalPlaybackError(false), [videoUrl]);
  const ytId = getYouTubeId(videoUrl);
  const vkIds = getVKVideoIds(videoUrl);
  const rutubeId = getRutubeVideoId(videoUrl);
  const twitchIds = getTwitchIds(videoUrl);
  const vimeoId = getVimeoId(videoUrl);
  const dailymotionId = getDailymotionId(videoUrl);
  const tiktokId = getTikTokId(videoUrl);
  const peertubeIds = getPeerTubeIds(videoUrl);
  const trovoName = getTrovoStreamername(videoUrl);
  const isEmbed = !!ytId || !!vkIds || !!rutubeId || !!twitchIds || !!vimeoId || !!dailymotionId || !!tiktokId || !!peertubeIds || !!trovoName;
  // Every non-embed URL is resolved server-side by VB (services/watch-party/roomEvents.handler.ts,
  // "Single extraction mechanism", 2026-08-10) — this component used to also run its own client-side
  // extraction (extractVideoUrl → content-service's yt-dlp/Playwright pipeline) racing that same
  // resolution. The Playwright fallback branch of that pipeline never returned httpHeaders (no
  // Referer/Cookie), so any CDN with hotlink/session checks 502'd at proxy-stream — confirmed live
  // 2026-08-19 against uzmovi.net's uzdown.space mirror. Removed rather than patched: the backend
  // already treats VB as the only path, so the client should just wait for room.videoUrl to become
  // an own-VB url instead of racing ahead on the raw source page.
  const isOwnVb = isOwnVbMediaUrl(videoUrl);
  const directSrc = isOwnVb ? videoUrl : null;

  // isHls/isDash come from the videoUrl's own extension — proxiedMediaUrl (vbSession.helper.ts)
  // always mints these with a type-matching one (stream.m3u8/.mpd/.mp4), same convention vb-
  // capture's own controller uses — cheap and reliable to read back off the URL itself instead of
  // threading the candidate's `type` all the way through room state just for this.
  useEffect(() => {
    if (!isOwnVb) return;
    setIsHls(videoUrl.includes('.m3u8'));
    setIsDash(videoUrl.includes('.mpd'));
  }, [isOwnVb, videoUrl]);

  // ── Sync incoming state to HTML5 video ────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isEmbed || !directSrc) return;

    isRemoteAction.current = true;

    // Compensate for delivery latency: a PLAY that took 200ms to arrive should land at the owner's
    // CURRENT position, not where they were when they pressed play. serverTimestamp is already
    // normalised to this client's clock (use-watch-party). Only while playing — pause is a fixed
    // position. Capped at 30s so a stale timestamp can't seek wildly past the real position.
    const elapsed = syncState.isPlaying && syncState.serverTimestamp
      ? Math.min(30, Math.max(0, (Date.now() - syncState.serverTimestamp) / 1000))
      : 0;
    const target = syncState.currentTime + elapsed;

    if (Math.abs(video.currentTime - target) > 0.3) {
      video.currentTime = target;
    }

    if (syncState.isPlaying && video.paused) {
      // Don't auto-resume if owner deliberately paused — only their own play click should resume.
      // ownerExplicitlyPausedRef is cleared in handlePlay and set in handlePause (user-initiated only).
      if (isOwner && ownerExplicitlyPausedRef.current) {
        isRemoteAction.current = false;
        return;
      }
      video.play()
        .then(() => setAutoplayBlocked(false))
        .catch((e: unknown) => {
          // AbortError = play() interrupted by rapid pause — not a real block, don't show overlay
          if ((e as DOMException)?.name === 'AbortError') return;
          if (isAutoplayPolicyError(e)) setAutoplayBlocked(true);
          else reportPlaybackFatal();
        });
    } else if (!syncState.isPlaying && !video.paused) {
      video.pause();
      setAutoplayBlocked(false);
    }

    setTimeout(() => { isRemoteAction.current = false; }, 200);
  }, [syncState.currentTime, syncState.isPlaying, syncState.serverTimestamp, isEmbed, directSrc, isOwner, reportPlaybackFatal]);

  // Cleanup debounce timer on unmount to avoid post-unmount state updates
  useEffect(() => () => {
    if (pendingEmitRef.current) clearTimeout(pendingEmitRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  }, []);

  // Load saved progress for owner when a non-YouTube video is ready
  useEffect(() => {
    if (!isOwner || !videoUrl || !directSrc || progressLoadedRef.current === videoUrl) return;
    progressLoadedRef.current = videoUrl;

    fetch(`/api/content/watch-progress?url=${encodeURIComponent(videoUrl)}`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((body: unknown) => {
        const data = (body as { data?: { position?: number } }).data;
        const position = data?.position ?? 0;
        if (position > 30) {
          // The `action` this used to carry was an empty object cast through `as any` — it
          // rendered no button and did nothing. The seek happens unconditionally just below, so
          // the toast is purely an explanation of what is about to happen; it now says so, and
          // in the user's language (it was hardcoded English).
          toast({ title: t('resumedFrom', { time: formatDuration(position) }) });
          // Expose seek via a brief delay so videoRef is attached to src
          setTimeout(() => {
            if (videoRef.current) videoRef.current.currentTime = position;
          }, 1500);
        }
      })
      .catch(() => {});
  }, [isOwner, videoUrl, directSrc]);

  // Save progress every 10s for owner
  useEffect(() => {
    if (!isOwner || isEmbed || !directSrc) return;

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || !videoUrl || video.paused) return;
      fetch('/api/content/watch-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          videoUrl,
          // content-service's save() reads `currentTime`, not `position` — this was silently
          // saving as 0 every 10s (no error, since the field is optional and defaults via
          // `currentTime ?? 0`), so the "continue watching" resume never actually worked.
          currentTime: video.currentTime,
          duration: video.duration || 0,
        }),
      }).catch(() => {});
    }, 10_000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isOwner, isEmbed, directSrc, videoUrl]);

  // Owner heartbeat every 1s — dep on directSrc so interval starts once VB has resolved a
  // playable url and videoRef.current is guaranteed set (NativeVideoPlayer renders when
  // directSrc is ready)
  //
  // Every 15th tick (~15s, matching watchParty.service.ts's Mongo-write throttle — no point
  // capturing more often than the server would ever persist) also grabs a small frame for the
  // Pro "continue watching" thumbnail. Best-effort: a cross-origin video source without CORS
  // headers taints the canvas and throws on toDataURL() — caught and skipped rather than crashing
  // the heartbeat, since most sources (vb-capture/vb-media-proxy, same-origin) work fine and a
  // missing thumbnail for the rest just means no preview, not a broken room.
  useEffect(() => {
    const video = videoRef.current;
    if (!isOwner || isEmbed || !video) return;
    let tick = 0;
    const id = setInterval(() => {
      if (video.paused) return;
      tick++;
      let frame: string | undefined;
      if (tick % 15 === 0 && video.videoWidth > 0) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 160;
          canvas.height = Math.round((160 * video.videoHeight) / video.videoWidth);
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          frame = canvas.toDataURL('image/jpeg', 0.5);
        } catch {
          // Tainted canvas (cross-origin source without CORS) or any other capture failure —
          // just skip the thumbnail this tick, position sync below is unaffected.
        }
      }
      onHeartbeat(video.currentTime, frame);
    }, 1000);
    return () => clearInterval(id);
  }, [isOwner, isEmbed, onHeartbeat, directSrc]);

  // Non-owner drift correction via heartbeat.
  // Tiered: >2s → hard seek; >0.5s → 1.15x rate; >0.2s → 1.08x rate; else restore.
  // 1s heartbeat + tiered rates close 1s drift in ~6 cycles (~6s).
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isEmbed || isOwner || !heartbeat || !syncState.isPlaying) return;
    const expected = heartbeat.currentTime + (Date.now() - heartbeat.timestamp) / 1000;
    const drift = expected - video.currentTime;
    const absDrift = Math.abs(drift);
    if (absDrift > 2) {
      isRemoteAction.current = true;
      video.playbackRate = 1.0;
      video.currentTime = expected;
      setTimeout(() => { isRemoteAction.current = false; }, 200);
    } else if (absDrift > 0.5) {
      video.playbackRate = drift > 0 ? 1.15 : 0.85;
    } else if (absDrift > 0.2) {
      video.playbackRate = drift > 0 ? 1.08 : 0.92;
    } else {
      video.playbackRate = 1.0;
    }
  }, [heartbeat, isEmbed, isOwner, syncState.isPlaying]);

  const handlePlay = useCallback(() => {
    if (isRemoteAction.current) return;
    if (isOwner) ownerExplicitlyPausedRef.current = false;
    setAutoplayBlocked(false);
    playPendingRef.current = false; // play() resolved — clear guard
    // Debounce: cancel any pending emit (e.g. a pause that followed this play within 80ms)
    // and schedule the play emit. This collapses rapid play→pause→play into one final event.
    if (pendingEmitRef.current) clearTimeout(pendingEmitRef.current);
    pendingEmitRef.current = setTimeout(() => {
      pendingEmitRef.current = null;
      if (videoRef.current) onPlay(videoRef.current.currentTime);
    }, 80);
  }, [onPlay, isOwner]);

  const handlePause = useCallback(() => {
    if (isRemoteAction.current) return;
    if (isOwner) ownerExplicitlyPausedRef.current = true;
    if (pendingEmitRef.current) clearTimeout(pendingEmitRef.current);
    pendingEmitRef.current = setTimeout(() => {
      pendingEmitRef.current = null;
      if (videoRef.current) onPause(videoRef.current.currentTime);
    }, 80);
  }, [onPause, isOwner]);

  const handleSeeked = useCallback(() => {
    if (!isRemoteAction.current && videoRef.current) {
      onSeek(videoRef.current.currentTime);
    }
  }, [onSeek]);

  function handleOverlayClick() {
    // Guard: v.paused stays true while play() promise is pending, so rapid clicks
    // would queue multiple play() calls. Block until the first resolves.
    if (playPendingRef.current) return;
    const v = videoRef.current;
    if (!v) return;
    playPendingRef.current = true;
    v.play()
      .then(() => {
        // Normally cleared by handlePlay when the <video>'s native `play` event fires — but
        // that listener is owner-only (`onPlay={isOwner ? onPlay : undefined}`, so only the
        // owner's play broadcasts to the room). For a non-owner viewer that event never fires,
        // so without clearing it here too, this ref stays stuck `true` after their very first
        // successful click — every click after that silently no-ops on the guard above, with
        // the overlay still visibly there (confirmed via real-device test, 2026-07-27).
        playPendingRef.current = false;
        setAutoplayBlocked(false);
      })
      .catch((e: unknown) => {
        playPendingRef.current = false;
        if ((e as DOMException)?.name === 'AbortError') return;
        if (isAutoplayPolicyError(e)) setAutoplayBlocked(true);
        else reportPlaybackFatal();
      });
  }

  // ── Loading / error states ──────────────────────────────────────────────────

  if (!room) {
    return <VideoLoading />;
  }

  if (!videoUrl) {
    return (
      <div className="aspect-video bg-[#0A0A12] rounded-xl flex flex-col items-center justify-center gap-3">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
        >
          <Clapperboard size={22} className="text-violet-400/70" />
        </div>
        <p className="text-slate-400 text-sm font-medium">{t('playerNoVideoSelected')}</p>
        {!isConnected && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Loader2 size={12} className="animate-spin" />
            {t('playerConnecting')}
          </div>
        )}
      </div>
    );
  }

  // ── YouTube — synced via the official IFrame Player API ─────────────────────
  // (raw iframe was display-only; YouTubePlayer broadcasts owner play/pause/seek + heartbeat and
  //  drift-corrects followers so the room actually watches together.)

  if (ytId) {
    return (
      <YouTubePlayer
        videoId={ytId}
        isOwner={isOwner}
        onPlay={onPlay}
        onPause={onPause}
        onSeek={onSeek}
        onHeartbeat={onHeartbeat}
      />
    );
  }

  // ── VK Video — NOT synced (video_ext.php has no postMessage control API, confirmed 2026-07-19) ──
  // Each viewer gets their own independent copy; there's no owner/viewer distinction to wire up.

  if (vkIds) {
    return (
      <VKPlayer
        ownerId={vkIds.ownerId}
        videoId={vkIds.videoId}
      />
    );
  }

  // ── Rutube — synced via the official rutube.ru/play/embed/ postMessage protocol ─────────────
  // (also sidesteps yt-dlp's IP-block on Rutube's options-JSON endpoint from Railway — see
  // RutubePlayer.tsx header comment for the verified command/event shapes.)

  if (rutubeId) {
    return (
      <RutubePlayer
        videoId={rutubeId}
        isOwner={isOwner}
        onPlay={onPlay}
        onPause={onPause}
        onSeek={onSeek}
        onHeartbeat={onHeartbeat}
      />
    );
  }

  // ── Twitch — synced via the official Twitch.Embed JS API (VOD only; live is play/pause-only) ──

  if (twitchIds) {
    return (
      <TwitchPlayer
        id={twitchIds.id}
        type={twitchIds.type}
        isOwner={isOwner}
        onPlay={onPlay}
        onPause={onPause}
        onSeek={onSeek}
        onHeartbeat={onHeartbeat}
      />
    );
  }

  // ── Vimeo — synced via the official Vimeo Player SDK ─────────────────────────

  if (vimeoId) {
    return (
      <VimeoPlayer
        videoId={vimeoId}
        isOwner={isOwner}
        onPlay={onPlay}
        onPause={onPause}
        onSeek={onSeek}
        onHeartbeat={onHeartbeat}
      />
    );
  }

  // ── Dailymotion — NOT synced (two independent control attempts both failed against the real
  // iframe, confirmed 2026-07-19 — see DailymotionPlayer.tsx header). Each viewer gets their own
  // independent copy; there's no owner/viewer distinction to wire up. ─────────────────────────

  if (dailymotionId) {
    return (
      <DailymotionPlayer
        videoId={dailymotionId}
      />
    );
  }

  // ── TikTok — synced via the official player/v1 postMessage embed ────────────

  if (tiktokId) {
    return (
      <TikTokPlayer
        videoId={tiktokId}
        isOwner={isOwner}
        onPlay={onPlay}
        onPause={onPause}
        onSeek={onSeek}
        onHeartbeat={onHeartbeat}
      />
    );
  }

  // ── PeerTube — synced via the official @peertube/embed-api (instance must be CSP-allowlisted) ──

  if (peertubeIds) {
    return (
      <PeerTubePlayer
        instance={peertubeIds.instance}
        videoId={peertubeIds.videoId}
        isOwner={isOwner}
        onPlay={onPlay}
        onPause={onPause}
        onSeek={onSeek}
        onHeartbeat={onHeartbeat}
      />
    );
  }

  // ── Trovo — official Trovo.TrovoPlayer JS API (not yet whitelisted, see TrovoPlayer.tsx) ────

  if (trovoName) {
    return (
      <TrovoPlayer
        streamername={trovoName}
        isOwner={isOwner}
        onPlay={onPlay}
        onPause={onPause}
      />
    );
  }

  // ── Any remaining source (Rutube, direct, etc.) — VB-resolved or still resolving ───
  // Real prod bug 2026-08-10: this block used to be gated on needsExtract alone, which was FALSE
  // for our own vb-media-proxy/vb-capture urls — that also skipped the whole block, including the
  // actual <video> render, falling through to `return null` below. The player vanishing outright
  // ("плеер исчез") was this, not a data/extraction problem. Gating on `!isEmbed` covers both the
  // "VB still resolving" state (directSrc null, videoUrl still the raw source page) and the
  // "VB resolved" state (directSrc set) with the same condition needsExtract used to represent.
  if (!isEmbed && videoUrl) {
    // Real playback failure (not just autoplay needing a click) — stop rendering the player (its
    // own "click to start" overlay would just retry the identical doomed play() call). Only the
    // OWNER actually triggers the VB fallback (vbStart is owner-gated in RoomContent), so only
    // the owner gets the "opening virtual browser" loading state — showing that to a non-owner
    // would be a dead end nobody ever resolves for them. A non-owner instead gets a click-to-retry
    // overlay: their own re-render (remounting NativeVideoPlayer against the same src) either
    // recovers on its own, or catches up once the owner's VB session comes online and room state
    // moves on.
    if (fatalPlaybackError) {
      return isOwner
        ? <OwnerVideoStuckOverlay onPickDifferentVideo={onPickDifferentVideo} />
        : <FatalErrorRetryOverlay onRetry={() => setFatalPlaybackError(false)} />;
    }
    if (directSrc) {
      return (
        <NativeVideoPlayer
          src={directSrc}
          isHls={isHls}
          isDash={isDash}
          videoRef={videoRef}
          autoplayBlocked={autoplayBlocked}
          isOwner={isOwner}
          startPosition={syncState.currentTime}
          onPlay={handlePlay}
          onPause={handlePause}
          onSeeked={handleSeeked}
          onBufferStart={onBufferStart}
          onBufferEnd={onBufferEnd}
          onOverlayClick={handleOverlayClick}
          onAutoplayBlocked={() => setAutoplayBlocked(true)}
          onFatalError={reportPlaybackFatal}
          duckAudio={duckAudio}
        />
      );
    }
    return <VideoLoading />;
  }

  return null;
}
