'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useJoinRoom } from '@/hooks/use-rooms';
import { toast } from '@/store/toast.store';
import { useApiError } from '@/hooks/use-api-error';
import { trackClick } from '@/lib/analytics';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Friends share the invite LINK (InviteDialog copies `${appUrl}/room/<id>?code=<CODE>`), so people
// paste it here. The field used to uppercase it and cut it at 10 chars → "HTTPS://AP" → "code not
// found". A pasted link now yields its code, or — with no code in it — the room itself.
function parseJoinInput(raw: string): { code: string } | { roomId: string } | null {
  const text = raw.trim();
  if (!/^https?:\/\/|\/room\//i.test(text)) return text ? { code: text.toUpperCase() } : null;
  try {
    const url = new URL(text, 'https://x.invalid');
    const code = url.searchParams.get('code');
    if (code) return { code: code.toUpperCase() };
    const roomId = /\/room\/([A-Za-z0-9_-]+)/.exec(url.pathname)?.[1];
    return roomId ? { roomId } : null;
  } catch {
    return null;
  }
}

export function JoinRoomDialog({ open, onOpenChange }: Props) {
  const t = useTranslations('room');
  const parseError = useApiError();
  const router = useRouter();
  const joinRoom = useJoinRoom();
  const [code, setCode] = useState('');
  // Shown inside the dialog, not only as a toast. A wrong code is an error *about the field the
  // user is looking at* — with the modal open and focus in the input, a corner toast is the wrong
  // place for it (prod audit 2026-08-01: entering ZZZ999 appeared to do nothing at all).
  const [error, setError] = useState('');

  async function handleJoin() {
    const parsed = parseJoinInput(code);
    if (!parsed) { setError(t('joinError')); return; }
    if ('code' in parsed && parsed.code.length < 4) return;
    trackClick('join_room:submit');
    setError('');

    if ('roomId' in parsed) {
      onOpenChange(false);
      setCode('');
      router.push(`/room/${parsed.roomId}`);
      return;
    }

    try {
      const res = await joinRoom.mutateAsync(parsed.code);
      onOpenChange(false);
      setCode('');
      const roomId = res.data?._id;
      if (roomId) {
        router.push(`/room/${roomId}`);
      }
    } catch (err) {
      const msg = parseError(err, t('joinError'));
      setError(msg);
      toast.error(msg);
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
            onChange={(e) => {
              const v = e.target.value;
              // Keep a pasted link as typed (paths/ids are case-sensitive); plain codes stay uppercase.
              setCode(/^https?:\/\/|\/room\//i.test(v) ? v : v.toUpperCase().slice(0, 10));
              setError('');
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleJoin(); }}
            placeholder="ABC123"
            autoFocus
            aria-invalid={!!error}
            className={`w-full h-11 bg-white/[0.06] border rounded-xl px-4 text-center text-lg font-bold tracking-widest text-white placeholder:text-zinc-600 focus:outline-none transition-all ${
              error ? 'border-red-500/50' : 'border-white/[0.1] focus:border-violet-500/50'
            }`}
          />

          {error && (
            <div className="flex items-center gap-2.5 text-sm text-red-400 bg-red-500/[0.07] border border-red-500/[0.15] rounded-xl px-3.5 py-2.5">
              <XCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={() => { void handleJoin(); }}
            disabled={joinRoom.isPending || code.trim().length < 4}
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
