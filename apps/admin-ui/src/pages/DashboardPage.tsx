import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Film, Swords, Tv2, Activity } from 'lucide-react';
import { dashboardApi } from '../api/dashboard.api';
import { errorsApi } from '../api/errors.api';
import { StatCard } from '../components/ui/StatCard';
import type { DashboardStats, Analytics } from '../types';
import type { ErrorStats } from '../api/errors.api';

const CHART_STYLE = {
  tooltip: { background: '#14141f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12, color: '#fff' },
  cursor:  { fill: 'rgba(255,255,255,0.03)' },
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-white mb-4">{children}</h2>;
}

export function DashboardPage() {
  const [stats, setStats]       = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [errors, setErrors]     = useState<ErrorStats | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, a, e] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getAnalytics(),
          errorsApi.stats(),
        ]);
        setStats(s); setAnalytics(a); setErrors(e);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    void load();
    const t = setInterval(() => void load(), 30_000);
    return () => clearInterval(t);
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-28 bg-card rounded-2xl animate-pulse" />
      ))}
    </div>
  );

  const activityData = analytics ? [
    { name: 'Новые сегодня', value: analytics.newUsersToday ?? 0 },
    { name: 'За неделю', value: analytics.newUsersThisWeek ?? 0 },
    { name: 'Watch Party', value: analytics.watchPartiesCreatedToday ?? 0 },
    { name: 'Battles', value: analytics.battlesCreatedToday ?? 0 },
  ] : [];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-text-muted text-sm mt-0.5">Обновляется каждые 30 секунд</p>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard label="Всего пользователей" value={stats?.totalUsers ?? 0}   LIcon={Users}    color="violet" />
        <StatCard label="Активных"            value={stats?.activeUsers ?? 0}   LIcon={Activity} color="emerald" />
        <StatCard label="Контент"             value={stats?.totalMovies ?? 0}   LIcon={Film}     color="blue" />
        <StatCard label="Battles"             value={stats?.activeBattles ?? 0} LIcon={Swords}   color="amber" />
        <StatCard label="Watch Parties"       value={stats?.activeWatchParties ?? 0} LIcon={Tv2} color="rose" />
      </div>

      {/* Error summary */}
      {errors && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Новые ошибки',   value: errors.new,         color: 'red',   dot: 'bg-red-400' },
            { label: 'В работе',       value: errors.in_progress, color: 'amber', dot: 'bg-amber-400' },
            { label: 'Исправлено',     value: errors.resolved,    color: 'emerald', dot: 'bg-emerald-400' },
            { label: 'Игнорируется',   value: errors.ignored,     color: 'gray',  dot: 'bg-text-muted' },
          ].map((e) => (
            <div key={e.label} className="bg-card rounded-2xl px-4 py-3 flex items-center gap-3 shadow-card">
              <span className={`w-2 h-2 rounded-full ${e.dot}`} />
              <div>
                <p className="text-text-muted text-xs">{e.label}</p>
                <p className="text-lg font-bold text-white">{e.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts row */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Movies */}
          <div className="bg-card rounded-2xl p-5 shadow-card">
            <SectionTitle>Топ фильмов по просмотрам</SectionTitle>
            {analytics.topMovies?.length ? (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={analytics.topMovies} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fill: '#5a5b70', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category" dataKey="title" width={110}
                    tick={{ fill: '#8b8ca8', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 14) + '…' : v}
                  />
                  <Tooltip contentStyle={CHART_STYLE.tooltip} cursor={CHART_STYLE.cursor} />
                  <Bar dataKey="viewCount" radius={[0, 6, 6, 0]}>
                    {analytics.topMovies.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#7B72F8' : i < 3 ? '#5B52D8' : '#2a2a45'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-text-muted text-sm">Нет данных</p>}
          </div>

          {/* Genre distribution */}
          <div className="bg-card rounded-2xl p-5 shadow-card">
            <SectionTitle>Жанры</SectionTitle>
            {analytics.genreDistribution?.length ? (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={analytics.genreDistribution}>
                  <XAxis dataKey="genre" tick={{ fill: '#5a5b70', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#5a5b70', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={CHART_STYLE.tooltip} cursor={CHART_STYLE.cursor} />
                  <Bar dataKey="count" fill="#7B72F8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-text-muted text-sm">Нет данных</p>}
          </div>

          {/* Today activity */}
          <div className="bg-card rounded-2xl p-5 shadow-card lg:col-span-2">
            <SectionTitle>Активность сегодня</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {activityData.map((item) => (
                <div key={item.name} className="bg-surface rounded-xl p-4 flex flex-col gap-1">
                  <p className="text-2xl font-bold text-white tabular-nums">{item.value}</p>
                  <p className="text-xs text-text-muted leading-tight">{item.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
