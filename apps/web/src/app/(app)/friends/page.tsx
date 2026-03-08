'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaUserPlus, FaSearch, FaUsers, FaUserCheck, FaClock } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import type { AxiosError } from 'axios';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import { toast } from '@/store/toast.store';
import type { ApiResponse, IFriendship, IUser } from '@/types';

type Tab = 'friends' | 'requests' | 'search';

const RANK_COLORS: Record<string, string> = {
  bronze:  'text-orange-400',
  silver:  'text-base-content/60',
  gold:    'text-gold',
  diamond: 'text-diamond',
  legend:  'text-primary',
};

export default function FriendsPage() {
  const t = useTranslations('friends');
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<IUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  // ── Data fetching ─────────────────────────────────────────────────────────

  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: () =>
      apiClient
        .get<ApiResponse<IUser[]>>('/users/friends')
        .then((r) => r.data.data ?? []),
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['friend-requests'],
    queryFn: () =>
      apiClient
        .get<ApiResponse<IFriendship[]>>('/users/friends/requests')
        .then((r) => r.data.data ?? []),
  });

  // ── Accept request ────────────────────────────────────────────────────────

  const { mutate: acceptRequest } = useMutation({
    mutationFn: (friendshipId: string) =>
      apiClient.patch(`/users/friends/accept/${friendshipId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['friends'] });
      void qc.invalidateQueries({ queryKey: ['friend-requests'] });
      toast.success(t('acceptedToast'));
    },
    onError: () => toast.error(t('acceptError')),
  });

  // ── Send friend request ───────────────────────────────────────────────────

  const sendRequest = async (userId: string) => {
    setSendingIds((prev) => new Set(prev).add(userId));
    try {
      await apiClient.post('/users/friends/request', { userId });
      setSentIds((prev) => new Set(prev).add(userId));
      toast.success(t('requestSentToast'));
    } catch (err) {
      logger.error("Do'st so'rovi xatosi", err);
      const status = (err as AxiosError).response?.status;
      if (status === 409)
        toast.error(t('alreadyFriendError'));
      else if (status === 404)
        toast.error(t('notFoundError'));
      else if (status === 400)
        toast.error(t('requestError'));
      else
        toast.error(t('serverError'));
    } finally {
      setSendingIds((prev) => {
        const s = new Set(prev);
        s.delete(userId);
        return s;
      });
    }
  };

  // ── Search ────────────────────────────────────────────────────────────────

  const handleSearch = async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await apiClient.get<ApiResponse<IUser[]>>(
        `/users/search?q=${encodeURIComponent(q)}`,
      );
      setSearchResults(res.data.data ?? []);
    } catch (err) {
      logger.error('Qidiruv xatosi', err);
      toast.error(t('searchError'));
    } finally {
      setSearching(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display">{t('title')}</h1>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-200 w-fit">
        <button
          className={`tab ${tab === 'friends' ? 'tab-active' : ''}`}
          onClick={() => setTab('friends')}
        >
          <FaUsers size={18} className="mr-1" />
          {t('tabFriends')} ({friends.length})
        </button>
        <button
          className={`tab ${tab === 'requests' ? 'tab-active' : ''}`}
          onClick={() => setTab('requests')}
        >
          <FaClock size={18} className="mr-1" />
          {t('tabRequests')}
          {requests.length > 0 && (
            <span className="badge badge-primary badge-xs ml-1">{requests.length}</span>
          )}
        </button>
        <button
          className={`tab ${tab === 'search' ? 'tab-active' : ''}`}
          onClick={() => setTab('search')}
        >
          <FaSearch size={18} className="mr-1" />
          {t('tabSearch')}
        </button>
      </div>

      {/* Friends list */}
      {tab === 'friends' && (
        <div className="space-y-3">
          {friends.length === 0 ? (
            <div className="text-center py-16 text-base-content/40">
              <FaUsers size={48} className="mx-auto mb-3 opacity-30" />
              <p>{t('empty')}</p>
              <button
                className="btn btn-sm btn-primary mt-4"
                onClick={() => setTab('search')}
              >
                {t('findFriend')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {friends.map((friend) => (
                <div
                  key={friend._id}
                  className="card bg-base-200 border border-base-300"
                >
                  <div className="card-body p-4 flex-row gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary text-primary-content flex items-center justify-center flex-shrink-0">
                      {friend.avatar ? (
                        <Image
                          src={friend.avatar}
                          alt={friend.username}
                          width={48}
                          height={48}
                          className="object-cover rounded-lg"
                          unoptimized
                        />
                      ) : (
                        <span className="font-medium">
                          {friend.username[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/profile/${friend.username}`}
                        className="font-medium text-sm hover:text-primary transition-colors block truncate"
                      >
                        {friend.username}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs capitalize ${RANK_COLORS[friend.rank] ?? ''}`}>
                          {friend.rank}
                        </span>
                        {friend.isOnline && (
                          <span className="flex items-center gap-1 text-xs text-success">
                            <span className="w-1.5 h-1.5 rounded-full bg-success" />
                            {t('online')}
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
              <FaClock size={48} className="mx-auto mb-3 opacity-30" />
              <p>{t('noRequests')}</p>
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req._id}
                className="card bg-base-200 border border-base-300"
              >
                <div className="card-body p-4 flex-row gap-3 items-center">
                  <div className="w-10 h-10 rounded-lg bg-secondary text-secondary-content flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium">
                      {req.requester.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{req.requester.username}</p>
                    <p className={`text-xs capitalize ${RANK_COLORS[req.requester.rank] ?? ''}`}>
                      {req.requester.rank}
                    </p>
                  </div>
                  <button
                    className="btn btn-sm btn-success flex-shrink-0"
                    onClick={() => acceptRequest(req._id)}
                  >
                    <FaUserCheck size={12} />
                    {t('accept')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Search */}
      {tab === 'search' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <FaSearch
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
            />
            <input
              type="search"
              placeholder={t('searchPlaceholder')}
              className="input input-bordered w-full pl-9"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                void handleSearch(e.target.value);
              }}
            />
          </div>

          {searching && (
            <div className="flex justify-center py-4">
              <span className="loading loading-spinner loading-md" />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {searchResults.map((u) => {
              const isSending = sendingIds.has(u._id);
              const isSent = sentIds.has(u._id);
              return (
                <div
                  key={u._id}
                  className="card bg-base-200 border border-base-300"
                >
                  <div className="card-body p-4 flex-row gap-3 items-center">
                    <div className="w-10 h-10 rounded-lg bg-success text-success-content flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium">
                        {u.username[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{u.username}</p>
                      <p className={`text-xs capitalize ${RANK_COLORS[u.rank] ?? ''}`}>
                        {u.rank}
                      </p>
                    </div>
                    <button
                      className="btn btn-sm btn-ghost flex-shrink-0"
                      disabled={isSending || isSent}
                      onClick={() => void sendRequest(u._id)}
                    >
                      {isSending ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : isSent ? (
                        <FaUserCheck size={16} className="text-success" />
                      ) : (
                        <FaUserPlus size={16} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
