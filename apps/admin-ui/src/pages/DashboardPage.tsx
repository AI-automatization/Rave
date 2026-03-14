import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { dashboardApi } from '../api/dashboard.api';
import { StatCard } from '../components/ui/StatCard';
import type { DashboardStats, Analytics } from '../types';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, a] = await Promise.all([dashboardApi.getStats(), dashboardApi.getAnalytics()]);
        setStats(s);
        setAnalytics(a);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    void load();
    // Auto-refresh har 30 sekundda
    const interval = setInterval(() => void load(), 30_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="text-text-muted text-sm animate-pulse">Yuklanmoqda...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-text-muted text-sm mt-0.5">Real-time statistika (har 30 sekund yangilanadi)</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label="Jami foydalanuvchilar" value={stats?.totalUsers ?? 0} icon="👥" color="blue" />
        <StatCard label="Faol foydalanuvchilar" value={stats?.activeUsers ?? 0} icon="🟢" color="green" />
        <StatCard label="Jami filmlar" value={stats?.totalMovies ?? 0} icon="🎬" color="red" />
        <StatCard label="Faol battlelar" value={stats?.activeBattles ?? 0} icon="⚔️" color="yellow" />
        <StatCard label="Watch Partylar" value={stats?.activeWatchParties ?? 0} icon="🎉" color="purple" />
      </div>

      {/* Analytics row */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Movies */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Top 10 Film (Ko'rishlar)</h2>
            {analytics.topMovies && analytics.topMovies.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analytics.topMovies} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="title"
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    width={120}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: string) => v.length > 16 ? v.slice(0, 16) + '…' : v}
                  />
                  <Tooltip
                    contentStyle={{ background: '#16161F', border: '1px solid #1e1e2a', borderRadius: 8, fontSize: 12 }}
                    cursor={{ fill: '#1e1e2a' }}
                  />
                  <Bar dataKey="viewCount" radius={[0, 4, 4, 0]}>
                    {analytics.topMovies.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#E50914' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-text-muted text-sm">Ma'lumot yo'q</p>
            )}
          </div>

          {/* Genre Distribution */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Janr taqsimoti</h2>
            {analytics.genreDistribution && analytics.genreDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analytics.genreDistribution}>
                  <XAxis dataKey="genre" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#16161F', border: '1px solid #1e1e2a', borderRadius: 8, fontSize: 12 }}
                    cursor={{ fill: '#1e1e2a' }}
                  />
                  <Bar dataKey="count" fill="#E50914" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-text-muted text-sm">Ma'lumot yo'q</p>
            )}
          </div>

          {/* Activity summary */}
          <div className="bg-surface border border-border rounded-xl p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-white mb-4">Bugungi faollik</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-overlay rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-400">{analytics.newUsersToday ?? 0}</p>
                <p className="text-xs text-text-muted mt-1">Yangi foydalanuvchilar</p>
              </div>
              <div className="bg-overlay rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-400">{analytics.newUsersThisWeek ?? 0}</p>
                <p className="text-xs text-text-muted mt-1">Bu hafta</p>
              </div>
              <div className="bg-overlay rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-purple-400">{analytics.watchPartiesCreatedToday ?? 0}</p>
                <p className="text-xs text-text-muted mt-1">Watch Party (bugun)</p>
              </div>
              <div className="bg-overlay rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-yellow-400">{analytics.battlesCreatedToday ?? 0}</p>
                <p className="text-xs text-text-muted mt-1">Battle (bugun)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
