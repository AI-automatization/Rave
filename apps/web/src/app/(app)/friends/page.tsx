'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaUserPlus, FaSearch, FaUsers, FaUserCheck, FaClock } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import type { ApiResponse, IFriendship, IUser } from '@/types';

type Tab = 'friends' | 'requests' | 'search';

export default function FriendsPage() {
  const t = useTranslations('friends');
  const [tab, setTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<IUser[]>([]);
  const [requests, setRequests] = useState<IFriendship[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadFriends();
    void loadRequests();
  }, []);

  const loadFriends = async () => {
    try {
      const res = await apiClient.get<ApiResponse<IUser[]>>('/users/friends');
      setFriends(res.data.data ?? []);
    } catch (err) {
      logger.error("Do'stlar yuklashda xato", err);
    }
  };

  const loadRequests = async () => {
    try {
      const res = await apiClient.get<ApiResponse<IFriendship[]>>('/users/friends/requests');
      setRequests(res.data.data ?? []);
    } catch (err) {
      logger.error("So'rovlar yuklashda xato", err);
    }
  };

  const handleSearch = async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<IUser[]>>(`/users/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data.data ?? []);
    } catch (err) {
      logger.error("Foydalanuvchi qidiruvda xato", err);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (userId: string) => {
    try {
      await apiClient.post('/users/friends/request', { userId });
    } catch (err) {
      logger.error("Do'st so'rovi yuborishda xato", err);
    }
  };

  const acceptRequest = async (friendshipId: string) => {
    try {
      await apiClient.patch(`/users/friends/accept/${friendshipId}`);
      void loadFriends();
      void loadRequests();
    } catch (err) {
      logger.error("So'rovni qabul qilishda xato", err);
    }
  };

  const rankColors: Record<string, string> = {
    bronze: 'text-orange-400', silver: 'text-silver', gold: 'text-gold',
    diamond: 'text-diamond',   legend: 'text-primary',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display">{t('title')}</h1>

      <div className="tabs tabs-boxed bg-base-200 w-fit">
        <button className={`tab ${tab === 'friends' ? 'tab-active' : ''}`} onClick={() => setTab('friends')}>
          <FaUsers size={18} className="mr-1" />
          {t('tabFriends')} ({friends.length})
        </button>
        <button className={`tab ${tab === 'requests' ? 'tab-active' : ''}`} onClick={() => setTab('requests')}>
          <FaClock size={18} className="mr-1" />
          {t('tabRequests')} {requests.length > 0 && <span className="badge badge-primary badge-xs ml-1">{requests.length}</span>}
        </button>
        <button className={`tab ${tab === 'search' ? 'tab-active' : ''}`} onClick={() => setTab('search')}>
          <FaSearch size={18} className="mr-1" />
          {t('tabSearch')}
        </button>
      </div>

      {tab === 'friends' && (
        <div className="space-y-3">
          {friends.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <FaUsers size={48} className="mx-auto mb-3 opacity-30" />
              <p>{t('empty')}</p>
              <button className="inline-flex items-center justify-center gap-2 h-8 px-3 rounded-lg bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 transition-all text-sm font-medium active:scale-95 mt-4" onClick={() => setTab('search')}>
                {t('findFriend')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {friends.map((friend) => (
                <div key={friend._id} className="bg-slate-800 rounded-lg border border-slate-700 p-4 flex gap-3">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500 text-slate-900 flex items-center justify-center flex-shrink-0">
                    {friend.avatar ? (
                      <Image src={friend.avatar} alt={friend.username} width={48} height={48} className="object-cover rounded-lg" unoptimized />
                    ) : (
                      <span className="font-medium">{friend.username[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${friend.username}`} className="font-medium text-sm text-white hover:text-cyan-400 transition-colors">
                      {friend.username}
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs capitalize ${rankColors[friend.rank] ?? 'text-slate-500'}`}>
                        {friend.rank}
                      </span>
                      {friend.isOnline && (
                        <span className="flex items-center gap-1 text-xs text-lime-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                          {t('online')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <FaClock size={48} className="mx-auto mb-3 opacity-30" />
              <p>{t('noRequests')}</p>
            </div>
          ) : (
            requests.map((req) => (
              <div key={req._id} className="bg-slate-800 rounded-lg border border-slate-700 p-4 flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-pink-500 text-slate-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium">{req.requester.username[0].toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-white">{req.requester.username}</p>
                  <p className={`text-xs capitalize ${rankColors[req.requester.rank] ?? 'text-slate-500'}`}>
                    {req.requester.rank}
                  </p>
                </div>
                <button className="inline-flex items-center justify-center gap-1 h-8 px-3 rounded-lg bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 transition-all text-sm font-medium active:scale-95 flex-shrink-0" onClick={() => void acceptRequest(req._id)}>
                  <FaUserCheck size={12} />
                  {t('accept')}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'search' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <FaSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              placeholder={t('searchPlaceholder')}
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                void handleSearch(e.target.value);
              }}
            />
          </div>
          {loading && <span className="animate-spin">⟳</span>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {searchResults.map((u) => (
              <div key={u._id} className="bg-slate-800 rounded-lg border border-slate-700 p-4 flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-lime-500 text-slate-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium">{u.username[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-white truncate">{u.username}</p>
                  <p className={`text-xs capitalize ${rankColors[u.rank] ?? ''}`}>{u.rank}</p>
                </div>
                <button className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-700/50 transition-all flex-shrink-0" onClick={() => void sendRequest(u._id)}>
                  <FaUserPlus size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
