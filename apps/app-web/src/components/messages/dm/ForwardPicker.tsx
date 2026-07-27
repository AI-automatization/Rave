'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Send, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
      <DialogContent className="bg-[#0C0B18] border-white/[0.07] text-white max-w-[380px] p-0 overflow-hidden rounded-2xl gap-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-white text-base">{t('forward')}</DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('selectChat')}
              className="glass-input w-full h-9 rounded-xl pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/60 transition-all"
            />
          </div>
        </div>

        <div className="flex flex-col divide-y divide-white/[0.05] max-h-[360px] overflow-y-auto">
          {candidates.length === 0 ? (
            <p className="text-[13px] text-white/30 text-center py-8">{t('empty')}</p>
          ) : (
            candidates.map((c) => {
              const color = memberColor(c.peerId);
              const initials = (c.peerUsername ?? '?').slice(0, 2).toUpperCase();
              return (
                <button
                  key={c.peerId}
                  onClick={() => handleForward(c.peerId)}
                  disabled={forward.isPending}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors cursor-pointer disabled:opacity-40 w-full text-left"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0"
                    style={{ backgroundColor: `${color}33` }}
                  >
                    {c.peerAvatar ? (
                      <img src={c.peerAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span style={{ color }}>{initials}</span>
                    )}
                  </div>
                  <span className="flex-1 text-sm text-white truncate">{c.peerUsername}</span>
                  {forward.isPending ? (
                    <Loader2 size={15} className="animate-spin text-violet-400 shrink-0" />
                  ) : (
                    <Send size={15} className="text-violet-400 shrink-0" />
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
