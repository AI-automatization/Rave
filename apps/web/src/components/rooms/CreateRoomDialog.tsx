'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Globe, ArrowRight, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { VideoSearch } from '@/components/rooms/VideoSearch';
import { useCreateRoom } from '@/hooks/use-rooms';
import { toast } from '@/store/toast.store';
import type { IExternalVideo } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ── Platform definitions ─────────────────────────────── */
interface Platform {
  id: string;
  name: string;
  base: string;
  icon: ReactNode;
  color: string;
  bg: string;
  border: string;
  soon?: boolean;
}

const PLATFORMS: Platform[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    base: 'https://youtube.com',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    color: '#FF0000',
    bg: 'rgba(255,0,0,0.12)',
    border: 'rgba(255,0,0,0.2)',
  },
  {
    id: 'vk',
    name: 'VK Видео',
    base: 'https://vkvideo.ru',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.712-1.033-1.01-1.49-.69-1.49.318v1.394H12.51c-2.785 0-4.52-1.814-4.52-5.008C7.99 9.42 9.754 7.5 12.58 7.5h1.542v1.572c0 .345.14.55.51.55.34 0 .55-.142.55-.55V7.5h1.748c1.035 0 1.497.49 1.497 1.553v4.988c0 .99-.346 1.47-1.05 1.47-.716 0-1.097-.49-1.097-1.47V12.57c0-1.17-.413-1.753-1.317-1.753-.883 0-1.317.583-1.317 1.753v1.493h-.002c0 .81.39 1.263 1.085 1.263.41 0 .738-.156.965-.465.27 2.11 2.037 2.262 2.037 2.262z"/>
      </svg>
    ),
    color: '#2787F5',
    bg: 'rgba(39,135,245,0.12)',
    border: 'rgba(39,135,245,0.2)',
  },
  {
    id: 'rutube',
    name: 'Rutube',
    base: 'https://rutube.ru',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.5 16.5L9 13V8l7.5 3.5L9 15v-2.5l4.5-1.5L9 9.5V8l7.5 4z"/>
      </svg>
    ),
    color: '#E8232A',
    bg: 'rgba(232,35,42,0.12)',
    border: 'rgba(232,35,42,0.2)',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    base: 'https://instagram.com',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
      </svg>
    ),
    color: '#E1306C',
    bg: 'rgba(225,48,108,0.12)',
    border: 'rgba(225,48,108,0.2)',
  },
  {
    id: 'cinerama',
    name: 'Cinerama',
    base: 'https://cinerama.uz',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
      </svg>
    ),
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.2)',
  },
  {
    id: 'twitch',
    name: 'Twitch',
    base: 'https://twitch.tv',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
      </svg>
    ),
    color: '#9146FF',
    bg: 'rgba(145,70,255,0.12)',
    border: 'rgba(145,70,255,0.2)',
  },
  {
    id: 'live',
    name: 'YouTube Live',
    base: 'https://youtube.com/live',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
        <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.3"/>
      </svg>
    ),
    color: '#FF0000',
    bg: 'rgba(255,0,0,0.1)',
    border: 'rgba(255,0,0,0.18)',
  },
  {
    id: 'web',
    name: 'Web',
    base: 'https://',
    icon: <Globe className="w-5 h-5" />,
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.12)',
    border: 'rgba(96,165,250,0.2)',
  },
  {
    id: 'dj',
    name: 'WeWatch DJ',
    base: '',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
      </svg>
    ),
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.12)',
    border: 'rgba(124,58,237,0.2)',
    soon: true,
  },
] as const;

/* ── Component ────────────────────────────────────────── */
export function CreateRoomDialog({ open, onOpenChange }: Props) {
  const t = useTranslations('room');
  const router = useRouter();
  const createRoom = useCreateRoom();

  const [videoUrl, setVideoUrl] = useState('');
  const [roomName, setRoomName] = useState('');
  const [selected, setSelected] = useState<IExternalVideo | null>(null);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);

  function handleSelect(video: IExternalVideo) {
    setSelected(video);
    setVideoUrl(video.url);
  }

  function handlePlatformClick(platform: Platform) {
    if (platform.soon) return;
    setActivePlatform(platform.id);
    if (platform.base && platform.base !== 'https://') {
      setVideoUrl(platform.base + '/');
    } else {
      setVideoUrl('https://');
    }
    setSelected(null);
  }

  async function handleCreate(withoutVideo = false) {
    try {
      const res = await createRoom.mutateAsync({
        name: roomName || undefined,
        videoUrl: withoutVideo ? undefined : (selected?.url ?? (videoUrl || undefined)),
        videoTitle: withoutVideo ? undefined : (selected?.title ?? undefined),
        videoThumbnail: withoutVideo ? undefined : (selected?.thumbnail ?? undefined),
        videoPlatform: withoutVideo ? undefined : (selected?.platform ?? activePlatform ?? undefined),
      });
      onOpenChange(false);
      const roomId = res.data?._id;
      if (roomId) router.push(`/room/${roomId}`);
    } catch {
      toast.error(t('createError'));
    }
  }

  function handleClose() {
    onOpenChange(false);
    setVideoUrl('');
    setRoomName('');
    setSelected(null);
    setActivePlatform(null);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0C0B18] border-white/[0.07] text-white max-w-[480px] p-0 overflow-hidden rounded-2xl">

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-base font-semibold text-white text-center">
            {t('sourceTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-5 pb-5 pt-4">

          {/* Search */}
          <VideoSearch onSelect={handleSelect} />

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[11px] text-slate-500">{t('sourcePaste')}</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* URL Input */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              {activePlatform && (() => {
                const p = PLATFORMS.find(pl => pl.id === activePlatform);
                return p ? (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center" style={{ color: p.color }}>
                    {p.icon}
                  </span>
                ) : null;
              })()}
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => { setVideoUrl(e.target.value); setSelected(null); }}
                placeholder="https://..."
                className="w-full h-11 bg-[#111118] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                style={{ paddingLeft: activePlatform ? '2.5rem' : '0.875rem', paddingRight: '0.875rem' }}
              />
            </div>
            <button
              onClick={() => void handleCreate()}
              disabled={(!videoUrl && !selected) || createRoom.isPending}
              className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}
            >
              {createRoom.isPending
                ? <Loader2 size={16} className="animate-spin" />
                : <ArrowRight size={16} />}
            </button>
          </div>

          {/* Selected video preview */}
          {selected && (
            <div className="flex items-center gap-3 bg-violet-500/[0.08] border border-violet-500/20 rounded-xl p-3">
              {selected.thumbnail && (
                <img src={selected.thumbnail} alt="" className="w-16 h-10 rounded-lg object-cover shrink-0" />
              )}
              <span className="text-sm text-white truncate flex-1">{selected.title}</span>
            </div>
          )}

          {/* Platform grid */}
          <div className="grid grid-cols-5 gap-2">
            {PLATFORMS.map((platform) => {
              const isActive = activePlatform === platform.id;
              return (
                <button
                  key={platform.id}
                  onClick={() => handlePlatformClick(platform)}
                  disabled={platform.soon}
                  className="relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all duration-150 disabled:cursor-not-allowed group"
                  style={{
                    background: isActive ? platform.bg : 'rgba(255,255,255,0.03)',
                    borderColor: isActive ? platform.border : 'rgba(255,255,255,0.06)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive && !platform.soon) {
                      (e.currentTarget as HTMLButtonElement).style.background = platform.bg;
                      (e.currentTarget as HTMLButtonElement).style.borderColor = platform.border;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)';
                    }
                  }}
                >
                  {platform.soon && (
                    <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/30 text-violet-300 border border-violet-500/30 leading-none">
                      {t('soonBadge')}
                    </span>
                  )}
                  <span style={{ color: platform.soon ? '#4B5563' : platform.color }}>
                    {platform.icon}
                  </span>
                  <span
                    className="text-[9px] font-medium leading-none text-center truncate w-full"
                    style={{ color: platform.soon ? '#4B5563' : isActive ? '#e2e8f0' : '#94a3b8' }}
                  >
                    {platform.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.05]" />

          {/* Room name (optional) */}
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder={t('roomName')}
            className="w-full h-10 bg-[#111118] border border-white/[0.06] rounded-xl px-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40 transition-all"
          />

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
