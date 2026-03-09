'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  FaFilm, FaLock, FaGlobe, FaEye, FaEyeSlash,
  FaSearch, FaPlus, FaArrowLeft, FaSpinner, FaCheck,
} from 'react-icons/fa';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import type { ApiResponse, IWatchPartyRoom, IMovie } from '@/types';

/* ── Platform detector ───────────────────────────────────────────── */
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

/* ── Create Room Page ────────────────────────────────────────────── */
export default function CreatePartyPage() {
  const router = useRouter();

  /* ── Movie catalog state ── */
  const [movies,        setMovies]        = useState<IMovie[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [search,        setSearch]        = useState('');
  const [selectedMovie, setSelectedMovie] = useState<IMovie | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── URL input state ── */
  const [videoUrl,       setVideoUrl]       = useState('');
  const [urlThumbnail,   setUrlThumbnail]   = useState('');
  const [urlPlatform,    setUrlPlatform]    = useState('');

  /* ── Room config state ── */
  const [roomName,    setRoomName]    = useState('');
  const [isPrivate,   setIsPrivate]   = useState(false);
  const [password,    setPassword]    = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [creating,    setCreating]    = useState(false);
  const [error,       setError]       = useState('');

  /* ── Source: movie or url ── */
  const hasMovie = !!selectedMovie;
  const hasUrl   = videoUrl.trim().length > 3;
  const canCreate = hasMovie || hasUrl;

  /* ── Fetch movies ── */
  const fetchMovies = useCallback(async (q?: string) => {
    setMoviesLoading(true);
    try {
      const endpoint = q
        ? `/movies/search?q=${encodeURIComponent(q)}&limit=30`
        : `/movies?limit=30`;
      const res = await apiClient.get<ApiResponse<IMovie[]>>(endpoint);
      setMovies(res.data.data ?? []);
    } catch {
      setMovies([]);
    } finally {
      setMoviesLoading(false);
    }
  }, []);

  useEffect(() => { void fetchMovies(); }, [fetchMovies]);

  /* Debounced search */
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      void fetchMovies(val.trim() || undefined);
    }, 400);
  };

  /* ── URL input handler ── */
  const handleUrlChange = (val: string) => {
    setVideoUrl(val);
    if (!val.trim()) { setUrlThumbnail(''); setUrlPlatform(''); return; }
    const platform  = detectPlatform(val);
    const thumbnail = platform === 'youtube' ? (getYoutubeThumbnail(val) ?? '') : '';
    setUrlPlatform(platform);
    setUrlThumbnail(thumbnail);
    // If URL filled → deselect movie
    if (val.trim()) setSelectedMovie(null);
  };

  /* When a movie is selected → clear URL */
  const handleSelectMovie = (movie: IMovie) => {
    setSelectedMovie(movie);
    setVideoUrl('');
    setUrlThumbnail('');
    setUrlPlatform('');
  };

  /* ── Create room ── */
  const handleCreate = async () => {
    if (!canCreate || creating) return;
    setCreating(true);
    setError('');
    try {
      const base = {
        name:     roomName.trim() || null,
        isPrivate,
        password: isPrivate && password ? password : undefined,
      };

      const body = hasMovie
        ? { ...base, movieId: selectedMovie!._id }
        : {
            ...base,
            videoUrl:       videoUrl.trim(),
            videoTitle:     videoUrl.trim(),
            videoThumbnail: urlThumbnail || undefined,
            videoPlatform:  urlPlatform  || 'other',
          };

      if (!hasMovie && videoUrl.trim()) {
        void apiClient.post('/external-videos', {
          url:       videoUrl.trim(),
          thumbnail: urlThumbnail || undefined,
          platform:  urlPlatform  || undefined,
        }).catch(() => {});
      }

      const res  = await apiClient.post<ApiResponse<IWatchPartyRoom>>('/watch-party/rooms', body);
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
    <div className="flex flex-col h-[calc(100vh-4rem)]">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] shrink-0">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-colors"
        >
          <FaArrowLeft size={12} />
        </button>
        <h1 className="text-sm font-bold text-white">Yangi xona yaratish</h1>
      </div>

      {/* Body: 2-column layout */}
      <div className="flex flex-1 min-h-0 gap-0">

        {/* ── LEFT: Movie catalog ─────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-white/[0.06]">

          {/* Search bar */}
          <div className="px-4 py-3 border-b border-white/[0.06] shrink-0">
            <div className="relative">
              <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Film qidirish..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-[#111118] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7C3AED]/50 transition-colors"
              />
            </div>
          </div>

          {/* Movie grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {moviesLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="rounded-xl overflow-hidden bg-white/[0.04] animate-pulse">
                    <div className="aspect-[2/3]" />
                  </div>
                ))}
              </div>
            ) : movies.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
                <FaFilm size={32} className="text-slate-700" />
                <p className="text-sm text-slate-500">
                  {search ? 'Film topilmadi' : 'Katalogda film yo\'q'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {movies.map((movie) => {
                  const isSelected = selectedMovie?._id === movie._id;
                  const poster = movie.posterUrl || movie.poster;
                  return (
                    <button
                      key={movie._id}
                      onClick={() => handleSelectMovie(movie)}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all text-left ${
                        isSelected
                          ? 'border-[#7C3AED] shadow-lg shadow-[#7C3AED]/30 scale-[1.02]'
                          : 'border-transparent hover:border-white/20 hover:scale-[1.01]'
                      }`}
                    >
                      <div className="aspect-[2/3] relative bg-slate-900">
                        {poster ? (
                          <Image
                            src={poster}
                            alt={movie.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <FaFilm size={18} className="text-slate-700" />
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#7C3AED]/40 flex items-center justify-center">
                            <div className="w-7 h-7 rounded-full bg-[#7C3AED] flex items-center justify-center shadow-lg">
                              <FaCheck size={12} className="text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-300 text-center px-1 py-1.5 line-clamp-1 leading-tight bg-[#111118]">
                        {movie.title}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Sidebar config ───────────────────────────────── */}
        <div className="w-72 shrink-0 flex flex-col border-l border-white/[0.06] bg-[#0c0c14]">
          <div className="flex-1 overflow-y-auto p-4 space-y-5">

            {/* Selected movie preview */}
            {selectedMovie && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/20">
                <div className="relative w-10 h-14 rounded-lg overflow-hidden shrink-0">
                  {(selectedMovie.posterUrl || selectedMovie.poster) ? (
                    <Image
                      src={selectedMovie.posterUrl || selectedMovie.poster}
                      alt={selectedMovie.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-[#7C3AED]/20 flex items-center justify-center">
                      <FaFilm size={14} className="text-[#7C3AED]" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#7C3AED]">Tanlangan film</p>
                  <p className="text-sm text-white font-medium line-clamp-2 mt-0.5">{selectedMovie.title}</p>
                </div>
              </div>
            )}

            {/* URL input — shown if no movie selected or always visible */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Video havola {selectedMovie ? '(ixtiyoriy)' : ''}
              </label>
              <input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="w-full bg-[#111118] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7C3AED]/50 transition-colors"
              />
              {urlPlatform && videoUrl && (
                <p className="text-[11px] text-slate-500">
                  Platforma: <span className="text-[#7C3AED] font-medium">{urlPlatform}</span>
                </p>
              )}
            </div>

            {/* Room name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Xona nomi</label>
              <input
                type="text"
                placeholder="Masalan: Juma kechasi..."
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                maxLength={50}
                className="w-full bg-[#111118] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7C3AED]/50 transition-colors"
              />
            </div>

            {/* Room type */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Xona turi</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsPrivate(false)}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border text-xs font-semibold transition-all ${
                    !isPrivate
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      : 'border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <FaGlobe size={11} /> Ochiq
                </button>
                <button
                  onClick={() => setIsPrivate(true)}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border text-xs font-semibold transition-all ${
                    isPrivate
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                      : 'border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <FaLock size={11} /> Yopiq
                </button>
              </div>
            </div>

            {/* Password */}
            {isPrivate && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Parol</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Parol o'rnating..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#111118] border border-white/[0.08] rounded-xl px-3 pr-10 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPw ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>

          {/* Create button pinned to bottom */}
          <div className="p-4 border-t border-white/[0.06] shrink-0">
            <button
              onClick={() => void handleCreate()}
              disabled={!canCreate || creating}
              className="w-full h-11 rounded-2xl bg-[#7C3AED] text-white font-bold text-sm disabled:opacity-40 hover:bg-[#6D28D9] transition-all shadow-lg shadow-[#7C3AED]/20 flex items-center justify-center gap-2 active:scale-95"
            >
              {creating ? (
                <><FaSpinner size={13} className="animate-spin" /> Yaratilmoqda...</>
              ) : (
                <><FaPlus size={12} /> Xona yaratish</>
              )}
            </button>
            {!canCreate && (
              <p className="text-[11px] text-slate-500 text-center mt-2">
                Film tanlang yoki video havola kiriting
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
