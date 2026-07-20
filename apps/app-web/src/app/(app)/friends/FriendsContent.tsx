'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useFriends, useFriendRequests } from '@/hooks/use-friends';
import { useAuthStore } from '@/store/auth.store';
import { FriendCard } from '@/components/friends/FriendCard';
import { RequestCard } from '@/components/friends/RequestCard';
import { FriendSearch } from '@/components/friends/FriendSearch';
import { trackClick } from '@/lib/analytics';

type Tab = 'friends' | 'requests' | 'search';

// Shaped like FriendCard/RequestCard rows — no layout shift once real data lands.
function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3" aria-busy="true">
      <div className="skeleton w-9 h-9 rounded-full shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-2.5 w-1/5 rounded" />
      </div>
    </div>
  );
}

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
      <h1 className="text-xl font-semibold text-white">{t('title')}</h1>

      {/* Tabs — pill style */}
      <div className="liquid-glass-sm p-1 flex gap-1">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => { trackClick('friends:tab', { tab: key }); setTab(key); }}
            className={`flex-1 h-8 rounded-md flex items-center justify-center gap-1.5 text-sm font-medium transition-colors cursor-pointer ${
              tab === key
                ? 'bg-violet-600/20 text-violet-300'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
            }`}
          >
            {label}
            {count !== undefined && count > 0 && (
              <span className={`text-[11px] ${tab === key ? 'text-violet-400' : 'text-zinc-600'}`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'friends' && (
        <div className="liquid-glass overflow-hidden">
          {loadingFriends && (
            <div className="flex flex-col divide-y divide-white/[0.05]">
              {[0, 1, 2].map((i) => <RowSkeleton key={i} />)}
            </div>
          )}
          {!loadingFriends && (!friends || friends.length === 0) && (
            <div className="flex flex-col items-center gap-3 py-16">
              <Users size={24} className="text-zinc-700" />
              <p className="text-sm text-zinc-500">{t('empty')}</p>
            </div>
          )}
          {!loadingFriends && friends && friends.length > 0 && (
            <div className="flex flex-col divide-y divide-white/[0.05] animate-fade-slide-in">
              {friends.map((f) => (
                <FriendCard
                  key={f._id}
                  user={f}
                  onMessage={() => { trackClick('friends:message'); router.push(`/messages?peer=${f._id}`); }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div className="liquid-glass overflow-hidden">
          {loadingRequests && (
            <div className="flex flex-col divide-y divide-white/[0.05]">
              {[0, 1].map((i) => <RowSkeleton key={i} />)}
            </div>
          )}
          {!loadingRequests && (!requests || requests.length === 0) && (
            <div className="flex flex-col items-center gap-3 py-16">
              <Bell size={24} className="text-zinc-700" />
              <p className="text-sm text-zinc-500">{t('noRequests')}</p>
            </div>
          )}
          {!loadingRequests && requests && requests.length > 0 && (
            <div className="flex flex-col divide-y divide-white/[0.05] animate-fade-slide-in">
              {requests.map((req) => (
                <RequestCard key={req._id} request={req} currentUserId={currentUser?._id ?? ''} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'search' && <FriendSearch />}
    </div>
  );
}
