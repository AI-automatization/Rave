'use client';

import { useState } from 'react';
import { MessageCircle, Users as UsersIcon } from 'lucide-react';
import { useWatchParty } from '@/hooks/use-watch-party';
import { VideoPlayer } from '@/components/party/VideoPlayer';
import { ChatPanel } from '@/components/party/ChatPanel';
import { MemberList } from '@/components/party/MemberList';
import { RoomHeader } from '@/components/party/RoomHeader';
import { EmojiReactions } from '@/components/party/EmojiReactions';

interface Props {
  roomId: string;
}

export function RoomContent({ roomId }: Props) {
  const { sendMessage, sendPlay, sendPause, sendSeek, sendEmoji } = useWatchParty(roomId);
  const [rightTab, setRightTab] = useState<'chat' | 'members'>('chat');

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
          />
          <EmojiReactions onSend={sendEmoji} />
        </div>

        {/* Right: Chat / Members */}
        <div className="hidden md:flex flex-col w-80 border-l border-white/[0.06] bg-[#0A0A12]/30">
          {/* Tabs */}
          <div className="flex border-b border-white/[0.06]">
            <button
              onClick={() => setRightTab('chat')}
              className={`flex-1 h-10 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
                rightTab === 'chat' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <MessageCircle size={14} />
              Chat
            </button>
            <button
              onClick={() => setRightTab('members')}
              className={`flex-1 h-10 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
                rightTab === 'members' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-slate-500 hover:text-slate-300'
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
