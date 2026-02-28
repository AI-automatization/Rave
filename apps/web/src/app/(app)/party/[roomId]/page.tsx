'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { ChatPanel } from '@/components/party/ChatPanel';
import { useWatchParty } from '@/hooks/useWatchParty';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import type { ApiResponse, IWatchPartyRoom } from '@/types';

const VideoPlayer = dynamic(
  () => import('@/components/VideoPlayer').then((m) => m.VideoPlayer),
  { ssr: false, loading: () => <div className="aspect-video w-full bg-black rounded-xl animate-pulse" /> },
);

export default function WatchPartyPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const user = useAuthStore((s) => s.user);
  const [room, setRoom] = useState<IWatchPartyRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string }[]>([]);

  const { syncState, members, messages, sendMessage, sendEmoji, emitPlay, emitPause, emitSeek, isConnected } =
    useWatchParty(roomId);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get<ApiResponse<IWatchPartyRoom>>(`/watch-party/rooms/${roomId}`);
        setRoom(res.data.data);
      } catch (err) {
        logger.error('Watch Party xonasini yuklashda xato', err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [roomId]);

  const isOwner = room?.owner._id === user?.id;

  const handleCopyInvite = () => {
    const link = `${window.location.origin}/party/join/${room?.inviteCode}`;
    void navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleEmojiSend = (emoji: string) => {
    sendEmoji(emoji);
    const id = Date.now();
    setFloatingEmojis((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
    }, 3000);
  };

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
        <p className="text-base-content/40 mb-4">Xona topilmadi</p>
        <Link href="/home" className="btn btn-primary">Bosh sahifa</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link href="/home" className="btn btn-ghost btn-sm gap-2">
          <ArrowLeft className="w-4 h-4" />
          Chiqish
        </Link>
        <div className="flex items-center gap-2">
          <div className={`badge badge-sm ${isConnected ? 'badge-success' : 'badge-error'}`}>
            {isConnected ? 'Ulangan' : 'Uzildi'}
          </div>
          <span className="text-sm text-base-content/60 truncate max-w-[150px]">
            {room.movie.title}
          </span>
          <button
            onClick={handleCopyInvite}
            className="btn btn-ghost btn-sm gap-1"
            title="Havolani nusxalash"
          >
            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline text-xs">{copied ? 'Nusxalandi' : 'Taklif'}</span>
          </button>
        </div>
      </div>

      {/* Main layout: 70% video + 30% chat */}
      <div className="flex flex-col lg:flex-row gap-4" style={{ height: 'calc(100vh - 9rem)' }}>
        {/* Video panel */}
        <div className="lg:w-[70%] flex flex-col gap-3 min-h-0">
          <div className="relative">
            {room.movie.videoUrl ? (
              <VideoPlayer
                src={room.movie.videoUrl}
                poster={room.movie.backdrop ?? room.movie.poster}
                syncTime={syncState?.currentTime}
                isOwner={isOwner}
                onPlay={() => { if (room.movie.videoUrl) emitPlay(syncState?.currentTime ?? 0); }}
                onPause={() => { if (room.movie.videoUrl) emitPause(syncState?.currentTime ?? 0); }}
                onSeek={(t) => emitSeek(t)}
              />
            ) : (
              <div className="aspect-video bg-black rounded-xl flex items-center justify-center">
                <p className="text-white/40">Video mavjud emas</p>
              </div>
            )}
            {/* Floating emojis */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {floatingEmojis.map(({ id, emoji }) => (
                <div
                  key={id}
                  className="absolute text-4xl animate-bounce"
                  style={{
                    bottom: `${20 + Math.random() * 60}%`,
                    right: `${5 + Math.random() * 15}%`,
                    animation: 'fade-in 3s ease-out forwards',
                  }}
                >
                  {emoji}
                </div>
              ))}
            </div>
          </div>

          {!isOwner && (
            <div className="alert alert-info py-2">
              <span className="text-xs">Faqat xona egasi ({room.owner.username}) video ni boshqara oladi</span>
            </div>
          )}
        </div>

        {/* Chat panel */}
        <div className="lg:w-[30%] min-h-0 flex">
          <ChatPanel
            messages={messages}
            members={members.length > 0 ? members : room.members}
            onSendMessage={sendMessage}
            onSendEmoji={handleEmojiSend}
            currentUserId={user?.id}
          />
        </div>
      </div>
    </div>
  );
}
