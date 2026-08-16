'use client';

import { useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/field';
import { roomsApi } from '@/lib/api/rooms.api';
import { useApiError } from '@/hooks/use-api-error';
import { trackClick } from '@/lib/analytics';

interface Props {
  open: boolean;
  inviteCode: string;
  /** Called once the join succeeded — the caller reconnects/reloads so the socket joins as a member. */
  onJoined: () => void;
}

export function RoomPasswordDialog({ open, inviteCode, onJoined }: Props) {
  const t = useTranslations('room');
  const parseError = useApiError();
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
      setError(parseError(err, t('passwordWrong')));
      setPending(false);
    }
  }

  // Deliberately not dismissible: without membership the room behind it renders nothing usable,
  // so an escape hatch would just drop the user on a broken screen. Leaving means going back.
  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-xs rounded-[var(--ww-r-xl)] border-[var(--ww-line)] bg-[var(--ww-panel-solid)] p-6 text-[var(--ww-text)]"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">{t('passwordTitle')}</DialogTitle>

        <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(124,58,237,0.28)] bg-[var(--ww-accent-soft)]">
            <Lock size={18} aria-hidden="true" className="text-[var(--ww-accent-hi)]" />
          </span>

          <div className="text-center">
            <p className="text-[14px] font-semibold text-[var(--ww-text)]">{t('passwordTitle')}</p>
            <p className="mt-1 text-[12px] text-[var(--ww-text-3)]">{t('passwordHint')}</p>
          </div>

          {/* Maydon endi butun ilova bo'ylab bir xil `Input` primitivida (48px) */}
          <Input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            placeholder={t('passwordPlaceholder')}
            aria-label={t('passwordTitle')}
            aria-invalid={error ? true : undefined}
            autoFocus
          />

          {error && (
            <p role="alert" className="text-center text-[12px] text-[var(--ww-danger)]">{error}</p>
          )}

          <button
            type="submit"
            disabled={!password || pending}
            className="ww-btn-accent flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--ww-r-md)] text-[14px] font-medium text-white disabled:cursor-default"
          >
            {pending && <Loader2 size={15} aria-hidden="true" className="animate-spin" />}
            {t('passwordSubmit')}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
