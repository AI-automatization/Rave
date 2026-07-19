'use client';

// WeWatch Web — Synced VK Video player (official video_ext.php embed).
//
// Uses VK's own sanctioned embed widget instead of scraping the CDN URL server-side (the old
// path went through content-service's ytDlpExtractor with an authenticated VK session cookie —
// ToS-questionable, same category of risk as pirate-site extraction, just against a legitimate
// platform). video_ext.php accepts postMessage commands directly (no VK.VideoPlayer SDK script
// needed) and reports state back the same way — protocol mirrors apps/mobile's already-working
// buildVKVideoHtml() bridge (WebViewAdapters.ts), reused here as the reference implementation.
//
// Owner  — its own play/pause/seek + a 1s heartbeat are broadcast over the socket.
// Viewer — applies incoming syncState (seekTo/play/pause) and drift-corrects off the heartbeat.
// Hard-seek only (like YouTube) — VK's embed doesn't expose a playbackRate control for micro-sync.

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useWatchPartyStore } from '@/store/watch-party.store';

interface Props {
  ownerId: string;
  videoId: string;
  isOwner: boolean;
  onPlay: (time: number) => void;
  onPause: (time: number) => void;
  onSeek: (time: number) => void;
  onHeartbeat: (time: number) => void;
}

interface VKMessage {
  type?: string;
  event?: string;
  params?: { position?: number; duration?: number };
  position?: number;
  duration?: number;
}

const VK_DRIFT_HARD_SEEK_SECS = 1.2;
const MAX_COMPENSATION_SECS = 30;
const LOAD_TIMEOUT_MS = 15000;

export function VKPlayer({ ownerId, videoId, isOwner, onPlay, onPause, onSeek, onHeartbeat }: Props) {
  const syncState = useWatchPartyStore((s) => s.syncState);
  const heartbeat = useWatchPartyStore((s) => s.heartbeat);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // true while WE are applying a remote change, so the resulting VK event isn't re-broadcast
  // (echo loop). Mirrors isRemoteAction in YouTubePlayer.tsx.
  const isRemoteAction = useRef(false);
  const currentTimeRef = useRef(0);
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const isOwnerRef = useRef(isOwner);   isOwnerRef.current = isOwner;
  const onPlayRef = useRef(onPlay);     onPlayRef.current = onPlay;
  const onPauseRef = useRef(onPause);   onPauseRef.current = onPause;
  const onSeekRef = useRef(onSeek);     onSeekRef.current = onSeek;
  const onHeartbeatRef = useRef(onHeartbeat); onHeartbeatRef.current = onHeartbeat;
  const markReadyRef = useRef<() => void>(() => {});

  function postToVK(msg: object) {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(msg), '*');
  }

  // ── Listen for VK embed state events + owner heartbeat ────────────────────────
  useEffect(() => {
    setReady(false);
    setError(null);
    currentTimeRef.current = 0;

    const timeoutId = setTimeout(() => {
      setReady((r) => {
        if (!r) setError('Видео не загрузилось — возможно, оно недоступно для встраивания');
        return r;
      });
    }, LOAD_TIMEOUT_MS);

    const startHeartbeat = () => {
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = setInterval(() => {
        if (isOwnerRef.current) onHeartbeatRef.current(currentTimeRef.current);
      }, 1000);
    };

    // VK's postMessage 'inited'/'ready' event is undocumented and not reliably observed in
    // production (T-S137 follow-up, 2026-07-19) — the iframe itself loads and plays fine (VK's
    // own native controls work end-to-end) while our postMessage listener never sees a
    // recognizable ready signal, so the load-timeout fired a false "failed to embed" error over a
    // working video. The iframe's own onLoad is the ground truth for "embed succeeded"; treat it
    // as ready too so the UI never lies about a video that's actually playing. Sync (owner
    // heartbeat/play/pause broadcast) still depends on VK's postMessage events firing at all — if
    // they never do, playback works locally per-viewer but cross-viewer sync silently won't;
    // that's a separate, so-far unconfirmed question this fix does not resolve.
    const markReady = () => {
      clearTimeout(timeoutId);
      setError(null);
      setReady(true);
      startHeartbeat();
    };
    markReadyRef.current = markReady;

    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      let data: VKMessage;
      try {
        data = (typeof e.data === 'string' ? JSON.parse(e.data) : e.data) as VKMessage;
      } catch { return; }
      const evt = data.type ?? data.event ?? '';
      const position = data.params?.position ?? data.position;
      if (typeof position === 'number') currentTimeRef.current = position;

      switch (evt) {
        case 'inited':
        case 'ready':
          markReady();
          break;
        case 'started':
        case 'resume':
        case 'play':
          if (isOwnerRef.current && !isRemoteAction.current) onPlayRef.current(currentTimeRef.current);
          break;
        case 'paused':
        case 'pause':
          if (isOwnerRef.current && !isRemoteAction.current) onPauseRef.current(currentTimeRef.current);
          break;
        case 'seek':
        case 'seeked':
          if (isOwnerRef.current && !isRemoteAction.current) onSeekRef.current(currentTimeRef.current);
          break;
        default:
          break;
      }
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(timeoutId);
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    };
  }, [ownerId, videoId]);

  // ── Viewer: apply incoming syncState (play/pause/seek) ────────────────────────
  useEffect(() => {
    if (!ready || isOwner) return;

    isRemoteAction.current = true;

    const elapsed = syncState.isPlaying && syncState.serverTimestamp
      ? Math.min(MAX_COMPENSATION_SECS, Math.max(0, (Date.now() - syncState.serverTimestamp) / 1000))
      : 0;
    const target = syncState.currentTime + elapsed;

    if (Math.abs(currentTimeRef.current - target) > 0.5) {
      postToVK({ method: 'seek', value: target });
      currentTimeRef.current = target;
    }
    postToVK({ method: syncState.isPlaying ? 'play' : 'pause' });

    const clear = setTimeout(() => { isRemoteAction.current = false; }, 400);
    return () => clearTimeout(clear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isOwner, syncState.currentTime, syncState.isPlaying, syncState.serverTimestamp]);

  // ── Viewer: drift correction from heartbeat (hard-seek only) ──────────────────
  useEffect(() => {
    if (!ready || isOwner || !heartbeat || !syncState.isPlaying) return;
    const expected = heartbeat.currentTime + (Date.now() - heartbeat.timestamp) / 1000;
    if (Math.abs(expected - currentTimeRef.current) > VK_DRIFT_HARD_SEEK_SECS) {
      isRemoteAction.current = true;
      postToVK({ method: 'seek', value: expected });
      currentTimeRef.current = expected;
      setTimeout(() => { isRemoteAction.current = false; }, 400);
    }
  }, [ready, isOwner, heartbeat, syncState.isPlaying]);

  if (error) {
    return (
      <div className="aspect-video bg-[#0A0A12] rounded-xl flex flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle size={28} className="text-red-400" />
        <p className="text-slate-300 text-sm font-medium">Не удалось загрузить видео</p>
        <p className="text-slate-500 text-xs">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
      <iframe
        ref={iframeRef}
        src={`https://vk.com/video_ext.php?oid=${ownerId}&id=${videoId}&hd=1&autoplay=1`}
        className="w-full h-full border-0"
        allow="autoplay; fullscreen; encrypted-media"
        allowFullScreen
        onLoad={() => markReadyRef.current()}
      />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A12]/80 pointer-events-none">
          <Loader2 size={28} className="animate-spin text-violet-400" />
        </div>
      )}
    </div>
  );
}
