'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaUserPlus, FaSearch, FaUsers, FaUserCheck, FaClock } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import type { ApiResponse, IFriendship, IUser } from '@/types';

type Tab = 'friends' | 'requests' | 'search';

const RANK_COLOR: Record<string, string> = {
  bronze:  'text-amber-500',
  silver:  'text-zinc-400',
  gold:    'text-amber-400',
  diamond: 'text-[#7C3AED]',
  legend:  'text-[#7C3AED]',
};

function getInitialTab(): Tab {
  if (typeof window === 'undefined') return 'friends';
  const p = new URLSearchParams(window.location.search);
  const t = p.get('tab');
  return (t === 'requests' || t === 'friends' || t === 'search') ? (t as Tab) : 'friends';
}

function Avatar({ user }: { user: { avatar?: string; username: string } }) {
  return user.avatar ? (
    <Image
      src={user.avatar}
      alt={user.username}
      width={40}
      height={40}
      className="w-full h-full object-cover rounded-xl"
      unoptimized
    />
  ) : (
    <span className="text-sm font-semibold text-white">
      {user.username[0]?.toUpperCase()}
    </span>
  );
}

export default function FriendsPage() {
  const t = useTranslations('friends');
  const [tab, setTab] = useState<Tab>(getInitialTab);
  const [friends,   setFriends]   = useState<IUser[]>([]);
  const [requests,  setRequests]  = useState<IFriendship[]>([]);
  const [search,    setSearch]    = useState('');
  const [results,   setResults]   = useState<IUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const [sentIds,    setSentIds]    = useState<Set<string>>(new Set());

  const loadFriends = useCallback(async () => {
    setLoading(true);
    try {
      const [fr, rq] = await Promise.all([
        apiClient.get<ApiResponse<IUser[]>>('/users/friends'),
        apiClient.get<ApiResponse<IFriendship[]>>('/users/friends/requests'),
      ]);
      setFriends(Array.isArray(fr.data.data) ? fr.data.data : []);
      setRequests(Array.isArray(rq.data.data) ? rq.data.data : []);
    } catch (err) {
      logger.error("Do'stlar yuklanmadi", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadFriends(); }, [loadFriends]);

  const acceptRequest = async (friendshipId: string) => {
    try {
      await apiClient.patch(`/users/friends/accept/${friendshipId}`);
      void loadFriends();
    } catch (err) {
      logger.error('Accept xatosi', err);
    }
  };

  const sendRequest = async (userId: string) => {
    setSendingIds((p) => new Set(p).add(userId));
    try {
      await apiClient.post('/users/friends/request', { userId });
      setSentIds((p) => new Set(p).add(userId));
    } catch (err) {
      logger.error("Do'st so'rovi xatosi", err);
    } finally {
      setSendingIds((p) => { const s = new Set(p); s.delete(userId); return s; });
    }
  };

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await apiClient.get<ApiResponse<IUser[]>>(`/users/search?q=${encodeURIComponent(q)}`);
      setResults(res.data.data ?? []);
    } catch (err) {
      logger.error('Qidiruv xatosi', err);
    } finally {
      setSearching(false);
    }
  };

  /* ── Tab bar ───────────────────────────────────────── */
  const tabs: { key: Tab; icon: typeof FaUsers; label: string; badge?: number }[] = [
    { key: 'friends',  icon: FaUsers,  label: t('tabFriends'),  badge: friends.length },
    { key: 'requests', icon: FaClock,  label: t('tabRequests'), badge: requests.length },
    { key: 'search',   icon: FaSearch, label: t('tabSearch') },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <FaUsers size={22} className="text-[#7C3AED]" />
        <h1 className="text-3xl font-display text-white">{t('title')}</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-[#111118] border border-white/[0.06] w-fit">
        {tabs.map(({ key, icon: Icon, label, badge }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 h-8 px-4 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? 'bg-[#7C3AED] text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon size={13} />
            {label}
            {badge !== undefined && badge > 0 && (
              <span className={`text-[10px] rounded-full px-1.5 py-0.5 leading-none font-semibold ${
                tab === key ? 'bg-white/20 text-white' : 'bg-[#7C3AED]/20 text-[#7C3AED]'
              }`}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Friends tab ──────────────────────────────────── */}
      {tab === 'friends' && (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 bg-white/[0.04] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#111118] border border-white/[0.06] flex items-center justify-center mb-4">
              <FaUsers size={28} className="text-zinc-700" />
            </div>
            <p className="text-zinc-400 text-sm mb-4">{t('empty')}</p>
            <button
              onClick={() => setTab('search')}
              className="h-9 px-5 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-all"
            >
              {t('findFriend')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {friends.map((friend) => (
              <div key={friend._id} className="rounded-2xl bg-[#111118] border border-white/[0.06] p-4 flex items-center gap-3 hover:border-white/10 transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <Avatar user={friend} />
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/profile/${friend.username}`}
                    className="text-sm font-medium text-zinc-200 hover:text-white transition-colors block truncate"
                  >
                    {friend.username}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs capitalize ${RANK_COLOR[friend.rank ?? ''] ?? 'text-zinc-600'}`}>
                      {friend.rank ?? '—'}
                    </span>
                    {friend.isOnline && (
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {t('online')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Requests tab ─────────────────────────────────── */}
      {tab === 'requests' && (
        requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#111118] border border-white/[0.06] flex items-center justify-center mb-4">
              <FaClock size={26} className="text-zinc-700" />
            </div>
            <p className="text-zinc-400 text-sm">{t('noRequests')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map((req) => (
              <div key={req._id} className="rounded-2xl bg-[#111118] border border-white/[0.06] p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-[#7C3AED]">
                    {req.requester.username[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">{req.requester.username}</p>
                  <p className={`text-xs capitalize ${RANK_COLOR[req.requester.rank ?? ''] ?? 'text-zinc-600'}`}>
                    {req.requester.rank ?? '—'}
                  </p>
                </div>
                <button
                  onClick={() => void acceptRequest(req._id)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-all flex-shrink-0"
                >
                  <FaUserCheck size={12} />
                  {t('accept')}
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Search tab ───────────────────────────────────── */}
      {tab === 'search' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <FaSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              type="search"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => void handleSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-[#111118] border border-white/[0.08] text-zinc-200 text-sm placeholder-zinc-600 focus:outline-none focus:border-[#7C3AED]/50 focus:ring-1 focus:ring-[#7C3AED]/30 transition-all"
            />
          </div>

          {searching && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" />
            </div>
          )}

          {!searching && results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {results.map((u) => {
                const isSending = sendingIds.has(u._id);
                const isSent    = sentIds.has(u._id);
                return (
                  <div key={u._id} className="rounded-2xl bg-[#111118] border border-white/[0.06] p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <Avatar user={u} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{u.username}</p>
                      <p className={`text-xs capitalize ${RANK_COLOR[u.rank ?? ''] ?? 'text-zinc-600'}`}>
                        {u.rank ?? '—'}
                      </p>
                    </div>
                    <button
                      disabled={isSending || isSent}
                      onClick={() => void sendRequest(u._id)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                        isSent
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[#7C3AED] hover:bg-[#7C3AED]/25 disabled:opacity-50'
                      }`}
                    >
                      {isSending ? (
                        <div className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                      ) : isSent ? (
                        <FaUserCheck size={13} />
                      ) : (
                        <FaUserPlus size={13} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {!searching && search.trim() && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FaSearch size={28} className="text-zinc-700 mb-3" />
              <p className="text-zinc-500 text-sm">Foydalanuvchi topilmadi</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
