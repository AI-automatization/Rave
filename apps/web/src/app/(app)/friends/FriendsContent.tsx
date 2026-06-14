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

      {/* Tabs — consistent rounded style */}
      <div className="flex gap-1.5 bg-[#111118] p-1.5 rounded-2xl border border-white/[0.06]">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tab === key
                ? 'bg-violet-600/18 text-violet-300 border border-violet-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            {label}
            {count !== undefined && count > 0 && (
              <span className="bg-violet-500/30 text-violet-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'friends' && (
        <div className="flex flex-col gap-2">
          {loadingFriends && (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="animate-spin text-violet-400" />
            </div>
          )}
          {!loadingFriends && (!friends || friends.length === 0) && (
            <div className="flex flex-col items-center gap-4 py-14">
              <div className="w-[72px] h-[72px] rounded-full bg-violet-500/12 border border-violet-500/25 flex items-center justify-center">
                <Users size={32} className="text-violet-400" />
              </div>
              <p className="text-sm text-slate-400">{t('empty')}</p>
            </div>
          )}
          {friends?.map((f) => (
            <FriendCard
              key={f._id}
              user={f}
              onMessage={() => router.push(`/messages?peer=${f._id}`)}
            />
          ))}
        </div>
      )}

      {tab === 'requests' && (
        <div className="flex flex-col gap-2">
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
        </div>
      )}

      {tab === 'search' && <FriendSearch />}
    </div>
  );
}
