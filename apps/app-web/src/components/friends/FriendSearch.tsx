'use client';

import { useState } from 'react';
import { Search, Loader2, UserPlus, Check, SearchX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchUsers, useSendFriendRequest } from '@/hooks/use-friends';
import { toast } from '@/store/toast.store';
import { useApiError } from '@/hooks/use-api-error';
import { Input } from '@/components/ui/field';
import { avatarColor } from '@/lib/utils';
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
    <div className="flex flex-col gap-4">
      {/* Qidiruv maydoni — auth formalari bilan bir xil `Input` primitivi
          (`.ww-field`), ilgari bu alohida `glass-input` edi. */}
      <Input
        type="search"
        icon={Search}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('searchPlaceholder')}
        aria-label={t('searchPlaceholder')}
      />

      {isLoading && (
        <div className="ww-card overflow-hidden" aria-busy="true">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-[var(--ww-line)] px-4 py-3.5 last:border-0"
            >
              <div className="skeleton h-10 w-10 shrink-0 rounded-full" />
              <div className="skeleton h-3 w-1/3 rounded" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && users && users.length > 0 && (
        <ul className="ww-card ww-rise overflow-hidden">
          {users.map((user) => {
            const isSent = sentTo.includes(user._id);
            const isSending = pendingId === user._id;
            const color = avatarColor(user._id ?? user.username ?? 'u');
            return (
              <li
                key={user._id}
                className="flex items-center gap-3 border-b border-[var(--ww-line)] px-4 py-3 transition-colors last:border-0 hover:bg-[var(--ww-surface-1)]"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-[13.5px] font-semibold"
                  style={{ background: `${color}2E`, border: `1px solid ${color}59`, color }}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (user.username?.[0]?.toUpperCase() ?? '?')
                  )}
                </span>

                <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[var(--ww-text)]">
                  {user.username}
                </span>

                <button
                  type="button"
                  onClick={() => { void handleSend(user._id); }}
                  disabled={isSending || isSent}
                  className={`flex h-9 shrink-0 items-center gap-1.5 rounded-[var(--ww-r-sm)] px-3 text-[12.5px] font-medium transition-colors disabled:cursor-default ${
                    isSent
                      ? 'bg-[var(--ww-success-soft)] text-[var(--ww-success)]'
                      : 'ww-btn-subtle cursor-pointer text-[var(--ww-text-2)] disabled:opacity-40'
                  }`}
                >
                  {/* `findFriend` ("find a friend") described the search box, not this button —
                      it sends a friend request. `addFriend` already existed in messages/* and
                      was simply never wired up (prod audit 2026-08-01). */}
                  {isSending && <Loader2 size={13} aria-hidden="true" className="animate-spin" />}
                  {!isSending && (isSent
                    ? <Check size={13} aria-hidden="true" />
                    : <UserPlus size={13} aria-hidden="true" />)}
                  {isSent ? t('requestSentLabel') : t('addFriend')}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {query.length >= 2 && !isLoading && users?.length === 0 && (
        <div className="ww-card flex flex-col items-center justify-center gap-3 py-14">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--ww-line)] bg-[var(--ww-surface-1)]">
            <SearchX size={20} aria-hidden="true" className="text-[var(--ww-text-4)]" />
          </span>
          <p className="text-[13px] text-[var(--ww-text-3)]">{t('notFoundError')}</p>
        </div>
      )}
    </div>
  );
}
