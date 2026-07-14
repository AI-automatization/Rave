'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { MessageCircle, Users as UsersIcon, ListVideo, X, ChevronRight, Loader2 } from 'lucide-react';
import { useWatchParty } from '@/hooks/use-watch-party';
import { VideoPlayer } from '@/components/party/VideoPlayer';
import { ChatPanel } from '@/components/party/ChatPanel';
import { MemberList } from '@/components/party/MemberList';
import { RoomHeader } from '@/components/party/RoomHeader';
import { EmojiReactions } from '@/components/party/EmojiReactions';
import { roomsApi } from '@/lib/api/rooms.api';
import { useWatchPartyStore } from '@/store/watch-party.store';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/hooks/use-toast';
import { trackClick } from '@/lib/analytics';

interface PlaylistItem {
  videoUrl: string;
  videoTitle?: string;
  addedBy?: string;
}

interface Props {
  roomId: string;
}

function PlaylistPanel({ roomId, isOwner }: { roomId: string; isOwner: boolean }) {
  const t = useTranslations('party');
  const room = useWatchPartyStore((s) => s.room);
  const playlist = (room as unknown as { playlist?: PlaylistItem[] }).playlist ?? [];
  const [urlInput, setUrlInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);

  async function handleAdd() {
    if (!urlInput.trim()) return;
    trackClick('room:playlist_add');
    setAdding(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/playlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ videoUrl: urlInput.trim() }),
      });
      if (res.ok) {
        setUrlInput('');
        toast({ title: t('addToQueue') });
      } else {
        toast({ title: t('addError'), variant: 'destructive' });
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(index: number) {
    trackClick('room:playlist_remove');
    try {
      await fetch(`/api/rooms/${roomId}/playlist/${index}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch {
      toast({ title: t('removeError'), variant: 'destructive' });
    }
  }

  async function handleNext() {
    trackClick('room:playlist_next');
    setNextLoading(true);
    try {
      await fetch(`/api/rooms/${roomId}/playlist/next`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      toast({ title: t('skipError'), variant: 'destructive' });
    } finally {
      setNextLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {playlist.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500 text-xs">{t('queueEmpty')}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1.5">
          {playlist.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-2 py-1.5 group"
            >
              <span className="text-slate-600 text-[10px] w-4 shrink-0">{i + 1}</span>
              <p className="flex-1 text-xs text-slate-300 truncate">
                {item.videoTitle ?? item.videoUrl}
              </p>
              {isOwner && (
                <button
                  onClick={() => handleRemove(i)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isOwner && (
        <div className="border-t border-white/[0.06] p-2 flex flex-col gap-2">
          {playlist.length > 0 && (
            <button
              onClick={handleNext}
              disabled={nextLoading}
              className="h-8 w-full rounded-lg text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {nextLoading
                ? <Loader2 size={12} className="animate-spin" />
                : <><ChevronRight size={12} /> {t('next')}</>}
            </button>
          )}
          <div className="flex gap-1.5">
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              placeholder={t('videoUrlPlaceholder')}
              className="flex-1 h-8 px-2 rounded-lg text-xs bg-white/[0.06] border border-white/[0.08] text-white placeholder-slate-500 outline-none focus:border-violet-500/50"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !urlInput.trim()}
              className="h-8 px-3 rounded-lg text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 transition-colors cursor-pointer disabled:opacity-50"
            >
              {adding ? <Loader2 size={12} className="animate-spin" /> : '+'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function RoomContent({ roomId }: Props) {
  const t = useTranslations('party');
  const { sendMessage, sendPlay, sendPause, sendSeek, sendEmoji, sendHeartbeat, sendBufferStart, sendBufferEnd } = useWatchParty(roomId);
  const [rightTab, setRightTab] = useState<'chat' | 'members' | 'playlist'>('chat');
  const setRoom = useWatchPartyStore((s) => s.setRoom);
  const reset = useWatchPartyStore((s) => s.reset);
  const room = useWatchPartyStore((s) => s.room);
  const currentUser = useAuthStore((s) => s.user);
  const isOwner = !!(room && currentUser && room.ownerId === currentUser._id);

  // Pre-load room via REST immediately — don't wait 2-3s for socket ROOM_JOINED
  useEffect(() => {
    let mounted = true;
    roomsApi.getById(roomId).then((res) => {
      if (mounted && res.data) setRoom(res.data);
    }).catch(() => {});
    return () => {
      mounted = false;
      // Reset store when leaving room so stale data doesn't flash on next room visit
      reset();
    };
  }, [roomId, setRoom, reset]);

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] -m-4 md:-m-6 lg:-m-8">
      <RoomHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Video */}
        <div className="flex-1 flex flex-col p-4 gap-3 min-w-0">
          <VideoPlayer
            onPlay={sendPlay}
            onPause={sendPause}
            onSeek={sendSeek}
            onHeartbeat={sendHeartbeat}
            onBufferStart={sendBufferStart}
            onBufferEnd={sendBufferEnd}
          />
          <EmojiReactions onSend={sendEmoji} />
        </div>

        {/* Right: Chat / Members / Playlist */}
        <div
          className="hidden md:flex flex-col w-80 border-l border-white/[0.07]"
          style={{ background: 'rgba(7,7,13,0.5)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
        >
          <div className="flex border-b border-white/[0.07]">
            <button
              onClick={() => { trackClick('room:tab_chat'); setRightTab('chat'); }}
              className={`relative flex-1 h-10 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
                rightTab === 'chat' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <MessageCircle size={13} />
              {t('chat')}
              {rightTab === 'chat' && (
                <span className="absolute bottom-0 inset-x-3 h-0.5 rounded-full bg-violet-500" />
              )}
            </button>
            <button
              onClick={() => { trackClick('room:tab_members'); setRightTab('members'); }}
              className={`relative flex-1 h-10 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
                rightTab === 'members' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <UsersIcon size={13} />
              {t('members')}
              {rightTab === 'members' && (
                <span className="absolute bottom-0 inset-x-3 h-0.5 rounded-full bg-violet-500" />
              )}
            </button>
            {isOwner && (
              <button
                onClick={() => { trackClick('room:tab_playlist'); setRightTab('playlist'); }}
                className={`relative flex-1 h-10 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  rightTab === 'playlist' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <ListVideo size={13} />
                {t('queue')}
                {rightTab === 'playlist' && (
                  <span className="absolute bottom-0 inset-x-3 h-0.5 rounded-full bg-violet-500" />
                )}
              </button>
            )}
          </div>

          {rightTab === 'chat' && <ChatPanel onSend={sendMessage} />}
          {rightTab === 'members' && <MemberList />}
          {rightTab === 'playlist' && (
            <PlaylistPanel roomId={roomId} isOwner={isOwner} />
          )}
        </div>
      </div>
    </div>
  );
}
