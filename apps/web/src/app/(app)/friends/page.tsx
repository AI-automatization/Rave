'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { UserPlus, Search, Users, UserCheck, Clock } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import type { ApiResponse, IFriendship, IUser } from '@/types';

type Tab = 'friends' | 'requests' | 'search';

export default function FriendsPage() {
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
      <h1 className="text-3xl font-display">DO&apos;STLAR</h1>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-200 w-fit">
        <button
          className={`tab ${tab === 'friends' ? 'tab-active' : ''}`}
          onClick={() => setTab('friends')}
        >
          <Users className="w-4 h-4 mr-1" />
          Do&apos;stlar ({friends.length})
        </button>
        <button
          className={`tab ${tab === 'requests' ? 'tab-active' : ''}`}
          onClick={() => setTab('requests')}
        >
          <Clock className="w-4 h-4 mr-1" />
          So&apos;rovlar {requests.length > 0 && <span className="badge badge-primary badge-xs ml-1">{requests.length}</span>}
        </button>
        <button
          className={`tab ${tab === 'search' ? 'tab-active' : ''}`}
          onClick={() => setTab('search')}
        >
          <Search className="w-4 h-4 mr-1" />
          Qidirish
        </button>
      </div>

      {/* Friends list */}
      {tab === 'friends' && (
        <div className="space-y-3">
          {friends.length === 0 ? (
            <div className="text-center py-16 text-base-content/40">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Hali do&apos;stlar yo&apos;q</p>
              <button className="btn btn-primary btn-sm mt-4" onClick={() => setTab('search')}>
                Do&apos;st topish
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {friends.map((friend) => (
                <div key={friend._id} className="card bg-base-200">
                  <div className="card-body p-4 flex-row items-center gap-3">
                    <div className="avatar">
                      <div className="w-12 rounded-full bg-primary text-primary-content flex items-center justify-center">
                        {friend.avatar ? (
                          <Image src={friend.avatar} alt={friend.username} width={48} height={48} className="object-cover" unoptimized />
                        ) : (
                          <span className="font-medium">{friend.username[0].toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${friend.username}`} className="font-medium text-sm hover:text-primary transition-colors">
                        {friend.username}
                      </Link>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs capitalize ${rankColors[friend.rank] ?? 'text-base-content/50'}`}>
                          {friend.rank}
                        </span>
                        {friend.isOnline && (
                          <span className="flex items-center gap-1 text-xs text-success">
                            <span className="w-1.5 h-1.5 rounded-full bg-success" />
                            Online
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Friend requests */}
      {tab === 'requests' && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="text-center py-16 text-base-content/40">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>So&apos;rovlar yo&apos;q</p>
            </div>
          ) : (
            requests.map((req) => (
              <div key={req._id} className="card bg-base-200">
                <div className="card-body p-4 flex-row items-center gap-3">
                  <div className="avatar">
                    <div className="w-10 rounded-full bg-secondary text-secondary-content flex items-center justify-center">
                      <span className="text-sm">{req.requester.username[0].toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{req.requester.username}</p>
                    <p className={`text-xs capitalize ${rankColors[req.requester.rank] ?? 'text-base-content/50'}`}>
                      {req.requester.rank}
                    </p>
                  </div>
                  <button
                    className="btn btn-primary btn-sm gap-1"
                    onClick={() => void acceptRequest(req._id)}
                  >
                    <UserCheck className="w-3 h-3" />
                    Qabul
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* User search */}
      {tab === 'search' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
            <input
              type="search"
              placeholder="Foydalanuvchi nomini qidiring..."
              className="input input-bordered w-full pl-9 bg-base-200"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                void handleSearch(e.target.value);
              }}
            />
          </div>
          {loading && <span className="loading loading-spinner loading-sm" />}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {searchResults.map((u) => (
              <div key={u._id} className="card bg-base-200">
                <div className="card-body p-4 flex-row items-center gap-3">
                  <div className="avatar">
                    <div className="w-10 rounded-full bg-accent text-accent-content flex items-center justify-center">
                      <span className="text-sm">{u.username[0].toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{u.username}</p>
                    <p className={`text-xs capitalize ${rankColors[u.rank] ?? ''}`}>{u.rank}</p>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm btn-circle"
                    onClick={() => void sendRequest(u._id)}
                    title="Do'st qo'shish"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
