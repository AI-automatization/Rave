'use client';

import { Loader2, Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAcceptFriendRequest, useRejectFriendRequest } from '@/hooks/use-friends';
import { toast } from '@/store/toast.store';
import { parseApiError } from '@/lib/api-error';
import type { IFriendship } from '@/types';

interface Props {
  request: IFriendship;
  currentUserId: string;
}

export function RequestCard({ request, currentUserId }: Props) {
  const t = useTranslations('friends');
  const accept = useAcceptFriendRequest();
  const reject = useRejectFriendRequest();

  const sender = request.requester._id === currentUserId ? (request.receiver ?? request.requester) : request.requester;

  async function handleAccept() {
    try {
      await accept.mutateAsync(request._id);
      toast.success(t('acceptedToast'));
    } catch (err) {
      toast.error(parseApiError(err, t('acceptError')));
    }
  }

  async function handleReject() {
    try {
      await reject.mutateAsync(request._id);
    } catch (err) {
      toast.error(parseApiError(err, t('acceptError')));
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
        <button
          onClick={handleAccept}
          disabled={isPending}
          className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
        >
          {accept.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        </button>
        <button
          onClick={handleReject}
          disabled={isPending}
          className="h-8 w-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
