'use client';

import { useState } from 'react';
import { Search, Loader2, UserPlus, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchUsers, useSendFriendRequest } from '@/hooks/use-friends';
import { toast } from '@/store/toast.store';
import { useApiError } from '@/hooks/use-api-error';
import { trackClick } from '@/lib/analytics';

export function FriendSearch() {
  const t = useTranslations('friends');
  const parseError = useApiError();
  const [query, setQuery] = useState('');
  const { data: users, isLoading } = useSearchUsers(query);
  const sendRequest = useSendFriendRequest();
  // The row itself has to remember who was already asked. The search result comes from
  // /user/search, which says nothing about friendship state, so after a successful request the
  // button stayed identical and inviting — the user had no way to tell it had worked, and a
  // second click just earned a 400 (prod audit 2026-08-01).
  const [sentTo, setSentTo] = useState<string[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleSend(userId: string) {
    trackClick('friend_search:send_request');
    setPendingId(userId);
    try {
      await sendRequest.mutateAsync(userId);
      setSentTo((prev) => [...prev, userId]);
      toast.success(t('requestSentToast'));
    } catch (err) {
      toast.error(parseError(err, t('requestError')));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="glass-input w-full h-10 rounded-xl pl-9 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60 transition-all"
        />
      </div>

      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 size={20} className="animate-spin text-violet-400" />
        </div>
      )}

      {users && users.length > 0 && (
        <div className="liquid-glass overflow-hidden">
          <div className="flex flex-col divide-y divide-white/[0.05]">
            {users.map((user) => {
              const isSent = sentTo.includes(user._id);
              const isSending = pendingId === user._id;
              return (
                <div key={user._id} className="flex items-center gap-3 px-4 py-3 hover:bg-violet-500/[0.04] transition-colors">
                  <div className="w-9 h-9 rounded-full bg-violet-600/20 flex items-center justify-center text-sm font-bold text-violet-300 shrink-0">
                    {user.username?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <span className="flex-1 text-sm text-white truncate">{user.username}</span>
                  <button
                    onClick={() => { void handleSend(user._id); }}
                    disabled={isSending || isSent}
                    className={`h-9 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 disabled:cursor-default ${
                      isSent
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : 'text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 cursor-pointer disabled:opacity-40'
                    }`}
                  >
                    {/* `findFriend` ("find a friend") described the search box, not this button —
                        it sends a friend request. `addFriend` already existed in messages/* and
                        was simply never wired up (prod audit 2026-08-01). */}
                    {isSending && <Loader2 size={12} className="animate-spin" />}
                    {!isSending && (isSent ? <Check size={12} /> : <UserPlus size={12} />)}
                    {isSent ? t('requestSentLabel') : t('addFriend')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {query.length >= 2 && !isLoading && users?.length === 0 && (
        <p className="text-xs text-slate-500 text-center py-4">{t('notFoundError')}</p>
      )}
    </div>
  );
}
