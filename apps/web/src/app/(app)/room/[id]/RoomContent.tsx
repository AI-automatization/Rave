'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Users as UsersIcon } from 'lucide-react';
import { useWatchParty } from '@/hooks/use-watch-party';
import { VideoPlayer } from '@/components/party/VideoPlayer';
import { ChatPanel } from '@/components/party/ChatPanel';
import { MemberList } from '@/components/party/MemberList';
import { RoomHeader } from '@/components/party/RoomHeader';
import { EmojiReactions } from '@/components/party/EmojiReactions';
import { roomsApi } from '@/lib/api/rooms.api';
import { useWatchPartyStore } from '@/store/watch-party.store';

interface Props {
  roomId: string;
}

export function RoomContent({ roomId }: Props) {
  const { sendMessage, sendPlay, sendPause, sendSeek, sendEmoji, sendHeartbeat, sendBufferStart, sendBufferEnd } = useWatchParty(roomId);
  const [rightTab, setRightTab] = useState<'chat' | 'members'>('chat');
  const setRoom = useWatchPartyStore((s) => s.setRoom);
  const reset = useWatchPartyStore((s) => s.reset);

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
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-4 md:-m-6 lg:-m-8">
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

        {/* Right: Chat / Members */}
        <div className="hidden md:flex flex-col w-80 border-l border-white/[0.06] bg-[#0A0A12]/30">
          <div className="flex gap-1 p-1.5 m-2 bg-[#111118] rounded-xl border border-white/[0.06]">
            <button
              onClick={() => setRightTab('chat')}
              className={`flex-1 h-9 flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                rightTab === 'chat'
                  ? 'bg-violet-600/18 text-violet-300 border border-violet-500/25'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              <MessageCircle size={14} />
              Chat
            </button>
            <button
              onClick={() => setRightTab('members')}
              className={`flex-1 h-9 flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                rightTab === 'members'
                  ? 'bg-violet-600/18 text-violet-300 border border-violet-500/25'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              <UsersIcon size={14} />
              Members
            </button>
          </div>

          {rightTab === 'chat' ? (
            <ChatPanel onSend={sendMessage} />
          ) : (
            <MemberList />
          )}
        </div>
      </div>
    </div>
  );
}
