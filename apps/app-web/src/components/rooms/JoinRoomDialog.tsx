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
import { parseApiError } from '@/lib/api-error';
import { trackClick } from '@/lib/analytics';

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
    trackClick('join_room:submit');

    try {
      const res = await joinRoom.mutateAsync(code.trim());
      onOpenChange(false);
      const roomId = res.data?._id;
      if (roomId) {
        router.push(`/room/${roomId}`);
      }
    } catch (err) {
      toast.error(parseApiError(err, t('joinError')));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="text-white max-w-sm border border-white/[0.12]"
        style={{ background: 'rgba(8,6,18,0.9)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}
      >
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
            className="w-full h-11 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 text-center text-lg font-bold tracking-widest text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 transition-all"
          />

          <button
            onClick={handleJoin}
            disabled={joinRoom.isPending || code.length < 4}
            className="w-full h-11 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
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
