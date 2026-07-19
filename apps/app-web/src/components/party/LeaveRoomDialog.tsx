'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, DoorOpen, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { toast } from '@/store/toast.store';
import { trackClick } from '@/lib/analytics';

interface Member {
  _id: string;
  username: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  otherMembers: Member[];
}

export function LeaveRoomDialog({ open, onOpenChange, roomId, otherMembers }: Props) {
  const t = useTranslations('party');
  const router = useRouter();
  const [busy, setBusy] = useState<'close' | string | null>(null);

  async function closeRoom() {
    trackClick('room:leave_close');
    setBusy('close');
    try {
      const res = await fetch(`/api/rooms/${roomId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('failed');
      router.push('/home');
    } catch {
      toast.error(t('leaveError'));
      setBusy(null);
    }
  }

  async function transferTo(newOwnerId: string) {
    trackClick('room:leave_transfer');
    setBusy(newOwnerId);
    try {
      const res = await fetch(`/api/rooms/${roomId}/leave`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwnerId }),
      });
      if (!res.ok) throw new Error('failed');
      router.push('/home');
    } catch {
      toast.error(t('leaveError'));
      setBusy(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="text-white max-w-sm border-white/[0.12]"
        style={{ background: 'rgba(8,6,18,0.9)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}
      >
        <DialogHeader>
          <DialogTitle className="text-white">{t('leaveTitle')}</DialogTitle>
          <DialogDescription className="text-slate-400">{t('leaveDesc')}</DialogDescription>
        </DialogHeader>

        <button
          onClick={closeRoom}
          disabled={busy !== null}
          className="h-11 px-3 rounded-xl text-sm font-medium text-red-400 bg-red-500/[0.07] border border-red-500/[0.15] hover:bg-red-500/[0.14] transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {busy === 'close' ? <Loader2 size={14} className="animate-spin" /> : <DoorOpen size={14} />}
          {t('leaveCloseRoom')}
        </button>

        {otherMembers.length > 0 && (
          <div className="flex flex-col gap-1 mt-1">
            <p className="text-xs text-slate-500 mb-1">{t('leaveTransferTitle')}</p>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {otherMembers.map((member) => (
                <button
                  key={member._id}
                  onClick={() => transferTo(member._id)}
                  disabled={busy !== null}
                  className="h-10 px-2.5 rounded-lg text-sm text-zinc-300 bg-white/[0.04] hover:bg-white/[0.08] transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {busy === member._id
                    ? <Loader2 size={13} className="animate-spin shrink-0" />
                    : <Crown size={13} className="text-yellow-500/70 shrink-0" />}
                  <span className="truncate">{member.username}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
