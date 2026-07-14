'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Globe, ArrowRight, Users, X, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useCreateRoom } from '@/hooks/use-rooms';
import { toast } from '@/store/toast.store';
import { parseApiError } from '@/lib/api-error';
import { ApiError } from '@/lib/api-client';
import { trackClick } from '@/lib/analytics';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ── Platform interface ───────────────────────────────── */
interface Platform {
  id: string;
  name: string;
  base: string;
  renderIcon: (size: number) => ReactNode;
  color: string;
  bg: string;
  border: string;
  urlPattern?: RegExp;
}

/* ── Platform list ────────────────────────────────────── */
const PLATFORMS: Platform[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    base: 'https://youtube.com',
    renderIcon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    color: '#FF0000',
    bg: 'rgba(255,0,0,0.13)',
    border: 'rgba(255,0,0,0.32)',
    urlPattern: /youtube\.com|youtu\.be/,
  },
  {
    id: 'vk',
    name: 'VK Видео',
    base: 'https://vkvideo.ru',
    renderIcon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.712-1.033-1.01-1.49-.69-1.49.318v1.394H12.51c-2.785 0-4.52-1.814-4.52-5.008C7.99 9.42 9.754 7.5 12.58 7.5h1.542v1.572c0 .345.14.55.51.55.34 0 .55-.142.55-.55V7.5h1.748c1.035 0 1.497.49 1.497 1.553v4.988c0 .99-.346 1.47-1.05 1.47-.716 0-1.097-.49-1.097-1.47V12.57c0-1.17-.413-1.753-1.317-1.753-.883 0-1.317.583-1.317 1.753v1.493h-.002c0 .81.39 1.263 1.085 1.263.41 0 .738-.156.965-.465.27 2.11 2.037 2.262 2.037 2.262z"/>
      </svg>
    ),
    color: '#2787F5',
    bg: 'rgba(39,135,245,0.13)',
    border: 'rgba(39,135,245,0.32)',
    urlPattern: /vkvideo\.ru|vk\.com\/video/,
  },
  {
    id: 'rutube',
    name: 'Rutube',
    base: 'https://rutube.ru',
    renderIcon: (s) => (
      <svg width={s} height={s} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="50" fill="#E8232A"/>
        <path fill="white" d="M28 22h27c14.4 0 23 7.5 23 20 0 8.5-4.5 15-12 18l17 18H67L55 60H44v18H28V22zm16 27h11c6 0 9.5-3 9.5-7s-3.5-7-9.5-7H44v14z"/>
      </svg>
    ),
    color: '#E8232A',
    bg: 'rgba(232,35,42,0.13)',
    border: 'rgba(232,35,42,0.32)',
    urlPattern: /rutube\.ru/,
  },
  {
    id: 'cinerama',
    name: 'Cinerama',
    base: 'https://cinerama.uz',
    renderIcon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3zM8 17H6v-2h2zm0-4H6v-2h2zm0-4H6V7h2zm10 8h-2v-2h2zm0-4h-2v-2h2zm0-4h-2V7h2z"/>
        <path d="M11 8l-3 4 3 4h2l-3-4 3-4z"/>
      </svg>
    ),
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.13)',
    border: 'rgba(245,158,11,0.32)',
    urlPattern: /cinerama\.uz/,
  },
  {
    id: 'live',
    name: 'YouTube Live',
    base: 'https://youtube.com/results?search_query=live',
    renderIcon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="5" fill="#FF0000"/>
        <path fill="white" d="M17.5 6.5h-11C5.67 6.5 5 7.17 5 8v8c0 .83.67 1.5 1.5 1.5h11c.83 0 1.5-.67 1.5-1.5V8c0-.83-.67-1.5-1.5-1.5zM10 15V9l5 3-5 3z"/>
        <circle cx="19.5" cy="4.5" r="3" fill="#00C853"/>
      </svg>
    ),
    color: '#FF0000',
    bg: 'rgba(255,0,0,0.10)',
    border: 'rgba(255,0,0,0.25)',
    urlPattern: /youtube\.com\/.*live/,
  },
  {
    id: 'web',
    name: 'Web',
    base: '',
    renderIcon: (s) => <Globe size={s} />,
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.13)',
    border: 'rgba(96,165,250,0.32)',
  },
];

/* ── Map UI platform IDs → backend VideoPlatform values ─────────── */
const PLATFORM_TO_BACKEND: Record<string, string> = {
  youtube: 'youtube',
  vk:      'vk',
  rutube:  'rutube',
  live:    'youtube',  // YouTube Live
  cinerama:'other',
  web:     'other',
};

/* ── Extraction pre-fetch (warms Redis cache before room opens) ─── */
const YOUTUBE_RE = /youtube\.com|youtu\.be/;

function prefetchExtraction(url: string): void {
  if (!url || YOUTUBE_RE.test(url)) return; // YouTube uses iframe, no extraction
  fetch('/api/content/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ url }),
  }).catch(() => { /* fire-and-forget */ });
}

/* ── Title + thumbnail fetcher ───────────────────────── */
interface VideoMeta { title: string | null; thumbnail: string | null; }

async function fetchVideoMeta(url: string): Promise<VideoMeta> {
  try {
    if (/youtube\.com|youtu\.be/.test(url)) {
      const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
      if (r.ok) {
        const d = await r.json() as { title?: string; thumbnail_url?: string };
        return { title: d.title ?? null, thumbnail: d.thumbnail_url ?? null };
      }
    }
    if (/rutube\.ru/.test(url)) {
      const r = await fetch(`https://rutube.ru/api/oembed/?url=${encodeURIComponent(url)}&format=json`);
      if (r.ok) {
        const d = await r.json() as { title?: string; thumbnail_url?: string };
        return { title: d.title ?? null, thumbnail: d.thumbnail_url ?? null };
      }
    }
    return { title: null, thumbnail: null };
  } catch { return { title: null, thumbnail: null }; }
}

function detectPlatform(url: string): Platform | null {
  return PLATFORMS.find(p => p.urlPattern?.test(url)) ?? null;
}

/* ── Component ────────────────────────────────────────── */
export function CreateRoomDialog({ open, onOpenChange }: Props) {
  const t = useTranslations('room');
  const router = useRouter();
  const createRoom = useCreateRoom();

  const [videoUrl, setVideoUrl]               = useState('');
  const [videoTitle, setVideoTitle]           = useState('');
  const [videoThumbnail, setVideoThumbnail]   = useState<string | null>(null);
  const [activePlatform, setActivePlatform]   = useState<Platform | null>(null);
  const [clipDetected, setClipDetected]       = useState(false);
  const [titleLoading, setTitleLoading]       = useState(false);

  const urlRef        = useRef<HTMLInputElement>(null);
  const titleTimer    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const prefetchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* ── Clipboard auto-detect on open ────────────────── */
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (!text || !/^https?:\/\//i.test(text) || text.length > 500) return;
        const p = detectPlatform(text);
        if (!p) return;
        setVideoUrl(text);
        setActivePlatform(p);
        setClipDetected(true);
        prefetchExtraction(text); // warm cache immediately on clipboard detect
        setTitleLoading(true);
        const meta = await fetchVideoMeta(text);
        if (meta.title) setVideoTitle(meta.title);
        if (meta.thumbnail) setVideoThumbnail(meta.thumbnail);
        setTitleLoading(false);
      } catch { /* permission denied — normal */ }
    }, 200);
    return () => clearTimeout(timer);
  }, [open]);

  /* ── URL change ────────────────────────────────────── */
  const handleUrlChange = useCallback((url: string) => {
    setVideoUrl(url);
    setClipDetected(false);
    const p = detectPlatform(url);
    setActivePlatform(p);
    clearTimeout(titleTimer.current);
    clearTimeout(prefetchTimer.current);
    if (url.length > 12) {
      // Pre-fetch extraction with 600ms debounce so cache is warm before room opens
      if (!YOUTUBE_RE.test(url)) {
        prefetchTimer.current = setTimeout(() => prefetchExtraction(url), 600);
      }
      titleTimer.current = setTimeout(() => {
        setTitleLoading(true);
        void fetchVideoMeta(url).then(meta => {
          if (meta.title) setVideoTitle(meta.title);
          if (meta.thumbnail) setVideoThumbnail(meta.thumbnail);
          setTitleLoading(false);
        });
      }, 800);
    } else {
      setVideoTitle('');
    }
  }, []);

  /* ── Platform click → open in popup window ─────────── */
  function handlePlatformClick(platform: Platform) {
    setActivePlatform(platform);
    if (platform.base) {
      const popup = window.open(
        platform.base,
        'wewatch-browser',
        'width=1100,height=700,menubar=no,toolbar=yes,location=yes,status=no'
      );
      if (!popup) window.open(platform.base, '_blank');
    }
    setTimeout(() => urlRef.current?.focus(), 80);
  }

  /* ── Create room ────────────────────────────────────── */
  async function handleCreate(withoutVideo = false) {
    trackClick('create_room:submit', { withoutVideo });
    try {
      const backendPlatform = activePlatform?.id
        ? (PLATFORM_TO_BACKEND[activePlatform.id] ?? 'other')
        : undefined;
      const res = await createRoom.mutateAsync({
        // Backend `name` caps at 80 chars (Joi) — trim here, mirrors mobile's useMediaDetection slice(0, 60)
        name:             videoTitle ? videoTitle.slice(0, 60) : undefined,
        videoUrl:         withoutVideo ? undefined : (videoUrl || undefined),
        videoTitle:       withoutVideo ? undefined : (videoTitle || undefined),
        videoThumbnail:   withoutVideo ? undefined : (videoThumbnail || undefined),
        videoPlatform:    withoutVideo ? undefined : backendPlatform,
      });
      onOpenChange(false);
      const id = res.data?._id;
      if (id) router.push(`/room/${id}`);
    } catch (err) {
      // Backend enforces one active room per owner (T-S108): a 409 ROOM_ALREADY_EXISTS means the
      // user already has an open room. Reopen it instead of failing silently (mirrors mobile) —
      // this was the "create button spins then does nothing" bug: a stale room blocked creation.
      if (err instanceof ApiError && err.status === 409) {
        const roomId = (err.data as { data?: { roomId?: string } })?.data?.roomId;
        if (roomId) {
          onOpenChange(false);
          toast.info(t('alreadyHaveRoom'));
          router.push(`/room/${roomId}`);
          return;
        }
      }
      toast.error(parseApiError(err, t('createError')));
    }
  }

  function handleClose() {
    onOpenChange(false);
    clearTimeout(titleTimer.current);
    clearTimeout(prefetchTimer.current);
    setVideoUrl('');
    setVideoTitle('');
    setVideoThumbnail(null);
    setActivePlatform(null);
    setClipDetected(false);
    setTitleLoading(false);
  }

  const hintText = activePlatform
    ? activePlatform.id === 'web'
      ? t('hintWeb')
      : `${t('hintPlatform')} (${activePlatform.name})`
    : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0C0B18] border-white/[0.07] text-white max-w-[460px] p-0 overflow-hidden rounded-2xl">

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-[15px] font-semibold text-white text-center">
            {t('sourceTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-5 pb-5 pt-4">

          {/* Clipboard detected banner */}
          {clipDetected && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-[12px] text-violet-300">
              <span className="shrink-0">📋</span>
              <span className="flex-1 truncate">{t('clipboardDetected')}</span>
              <button
                onClick={() => { setClipDetected(false); setVideoUrl(''); setVideoTitle(''); setActivePlatform(null); }}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* URL input row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              {activePlatform && (
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center"
                  style={{ color: activePlatform.color }}
                >
                  {activePlatform.renderIcon(16)}
                </span>
              )}
              <input
                ref={urlRef}
                type="url"
                value={videoUrl}
                onChange={e => handleUrlChange(e.target.value)}
                placeholder="https://..."
                className="w-full h-12 bg-[#111118] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                style={{ paddingLeft: activePlatform ? '2.5rem' : '1rem', paddingRight: '1rem' }}
              />
            </div>
            <button
              onClick={() => void handleCreate()}
              disabled={!videoUrl || createRoom.isPending}
              className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#5B21B6)' }}
            >
              {createRoom.isPending
                ? <Loader2 size={18} className="animate-spin" />
                : <ArrowRight size={18} />}
            </button>
          </div>

          {/* Video title preview */}
          {(videoTitle || titleLoading) && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[12px]">
              {titleLoading
                ? <Loader2 size={12} className="animate-spin text-slate-500 shrink-0" />
                : <span className="text-slate-500 shrink-0">▶</span>}
              <span className="text-slate-300 truncate">{titleLoading ? '...' : videoTitle}</span>
            </div>
          )}

          {/* Hint */}
          {hintText && !clipDetected && (
            <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <ExternalLink size={11} className="shrink-0" />
              {hintText}
            </p>
          )}

          {/* Platform grid — 3 columns */}
          <div className="grid grid-cols-3 gap-3">
            {PLATFORMS.map(platform => {
              const isActive = activePlatform?.id === platform.id;
              return (
                <button
                  key={platform.id}
                  onClick={() => { trackClick('create_room:platform', { platform: platform.id }); handlePlatformClick(platform); }}
                  className="flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl border transition-all duration-150 active:scale-95 cursor-pointer"
                  style={{
                    background: isActive ? platform.bg : 'rgba(255,255,255,0.03)',
                    borderColor: isActive ? platform.border : 'rgba(255,255,255,0.06)',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = platform.bg;
                      e.currentTarget.style.borderColor = platform.border;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    }
                  }}
                >
                  <span style={{ color: platform.color }}>
                    {platform.renderIcon(32)}
                  </span>
                  <span
                    className="text-[11px] font-medium leading-none text-center"
                    style={{ color: isActive ? '#e2e8f0' : '#64748b' }}
                  >
                    {platform.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.05]" />

          {/* Create without video */}
          <button
            onClick={() => void handleCreate(true)}
            disabled={createRoom.isPending}
            className="w-full h-10 rounded-xl border border-white/[0.08] text-sm font-medium text-slate-400 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Users size={14} />
            {t('noMedia')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
