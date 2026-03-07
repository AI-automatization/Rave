'use client';

import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import {
  FaFilm, FaTrophy, FaStar, FaUsers, FaCalendarAlt, FaEdit,
} from 'react-icons/fa';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/axios';
import type { ApiResponse, IUser, IAchievement } from '@/types';

const RANK_COLORS: Record<string, string> = {
  bronze:  'text-orange-400 border-orange-400/30 bg-orange-400/10',
  silver:  'text-base-content/70 border-base-content/20 bg-base-content/10',
  gold:    'text-gold border-gold/30 bg-gold/10',
  diamond: 'text-diamond border-diamond/30 bg-diamond/10',
  legend:  'text-primary border-primary/30 bg-primary/10',
};

const RARITY_COLORS: Record<string, string> = {
  common:    'border-base-content/20',
  rare:      'border-info',
  epic:      'border-secondary',
  legendary: 'border-accent',
};

export default function MyProfilePage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: user, isLoading } = useQuery({
    queryKey: ['profile-me'],
    queryFn: () =>
      apiClient
        .get<ApiResponse<IUser>>('/users/me')
        .then((r) => r.data.data),
    enabled: isAuthenticated,
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements-me'],
    queryFn: () =>
      user
        ? apiClient
            .get<ApiResponse<IAchievement[]>>(`/users/${user._id}/achievements`)
            .then((r) => r.data.data ?? [])
        : Promise.resolve([]),
    enabled: !!user,
  });

  const { data: friendsCount = 0 } = useQuery({
    queryKey: ['friends-count'],
    queryFn: () =>
      apiClient
        .get<ApiResponse<IUser[]>>('/users/friends')
        .then((r) => (r.data.data ?? []).length),
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="skeleton h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center space-y-2">
          <p className="text-base-content/50">Profil yuklanmadi</p>
        </div>
      </div>
    );
  }

  const joinDate = new Date((user as IUser & { createdAt?: string }).createdAt ?? Date.now())
    .toLocaleDateString('uz', { year: 'numeric', month: 'long' });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Profile card */}
      <div className="card bg-base-200">
        <div className="card-body p-6 flex flex-col sm:flex-row items-start gap-6">

          {/* Avatar */}
          <div className="relative">
            {user.avatar ? (
              <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-primary ring-offset-2 ring-offset-base-200">
                <Image
                  src={user.avatar}
                  alt={user.username}
                  width={96}
                  height={96}
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary text-primary-content flex items-center justify-center text-3xl font-display">
                {user.username[0].toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-success border-2 border-base-200" />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-2xl font-display">{user.username.toUpperCase()}</h1>
                {user.bio && (
                  <p className="text-base-content/60 text-sm mt-1">{user.bio}</p>
                )}
              </div>
              <button className="btn btn-ghost btn-sm gap-1" title="Profil tahrirlash">
                <FaEdit size={14} />
                <span className="hidden sm:inline">Tahrirlash</span>
              </button>
            </div>

            {/* Rank badge */}
            <div className={`badge border text-xs capitalize px-3 py-2 ${RANK_COLORS[user.rank] ?? ''}`}>
              {user.rank}
            </div>

            {/* Meta */}
            <div className="flex gap-4 flex-wrap text-sm text-base-content/60">
              <div className="flex items-center gap-1">
                <FaStar size={14} className="text-accent" />
                <span className="font-medium text-base-content">
                  {user.totalPoints.toLocaleString()}
                </span>
                <span>points</span>
              </div>
              <div className="flex items-center gap-1">
                <FaCalendarAlt size={14} />
                <span>{joinDate} dan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: FaFilm,   label: 'Filmlar',   val: '—' },
          { icon: FaTrophy, label: 'Yutuqlar',  val: achievements.length },
          { icon: FaUsers,  label: "Do'stlar",  val: friendsCount },
          { icon: FaStar,   label: 'Points',    val: user.totalPoints.toLocaleString() },
        ].map(({ icon: Icon, label, val }) => (
          <div key={label} className="card bg-base-200">
            <div className="card-body p-4 items-center text-center gap-1">
              <Icon size={22} className="text-primary" />
              <p className="text-xl font-display">{val}</p>
              <p className="text-xs text-base-content/50">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FaTrophy size={20} className="text-accent" />
            <h2 className="text-xl font-display">YUTUQLAR ({achievements.length})</h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {achievements.map((ach) => (
              <div
                key={ach._id}
                className={`card bg-base-200 border ${RARITY_COLORS[ach.rarity] ?? 'border-base-300'} cursor-pointer hover:scale-105 transition-transform`}
                title={`${ach.title} — ${ach.description}`}
              >
                <div className="card-body p-3 items-center text-center gap-1">
                  <span className="text-2xl">{ach.icon}</span>
                  <p className="text-xs font-medium line-clamp-2 leading-tight">{ach.title}</p>
                  <span className={`text-xs opacity-60 capitalize ${ach.rarity === 'legendary' ? 'text-accent' : ''}`}>
                    {ach.rarity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
