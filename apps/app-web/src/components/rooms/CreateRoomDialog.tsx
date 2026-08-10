'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Globe, ArrowRight, ArrowLeft, Users, X, ExternalLink, Search, ChevronDown, Link2, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useCreateRoom } from '@/hooks/use-rooms';
import { toast } from '@/store/toast.store';
import { useApiError } from '@/hooks/use-api-error';
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
    id: 'twitch',
    name: 'Twitch',
    base: 'https://twitch.tv',
    renderIcon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0 1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
      </svg>
    ),
    color: '#9146FF',
    bg: 'rgba(145,70,255,0.13)',
    border: 'rgba(145,70,255,0.32)',
    urlPattern: /twitch\.tv/,
  },
  {
    id: 'vimeo',
    name: 'Vimeo',
    base: 'https://vimeo.com',
    renderIcon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197a315.065 315.065 0 0 0 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.179 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.753 6.762-5.674 2.473.06 3.628 1.664 3.494 4.844Z"/>
      </svg>
    ),
    color: '#1AB7EA',
    bg: 'rgba(26,183,234,0.13)',
    border: 'rgba(26,183,234,0.32)',
    urlPattern: /vimeo\.com/,
  },
  {
    id: 'dailymotion',
    name: 'Dailymotion',
    base: 'https://dailymotion.com',
    renderIcon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.5 0h-17A3.5 3.5 0 0 0 0 3.5v17A3.5 3.5 0 0 0 3.5 24h17a3.5 3.5 0 0 0 3.5-3.5v-17A3.5 3.5 0 0 0 20.5 0Zm-2.34 18.3h-2.87v-1.28h-.04c-.5.94-1.6 1.52-2.75 1.52-2.7 0-4.5-2.12-4.5-4.85 0-2.5 1.66-4.84 4.32-4.84 1.1 0 2.2.44 2.83 1.32h.04V4.5h3l-.03 13.8Zm-4.9-2.15c1.34 0 2.05-1.13 2.05-2.36 0-1.26-.68-2.4-2.05-2.4-1.36 0-1.98 1.19-1.98 2.4 0 1.19.66 2.36 1.98 2.36Z"/>
      </svg>
    ),
    color: '#00D3FF',
    bg: 'rgba(0,211,255,0.13)',
    border: 'rgba(0,211,255,0.32)',
    urlPattern: /dailymotion\.com|dai\.ly/,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    base: 'https://tiktok.com',
    renderIcon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.6 5.82c-1.01-.98-1.56-2.29-1.56-3.66h-3.13v13.7a2.7 2.7 0 0 1-4.86 1.62 2.7 2.7 0 0 1 2.16-4.32c.29 0 .58.04.85.13V9.99a5.9 5.9 0 0 0-.85-.06 5.83 5.83 0 0 0-5.83 5.83 5.83 5.83 0 0 0 5.83 5.83 5.83 5.83 0 0 0 5.83-5.83V9.03a9.4 9.4 0 0 0 5.5 1.76V7.66a5.7 5.7 0 0 1-3.94-1.84Z"/>
      </svg>
    ),
    color: '#25F4EE',
    bg: 'rgba(37,244,238,0.13)',
    border: 'rgba(37,244,238,0.32)',
    urlPattern: /tiktok\.com/,
  },
  {
    id: 'peertube',
    name: 'PeerTube',
    base: 'https://framatube.org',
    renderIcon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-2 14.5v-9l7 4.5-7 4.5Z"/>
      </svg>
    ),
    color: '#F1680D',
    bg: 'rgba(241,104,13,0.13)',
    border: 'rgba(241,104,13,0.32)',
    urlPattern: /\/videos\/watch\/[0-9a-f-]{36}|\/w\/[a-zA-Z0-9]{22}$/,
  },
  {
    id: 'trovo',
    name: 'Trovo',
    base: 'https://trovo.live',
    renderIcon: (s) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2 2 7v10l10 5 10-5V7L12 2Zm0 2.24 7 3.5v7.52l-7 3.5-7-3.5V7.74l7-3.5ZM9.5 8v8l7-4-7-4Z"/>
      </svg>
    ),
    color: '#19D66B',
    bg: 'rgba(25,214,107,0.13)',
    border: 'rgba(25,214,107,0.32)',
    urlPattern: /trovo\.live/,
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
  twitch:  'twitch',
  vimeo:   'vimeo',
  dailymotion: 'dailymotion',
  tiktok: 'tiktok',
  peertube: 'peertube',
  trovo: 'trovo',
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

// oEmbed providers (Rutube in particular) sometimes return a protocol-relative thumbnail_url
// ("//pic.rutube.ru/..."). It renders fine in an <img> (browsers resolve it against the current
// page's protocol) but backend Joi validation (videoThumbnail: Joi.string().uri()) requires an
// explicit scheme and rejects it with a 422 — silently failing the whole room-create request.
// Normalize to an absolute https URL here, or drop it entirely if it's not a usable URL at all
// (a broken thumbnail is cosmetic; failing to create the room over it is not acceptable).
function toAbsoluteThumbnailUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : raw.startsWith('//') ? `https:${raw}` : `https://${raw}`;
  try { new URL(withScheme); return withScheme; } catch { return null; }
}

async function fetchVideoMeta(url: string): Promise<VideoMeta> {
  try {
    if (/youtube\.com|youtu\.be/.test(url)) {
      const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
      if (r.ok) {
        const d = await r.json() as { title?: string; thumbnail_url?: string };
        return { title: d.title ?? null, thumbnail: toAbsoluteThumbnailUrl(d.thumbnail_url) };
      }
    }
    if (/rutube\.ru/.test(url)) {
      const r = await fetch(`https://rutube.ru/api/oembed/?url=${encodeURIComponent(url)}&format=json`);
      if (r.ok) {
        const d = await r.json() as { title?: string; thumbnail_url?: string };
        return { title: d.title ?? null, thumbnail: toAbsoluteThumbnailUrl(d.thumbnail_url) };
      }
    }
    return { title: null, thumbnail: null };
  } catch { return { title: null, thumbnail: null }; }
}

function detectPlatform(url: string): Platform | null {
  return PLATFORMS.find(p => p.urlPattern?.test(url)) ?? null;
}

/* ── In-app search — mirrors mobile's contentApi.searchVideos (apps/mobile/src/api/content.api.ts).
   Backend (services/content/src/services/videoSearch.service.ts) covers YouTube (official Data
   API v3)/Rutube/VK/Dailymotion (official public API)/PeerTube (SepiaSearch)/YouTube Live —
   Twitch/Vimeo would need their own registered OAuth app credentials we don't have, TikTok has no
   usable public search API, and Trovo/Cinerama/Web have no video-level search API to call at all.
   Those keep the popup-window-then-paste-link flow instead of focusing this input. ── */
interface VideoSearchItem {
  title: string;
  thumbnail: string;
  url: string;
  platform: 'youtube' | 'rutube' | 'vk' | 'dailymotion' | 'peertube' | 'live';
  duration?: number;
  viewCount?: number;
}

const SEARCHABLE_PLATFORM_IDS = new Set(['youtube', 'rutube', 'vk', 'dailymotion', 'peertube', 'live']);

// Idle-state brand tint, derived from each platform's own `color` hex — so the resting grid
// tile carries a whisper of brand identity instead of looking identical (flat gray) for every
// platform until hovered. Doesn't touch platform.bg/border (those stay the stronger hover/active
// treatment already tuned per platform).
function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return `rgba(255,255,255,${alpha})`;
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16));
  return `rgba(${r},${g},${b},${alpha})`;
}

function fmtDuration(s: number | undefined): string | null {
  if (!s || !isFinite(s) || s <= 0) return null;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    : `${m}:${sec.toString().padStart(2, '0')}`;
}

/* ── Top sources shown up-front — the rest live behind "Other sources". A user thinks "what
   are we watching", not "which of these 12 logos is mine" — narrowing the first-glance choice
   to the platforms people actually use most keeps the decision fast without removing anything
   (Rutube/Vimeo/etc. are one click away under the toggle, not deleted). ── */
const TOP_PLATFORM_IDS = ['youtube', 'tiktok', 'vk', 'twitch'];

/* ── Component ────────────────────────────────────────── */
export function CreateRoomDialog({ open, onOpenChange }: Props) {
  const t = useTranslations('room');
  const parseError = useApiError();
  const router = useRouter();
  const createRoom = useCreateRoom();

  const [step, setStep]                       = useState<1 | 2>(1);
  const [videoUrl, setVideoUrl]               = useState('');
  const [videoTitle, setVideoTitle]           = useState('');
  const [videoThumbnail, setVideoThumbnail]   = useState<string | null>(null);
  const [activePlatform, setActivePlatform]   = useState<Platform | null>(null);
  const [clipDetected, setClipDetected]       = useState(false);
  const [titleLoading, setTitleLoading]       = useState(false);
  const [searchQuery, setSearchQuery]         = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showOtherSources, setShowOtherSources] = useState(false);
  const [roomName, setRoomName]               = useState('');
  const [isPrivate, setIsPrivate]             = useState(false);

  const urlRef        = useRef<HTMLInputElement>(null);
  const searchRef     = useRef<HTMLInputElement>(null);
  const titleTimer    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const prefetchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* ── In-app search (YouTube/Rutube/VK) — debounced ─── */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults = [], isFetching: searchLoading } = useQuery<VideoSearchItem[]>({
    queryKey: ['video-search', debouncedSearch],
    queryFn: async () => {
      const res = await fetch(`/api/content/search?q=${encodeURIComponent(debouncedSearch)}`, { credentials: 'include' });
      if (!res.ok) return [];
      const data = await res.json() as { data?: VideoSearchItem[] };
      return data.data ?? [];
    },
    enabled: open && debouncedSearch.length >= 2,
    staleTime: 60_000,
  });

  function handleSelectSearchResult(item: VideoSearchItem) {
    trackClick('create_room:search_select', { platform: item.platform });
    setVideoUrl(item.url);
    setVideoTitle(item.title);
    setVideoThumbnail(toAbsoluteThumbnailUrl(item.thumbnail));
    setActivePlatform(detectPlatform(item.url));
    setSearchQuery('');
    prefetchExtraction(item.url);
    setRoomName(item.title.slice(0, 60));
    setStep(2);
  }

  /* ── Advance to step 2 (room name + visibility) — pre-fills the editable name from whatever
     title we resolved in step 1, but only once (roomName stays untouched if the user already
     typed something and goes back-and-forth between steps).
     No "create without video" path — the backend requires either movieId or videoUrl on every
     room (services/watch-party/src/services/watchParty.service.ts:90-92, BadRequestError if
     both are missing), confirmed live: the old "Создать без видео" button 400'd every time. ── */
  function goToStep2() {
    trackClick('create_room:go_step2');
    setRoomName((prev) => prev || videoTitle.slice(0, 60));
    setStep(2);
  }

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
    // Youtube/Rutube/VK have in-app search (below) — no need to send the user to a popup window
    // to find a link and paste it back.
    if (SEARCHABLE_PLATFORM_IDS.has(platform.id)) {
      setTimeout(() => searchRef.current?.focus(), 80);
      return;
    }
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
  async function handleCreate() {
    trackClick('create_room:submit', { isPrivate });
    try {
      const backendPlatform = activePlatform?.id
        ? (PLATFORM_TO_BACKEND[activePlatform.id] ?? 'other')
        : undefined;
      // The url input has no <form>, so the browser's native URL validation never runs —
      // a bare paste like "youtube.com/watch?v=..." (no scheme) reaches here as-is and fails
      // backend Joi's videoUrl.uri() check with a 422 the user never sees the reason for
      // (button just resets). Normalize before sending, same as mobile's URL handling.
      const normalizedVideoUrl = videoUrl && !/^https?:\/\//i.test(videoUrl)
        ? `https://${videoUrl}`
        : videoUrl;
      // Safety net alongside toAbsoluteThumbnailUrl (used when storing it from fetchVideoMeta):
      // re-validate here too so a malformed thumbnail can never 422 the whole room-create request.
      const safeThumbnail = videoThumbnail ? toAbsoluteThumbnailUrl(videoThumbnail) : null;
      const res = await createRoom.mutateAsync({
        // Backend `name` caps at 80 chars (Joi) — trim here, mirrors mobile's useMediaDetection slice(0, 60)
        name:             roomName ? roomName.slice(0, 60) : undefined,
        videoUrl:         normalizedVideoUrl || undefined,
        videoTitle:       videoTitle || undefined,
        videoThumbnail:   safeThumbnail || undefined,
        videoPlatform:    backendPlatform,
        isPrivate,
      });
      onOpenChange(false);
      const id = res.data?._id;
      // Backend now starts VB server-side directly at room creation for any non-embed URL
      // (watchParty.controller.ts createRoom, 2026-08-10) — the old ?verify=1 client round-trip
      // (re-submit through CHANGE_MEDIA once the socket connects) is no longer needed and has
      // been removed; it also never existed on mobile, so this was a web-only fix for a bug that
      // no longer exists.
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
      toast.error(parseError(err, t('createError')));
    }
  }

  function handleClose() {
    onOpenChange(false);
    clearTimeout(titleTimer.current);
    clearTimeout(prefetchTimer.current);
    setStep(1);
    setVideoUrl('');
    setVideoTitle('');
    setVideoThumbnail(null);
    setActivePlatform(null);
    setClipDetected(false);
    setTitleLoading(false);
    setSearchQuery('');
    setShowOtherSources(false);
    setRoomName('');
    setIsPrivate(false);
  }

  const hintText = activePlatform
    ? activePlatform.id === 'web'
      ? t('hintWeb')
      : `${t('hintPlatform')} (${activePlatform.name})`
    : null;

  const topPlatforms = PLATFORMS.filter(p => TOP_PLATFORM_IDS.includes(p.id));
  const otherPlatforms = PLATFORMS.filter(p => !TOP_PLATFORM_IDS.includes(p.id));
  const canAdvance = !!videoUrl && !titleLoading;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0C0B18] border-white/[0.07] text-white max-w-[620px] p-0 overflow-hidden rounded-2xl">

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-[15px] font-semibold text-white text-center">
            {step === 1 ? t('whatToWatch') : t('createTitle')}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
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

            {/* URL input row — arrow now advances to step 2 (room name + visibility) instead of
                creating immediately, so every room (video or not) goes through the same "who can
                join" question. */}
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
                onClick={goToStep2}
                disabled={!canAdvance}
                className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#5B21B6)' }}
              >
                {titleLoading
                  ? <Loader2 size={18} className="animate-spin" />
                  : <ArrowRight size={18} />}
              </button>
            </div>

            {/* In-app search — YouTube/Rutube/VK, no need to leave the site to find a link */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full h-11 pl-9 pr-3 bg-[#111118] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
              />
            </div>

            {debouncedSearch.length >= 2 && (
              <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
                {searchLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={16} className="animate-spin text-slate-500" />
                  </div>
                )}
                {!searchLoading && searchResults.length === 0 && (
                  <p className="text-center py-4 text-[12px] text-slate-500">{t('searchNoResults')}</p>
                )}
                {!searchLoading && searchResults.map((item, idx) => {
                  const itemPlatform = PLATFORMS.find(p => p.id === item.platform);
                  return (
                  <button
                    key={`${item.url}-${idx}`}
                    onClick={() => handleSelectSearchResult(item)}
                    className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors text-left cursor-pointer"
                  >
                    <div className="relative w-20 h-11 rounded-md overflow-hidden shrink-0 bg-black/40">
                      {item.thumbnail && (
                        // eslint-disable-next-line @next/next/no-img-element -- external thumbnails from arbitrary platforms, next/image domain allowlist not worth it here
                        <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                      )}
                      {fmtDuration(item.duration) && (
                        <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/80 text-[9px] text-white tabular-nums">
                          {fmtDuration(item.duration)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-slate-200 truncate leading-tight">{item.title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {itemPlatform && (
                          <span style={{ color: itemPlatform.color }} className="shrink-0 flex items-center">
                            {itemPlatform.renderIcon(10)}
                          </span>
                        )}
                        <p className="text-[10px] text-slate-500">{itemPlatform?.name ?? item.platform}</p>
                      </div>
                    </div>
                  </button>
                  );
                })}
              </div>
            )}

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

            {/* Top sources — 4 columns, just the platforms most people actually use. Idle tile
                carries a faint wash of the platform's own color (hexToRgba) instead of flat
                neutral gray. Small search-glyph badge marks which platforms search in-app vs.
                pop out a browser window. */}
            <div className="grid grid-cols-4 gap-3">
              {topPlatforms.map(platform => {
                const isActive = activePlatform?.id === platform.id;
                const canSearch = SEARCHABLE_PLATFORM_IDS.has(platform.id);
                const idleBg = hexToRgba(platform.color, 0.05);
                const idleBorder = hexToRgba(platform.color, 0.16);
                return (
                  <button
                    key={platform.id}
                    onClick={() => { trackClick('create_room:platform', { platform: platform.id }); handlePlatformClick(platform); }}
                    className="relative flex flex-col items-center gap-2 py-3.5 px-2 rounded-2xl border transition-all duration-150 active:scale-95 cursor-pointer"
                    style={{
                      background: isActive ? platform.bg : idleBg,
                      borderColor: isActive ? platform.border : idleBorder,
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = platform.bg;
                        e.currentTarget.style.borderColor = platform.border;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = idleBg;
                        e.currentTarget.style.borderColor = idleBorder;
                      }
                    }}
                  >
                    {canSearch && (
                      <span
                        className="absolute top-1.5 right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-white/[0.06]"
                        title={t('searchAvailable')}
                      >
                        <Search size={9} className="text-zinc-400" />
                      </span>
                    )}
                    <span style={{ color: platform.color }}>
                      {platform.renderIcon(26)}
                    </span>
                    <span
                      className="text-[10px] font-medium leading-none text-center"
                      style={{ color: isActive ? '#e2e8f0' : '#64748b' }}
                    >
                      {platform.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Other sources — collapsed by default (spec: don't make the user scan 12 logos
                to answer "what are we watching"). Same tile treatment, just hidden until asked for. */}
            <button
              onClick={() => setShowOtherSources(v => !v)}
              className="flex items-center justify-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer py-1"
            >
              {t('otherSources')}
              <ChevronDown size={13} className={`transition-transform ${showOtherSources ? 'rotate-180' : ''}`} />
            </button>

            {showOtherSources && (
              <div className="grid grid-cols-4 gap-3">
                {otherPlatforms.map(platform => {
                  const isActive = activePlatform?.id === platform.id;
                  const canSearch = SEARCHABLE_PLATFORM_IDS.has(platform.id);
                  const idleBg = hexToRgba(platform.color, 0.05);
                  const idleBorder = hexToRgba(platform.color, 0.16);
                  return (
                    <button
                      key={platform.id}
                      onClick={() => { trackClick('create_room:platform', { platform: platform.id }); handlePlatformClick(platform); }}
                      className="relative flex flex-col items-center gap-2 py-3.5 px-2 rounded-2xl border transition-all duration-150 active:scale-95 cursor-pointer"
                      style={{
                        background: isActive ? platform.bg : idleBg,
                        borderColor: isActive ? platform.border : idleBorder,
                      }}
                      onMouseEnter={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = platform.bg;
                          e.currentTarget.style.borderColor = platform.border;
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = idleBg;
                          e.currentTarget.style.borderColor = idleBorder;
                        }
                      }}
                    >
                      {canSearch && (
                        <span
                          className="absolute top-1.5 right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-white/[0.06]"
                          title={t('searchAvailable')}
                        >
                          <Search size={9} className="text-zinc-400" />
                        </span>
                      )}
                      <span style={{ color: platform.color }}>
                        {platform.renderIcon(26)}
                      </span>
                      <span
                        className="text-[10px] font-medium leading-none text-center"
                        style={{ color: isActive ? '#e2e8f0' : '#64748b' }}
                      >
                        {platform.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4 px-5 pb-5 pt-4">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer self-start"
            >
              <ArrowLeft size={13} />
              {t('backBtn')}
            </button>

            {/* Video preview — step 1 always resolves a video now (no "skip video" path) */}
            {videoTitle && (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <div className="relative w-20 h-11 rounded-md overflow-hidden shrink-0 bg-black/40">
                  {videoThumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element -- external thumbnail
                    <img src={videoThumbnail} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-slate-200 truncate leading-tight">{videoTitle}</p>
                  {activePlatform && (
                    <div className="flex items-center gap-1 mt-1">
                      <span style={{ color: activePlatform.color }} className="shrink-0 flex items-center">
                        {activePlatform.renderIcon(10)}
                      </span>
                      <p className="text-[10px] text-slate-500">{activePlatform.name}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Room name — editable, pre-filled from the video title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-slate-400">{t('roomName')}</label>
              <input
                type="text"
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                placeholder={t('roomNamePlaceholder')}
                maxLength={60}
                className="w-full h-11 px-3.5 bg-[#111118] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
              />
            </div>

            {/* Visibility — the only two states the backend actually supports (isPrivate).
                A public room means anyone with the room list access can join; private means
                invite-link only. */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-slate-400">{t('whoCanJoin')}</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setIsPrivate(false)}
                  className={`flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    !isPrivate ? 'bg-violet-500/[0.1] border-violet-500/30' : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.16]'
                  }`}
                >
                  <Users size={15} className={!isPrivate ? 'text-violet-300' : 'text-zinc-500'} />
                  <span className={`text-[13px] font-medium ${!isPrivate ? 'text-white' : 'text-zinc-300'}`}>{t('visibilityPublic')}</span>
                  <span className="text-[11px] text-zinc-500 leading-snug">{t('visibilityPublicDesc')}</span>
                </button>
                <button
                  onClick={() => setIsPrivate(true)}
                  className={`flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isPrivate ? 'bg-violet-500/[0.1] border-violet-500/30' : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.16]'
                  }`}
                >
                  <Lock size={15} className={isPrivate ? 'text-violet-300' : 'text-zinc-500'} />
                  <span className={`text-[13px] font-medium ${isPrivate ? 'text-white' : 'text-zinc-300'}`}>{t('visibilityPrivate')}</span>
                  <span className="text-[11px] text-zinc-500 leading-snug">{t('visibilityPrivateDesc')}</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => void handleCreate()}
              disabled={createRoom.isPending}
              className="w-full h-12 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#5B21B6)' }}
            >
              {createRoom.isPending
                ? <><Loader2 size={16} className="animate-spin" />{t('creating')}</>
                : <><Link2 size={15} />{t('createBtn')}</>}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
