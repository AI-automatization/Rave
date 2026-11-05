'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ArrowLeft, Users, X, ExternalLink, Search, ChevronDown, Link2, Lock } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useCreateRoom } from '@/hooks/use-rooms';
import { toast } from '@/store/toast.store';
import { useApiError } from '@/hooks/use-api-error';
import { ApiError } from '@/lib/api-client';
import { trackClick } from '@/lib/analytics';
import { trackRoomCreated } from '@/lib/measurement-events';
import { resolveLinkPlatform, normalizeLinkInput } from '@/lib/link-routing';
import { useDesktopVbPicker, opensInPicker } from '@/hooks/use-desktop-vb-picker';
import { VbPickerOverlay } from '@/components/desktop/VbPickerOverlay';
import {
  PLATFORMS, TOP_PLATFORM_IDS, PlatformTile, detectPlatform, openPlatformPopup, platformStartUrl,
} from './platforms';
import type { Platform } from './platforms';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ── Map UI platform IDs → backend VideoPlatform values ─────────── */
const PLATFORM_TO_BACKEND: Record<string, string> = {
  youtube: 'youtube',
  vk:      'vk',
  rutube:  'rutube',
  twitch:  'twitch',
  vimeo:   'vimeo',
  dailymotion: 'dailymotion',
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
  platform: 'youtube' | 'rutube' | 'vk' | 'dailymotion' | 'peertube' | 'live' | 'archive';
  duration?: number;
  viewCount?: number;
}

const SEARCHABLE_PLATFORM_IDS = new Set(['youtube', 'rutube', 'vk', 'dailymotion', 'peertube', 'live']);

function fmtDuration(s: number | undefined): string | null {
  if (!s || !isFinite(s) || s <= 0) return null;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    : `${m}:${sec.toString().padStart(2, '0')}`;
}

/* ── Component ────────────────────────────────────────── */
export function CreateRoomDialog({ open, onOpenChange }: Props) {
  const t = useTranslations('room');
  const locale = useLocale();
  const parseError = useApiError();
  const router = useRouter();
  const createRoom = useCreateRoom();
  // True while the pasted link is being checked for iframe-embeddability (before the room request).
  const [checkingLink, setCheckingLink] = useState(false);

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
  // What "Take video" brought along with the link, tied to the url it came with — any later edit of
  // the link drops it (compared at submit). referer = the site page a player iframe sat on (the
  // server opens the player with it); stream = the film's playlist/file the panel saw on the network.
  const [picked, setPicked]                   = useState<{ url: string; referer?: string; stream?: { url: string; type: 'hls' | 'dash' | 'mp4' } } | null>(null);

  const urlRef        = useRef<HTMLInputElement>(null);
  const searchRef     = useRef<HTMLInputElement>(null);
  const titleTimer    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const prefetchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* ── Desktop app: a platform (or a pasted film-site link) opens in the browser panel inside this
     window; the video the user opens there comes straight back here (no copy-paste). The panel
     closes right after — it only finds the link. ── */
  const pickToken = useRef(0);
  const vbPicker = useDesktopVbPicker((url, pageTitle, referer, stream) => {
    trackClick('create_room:vb_pick');
    const token = ++pickToken.current;
    clearTimeout(titleTimer.current);
    clearTimeout(prefetchTimer.current);
    setVideoUrl(url);
    setPicked(referer || stream
      ? { url, referer, stream: stream ? { url: stream.url, type: stream.type } : undefined }
      : null);
    setClipDetected(false);
    setActivePlatform(detectPlatform(url));
    setVideoTitle(pageTitle ?? '');
    setVideoThumbnail(null);
    setRoomName((prev) => prev || (pageTitle ?? '').slice(0, 60));
    prefetchExtraction(url);
    setStep(2);
    setTitleLoading(true);
    void fetchVideoMeta(url).then((meta) => {
      if (token !== pickToken.current) return; // dialog closed or another pick since
      if (meta.title) {
        const title = meta.title;
        setVideoTitle(title);
        setRoomName((prev) => prev || title.slice(0, 60));
      }
      if (meta.thumbnail) setVideoThumbnail(meta.thumbnail);
      setTitleLoading(false);
    });
  });

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
    // Desktop app + a link to an ordinary site (a film site, an own source): open it in the browser
    // panel first — the user starts the film there and we take its player, not the whole page.
    const link = normalizeLinkInput(videoUrl);
    if (vbPicker.canPick() && opensInPicker(link)) {
      trackClick('create_room:link_vb');
      void vbPicker.start(link).then((ok) => { if (!ok) toast.error(t('vbPickFailed')); });
      return;
    }
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

  /* ── Platform click → its site (browser panel in the desktop app, a popup window on the web) ── */
  function handlePlatformClick(platform: Platform) {
    trackClick('create_room:platform', { platform: platform.id });
    setActivePlatform(platform);
    // Desktop app: the platform's own site in the browser panel ('web' starts at a search page).
    if (vbPicker.canPick()) {
      trackClick('create_room:platform_vb', { platform: platform.id });
      void vbPicker.start(platformStartUrl(platform)).then((ok) => {
        if (!ok) toast.error(t('vbPickFailed'));
      });
      return;
    }
    // Youtube/Rutube/VK have in-app search (below) — no need to send the user to a popup window
    // to find a link and paste it back.
    if (SEARCHABLE_PLATFORM_IDS.has(platform.id)) {
      setTimeout(() => searchRef.current?.focus(), 80);
      return;
    }
    openPlatformPopup(platform);
    setTimeout(() => urlRef.current?.focus(), 80);
  }

  /* ── Create room ────────────────────────────────────── */
  async function handleCreate() {
    if (checkingLink) return;
    trackClick('create_room:submit', { isPrivate });
    const pickedUrl = normalizeLinkInput(videoUrl);
    try {
      const backendPlatform = activePlatform?.id
        ? (PLATFORM_TO_BACKEND[activePlatform.id] ?? 'other')
        : undefined;
      // The url input has no <form>, so the browser's native URL validation never runs —
      // a bare paste like "youtube.com/watch?v=..." (no scheme) reaches here as-is and fails
      // backend Joi's videoUrl.uri() check with a 422 the user never sees the reason for
      // (button just resets). Normalize before sending, same as mobile's URL handling.
      const normalizedVideoUrl = pickedUrl;
      // Safety net alongside toAbsoluteThumbnailUrl (used when storing it from fetchVideoMeta):
      // re-validate here too so a malformed thumbnail can never 422 the whole room-create request.
      const safeThumbnail = videoThumbnail ? toAbsoluteThumbnailUrl(videoThumbnail) : null;
      // Link no dedicated player handles → ask the server whether the page can be framed; framable
      // pages become plain-iframe ('webview') rooms, the rest keep the old path (backend starts the
      // Virtual Browser). Picked-platform rooms (YouTube etc.) skip the check inside the helper.
      let platform = backendPlatform;
      let storedUrl = normalizedVideoUrl;
      if (normalizedVideoUrl && (!platform || platform === 'other')) {
        setCheckingLink(true);
        try {
          const r = await resolveLinkPlatform(normalizedVideoUrl, platform ?? 'other');
          platform = r.platform;
          storedUrl = r.url;
        } finally {
          setCheckingLink(false);
        }
      }
      const payload = {
        // Backend `name` caps at 80 chars (Joi) — trim here, mirrors mobile's useMediaDetection slice(0, 60)
        name:             roomName ? roomName.slice(0, 60) : undefined,
        videoUrl:         storedUrl || undefined,
        videoTitle:       videoTitle || undefined,
        videoThumbnail:   safeThumbnail || undefined,
        videoPlatform:    platform,
        videoReferer:     picked?.url === videoUrl ? picked.referer : undefined,
        videoStream:      picked?.url === videoUrl ? picked.stream : undefined,
        isPrivate,
      };
      let res;
      try {
        res = await createRoom.mutateAsync(payload);
      } catch (e) {
        // A watch-party build without videoStream in createRoomSchema (Joi rejects unknown keys) answers
        // 422 to the whole request — the room is fine without the hint, it just stays a page room.
        if (!(payload.videoStream && e instanceof ApiError && e.status === 422)) throw e;
        res = await createRoom.mutateAsync({ ...payload, videoStream: undefined });
      }
      onOpenChange(false);
      trackRoomCreated(locale);
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
          // Bring the movie they just picked along — otherwise the old room reopened with its
          // old video and the new choice was silently lost.
          router.push(pickedUrl ? `/room/${roomId}?play=${encodeURIComponent(pickedUrl)}` : `/room/${roomId}`);
          return;
        }
      }
      toast.error(parseError(err, t('createError')));
    }
  }

  function handleClose() {
    onOpenChange(false);
    pickToken.current++;
    vbPicker.cancel();
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
    setPicked(null);
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
    <>
    {/* While the browser panel is up the dialog steps aside (its overlay would sit over the panel's
        toolbar and Radix makes everything outside it inert); its state stays, so it comes back as left. */}
    {vbPicker.picking && <VbPickerOverlay picker={vbPicker} />}
    <Dialog open={open && !vbPicker.picking} onOpenChange={handleClose}>
      {/* grid-cols-[minmax(0,1fr)]: the base DialogContent is an auto-column grid, so the long video title / platform chip row widened it past a 390px screen (input + arrow cut off on the right). */}
      <DialogContent className="bg-[#0C0B18] border-white/[0.07] text-white max-w-[620px] grid-cols-[minmax(0,1fr)] p-0 overflow-hidden rounded-2xl">

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
                  placeholder={t('urlPlaceholder')}
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

            {/* Top sources — 4 columns, just the platforms most people actually use (PlatformTile,
                shared with "Change video"). Small search-glyph badge marks which platforms search
                in-app vs. pop out a browser window. */}
            <div className="grid grid-cols-4 gap-3">
              {topPlatforms.map(platform => (
                <PlatformTile
                  key={platform.id}
                  platform={platform}
                  active={activePlatform?.id === platform.id}
                  onClick={() => handlePlatformClick(platform)}
                  badgeTitle={SEARCHABLE_PLATFORM_IDS.has(platform.id) ? t('searchAvailable') : undefined}
                />
              ))}
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
                {otherPlatforms.map(platform => (
                  <PlatformTile
                    key={platform.id}
                    platform={platform}
                    active={activePlatform?.id === platform.id}
                    onClick={() => handlePlatformClick(platform)}
                    badgeTitle={SEARCHABLE_PLATFORM_IDS.has(platform.id) ? t('searchAvailable') : undefined}
                  />
                ))}
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
              disabled={createRoom.isPending || checkingLink}
              className="w-full h-12 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#5B21B6)' }}
            >
              {checkingLink
                ? <><Loader2 size={16} className="animate-spin" />{t('checkingLink')}</>
                : createRoom.isPending
                ? <><Loader2 size={16} className="animate-spin" />{t('creating')}</>
                : <><Link2 size={15} />{t('createBtn')}</>}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
