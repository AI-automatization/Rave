'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useJoinRoom } from '@/hooks/use-rooms';
import { toast } from '@/store/toast.store';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinRoomDialog({ open, onOpenChange }: Props) {
  const t = useTranslations('room');
  const router = useRouter();
  const joinRoom = useJoinRoom();
  const [code, setCode] = useState('');

  async function handleJoin() {
    if (code.length < 4) return;

    try {
      const res = await joinRoom.mutateAsync(code.trim());
      onOpenChange(false);
      const roomId = res.data?.room?._id;
      if (roomId) {
        router.push(`/room/${roomId}`);
      }
    } catch {
      toast.error(t('joinError'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0F0E1A] border-[#1E1D2E] text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">{t('joinTitle')}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {t('joinDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={10}
            autoFocus
            className="w-full h-12 bg-[#13121F] border border-[#2A2840] rounded-xl px-4 text-center text-lg font-bold tracking-widest text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
          />

          <button
            onClick={handleJoin}
            disabled={joinRoom.isPending || code.length < 4}
            className="w-full h-11 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}
          >
            {joinRoom.isPending
              ? <><Loader2 size={15} className="animate-spin" />{t('joining')}</>
              : t('joinBtn')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
