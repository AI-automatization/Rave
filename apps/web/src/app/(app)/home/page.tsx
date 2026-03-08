'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  FaPlay, FaLock, FaGlobe, FaUsers, FaPlus, FaChevronDown,
  FaCrown, FaVideo,
} from 'react-icons/fa';
import { apiClient } from '@/lib/axios';
import { CreateRoomModal } from '@/components/party/CreateRoomModal';
import type { ApiResponse, IWatchPartyRoom } from '@/types';

/* ── Channel card ────────────────────────────────────────────────── */
function ChannelCard({
  room,
  onJoin,
}: {
  room: IWatchPartyRoom;
  onJoin: (room: IWatchPartyRoom) => void;
}) {
  const memberCount = room.memberCount ?? room.members.length;
  const title = room.videoTitle ?? 'Noma\'lum video';
  const platform = room.videoPlatform ?? (room.movieId ? 'movie' : 'other');

  const platformColor: Record<string, string> = {
    youtube: 'text-red-400',
    vimeo: 'text-blue-400',
    twitch: 'text-purple-400',
    direct: 'text-emerald-400',
    movie: 'text-cyan-400',
    other: 'text-slate-400',
  };

  return (
    <div className="group bg-[#111118] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-[#7C3AED]/40 transition-all hover:shadow-lg hover:shadow-[#7C3AED]/5">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-900">
        {room.videoThumbnail ? (
          <Image
            src={room.videoThumbnail}
            alt={title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <FaVideo size={28} className="text-slate-700" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={() => onJoin(room)}
            className="h-10 px-5 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors flex items-center gap-2"
          >
            <FaPlay size={11} />
            Kirish
          </button>
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          {room.isPrivate ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <FaLock size={8} /> Yopiq
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              <FaGlobe size={8} /> Ochiq
            </span>
          )}
        </div>

        <div className="absolute top-2 right-2">
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-white">
            <FaUsers size={8} />
            {memberCount}/{room.maxMembers}
          </span>
        </div>

        {/* Live dot */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] text-white/70 font-medium">LIVE</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <p className="text-sm text-white font-medium line-clamp-1 leading-snug">
          {title}
        </p>
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-medium ${platformColor[platform] ?? 'text-slate-400'}`}>
            {platform === 'movie' ? '🎬 Katalog' : platform}
          </span>
          <button
            onClick={() => onJoin(room)}
            className="h-7 px-3 rounded-lg bg-[#7C3AED]/10 border border-[#7C3AED]/20 text-[#7C3AED] text-[11px] font-semibold hover:bg-[#7C3AED]/20 transition-colors"
          >
            Ulash
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Password dialog for private rooms ───────────────────────────── */
function PasswordDialog({
  room,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  room: IWatchPartyRoom;
  onSubmit: (password: string) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}) {
  const [pw, setPw] = useState('');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="bg-[#111118] border border-white/10 rounded-2xl w-full max-w-sm p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
            <FaLock size={16} className="text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Yopiq xona</p>
            <p className="text-xs text-slate-400 mt-0.5">Kirish uchun parol kerak</p>
          </div>
        </div>
        <input
          type="password"
          placeholder="Parolni kiriting..."
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && pw) onSubmit(pw); }}
          autoFocus
          className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 h-9 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-colors">
            Bekor
          </button>
          <button
            onClick={() => pw && onSubmit(pw)}
            disabled={!pw || loading}
            className="flex-1 h-9 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold disabled:opacity-40 hover:bg-[#6D28D9] transition-colors"
          >
            {loading ? 'Kirilmoqda...' : 'Kirish'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Home page ───────────────────────────────────────────────────── */
export default function HomePage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<IWatchPartyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState<IWatchPartyRoom | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  const loadRooms = useCallback(async () => {
    try {
      const res = await apiClient.get<ApiResponse<IWatchPartyRoom[]>>('/watch-party/rooms');
      setRooms(res.data.data ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadRooms(); }, [loadRooms]);

  // Auto-refresh rooms every 30s
  useEffect(() => {
    const id = setInterval(() => { void loadRooms(); }, 30_000);
    return () => clearInterval(id);
  }, [loadRooms]);

  const handleJoin = (room: IWatchPartyRoom) => {
    if (room.isPrivate) {
      setJoiningRoom(room);
      setJoinError('');
    } else {
      void joinRoom(room.inviteCode);
    }
  };

  const joinRoom = async (inviteCode: string, password?: string) => {
    setJoinLoading(true);
    setJoinError('');
    try {
      const res = await apiClient.post<ApiResponse<IWatchPartyRoom>>(
        `/watch-party/rooms/join/${inviteCode}`,
        password ? { password } : {},
      );
      const room = res.data.data;
      if (room?._id) {
        setJoiningRoom(null);
        router.push(`/party/${room._id}`);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
      if (msg === 'password_required') {
        // Should not happen here since we show the dialog first, but handle gracefully
        setJoinError('Parol kerak');
      } else {
        setJoinError(msg || 'Xonaga kirib bo\'lmadi');
      }
    } finally {
      setJoinLoading(false);
    }
  };

  const visibleRooms = showAll ? rooms : rooms.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* ── Banner ───────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#7C3AED]/30 via-[#111118] to-[#0a0a0f] border border-[#7C3AED]/20 p-8 md:p-12">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, #7C3AED 0%, transparent 50%), radial-gradient(circle at 80% 20%, #EC4899 0%, transparent 40%)',
        }} />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-widest text-[#7C3AED] uppercase">Watch Together</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              Do&apos;stlar bilan birga<br />
              <span className="text-[#7C3AED]">film ko&apos;ring</span>
            </h1>
            <p className="text-sm text-slate-400 max-w-md">
              YouTube, Vimeo yoki istalgan video havolasini ulashing — hammasi sinxron, real vaqtda.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="shrink-0 inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-[#7C3AED] text-white text-sm font-bold hover:bg-[#6D28D9] transition-all shadow-lg shadow-[#7C3AED]/30 hover:shadow-[#7C3AED]/50 active:scale-95"
          >
            <FaPlus size={13} />
            Xona yaratish
          </button>
        </div>

        {/* Stats */}
        <div className="relative mt-6 flex gap-6 flex-wrap">
          {[
            { icon: <FaUsers size={14} />, label: 'Faol xonalar', value: rooms.length },
            { icon: <FaCrown size={14} />, label: 'Jami a\'zolar', value: rooms.reduce((s, r) => s + (r.memberCount ?? r.members.length), 0) },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-2 text-slate-400">
              <span className="text-[#7C3AED]">{stat.icon}</span>
              <span className="text-white font-semibold tabular-nums">{stat.value}</span>
              <span className="text-xs">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Active channels ───────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Faol kanallar</h2>
            <p className="text-xs text-slate-500 mt-0.5">Hozir tomoshabin bo&apos;layotgan xonalar</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-[#7C3AED]/30 text-[#7C3AED] text-xs font-semibold hover:bg-[#7C3AED]/10 transition-colors"
          >
            <FaPlus size={10} />
            Yangi xona
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-[#111118] rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-white/[0.04]" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-white/[0.04] rounded w-3/4" />
                  <div className="h-3 bg-white/[0.04] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center">
              <FaPlay size={24} className="text-slate-600" />
            </div>
            <div className="text-center">
              <p className="text-slate-300 font-medium">Hali faol xona yo&apos;q</p>
              <p className="text-sm text-slate-600 mt-1">Birinchi xonani siz yarating!</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors"
            >
              <FaPlus size={12} />
              Xona yaratish
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {visibleRooms.map((room) => (
                <ChannelCard key={room._id} room={room} onJoin={handleJoin} />
              ))}
            </div>

            {rooms.length > 5 && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setShowAll((p) => !p)}
                  className="inline-flex items-center gap-2 h-9 px-5 rounded-xl border border-white/10 text-slate-400 text-sm hover:text-white hover:border-white/20 transition-all"
                >
                  {showAll ? 'Kamroq ko\'rsatish' : `Barchasini ko\'rish (${rooms.length})`}
                  <FaChevronDown
                    size={11}
                    className={`transition-transform ${showAll ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateRoomModal onClose={() => setShowCreateModal(false)} />
      )}

      {joiningRoom && (
        <PasswordDialog
          room={joiningRoom}
          onSubmit={(pw) => void joinRoom(joiningRoom.inviteCode, pw)}
          onCancel={() => { setJoiningRoom(null); setJoinError(''); }}
          loading={joinLoading}
          error={joinError}
        />
      )}
    </div>
  );
}
