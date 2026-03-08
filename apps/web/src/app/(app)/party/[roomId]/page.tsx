'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FaCopy, FaCheck, FaUserPlus, FaTimes, FaSignOutAlt, FaCrown } from 'react-icons/fa';
import { ChatPanel } from '@/components/party/ChatPanel';
import { FullscreenOverlay } from '@/components/party/FullscreenOverlay';
import { useWatchParty } from '@/hooks/useWatchParty';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import { useTranslations } from 'next-intl';
import type { ApiResponse, IWatchPartyRoom, IMovie, IUser } from '@/types';

const VideoPlayer = dynamic(
  () => import('@/components/VideoPlayer').then((m) => m.VideoPlayer),
  { ssr: false, loading: () => <div className="aspect-video w-full bg-black rounded-xl animate-pulse" /> },
);

const UniversalPlayer = dynamic(
  () => import('@/components/video/UniversalPlayer').then((m) => m.UniversalPlayer),
  { ssr: false, loading: () => <div className="aspect-video w-full bg-black rounded-xl animate-pulse" /> },
);

export default function WatchPartyPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const t = useTranslations('party');
  const user = useAuthStore((s) => s.user);
  const [room, setRoom] = useState<IWatchPartyRoom | null>(null);
  const [movie, setMovie] = useState<IMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; bottom: number; right: number }[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [friends, setFriends] = useState<IUser[]>([]);
  const [copiedFriendId, setCopiedFriendId] = useState<string | null>(null);
  const emojiTimestamps = useRef<number[]>([]);
  const [emojiCooldown, setEmojiCooldown] = useState(0);

  const {
    syncState, members, messages, emojiEvents, ownerId, roomClosed,
    sendMessage, sendEmoji, emitPlay, emitPause, emitSeek, leaveRoom, isConnected,
  } = useWatchParty(roomId, room?.ownerId);

  const voice = useVoiceChat(roomId, user?.id);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenEl, setFullscreenEl] = useState<Element | null>(null);

  // Effective owner: use live ownerId from socket (falls back to room data)
  const effectiveOwnerId = ownerId ?? room?.ownerId;
  const isOwner = !!user?.id && effectiveOwnerId === user.id;

  // Refs to keep latest values accessible from intervals/cleanup
  const videoUrlRef    = useRef<string | null>(null);
  const currentTimeRef = useRef<number>(0);
  const durationRef    = useRef<number>(0);

  useEffect(() => { videoUrlRef.current = room?.videoUrl ?? null; }, [room?.videoUrl]);
  useEffect(() => { currentTimeRef.current = syncState?.currentTime ?? 0; }, [syncState?.currentTime]);

  // Save watch progress every 30s (owner only, external videos only)
  const saveProgress = useCallback((currentTime: number, duration: number) => {
    const url = videoUrlRef.current;
    if (!url || !isOwner || currentTime < 5) return;
    apiClient.post('/watch-progress', { videoUrl: url, currentTime, duration }).catch(() => {});
  }, [isOwner]);

  // Called by VideoPlayer onProgress — derives duration from pct + time
  const handleVideoProgress = useCallback((pct: number, currentTime: number) => {
    currentTimeRef.current = currentTime;
    if (pct > 0) durationRef.current = (currentTime / pct) * 100;
  }, []);

  useEffect(() => {
    if (!isOwner) return;
    const id = setInterval(() => {
      const t = currentTimeRef.current;
      const d = durationRef.current;
      if (t > 5) saveProgress(t, d);
    }, 30_000);
    return () => clearInterval(id);
  }, [isOwner, saveProgress]);

  // Save progress on leave
  const saveProgressOnLeave = useCallback(() => {
    const url = videoUrlRef.current;
    const t   = currentTimeRef.current;
    const d   = durationRef.current;
    if (url && isOwner && t > 5) {
      apiClient.post('/watch-progress', { videoUrl: url, currentTime: t, duration: d }).catch(() => {});
    }
  }, [isOwner]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get<ApiResponse<IWatchPartyRoom>>(`/watch-party/rooms/${roomId}`);
        const roomData = res.data.data;
        if (!roomData) return;
        setRoom(roomData);
        // Only fetch movie when using catalog (not external URL)
        if (roomData.movieId) {
          const movieRes = await apiClient.get<ApiResponse<IMovie>>(`/movies/${roomData.movieId}`);
          setMovie(movieRes.data.data ?? null);
        }
      } catch (err) {
        logger.error('Watch Party xonasini yuklashda xato', err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [roomId]);

  useEffect(() => {
    apiClient
      .get<ApiResponse<IUser[]>>('/users/friends')
      .then((r) => setFriends(r.data.data ?? []))
      .catch(() => {});
  }, []);

  // Room closed by owner → redirect to home
  useEffect(() => {
    if (roomClosed) {
      router.replace('/home');
    }
  }, [roomClosed, router]);

  const handleFullscreenChange = (fs: boolean) => {
    setIsFullscreen(fs);
    setFullscreenEl(fs ? document.fullscreenElement : null);
  };

  const inviteLink = room ? `${typeof window !== 'undefined' ? window.location.origin : ''}/party/join/${room.inviteCode}` : '';

  const handleCopyForFriend = (friendId: string) => {
    void navigator.clipboard.writeText(inviteLink).then(() => {
      setCopiedFriendId(friendId);
      setTimeout(() => setCopiedFriendId(null), 2000);
    });
  };

  const handleCopyInvite = () => {
    const link = `${window.location.origin}/party/join/${room?.inviteCode}`;
    void navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleLeave = () => {
    if (isOwner && members.length > 1) {
      // Owner with others in room → show confirmation
      setShowLeaveConfirm(true);
    } else {
      doLeave();
    }
  };

  const doLeave = () => {
    saveProgressOnLeave();
    leaveRoom();
    router.replace('/home');
  };

  // Sync floatingEmojis from socket emojiEvents
  useEffect(() => {
    if (emojiEvents.length === 0) return;
    const latest = emojiEvents[emojiEvents.length - 1];
    const bottom = 15 + Math.random() * 55;
    const right = 4 + Math.random() * 18;
    setFloatingEmojis((prev) => [...prev, { id: latest.id, emoji: latest.emoji, bottom, right }]);
    const timer = setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== latest.id));
    }, 3000);
    return () => clearTimeout(timer);
  }, [emojiEvents]);

  const EMOJI_LIMIT = 2;
  const EMOJI_WINDOW_MS = 2 * 60 * 1000;

  const handleEmojiSend = (emoji: string) => {
    const now = Date.now();
    emojiTimestamps.current = emojiTimestamps.current.filter((ts) => now - ts < EMOJI_WINDOW_MS);
    if (emojiTimestamps.current.length >= EMOJI_LIMIT) {
      const oldest = emojiTimestamps.current[0];
      const remaining = Math.ceil((EMOJI_WINDOW_MS - (now - oldest)) / 1000);
      setEmojiCooldown(remaining);
      return;
    }
    emojiTimestamps.current.push(now);
    sendEmoji(emoji);
  };

  useEffect(() => {
    if (emojiCooldown <= 0) return;
    const timer = setInterval(() => {
      setEmojiCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [emojiCooldown]);

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-6rem)]">
        <div className="lg:w-[70%] aspect-video bg-base-200 animate-pulse rounded-xl" />
        <div className="lg:w-[30%] bg-base-200 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 mb-4">{t('roomNotFound')}</p>
        <Link href="/home" className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 transition-all font-medium active:scale-95">{t('backHome')}</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={handleLeave}
          className="inline-flex items-center justify-center gap-2 h-8 px-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
        >
          <FaSignOutAlt size={14} />
          {t('leave')}
        </button>
        <div className="flex items-center gap-2">
          <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${isConnected ? 'bg-lime-500/20 text-lime-400 border border-lime-500' : 'bg-red-500/20 text-red-400 border border-red-500'}`}>
            {isConnected ? t('connected') : t('disconnected')}
          </div>
          {(movie?.title ?? room?.videoTitle) && (
            <span className="text-sm text-slate-400 truncate max-w-[150px]">
              {movie?.title ?? room?.videoTitle}
            </span>
          )}
          <button
            onClick={handleCopyInvite}
            className="inline-flex items-center justify-center gap-1 h-8 px-3 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-all text-sm"
            title="Havolani nusxalash"
          >
            {copied ? <FaCheck size={16} className="text-lime-400" /> : <FaCopy size={16} />}
            <span className="hidden sm:inline text-xs">{copied ? t('copied') : t('link')}</span>
          </button>
          <button
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center justify-center gap-1 h-8 px-3 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-all text-sm"
            title={t('inviteFriends')}
          >
            <FaUserPlus size={16} />
            <span className="hidden sm:inline text-xs">{t('friends')}</span>
          </button>
        </div>
      </div>

      {/* Main layout: 70% video + 30% chat */}
      <div className="flex flex-col lg:flex-row gap-4" style={{ height: 'calc(100vh - 9rem)' }}>
        {/* Video panel */}
        <div className="lg:w-[70%] flex flex-col gap-3 min-h-0">
          <div className="relative">
            {room?.videoUrl ? (
              /* External URL room — use UniversalPlayer */
              <UniversalPlayer
                videoUrl={room.videoUrl}
                platform={(room.videoPlatform ?? 'other') as import('@/types').VideoPlatform}
                title={room.videoTitle ?? undefined}
                thumbnail={room.videoThumbnail ?? undefined}
                syncTime={syncState?.currentTime}
                syncTimestamp={syncState?.serverTimestamp}
                syncIsPlaying={syncState?.isPlaying}
                isOwner={isOwner}
                onProgress={handleVideoProgress}
                onPlay={(time) => emitPlay(time)}
                onPause={(time) => emitPause(time)}
                onSeek={(time) => emitSeek(time)}
                onFullscreenChange={handleFullscreenChange}
              />
            ) : movie?.videoUrl ? (
              /* Catalog movie */
              <VideoPlayer
                src={movie.videoUrl}
                poster={movie.backdropUrl ?? movie.posterUrl ?? movie.backdrop ?? movie.poster}
                syncTime={syncState?.currentTime}
                syncTimestamp={syncState?.serverTimestamp}
                syncIsPlaying={syncState?.isPlaying}
                isOwner={isOwner}
                onProgress={handleVideoProgress}
                onPlay={(time) => emitPlay(time)}
                onPause={(time) => emitPause(time)}
                onSeek={(time) => emitSeek(time)}
                onFullscreenChange={handleFullscreenChange}
              />
            ) : (
              <div className="aspect-video bg-black rounded-xl flex items-center justify-center">
                <p className="text-white/40">{t('noVideo')}</p>
              </div>
            )}
            {/* Floating emojis */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {floatingEmojis.map(({ id, emoji, bottom, right }) => (
                <div
                  key={id}
                  className="absolute text-4xl select-none"
                  style={{ bottom: `${bottom}%`, right: `${right}%`, animation: 'floatUp 3s ease-out forwards' }}
                >
                  {emoji}
                </div>
              ))}
            </div>
          </div>

          {!isOwner && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
              <span className="text-base">👁️</span>
              <span>{t('ownerOnly')}</span>
            </div>
          )}
        </div>

        {/* Chat panel */}
        <div className="lg:w-[30%] min-h-0 flex">
          <ChatPanel
            messages={messages}
            members={members}
            onSendMessage={sendMessage}
            onSendEmoji={handleEmojiSend}
            currentUserId={user?.id}
            ownerId={effectiveOwnerId}
            emojiCooldown={emojiCooldown}
            voice={voice}
          />
        </div>
      </div>

      {/* Fullscreen overlay — chat + voice inside fullscreen element via portal */}
      {isFullscreen && fullscreenEl && createPortal(
        <FullscreenOverlay
          messages={messages}
          members={members}
          currentUserId={user?.id}
          ownerId={effectiveOwnerId}
          voice={voice}
          emojiCooldown={emojiCooldown}
          floatingEmojis={floatingEmojis}
          onSendMessage={sendMessage}
          onSendEmoji={handleEmojiSend}
        />,
        fullscreenEl,
      )}

      {/* Owner leave confirmation modal */}
      {showLeaveConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowLeaveConfirm(false)}
        >
          <div
            className="bg-[#1a1f2e] border border-slate-700 rounded-2xl w-full max-w-sm mx-4 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <FaCrown size={18} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Honadan chiqmoqchimisiz?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Siz egasiz. Chiqib ketsangiz, eglik <span className="text-amber-400 font-medium">keyingi a&apos;zoga</span> o&apos;tkaziladi va film davom etadi.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 h-9 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700/50 transition-all text-sm"
              >
                Qolish
              </button>
              <button
                onClick={doLeave}
                className="flex-1 h-9 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium"
              >
                Chiqish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Friend invite modal */}
      {showInvite && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowInvite(false)}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-sm mx-4 p-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">{t('inviteFriends')}</h3>
              <button onClick={() => setShowInvite(false)} className="text-slate-400 hover:text-slate-200">
                <FaTimes size={14} />
              </button>
            </div>
            <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-2">
              <span className="text-xs text-slate-400 truncate flex-1">{inviteLink}</span>
              <button
                onClick={handleCopyInvite}
                className="shrink-0 text-slate-300 hover:text-lime-400 transition-colors"
              >
                {copied ? <FaCheck size={13} className="text-lime-400" /> : <FaCopy size={13} />}
              </button>
            </div>
            {friends.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">{t('noFriends')}</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {friends.map((friend) => (
                  <li key={friend._id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden shrink-0">
                      {friend.avatar ? (
                        <img src={friend.avatar} alt={friend.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-300">
                          {friend.username[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-slate-300 flex-1 truncate">{friend.username}</span>
                    <button
                      onClick={() => handleCopyForFriend(friend._id)}
                      className="shrink-0 inline-flex items-center gap-1 h-7 px-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all text-xs font-medium"
                    >
                      {copiedFriendId === friend._id ? (
                        <><FaCheck size={11} /> {t('copied')}</>
                      ) : (
                        <><FaCopy size={11} /> {t('link')}</>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
