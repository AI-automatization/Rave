'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaTimes, FaLink, FaPlay, FaSpinner, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import type { IVideoMetadata, VideoPlatform } from '@/types';

interface CreateRoomModalProps {
  onClose: () => void;
}

const PLATFORM_LABEL: Record<VideoPlatform, string> = {
  youtube:     'YouTube',
  vimeo:       'Vimeo',
  twitch:      'Twitch',
  dailymotion: 'Dailymotion',
  direct:      'To\'g\'ridan video',
  other:       'Boshqa sayt',
};

const PLATFORM_COLOR: Record<VideoPlatform, string> = {
  youtube:     'text-red-400 bg-red-500/10',
  vimeo:       'text-blue-400 bg-blue-500/10',
  twitch:      'text-purple-400 bg-purple-500/10',
  dailymotion: 'text-orange-400 bg-orange-500/10',
  direct:      'text-emerald-400 bg-emerald-500/10',
  other:       'text-slate-400 bg-slate-500/10',
};

type FetchState = 'idle' | 'loading' | 'success' | 'error';

export function CreateRoomModal({ onClose }: CreateRoomModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [url, setUrl] = useState('');
  const [fetchState, setFetchState] = useState<FetchState>('idle');
  const [metadata, setMetadata] = useState<IVideoMetadata & { platform: VideoPlatform } | null>(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const handleFetchMetadata = async (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed) return;
    setFetchState('loading');
    setMetadata(null);
    setError('');
    try {
      const res = await fetch('/api/external-videos/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      const json = await res.json() as { success: boolean; data?: IVideoMetadata & { platform: VideoPlatform }; message?: string };
      if (!res.ok || !json.success) {
        setError(json.message ?? 'Metadatani olishda xato');
        setFetchState('error');
        return;
      }
      setMetadata(json.data ?? null);
      setFetchState('success');
    } catch {
      setError('Tarmoq xatosi. URL\'ni tekshirib ko\'ring.');
      setFetchState('error');
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    setFetchState('idle');
    setMetadata(null);
    setError('');
  };

  const handleUrlBlur = () => {
    if (url.trim()) void handleFetchMetadata(url);
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && url.trim()) void handleFetchMetadata(url);
  };

  const handleCreate = async () => {
    if (!url.trim()) return;
    setCreating(true);
    try {
      const params = new URLSearchParams({ videoUrl: url.trim() });
      if (metadata?.title)     params.set('videoTitle', metadata.title);
      if (metadata?.thumbnail) params.set('videoThumbnail', metadata.thumbnail);
      if (metadata?.platform)  params.set('videoPlatform', metadata.platform);
      router.push(`/party/create?${params.toString()}`);
      onClose();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111118] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center">
              <FaPlay size={10} className="text-[#7C3AED] ml-0.5" />
            </div>
            <h2 className="text-sm font-semibold text-white">Video bilan Watch Party</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <FaTimes size={13} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1.5">Video havolasi</label>
            <div className="relative">
              <FaLink size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                ref={inputRef}
                type="url"
                placeholder="YouTube, Vimeo, MP4... istalgan link"
                value={url}
                onChange={handleUrlChange}
                onBlur={handleUrlBlur}
                onKeyDown={handleUrlKeyDown}
                className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7C3AED]/50 transition-colors"
              />
              {fetchState === 'loading' && (
                <FaSpinner size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C3AED] animate-spin" />
              )}
              {fetchState === 'success' && (
                <FaCheckCircle size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" />
              )}
              {fetchState === 'error' && (
                <FaExclamationCircle size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" />
              )}
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5">
              YouTube, Vimeo, Twitch, Dailymotion yoki to&apos;g&apos;ridan .mp4 havola
            </p>
          </div>

          {/* Error */}
          {fetchState === 'error' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
              <FaExclamationCircle size={12} />
              {error || 'Metadatani olishda xato. Havola ishlashini tekshiring.'}
            </div>
          )}

          {/* Metadata preview */}
          {fetchState === 'success' && metadata && (
            <div className="flex gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
              {metadata.thumbnail ? (
                <div className="w-24 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                  <Image
                    src={metadata.thumbnail}
                    alt={metadata.title}
                    width={96}
                    height={56}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-24 h-14 rounded-lg bg-slate-800 shrink-0 flex items-center justify-center">
                  <FaPlay size={18} className="text-slate-600" />
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm text-white font-medium line-clamp-2 leading-snug">
                  {metadata.title || 'Sarlavhasiz video'}
                </p>
                <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${PLATFORM_COLOR[metadata.platform]}`}>
                  {PLATFORM_LABEL[metadata.platform]}
                </span>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {fetchState === 'loading' && (
            <div className="flex gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl animate-pulse">
              <div className="w-24 h-14 rounded-lg bg-slate-700/50 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-700/50 rounded w-3/4" />
                <div className="h-3 bg-slate-700/50 rounded w-1/2" />
                <div className="h-4 w-16 bg-slate-700/50 rounded-full" />
              </div>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => void handleCreate()}
            disabled={!url.trim() || creating || fetchState === 'loading'}
            className="w-full h-10 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#6D28D9] transition-colors flex items-center justify-center gap-2"
          >
            {creating ? (
              <><FaSpinner size={13} className="animate-spin" /> Yaratilmoqda...</>
            ) : (
              <><FaPlay size={12} /> Watch Party boshlash</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
