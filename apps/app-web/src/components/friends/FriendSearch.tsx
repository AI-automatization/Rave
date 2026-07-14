'use client';

import { useState } from 'react';
import { Search, Loader2, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchUsers, useSendFriendRequest } from '@/hooks/use-friends';
import { toast } from '@/store/toast.store';
import { parseApiError } from '@/lib/api-error';
import { trackClick } from '@/lib/analytics';

export function FriendSearch() {
  const t = useTranslations('friends');
  const [query, setQuery] = useState('');
  const { data: users, isLoading } = useSearchUsers(query);
  const sendRequest = useSendFriendRequest();

  async function handleSend(userId: string) {
    trackClick('friend_search:send_request');
    try {
      await sendRequest.mutateAsync(userId);
      toast.success(t('requestSentToast'));
    } catch (err) {
      toast.error(parseApiError(err, t('requestError')));
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
            {users.map((user) => (
              <div key={user._id} className="flex items-center gap-3 px-4 py-3 hover:bg-violet-500/[0.04] transition-colors">
                <div className="w-9 h-9 rounded-full bg-violet-600/20 flex items-center justify-center text-sm font-bold text-violet-300 shrink-0">
                  {user.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="flex-1 text-sm text-white truncate">{user.username}</span>
                <button
                  onClick={() => handleSend(user._id)}
                  disabled={sendRequest.isPending}
                  className="h-8 px-3 rounded-lg text-xs font-medium text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                >
                  <UserPlus size={12} />
                  {t('findFriend')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {query.length >= 2 && !isLoading && users?.length === 0 && (
        <p className="text-xs text-slate-500 text-center py-4">{t('notFoundError')}</p>
      )}
    </div>
  );
}
