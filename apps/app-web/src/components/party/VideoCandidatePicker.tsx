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

// Single-candidate local preview — plays ONE candidate URL in the owner's own browser only, no
// CHANGE_MEDIA emitted here (that only happens on confirm). Candidate URLs are already-resolved
// CDN URLs (mp4/hls), not page URLs, so this plays them directly instead of going through the
// full extraction pipeline VideoPlayer.tsx uses for room.videoUrl. `embed` candidates aren't a
// direct CDN URL at all — no local preview is possible for those, just the poster + confirm.
function CandidatePreview({ candidate }: { candidate: VideoCandidate }) {
  const t = useTranslations('party');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<import('hls.js').default | null>(null);
  const dashRef = useRef<import('dashjs').MediaPlayerClass | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || candidate.type === 'embed') return;
    let cancelled = false;

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
      hlsRef.current?.destroy();
      hlsRef.current = null;
      dashRef.current?.reset();
      dashRef.current = null;
    };
  }, [candidate.url, candidate.type]);

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

  // Fresh request + reset every time the dialog opens — a candidate set from a previous open (or
  // a previous videoUrl) shouldn't linger. onRequestCandidates is a stable useCallback off the
  // socket hook; only `open` should retrigger this.
  useEffect(() => {
    if (!open) return;
    setIndex(0);
    setMode('cycle');
    setGridSelected(null);
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
            <CandidatePreview candidate={current} />
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
                <CandidatePreview candidate={gridCandidate} />
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
                  const dur = fmtDuration(c.duration);
                  return (
                    <button
                      key={`${c.url}-${i}`}
                      onClick={() => { trackClick('room:candidate_grid_select'); setGridSelected(i); }}
                      className="relative aspect-video rounded-lg overflow-hidden bg-white/[0.04] border border-white/[0.08] hover:border-violet-500/40 transition-colors cursor-pointer flex items-center justify-center"
                    >
                      {c.poster ? (
                        // eslint-disable-next-line @next/next/no-img-element -- extractor/VB-provided poster URL or data URI
                        <img src={c.poster} alt="" className="w-full h-full object-cover" />
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
