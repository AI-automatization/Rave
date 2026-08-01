'use client';

import { Loader2, Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAcceptFriendRequest, useRejectFriendRequest } from '@/hooks/use-friends';
import { toast } from '@/store/toast.store';
import { useApiError } from '@/hooks/use-api-error';
import type { IFriendship } from '@/types';
import { trackClick } from '@/lib/analytics';

interface Props {
  request: IFriendship;
  currentUserId: string;
}

export function RequestCard({ request, currentUserId }: Props) {
  const t = useTranslations('friends');
  const parseError = useApiError();
  const accept = useAcceptFriendRequest();
  const reject = useRejectFriendRequest();

  const sender = request.requester._id === currentUserId ? (request.receiver ?? request.requester) : request.requester;

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
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-violet-500/[0.04] transition-colors">
      <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center text-sm font-bold text-slate-300">
        {sender.username?.[0]?.toUpperCase() ?? '?'}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{sender.username}</p>
      </div>

      <div className="flex items-center gap-1.5">
        {/* 36px targets, not 32 — these two sit next to each other and are the only way to act
            on a request. aria-label because they are icon-only. */}
        <button
          onClick={() => { void handleAccept(); }}
          disabled={isPending}
          aria-label={t('accept')}
          className="h-9 w-9 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
        >
          {accept.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        </button>
        <button
          onClick={() => { void handleReject(); }}
          disabled={isPending}
          aria-label={t('reject')}
          className="h-9 w-9 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
        >
          {reject.isPending ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
        </button>
      </div>
    </div>
  );
}
