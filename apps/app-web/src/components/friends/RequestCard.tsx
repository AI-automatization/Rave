'use client';

import { Loader2, Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAcceptFriendRequest, useRejectFriendRequest } from '@/hooks/use-friends';
import { toast } from '@/store/toast.store';
import { useApiError } from '@/hooks/use-api-error';
import type { IFriendship } from '@/types';
import { avatarColor } from '@/lib/utils';
import { trackClick } from '@/lib/analytics';

interface Props {
  request: IFriendship;
  currentUserId: string;
}

/** Bitta do'stlik so'rovi qatori. Ro'yxat `<ul>` bo'lgani uchun bu `<li>`. */
export function RequestCard({ request, currentUserId }: Props) {
  const t = useTranslations('friends');
  const parseError = useApiError();
  const accept = useAcceptFriendRequest();
  const reject = useRejectFriendRequest();

  const sender = request.requester._id === currentUserId ? (request.receiver ?? request.requester) : request.requester;
  const color = avatarColor(sender._id ?? sender.username ?? 'u');

  async function handleAccept() {
    trackClick('friend_request:accept');
    try {
      await accept.mutateAsync(request._id);
      toast.success(t('acceptedToast'));
    } catch (err) {
      toast.error(parseError(err, t('acceptError')));
    }
  }

  async function handleReject() {
    trackClick('friend_request:reject');
    try {
      await reject.mutateAsync(request._id);
    } catch (err) {
      toast.error(parseError(err, t('acceptError')));
    }
  }

  const isPending = accept.isPending || reject.isPending;

  return (
    <li className="flex items-center gap-3 border-b border-[var(--ww-line)] px-4 py-3 transition-colors last:border-0 hover:bg-[var(--ww-surface-1)]">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-[13.5px] font-semibold"
        style={{ background: `${color}2E`, border: `1px solid ${color}59`, color }}
      >
        {sender.avatar ? (
          <img src={sender.avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          (sender.username?.[0]?.toUpperCase() ?? '?')
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-[var(--ww-text)]">{sender.username}</p>
        <p className="mt-0.5 text-[11.5px] text-[var(--ww-text-3)]">{t('wantsToBeFriend')}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {/* 36px maydon, 32 emas — bu ikkisi yonma-yon turadi va so'rovga javob
            berishning yagona yo'li. Faqat ikonka bo'lgani uchun aria-label. */}
        <button
          type="button"
          onClick={() => { void handleAccept(); }}
          disabled={isPending}
          aria-label={t('accept')}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[var(--ww-r-sm)] bg-[var(--ww-success-soft)] text-[var(--ww-success)] transition-colors hover:bg-[rgba(74,222,128,0.20)] disabled:cursor-default disabled:opacity-40"
        >
          {accept.isPending
            ? <Loader2 size={15} aria-hidden="true" className="animate-spin" />
            : <Check size={15} aria-hidden="true" />}
        </button>
        <button
          type="button"
          onClick={() => { void handleReject(); }}
          disabled={isPending}
          aria-label={t('reject')}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[var(--ww-r-sm)] bg-[var(--ww-danger-soft)] text-[var(--ww-danger)] transition-colors hover:bg-[rgba(255,107,107,0.20)] disabled:cursor-default disabled:opacity-40"
        >
          {reject.isPending
            ? <Loader2 size={15} aria-hidden="true" className="animate-spin" />
            : <X size={15} aria-hidden="true" />}
        </button>
      </div>
    </li>
  );
}
