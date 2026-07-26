'use client';

import { useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { roomsApi } from '@/lib/api/rooms.api';
import { parseApiError } from '@/lib/api-error';
import { trackClick } from '@/lib/analytics';

interface Props {
  open: boolean;
  inviteCode: string;
  /** Called once the join succeeded — the caller reconnects/reloads so the socket joins as a member. */
  onJoined: () => void;
}

export function RoomPasswordDialog({ open, inviteCode, onJoined }: Props) {
  const t = useTranslations('room');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || pending) return;
    trackClick('room:submit_password');
    setPending(true);
    setError(null);
    try {
      await roomsApi.joinByCode(inviteCode, password);
      onJoined();
    } catch (err) {
      setError(parseApiError(err, t('passwordWrong')));
      setPending(false);
    }
  }

  // Deliberately not dismissible: without membership the room behind it renders nothing usable,
  // so an escape hatch would just drop the user on a broken screen. Leaving means going back.
  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-xs liquid-glass border-white/[0.08] p-6"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">{t('passwordTitle')}</DialogTitle>

        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}
          >
            <Lock size={17} className="text-violet-400" />
          </div>

          <div className="text-center">
            <p className="text-white text-sm font-semibold">{t('passwordTitle')}</p>
            <p className="text-zinc-500 text-[11px] mt-1">{t('passwordHint')}</p>
          </div>

          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            placeholder={t('passwordPlaceholder')}
            autoFocus
            className="w-full h-9 bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
          />

          {error && <p className="text-[11px] text-red-400 text-center">{error}</p>}

          <button
            type="submit"
            disabled={!password || pending}
            className="w-full h-9 rounded-lg flex items-center justify-center gap-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 transition-colors cursor-pointer"
          >
            {pending && <Loader2 size={14} className="animate-spin" />}
            {t('passwordSubmit')}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
