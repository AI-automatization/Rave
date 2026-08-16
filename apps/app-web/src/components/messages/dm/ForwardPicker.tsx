'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Send, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/field';
import { useConversations, useForwardMessage } from '@/hooks/use-dm';
import type { DmMessage } from '@/lib/api/user.api';
import { memberColor } from '@/lib/dm/dm-format';
import { toast } from '@/store/toast.store';
import { useApiError } from '@/hooks/use-api-error';
import { trackClick } from '@/lib/analytics';

interface Props {
  message: DmMessage | null;
  currentPeerId: string;
  onClose: () => void;
}

// Web port of mobile's ForwardPicker.tsx — a conversation picker reusing the search+list shell
// pattern from components/friends/FriendSearch.tsx, parameterized for "forward to" instead of
// "send friend request". Excludes the conversation the message is already in, matching mobile.
export function ForwardPicker({ message, currentPeerId, onClose }: Props) {
  const t = useTranslations('dm');
  const parseError = useApiError();
  const [query, setQuery] = useState('');
  const { data: conversations } = useConversations();
  const forward = useForwardMessage();

  const candidates = (conversations ?? [])
    .filter((c) => c.peerId !== currentPeerId)
    .filter((c) => !query.trim() || c.peerUsername.toLowerCase().includes(query.trim().toLowerCase()));

  function handleForward(toPeerId: string) {
    if (!message || forward.isPending) return;
    trackClick('dm:forward_send', { toPeerId });
    forward.mutate(
      { toPeerId, messageId: message._id },
      {
        onSuccess: () => { toast.success(t('forwardSuccess')); onClose(); },
        onError: (err) => toast.error(parseError(err, t('forwardBlocked'))),
      },
    );
  }

  return (
    <Dialog open={!!message} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-[380px] gap-0 overflow-hidden rounded-[var(--ww-r-xl)] border-[var(--ww-line)] bg-[var(--ww-panel-solid)] p-0 text-[var(--ww-text)]">
        <DialogHeader className="px-4 pb-2 pt-4">
          <DialogTitle className="text-[16px] font-semibold text-[var(--ww-text)]">{t('forward')}</DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-3">
          {/* Qidiruv maydoni /friends bilan bir xil `Input` primitivida */}
          <Input
            type="search"
            icon={Search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchChat')}
            aria-label={t('searchChat')}
          />
        </div>

        <div className="max-h-[360px] overflow-y-auto">
          {candidates.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[var(--ww-text-4)]">{t('empty')}</p>
          ) : (
            candidates.map((c) => {
              const color = memberColor(c.peerId);
              const initials = (c.peerUsername ?? '?').slice(0, 2).toUpperCase();
              return (
                <button
                  key={c.peerId}
                  type="button"
                  onClick={() => handleForward(c.peerId)}
                  disabled={forward.isPending}
                  className="flex w-full cursor-pointer items-center gap-3 border-b border-[var(--ww-line)] px-4 py-3 text-left transition-colors last:border-0 hover:bg-[var(--ww-surface-1)] disabled:cursor-default disabled:opacity-40"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-[12.5px] font-semibold"
                    style={{ background: `${color}2E`, border: `1px solid ${color}59`, color }}
                  >
                    {c.peerAvatar ? (
                      <img src={c.peerAvatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                  </span>
                  <span className="flex-1 truncate text-[14px] text-[var(--ww-text)]">{c.peerUsername}</span>
                  {forward.isPending ? (
                    <Loader2 size={15} aria-hidden="true" className="shrink-0 animate-spin text-[var(--ww-accent-hi)]" />
                  ) : (
                    <Send size={15} aria-hidden="true" className="shrink-0 text-[var(--ww-accent-hi)]" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
