'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FaArrowLeft, FaCopy, FaCheck, FaUserPlus, FaTimes } from 'react-icons/fa';
import { ChatPanel } from '@/components/party/ChatPanel';
import { useWatchParty } from '@/hooks/useWatchParty';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import { useTranslations } from 'next-intl';
import type { ApiResponse, IWatchPartyRoom, IMovie, IUser } from '@/types';

const VideoPlayer = dynamic(
  () => import('@/components/VideoPlayer').then((m) => m.VideoPlayer),
  { ssr: false, loading: () => <div className="aspect-video w-full bg-black rounded-xl animate-pulse" /> },
);

export default function WatchPartyPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const t = useTranslations('party');
  const user = useAuthStore((s) => s.user);
  const [room, setRoom] = useState<IWatchPartyRoom | null>(null);
  const [movie, setMovie] = useState<IMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; bottom: number; right: number }[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [friends, setFriends] = useState<IUser[]>([]);
  const [copiedFriendId, setCopiedFriendId] = useState<string | null>(null);
  const emojiTimestamps = useRef<number[]>([]);
  const [emojiCooldown, setEmojiCooldown] = useState(0); // seconds left

  const { syncState, members, messages, emojiEvents, sendMessage, sendEmoji, emitPlay, emitPause, emitSeek, isConnected } =
    useWatchParty(roomId);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get<ApiResponse<IWatchPartyRoom>>(`/watch-party/rooms/${roomId}`);
        const roomData = res.data.data;
        if (!roomData) return;
        setRoom(roomData);

        // Fetch movie separately
        const movieRes = await apiClient.get<ApiResponse<IMovie>>(`/movies/${roomData.movieId}`);
        setMovie(movieRes.data.data ?? null);
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

  const isOwner = room?.ownerId === user?.id;


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

  // Sync floatingEmojis from socket emojiEvents (all users including self)
  useEffect(() => {
    if (emojiEvents.length === 0) return;
    const latest = emojiEvents[emojiEvents.length - 1];
    const bottom = 15 + Math.random() * 55;
    const right = 4 + Math.random() * 18;
    setFloatingEmojis((prev) => [...prev, { id: latest.id, emoji: latest.emoji, bottom, right }]);
    const t = setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== latest.id));
    }, 3000);
    return () => clearTimeout(t);
  }, [emojiEvents]);

  // Emoji rate limit: max 2 per 2 minutes
  const EMOJI_LIMIT = 2;
  const EMOJI_WINDOW_MS = 2 * 60 * 1000;

  const handleEmojiSend = (emoji: string) => {
    const now = Date.now();
    // Remove timestamps older than 2 minutes
    emojiTimestamps.current = emojiTimestamps.current.filter((t) => now - t < EMOJI_WINDOW_MS);
    if (emojiTimestamps.current.length >= EMOJI_LIMIT) {
      const oldest = emojiTimestamps.current[0];
      const remaining = Math.ceil((EMOJI_WINDOW_MS - (now - oldest)) / 1000);
      setEmojiCooldown(remaining);
      return;
    }
    emojiTimestamps.current.push(now);
    sendEmoji(emoji);
  };

  // Cooldown countdown
  useEffect(() => {
    if (emojiCooldown <= 0) return;
    const t = setInterval(() => {
      setEmojiCooldown((prev) => {
        if (prev <= 1) { clearInterval(t); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
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
        <Link href="/home" className="inline-flex items-center justify-center gap-2 h-8 px-3 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-all text-sm font-medium">
          <FaArrowLeft size={16} />
          {t('leave')}
        </Link>
        <div className="flex items-center gap-2">
          <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${isConnected ? 'bg-lime-500/20 text-lime-400 border border-lime-500' : 'bg-red-500/20 text-red-400 border border-red-500'}`}>
            {isConnected ? t('connected') : t('disconnected')}
          </div>
          {movie && (
            <span className="text-sm text-slate-400 truncate max-w-[150px]">
              {movie.title}
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
            {movie?.videoUrl ? (
              <VideoPlayer
                src={movie.videoUrl}
                poster={movie.backdropUrl ?? movie.posterUrl ?? movie.backdrop ?? movie.poster}
                syncTime={syncState?.currentTime}
                syncTimestamp={syncState?.serverTimestamp}
                syncIsPlaying={syncState?.isPlaying}
                isOwner={isOwner}
                onPlay={(t) => emitPlay(t)}
                onPause={(t) => emitPause(t)}
                onSeek={(t) => emitSeek(t)}
              />
            ) : (
              <div className="aspect-video bg-black rounded-xl flex items-center justify-center">
                <p className="text-white/40">{t('noVideo')}</p>
              </div>
            )}
            {/* Floating emojis — driven by socket events */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {floatingEmojis.map(({ id, emoji, bottom, right }) => (
                <div
                  key={id}
                  className="absolute text-4xl select-none"
                  style={{
                    bottom: `${bottom}%`,
                    right: `${right}%`,
                    animation: 'floatUp 3s ease-out forwards',
                  }}
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
            emojiCooldown={emojiCooldown}
          />
        </div>
      </div>

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

            {/* Invite link */}
            <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-2">
              <span className="text-xs text-slate-400 truncate flex-1">{inviteLink}</span>
              <button
                onClick={handleCopyInvite}
                className="shrink-0 text-slate-300 hover:text-lime-400 transition-colors"
                title="Nusxalash"
              >
                {copied ? <FaCheck size={13} className="text-lime-400" /> : <FaCopy size={13} />}
              </button>
            </div>

            {/* Friends list */}
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
