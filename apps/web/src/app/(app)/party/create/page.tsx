'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  FaFilm, FaLink, FaLock, FaGlobe, FaEye, FaEyeSlash,
  FaSearch, FaPlus, FaArrowLeft, FaSpinner,
} from 'react-icons/fa';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import type { ApiResponse, IWatchPartyRoom, IMovie } from '@/types';

type Tab = 'movie' | 'url';

/* ── Video URL metadata detector ──────────────────────────────────── */
function detectPlatform(url: string): string {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
  if (/vimeo\.com/.test(url)) return 'vimeo';
  if (/twitch\.tv/.test(url)) return 'twitch';
  if (/dailymotion\.com/.test(url)) return 'dailymotion';
  if (/\.(mp4|webm|ogg|m3u8)(\?.*)?$/.test(url)) return 'direct';
  return 'other';
}

function getYoutubeThumbnail(url: string): string | null {
  const m = url.match(/(?:youtube\.com.*[?&]v=|youtu\.be\/)([^&\s]+)/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
}

/* ── Movie catalog tab ─────────────────────────────────────────────── */
function MovieCatalog({ onSelect }: { onSelect: (movie: IMovie) => void }) {
  const [movies, setMovies] = useState<IMovie[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const fetchMovies = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const url = q
        ? `/movies/search?q=${encodeURIComponent(q)}&limit=20`
        : `/movies?limit=20&sort=viewCount`;
      const res = await apiClient.get<ApiResponse<IMovie[]>>(url);
      setMovies(res.data.data ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void fetchMovies(); }, [fetchMovies]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchMovies(search.trim() || undefined);
  };

  const handleSelect = (movie: IMovie) => {
    setSelected(movie._id);
    onSelect(movie);
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="relative">
        <FaSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Film qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7C3AED]/50 transition-colors"
        />
      </form>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden bg-white/[0.04] animate-pulse">
              <div className="aspect-[2/3]" />
            </div>
          ))}
        </div>
      ) : movies.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-8">Film topilmadi</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
          {movies.map((movie) => (
            <button
              key={movie._id}
              onClick={() => handleSelect(movie)}
              className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                selected === movie._id
                  ? 'border-[#7C3AED] shadow-lg shadow-[#7C3AED]/30'
                  : 'border-transparent hover:border-white/20'
              }`}
            >
              <div className="aspect-[2/3] relative bg-slate-900">
                {(movie.poster || movie.posterUrl) ? (
                  <Image
                    src={movie.poster || movie.posterUrl!}
                    alt={movie.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FaFilm size={20} className="text-slate-700" />
                  </div>
                )}
                {selected === movie._id && (
                  <div className="absolute inset-0 bg-[#7C3AED]/30 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-[#7C3AED] flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-300 text-center px-1 py-1 line-clamp-1 leading-tight">
                {movie.title}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── URL tab ─────────────────────────────────────────────────────── */
function UrlTab({ onSelect }: {
  onSelect: (data: { videoUrl: string; videoTitle: string; videoThumbnail: string; videoPlatform: string }) => void;
}) {
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState<{ title: string; thumbnail: string; platform: string } | null>(null);

  const handleUrl = (value: string) => {
    setUrl(value);
    if (!value.trim()) { setPreview(null); return; }
    const platform = detectPlatform(value);
    const thumbnail = platform === 'youtube' ? (getYoutubeThumbnail(value) ?? '') : '';
    const p = { title: value, thumbnail, platform };
    setPreview(p);
    onSelect({ videoUrl: value, videoTitle: value, videoThumbnail: thumbnail, videoPlatform: platform });
  };

  return (
    <div className="space-y-3">
      <div>
        <input
          type="url"
          placeholder="https://youtube.com/watch?v=..."
          value={url}
          onChange={(e) => handleUrl(e.target.value)}
          className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7C3AED]/50 transition-colors"
        />
        <p className="text-xs text-slate-600 mt-1.5">YouTube, Vimeo, to&apos;g&apos;ridan-to&apos;g&apos;ri havolalar qo&apos;llab-quvvatlanadi</p>
      </div>

      {preview && url && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0a0a0f] border border-white/[0.06]">
          {preview.thumbnail ? (
            <div className="relative w-16 h-10 rounded-lg overflow-hidden shrink-0">
              <Image src={preview.thumbnail} alt="" fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="w-16 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
              <FaLink size={14} className="text-slate-600" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs text-slate-300 line-clamp-1">{url}</p>
            <p className="text-[11px] text-[#7C3AED] font-medium mt-0.5">{preview.platform}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Create room page ─────────────────────────────────────────────── */
export default function CreatePartyPage() {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('movie');
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Selected content
  const [selectedMovie, setSelectedMovie] = useState<IMovie | null>(null);
  const [urlData, setUrlData] = useState<{
    videoUrl: string; videoTitle: string; videoThumbnail: string; videoPlatform: string;
  } | null>(null);

  const canCreate = tab === 'movie' ? !!selectedMovie : !!urlData?.videoUrl;

  const handleCreate = async () => {
    if (!canCreate) return;
    setCreating(true);
    setError('');

    try {
      const base = {
        name: roomName.trim() || null,
        isPrivate,
        password: isPrivate && password ? password : undefined,
      };

      const body = tab === 'movie'
        ? { ...base, movieId: selectedMovie!._id }
        : {
            ...base,
            videoUrl: urlData!.videoUrl,
            videoTitle: urlData!.videoTitle,
            videoThumbnail: urlData!.videoThumbnail,
            videoPlatform: urlData!.videoPlatform,
          };

      // Save external video for history (non-blocking)
      if (tab === 'url' && urlData?.videoUrl) {
        void apiClient.post('/external-videos', {
          url: urlData.videoUrl,
          title: urlData.videoTitle,
          thumbnail: urlData.videoThumbnail,
          platform: urlData.videoPlatform,
        }).catch(() => { /* non-blocking */ });
      }

      const res = await apiClient.post<ApiResponse<IWatchPartyRoom>>('/watch-party/rooms', body);
      const room = res.data.data;
      if (!room?._id) throw new Error('No room ID');
      router.replace(`/party/${room._id}`);
    } catch (err) {
      logger.error('Xona yaratishda xato', err);
      setError('Xona yaratib bo\'lmadi. Qayta urinib ko\'ring.');
      setCreating(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-colors"
        >
          <FaArrowLeft size={13} />
        </button>
        <div>
          <h1 className="text-base font-bold text-white">Yangi xona yaratish</h1>
          <p className="text-xs text-slate-500">Do&apos;stlar bilan birga kino ko&apos;ring</p>
        </div>
      </div>

      {/* Room name */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Xona nomi (ixtiyoriy)</label>
        <input
          type="text"
          placeholder="Masalan: Juma kechasi kinosi..."
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          maxLength={50}
          className="w-full bg-[#111118] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7C3AED]/50 transition-colors"
        />
      </div>

      {/* Content tabs */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Video tanlash</label>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-[#111118] rounded-xl border border-white/[0.06]">
          <button
            onClick={() => setTab('movie')}
            className={`flex-1 flex items-center justify-center gap-2 h-8 rounded-lg text-xs font-semibold transition-all ${
              tab === 'movie'
                ? 'bg-[#7C3AED] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FaFilm size={11} />
            Katalogdan
          </button>
          <button
            onClick={() => setTab('url')}
            className={`flex-1 flex items-center justify-center gap-2 h-8 rounded-lg text-xs font-semibold transition-all ${
              tab === 'url'
                ? 'bg-[#7C3AED] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FaLink size={11} />
            Havola orqali
          </button>
        </div>

        {/* Tab content */}
        <div className="bg-[#111118] border border-white/[0.06] rounded-xl p-4">
          {tab === 'movie' ? (
            <MovieCatalog onSelect={setSelectedMovie} />
          ) : (
            <UrlTab onSelect={setUrlData} />
          )}
        </div>
      </div>

      {/* Room type */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Xona turi</label>
        <div className="flex gap-2">
          <button
            onClick={() => setIsPrivate(false)}
            className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-semibold transition-all ${
              !isPrivate
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'border-white/10 text-slate-400 hover:border-white/20'
            }`}
          >
            <FaGlobe size={13} />
            Ochiq
          </button>
          <button
            onClick={() => setIsPrivate(true)}
            className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-semibold transition-all ${
              isPrivate
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                : 'border-white/10 text-slate-400 hover:border-white/20'
            }`}
          >
            <FaLock size={13} />
            Yopiq
          </button>
        </div>

        {isPrivate && (
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Parol o'rnating..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#111118] border border-white/10 rounded-xl px-4 pr-11 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400 text-center">{error}</p>}

      {/* Create button */}
      <button
        onClick={() => void handleCreate()}
        disabled={!canCreate || creating}
        className="w-full h-12 rounded-2xl bg-[#7C3AED] text-white font-bold text-sm disabled:opacity-40 hover:bg-[#6D28D9] transition-all shadow-lg shadow-[#7C3AED]/20 flex items-center justify-center gap-2 active:scale-95"
      >
        {creating ? (
          <>
            <FaSpinner size={14} className="animate-spin" />
            Yaratilmoqda...
          </>
        ) : (
          <>
            <FaPlus size={13} />
            Xona yaratish
          </>
        )}
      </button>
    </div>
  );
}
