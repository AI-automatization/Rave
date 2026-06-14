'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, LogOut, Share2 } from 'lucide-react';
import { useWatchPartyStore } from '@/store/watch-party.store';
import { useTranslations } from 'next-intl';
import { InviteDialog } from '@/components/party/InviteDialog';

export function RoomHeader() {
  const t = useTranslations('party');
  const router = useRouter();
  const room = useWatchPartyStore((s) => s.room);
  const members = useWatchPartyStore((s) => s.members);
  const isConnected = useWatchPartyStore((s) => s.isConnected);
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-base font-semibold text-white truncate">
            {room?.name ?? room?.videoTitle ?? 'Watch Party'}
          </h2>
          <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
            <Users size={12} />
            {members.length}
          </div>
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setInviteOpen(true)}
            className="h-8 px-3 rounded-lg text-xs font-medium text-slate-300 bg-white/[0.06] hover:bg-white/[0.1] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 size={12} />
            {t('link')}
          </button>
          <button
            onClick={() => router.push('/home')}
            className="h-8 px-3 rounded-lg text-xs font-medium text-red-400 bg-red-500/[0.08] hover:bg-red-500/[0.15] transition-colors flex items-center gap-1.5 cursor-pointer"
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
