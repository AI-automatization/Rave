'use client';

import { useState } from 'react';
import { Copy, Check, Send, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useWatchPartyStore } from '@/store/watch-party.store';
import { toast } from '@/hooks/use-toast';
import type { IUser } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteDialog({ open, onOpenChange }: Props) {
  const t = useTranslations('party');
  const room = useWatchPartyStore((s) => s.room);
  const [copied, setCopied] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  const inviteCode = room?.inviteCode ?? '';

  const { data: friends } = useQuery<IUser[]>({
    queryKey: ['friends'],
    queryFn: async () => {
      const res = await fetch('/api/user/me/friends', { credentials: 'include' });
      if (!res.ok) return [];
      const data = await res.json() as { data?: IUser[] };
      return Array.isArray(data.data) ? data.data : [];
    },
    enabled: open,
  });

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  async function handleInvite(userId: string) {
    if (!room?._id) return;
    setInvitingId(userId);
    try {
      const res = await fetch(`/api/rooms/${room._id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        toast({ title: 'Invite sent ✓' });
      } else {
        toast({ title: 'Failed to invite', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Failed to invite', variant: 'destructive' });
    } finally {
      setInvitingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="text-white max-w-sm border-white/[0.12]"
        style={{ background: 'rgba(8,6,18,0.9)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}
      >
        <DialogHeader>
          <DialogTitle className="text-white">{t('inviteFriends')}</DialogTitle>
          <DialogDescription className="text-slate-400">
            Bu kodni do&apos;stlaringizga yuboring
          </DialogDescription>
        </DialogHeader>

        {/* Invite code */}
        <div className="flex items-center gap-2">
          <div
            className="flex-1 h-12 border border-white/[0.1] rounded-xl flex items-center justify-center text-xl font-bold tracking-[0.3em] text-white"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            {inviteCode}
          </div>
          <button
            onClick={handleCopy}
            className="h-12 w-12 rounded-xl flex items-center justify-center text-white bg-violet-600 hover:bg-violet-500 transition-colors cursor-pointer"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>

        {copied && (
          <p className="text-xs text-emerald-400 text-center">{t('copied')}</p>
        )}

        {/* Friends list */}
        {friends && friends.length > 0 && (
          <div className="flex flex-col gap-1 mt-1 max-h-48 overflow-y-auto">
            <p className="text-xs text-slate-500 mb-1">{t('friends')}</p>
            {friends.map((friend) => (
              <div
                key={friend._id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-xs font-bold text-slate-300 overflow-hidden shrink-0">
                  {friend.avatar
                    ? <img src={friend.avatar} alt="" className="w-full h-full object-cover" />
                    : friend.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="flex-1 text-sm text-slate-300 truncate">{friend.username}</span>
                <button
                  onClick={() => handleInvite(friend._id)}
                  disabled={invitingId === friend._id}
                  className="h-7 px-2.5 rounded-lg text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {invitingId === friend._id
                    ? <Loader2 size={11} className="animate-spin" />
                    : <><Send size={11} /> Invite</>}
                </button>
              </div>
            ))}
          </div>
        )}

        {friends && friends.length === 0 && (
          <p className="text-xs text-slate-500 text-center">{t('noFriends')}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
