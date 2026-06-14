'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useFriends, useFriendRequests } from '@/hooks/use-friends';
import { useAuthStore } from '@/store/auth.store';
import { FriendCard } from '@/components/friends/FriendCard';
import { RequestCard } from '@/components/friends/RequestCard';
import { FriendSearch } from '@/components/friends/FriendSearch';

type Tab = 'friends' | 'requests' | 'search';

export function FriendsContent() {
  const t = useTranslations('friends');
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>('friends');

  const { data: friends, isLoading: loadingFriends } = useFriends();
  const { data: requests, isLoading: loadingRequests } = useFriendRequests();

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'friends', label: t('tabFriends'), count: friends?.length },
    { key: 'requests', label: t('tabRequests'), count: requests?.length },
    { key: 'search', label: t('tabSearch') },
  ];

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-white">{t('title')}</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 h-9 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              tab === key ? 'bg-violet-600/20 text-violet-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            {label}
            {count !== undefined && count > 0 && (
              <span className="bg-violet-600/30 text-violet-300 text-[10px] px-1.5 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'friends' && (
        <>
          {loadingFriends && (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="animate-spin text-violet-400" />
            </div>
          )}
          {!loadingFriends && (!friends || friends.length === 0) && (
            <div className="flex flex-col items-center gap-3 py-10">
              <Users size={28} className="text-slate-600" />
              <p className="text-sm text-slate-400">{t('empty')}</p>
            </div>
          )}
          {friends?.map((f) => {
            const friend = f.requester._id === currentUser?._id ? f.receiver : f.requester;
            return (
              <FriendCard
                key={f._id}
                user={friend}
                onMessage={() => router.push(`/messages?peer=${friend._id}`)}
              />
            );
          })}
        </>
      )}

      {tab === 'requests' && (
        <>
          {loadingRequests && (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="animate-spin text-violet-400" />
            </div>
          )}
          {!loadingRequests && (!requests || requests.length === 0) && (
            <p className="text-sm text-slate-400 text-center py-10">{t('noRequests')}</p>
          )}
          {requests?.map((req) => (
            <RequestCard key={req._id} request={req} currentUserId={currentUser?._id ?? ''} />
          ))}
        </>
      )}

      {tab === 'search' && <FriendSearch />}
    </div>
  );
}
