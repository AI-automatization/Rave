'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, X as XIcon, ArrowLeft, Clapperboard, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { trackClick } from '@/lib/analytics';
import { buildProxyUrl } from './VideoPlayer';
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

function fmtDuration(seconds?: number): string | null {
  if (!seconds || !isFinite(seconds) || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
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
}: {
  candidate: VideoCandidate;
  /** Real duration/poster pulled from the actual playing element — see captureVideoFrame above.
   *  Only fires once per successful capture; the caller merges this into candidate display data
   *  (grid thumbnails, duration badge) without mutating the server-provided candidate itself. */
  onCapture?: (info: { poster?: string; duration?: number }) => void;
}) {
  const t = useTranslations('party');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<import('hls.js').default | null>(null);
  const dashRef = useRef<import('dashjs').MediaPlayerClass | null>(null);

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
    video.addEventListener('loadedmetadata', reportDuration);
    video.addEventListener('timeupdate', tryCaptureFrame);

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
      }).catch(() => {});
    }).catch(() => {});

    return () => {
      cancelled = true;
      video.removeEventListener('loadedmetadata', reportDuration);
      video.removeEventListener('timeupdate', tryCaptureFrame);
      hlsRef.current?.destroy();
      hlsRef.current = null;
      dashRef.current?.reset();
      dashRef.current = null;
    };
  }, [candidate.url, candidate.type, onCapture]);

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
    onRequestCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
            <CandidatePreview candidate={current} onCapture={captureFor(index)} />
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
