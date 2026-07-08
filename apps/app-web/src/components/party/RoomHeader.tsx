'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, LogOut, Share2 } from 'lucide-react';
import { useWatchPartyStore } from '@/store/watch-party.store';
import { useTranslations } from 'next-intl';
import { InviteDialog } from '@/components/party/InviteDialog';

export function RoomHeader() {
  const t = useTranslations('party');
  const tHome = useTranslations('home');
  const router = useRouter();
  const room = useWatchPartyStore((s) => s.room);
  const storeMembers = useWatchPartyStore((s) => s.members);
  const isConnected = useWatchPartyStore((s) => s.isConnected);
  const [inviteOpen, setInviteOpen] = useState(false);

  const memberCount = ((room as any)?.members as unknown[])?.length ?? storeMembers.length;

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Connection dot */}
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: isConnected ? '#34d399' : '#f87171', boxShadow: isConnected ? '0 0 4px #34d399' : 'none' }}
          />

          <h2 className="text-[14px] font-semibold text-white truncate leading-snug">
            {room?.name ?? room?.videoTitle ?? tHome('title')}
          </h2>

          {room?.videoPlatform && (
            <span className="text-[10px] text-slate-600 uppercase tracking-wide shrink-0">
              {room.videoPlatform}
            </span>
          )}

          <div className="flex items-center gap-1 text-[11px] text-slate-500 shrink-0">
            <Users size={11} />
            {memberCount}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setInviteOpen(true)}
            className="h-8 px-3 rounded-lg text-xs font-medium text-zinc-300 bg-white/[0.05] border border-white/[0.09] hover:bg-white/[0.1] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 size={12} />
            {t('link')}
          </button>
          <button
            onClick={() => router.push('/home')}
            className="h-8 px-3 rounded-lg text-xs font-medium text-red-400 bg-red-500/[0.07] border border-red-500/[0.15] hover:bg-red-500/[0.14] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut size={12} />
            {t('leave')}
          </button>
        </div>
      </div>

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </>
  );
}
