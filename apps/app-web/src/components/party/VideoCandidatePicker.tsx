'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, X as XIcon, ArrowLeft, Clapperboard, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { trackClick } from '@/lib/analytics';
import { buildProxyUrl, setupCaptureMse } from './VideoPlayer';
import { formatDuration } from '@/lib/format-duration';
import type { VideoCandidate } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` = no answer from the server yet (request in flight, or picker never opened this
   * session) — distinct from an empty array, which means the server genuinely found nothing else. */
  candidates: VideoCandidate[] | null;
  onRequestCandidates: () => void;
  onConfirm: (candidate: VideoCandidate) => void;
}

// How long the "this option didn't load" overlay stays before cycling to the next candidate.
const FAILED_ADVANCE_MS = 1500;
// 2026-10-25 (Abdulaziz): each candidate gets this long in cycle mode; no pick → next one by itself.
// Mirrors PICK_MS_PER_CANDIDATE in watch-party's vbSession.helper.ts, which stops VB once the
// whole cycle is over.
const PICK_SECONDS_PER_CANDIDATE = 60;
// Seconds of real playback before judging "has an audio track" (see CandidatePreview.checkAudio).
const AUDIO_CHECK_AFTER_SECS = 2;

function fmtDuration(seconds?: number): string | null {
  if (!seconds || !isFinite(seconds) || seconds <= 0) return null;
  return formatDuration(seconds);
}

// Grabs the CURRENTLY DECODED frame off a playing <video> as a real thumbnail — not a page
// screenshot, not a generic icon, an actual frame of the actual video the owner is about to
// confirm. Real prod ask 2026-08-08: VB's own screencast-of-the-source-PAGE was explicitly
// rejected for this ("это картинка сайта, не кадр фильма") — this only ever runs against the
// SAME <video> element already playing the candidate below, so whatever it captures is
// guaranteed to be real video content, never a source page.
function captureVideoFrame(video: HTMLVideoElement): string | null {
  if (!video.videoWidth || !video.videoHeight) return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
  } catch {
    // Cross-origin canvas taint (a proxied source that somehow didn't get CORS headers right) —
    // silently skip rather than throw; the candidate is still fully usable without a captured frame.
    return null;
  }
}

// Single-candidate local preview — plays ONE candidate URL in the owner's own browser only, no
// CHANGE_MEDIA emitted here (that only happens on confirm). Candidate URLs are already-resolved
// CDN URLs (mp4/hls), not page URLs, so this plays them directly instead of going through the
// full extraction pipeline VideoPlayer.tsx uses for room.videoUrl. `embed` candidates aren't a
// direct CDN URL at all — no local preview is possible for those, just the poster + confirm.
function CandidatePreview({
  candidate,
  onCapture,
  onFailed,
  onAudioInfo,
}: {
  candidate: VideoCandidate;
  /** Real duration/poster pulled from the actual playing element — see captureVideoFrame above.
   *  Only fires once per successful capture; the caller merges this into candidate display data
   *  (grid thumbnails, duration badge) without mutating the server-provided candidate itself. */
  onCapture?: (info: { poster?: string; duration?: number }) => void;
  /** Fires once when this candidate can't be loaded at all (media error, fatal hls/dash/MSE
   *  error) — live 2026-10-24: a dead candidate used to sit on a black 0:00 frame with no hint. */
  onFailed?: () => void;
  /** Fires once, ~2s into real playback: does this candidate carry an audio track at all? Sites
   *  like arte.tv split video and audio into separate files, and a video-only one gave a silent
   *  room (live 2026-10-24). Not fired on browsers that expose none of the signals below. */
  onAudioInfo?: (hasAudio: boolean) => void;
}) {
  const t = useTranslations('party');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<import('hls.js').default | null>(null);
  const dashRef = useRef<import('dashjs').MediaPlayerClass | null>(null);
  const captureMseRef = useRef<Awaited<ReturnType<typeof setupCaptureMse>>>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || candidate.type === 'embed') return;
    let cancelled = false;
    let framedCaptured = false;

    const reportDuration = () => {
      if (isFinite(video.duration) && video.duration > 0) onCapture?.({ duration: video.duration });
    };
    // A frame grabbed the instant playback starts is very often still black (encoder keyframe
    // lag, or a fade-in intro) — waiting for the second timeupdate (real decoded progress, not
    // just "play() resolved") gives a frame that's actually representative of the content.
    let timeUpdateCount = 0;
    const tryCaptureFrame = () => {
      if (framedCaptured || cancelled) return;
      timeUpdateCount++;
      if (timeUpdateCount < 2) return;
      const frame = captureVideoFrame(video);
      if (frame) {
        framedCaptured = true;
        onCapture?.({ poster: frame });
      }
    };
    let failReported = false;
    const reportFailed = () => {
      if (failReported || cancelled) return;
      failReported = true;
      onFailed?.();
    };
    // Decoder-level counters — they grow while the preview is `muted` too (checked live in Chrome
    // 2026-10-24: an archive.org mp4 with sound → >0 bytes after 6s muted, arte's video-only
    // _v720_crf_h264.mp4 → 0). Firefox: mozHasAudio, Safari: audioTracks.
    let audioReported = false;
    const checkAudio = () => {
      if (audioReported || cancelled || video.currentTime < AUDIO_CHECK_AFTER_SECS) return;
      const v = video as HTMLVideoElement & {
        webkitAudioDecodedByteCount?: number; mozHasAudio?: boolean; audioTracks?: { length: number };
      };
      let hasAudio: boolean | null = null;
      if (typeof v.webkitAudioDecodedByteCount === 'number') hasAudio = v.webkitAudioDecodedByteCount > 0;
      else if (typeof v.mozHasAudio === 'boolean') hasAudio = v.mozHasAudio;
      else if (v.audioTracks) hasAudio = v.audioTracks.length > 0;
      audioReported = true;
      if (hasAudio !== null) onAudioInfo?.(hasAudio);
    };
    video.addEventListener('loadedmetadata', reportDuration);
    video.addEventListener('timeupdate', tryCaptureFrame);
    video.addEventListener('timeupdate', checkAudio);
    video.addEventListener('error', reportFailed);

    // candidate.url is always cross-origin from the browser's point of view — a raw CDN url from
    // content-service's extraction, or our own watch-party service's vb-capture/vb-media-proxy —
    // same CORS problem the main player already solves via this same proxy, see VideoPlayer.tsx.
    buildProxyUrl(candidate.url).then((proxiedUrl) => {
      if (cancelled) return;

      if (candidate.type === 'dash') {
        import('dashjs').then((dashjs) => {
          if (cancelled) return;
          dashRef.current?.reset();
          const player = dashjs.MediaPlayer().create();
          dashRef.current = player;
          player.initialize(video, proxiedUrl, false);
          player.on(dashjs.MediaPlayer.events.CAN_PLAY, () => { video.play().catch(() => {}); });
          player.on(dashjs.MediaPlayer.events.ERROR, reportFailed);
        }).catch(reportFailed);
        return;
      }

      // Real bug 2026-08-28 (Saidazim, live): every vb-capture candidate previewed as a BLACK BOX,
      // and it's the one the picker deliberately shows FIRST (vbSession.helper.ts ranks capture-kind
      // ahead of expiring signed URLs). A vb-capture URL is a live, still-growing fMP4 buffer —
      // Chrome refuses it through a plain `video.src` with MEDIA_ERR_SRC_NOT_SUPPORTED, which is
      // exactly why the main player routes it through MSE (VideoPlayer.tsx). The preview was still
      // taking the plain-src branch below because capture candidates are typed 'mp4'. Same helper,
      // same "null means fall back to plain src" contract as the player.
      if (candidate.url.includes('/vb-capture/')) {
        void setupCaptureMse(video, proxiedUrl, {
          onFatal: reportFailed,
          onReady: () => { video.play().catch(() => {}); },
          isCancelled: () => cancelled,
        }).then((result) => {
          if (cancelled) { result?.teardown(); return; }
          captureMseRef.current = result;
          if (!result) {
            video.src = proxiedUrl;
            video.play().catch(() => {});
          }
        }).catch(() => {});
        return;
      }

      if (candidate.type === 'mp4' || video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = proxiedUrl;
        video.play().catch(() => {});
        return;
      }

      import('hls.js').then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) { video.src = proxiedUrl; video.play().catch(() => {}); return; }
        hlsRef.current?.destroy();
        const hls = new Hls({ enableWorker: true });
        hlsRef.current = hls;
        hls.loadSource(proxiedUrl);
        hls.attachMedia(video);
        hls.once(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); });
        hls.on(Hls.Events.ERROR, (_event, data) => { if (data.fatal) reportFailed(); });
      }).catch(reportFailed);
    }).catch(reportFailed);

    return () => {
      cancelled = true;
      video.removeEventListener('loadedmetadata', reportDuration);
      video.removeEventListener('timeupdate', tryCaptureFrame);
      video.removeEventListener('timeupdate', checkAudio);
      video.removeEventListener('error', reportFailed);
      hlsRef.current?.destroy();
      hlsRef.current = null;
      dashRef.current?.reset();
      dashRef.current = null;
      // Releases the MediaSource object URL — without this, cycling through several capture
      // candidates leaks one live MediaSource per preview.
      captureMseRef.current?.teardown();
      captureMseRef.current = null;
    };
  }, [candidate.url, candidate.type, onCapture, onFailed, onAudioInfo]);

  if (candidate.type === 'embed') {
    return (
      <div className="aspect-video bg-[#0A0A12] rounded-xl flex flex-col items-center justify-center gap-3 px-4 text-center">
        {candidate.poster ? (
          // eslint-disable-next-line @next/next/no-img-element -- extractor/VB-provided poster URL or data URI
          <img src={candidate.poster} alt="" className="max-h-32 max-w-full object-contain rounded-lg" />
        ) : (
          <Clapperboard size={26} className="text-violet-400/60" />
        )}
        <p className="text-slate-500 text-xs">{t('videoCandidateEmbedHint')}</p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      poster={candidate.poster}
      muted
      playsInline
      controls
      // Real bug 2026-08-28: without this, captureVideoFrame's canvas is ALWAYS tainted (candidate
      // URLs are served from stream.wewatch.uz, a different origin than app.wewatch.uz), so
      // toDataURL throws on every single candidate and the catch silently returns null — meaning
      // no grid thumbnail ever appeared for any source, independent of the vb-capture playback bug
      // above. Requires the matching Access-Control-Allow-Origin on the VB media routes.
      crossOrigin="anonymous"
      className="w-full aspect-video bg-black rounded-xl"
    />
  );
}

export function VideoCandidatePicker({ open, onOpenChange, candidates, onRequestCandidates, onConfirm }: Props) {
  const t = useTranslations('party');
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<'cycle' | 'grid'>('cycle');
  const [gridSelected, setGridSelected] = useState<number | null>(null);
  // Real frames/durations captured off the actual playing <video> element (see captureVideoFrame
  // in CandidatePreview) — kept separate from `candidates` (server data) rather than mutated in,
  // since candidates is a prop and a given candidate's captured info can arrive well after the
  // initial render (only once playback actually starts). Keyed by index into `candidates`.
  const [captured, setCaptured] = useState<Record<number, { poster?: string; duration?: number }>>({});
  const captureCallbacks = useRef<Record<number, (info: { poster?: string; duration?: number }) => void>>({});
  function captureFor(i: number) {
    if (!captureCallbacks.current[i]) {
      captureCallbacks.current[i] = (info) => {
        setCaptured((prev) => ({ ...prev, [i]: { ...prev[i], ...info } }));
      };
    }
    return captureCallbacks.current[i];
  }
  // Same stable-per-index pattern as captureFor — a fresh closure every render would retrigger
  // CandidatePreview's load effect and restart the preview.
  const [failed, setFailed] = useState<Record<number, true>>({});
  const failCallbacks = useRef<Record<number, () => void>>({});
  function failFor(i: number) {
    if (!failCallbacks.current[i]) {
      failCallbacks.current[i] = () => setFailed((prev) => ({ ...prev, [i]: true }));
    }
    return failCallbacks.current[i];
  }
  // Same stable-per-index pattern — `false` = preview played but decoded no audio at all.
  const [audioInfo, setAudioInfo] = useState<Record<number, boolean>>({});
  const audioCallbacks = useRef<Record<number, (hasAudio: boolean) => void>>({});
  function audioFor(i: number) {
    if (!audioCallbacks.current[i]) {
      audioCallbacks.current[i] = (hasAudio) => setAudioInfo((prev) => ({ ...prev, [i]: hasAudio }));
    }
    return audioCallbacks.current[i];
  }

  // Fresh request + reset every time the dialog opens — a candidate set from a previous open (or
  // a previous videoUrl) shouldn't linger. onRequestCandidates is a stable useCallback off the
  // socket hook; only `open` should retrigger this.
  useEffect(() => {
    if (!open) return;
    setIndex(0);
    setMode('cycle');
    setGridSelected(null);
    setCaptured({});
    captureCallbacks.current = {};
    setFailed({});
    failCallbacks.current = {};
    setAudioInfo({});
    audioCallbacks.current = {};
    onRequestCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Tagged with the candidate index it counts for — a stale 0 left over from the previous
  // candidate must not instantly skip the next one before the reset lands.
  const [countdown, setCountdown] = useState({ i: -1, left: PICK_SECONDS_PER_CANDIDATE });

  function handleReject() {
    trackClick('room:candidate_reject');
    if (!candidates) return;
    if (index + 1 < candidates.length) {
      setIndex(index + 1);
    } else {
      setMode('grid');
    }
  }

  function handleConfirm(candidate: VideoCandidate) {
    trackClick('room:candidate_confirm');
    onConfirm(candidate);
    onOpenChange(false);
  }

  const loading = candidates === null;
  const empty = candidates !== null && candidates.length === 0;
  const current = candidates && candidates[index] ? candidates[index] : null;
  const gridCandidate = candidates && gridSelected !== null ? candidates[gridSelected] : null;
  const currentFailed = mode === 'cycle' && !!failed[index];

  // A dead candidate shouldn't make the owner stare at a black 0:00 frame — show why, then move
  // on by itself. Only in cycle mode, and only past the last one into the grid (same as Reject).
  useEffect(() => {
    if (!currentFailed || !candidates) return;
    const id = setTimeout(() => {
      if (index + 1 < candidates.length) setIndex(index + 1);
      else setMode('grid');
    }, FAILED_ADVANCE_MS);
    return () => clearTimeout(id);
  }, [currentFailed, index, candidates]);

  // Per-candidate countdown — restarts on every candidate change, runs only while a live preview
  // is on screen (a failed one already advances itself after FAILED_ADVANCE_MS).
  const countdownActive = open && mode === 'cycle' && !!current && !currentFailed;
  useEffect(() => {
    if (!countdownActive) return;
    setCountdown({ i: index, left: PICK_SECONDS_PER_CANDIDATE });
    const id = setInterval(() => setCountdown((c) => ({ ...c, left: Math.max(c.left - 1, 0) })), 1000);
    return () => clearInterval(id);
  }, [countdownActive, index]);
  useEffect(() => {
    if (!countdownActive || countdown.i !== index || countdown.left > 0 || !candidates) return;
    if (index + 1 < candidates.length) setIndex(index + 1);
    else setMode('grid');
  }, [countdownActive, countdown, index, candidates]);
  const secondsLeft = countdown.i === index ? countdown.left : PICK_SECONDS_PER_CANDIDATE;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="text-white max-w-lg border-white/[0.12]"
        style={{ background: 'rgba(8,6,18,0.92)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}
      >
        <DialogHeader>
          <DialogTitle className="text-white">{t('videoCandidatesTitle')}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {mode === 'cycle' ? t('videoCandidatesCycleHint') : t('videoCandidatesGridHint')}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="aspect-video flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-violet-400" />
          </div>
        )}

        {!loading && empty && (
          <div className="aspect-video bg-[#0A0A12] rounded-xl flex flex-col items-center justify-center gap-2">
            <Clapperboard size={24} className="text-violet-400/60" />
            <p className="text-slate-400 text-sm">{t('noOtherCandidates')}</p>
          </div>
        )}

        {!loading && !empty && mode === 'cycle' && current && (
          <div className="flex flex-col gap-3">
            {countdownActive && (
              <div className="flex flex-col gap-1.5">
                <p className="text-[12px] text-slate-300 tabular-nums">
                  {t('videoCandidateCountdown', { seconds: secondsLeft })}
                </p>
                <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full bg-violet-500 transition-[width] duration-1000 ease-linear"
                    style={{ width: `${(secondsLeft / PICK_SECONDS_PER_CANDIDATE) * 100}%` }}
                  />
                </div>
              </div>
            )}
            {current.confirmed && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 rounded-lg px-2.5 py-1.5 w-fit">
                <Check size={12} />
                {t('videoCandidateConfirmedBadge')}
              </div>
            )}
            {current.complete && (
              <div className="flex items-center gap-1.5 text-[11px] text-violet-300 bg-violet-500/10 rounded-lg px-2.5 py-1.5 w-fit">
                <Check size={12} />
                {t('videoCandidateComplete')}
              </div>
            )}
            <div className="relative">
              <CandidatePreview candidate={current} onCapture={captureFor(index)} onFailed={failFor(index)} onAudioInfo={audioFor(index)} />
              {currentFailed && (
                <div className="absolute inset-0 rounded-xl bg-black/80 flex flex-col items-center justify-center gap-2 px-4 text-center">
                  <XIcon size={22} className="text-red-400" />
                  <p className="text-slate-300 text-sm">{t('videoCandidateFailed')}</p>
                </div>
              )}
            </div>
            {audioInfo[index] === false && !currentFailed && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-500/10 rounded-lg px-2.5 py-1.5 w-fit">
                <span aria-hidden>🔇</span>
                {t('videoCandidateNoAudio')}
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 tabular-nums">
                {index + 1} / {candidates!.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  className="h-9 px-3 rounded-lg text-xs font-medium text-zinc-300 bg-white/[0.06] hover:bg-white/[0.1] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <XIcon size={13} />
                  {t('videoCandidateReject')}
                </button>
                <button
                  onClick={() => handleConfirm(current)}
                  className="h-9 px-3 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={13} />
                  {t('videoCandidateConfirm')}
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !empty && mode === 'grid' && (
          <div className="flex flex-col gap-3">
            {gridCandidate ? (
              <>
                <button
                  onClick={() => setGridSelected(null)}
                  className="self-start flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={12} />
                  {t('videoCandidateBack')}
                </button>
                <CandidatePreview candidate={gridCandidate} onCapture={captureFor(gridSelected!)} />
                <div className="flex justify-end">
                  <button
                    onClick={() => handleConfirm(gridCandidate)}
                    className="h-9 px-3 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check size={13} />
                    {t('videoCandidateConfirm')}
                  </button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                {candidates!.map((c, i) => {
                  // A real captured frame (only exists for candidates the owner has already
                  // previewed — see captureVideoFrame) always wins over the server-provided
                  // poster/duration: it's an actual frame of THIS video, not a guess.
                  const poster = captured[i]?.poster ?? c.poster;
                  const dur = fmtDuration(captured[i]?.duration ?? c.duration);
                  return (
                    <button
                      key={`${c.url}-${i}`}
                      onClick={() => { trackClick('room:candidate_grid_select'); setGridSelected(i); }}
                      className="relative aspect-video rounded-lg overflow-hidden bg-white/[0.04] border border-white/[0.08] hover:border-violet-500/40 transition-colors cursor-pointer flex items-center justify-center"
                    >
                      {poster ? (
                        // eslint-disable-next-line @next/next/no-img-element -- real captured video frame, or extractor/VB-provided poster URL
                        <img src={poster} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Clapperboard size={18} className="text-violet-400/50" />
                      )}
                      {dur && (
                        <span className="absolute bottom-1 right-1 text-[10px] px-1 rounded bg-black/70 text-white/80 tabular-nums">
                          {dur}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
