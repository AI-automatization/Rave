import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Users, Film, Swords, Tv2, Activity,
  AlertCircle, Zap, UserPlus, TrendingUp, Monitor,
} from 'lucide-react';
import { dashboardApi } from '../api/dashboard.api';
import { errorsApi } from '../api/errors.api';
import { StatCard } from '../components/ui/StatCard';
import type { DashboardStats, Analytics } from '../types';
import type { ErrorStats } from '../api/errors.api';

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: '#10102a',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    fontSize: 12,
    color: '#F4F4FC',
    padding: '8px 12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
  },
  cursor: { fill: 'rgba(255,255,255,0.02)' },
};

// Live countdown: 30 → 0 → 30
function useCountdown(resetSignal: number) {
  const [n, setN] = useState(30);
  useEffect(() => { setN(30); }, [resetSignal]);
  useEffect(() => {
    const t = setInterval(() => setN((v) => (v <= 1 ? 30 : v - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  return n;
}

// Skeleton placeholder
function SkeletonCard() {
  return <div className="h-[108px] bg-card rounded-2xl shimmer-bg" />;
}

// Reusable section panel with gradient top line
function SectionPanel({ title, sub, icon, children }: {
  title: string;
  sub?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-card relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.09] to-transparent" />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[13px] font-semibold text-white flex items-center gap-2">
          {icon}
          {title}
        </h2>
        {sub && <span className="text-[11px] text-text-dim">{sub}</span>}
      </div>
      {children}
    </div>
  );
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [errors, setErrors] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetSig, setResetSig] = useState(0);
  const countdown = useCountdown(resetSig);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, a, e] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getAnalytics(),
          errorsApi.stats(),
        ]);
        setStats(s);
        setAnalytics(a);
        setErrors(e);
        setResetSig((n) => n + 1);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    void load();
    const t = setInterval(() => void load(), 30_000);
    return () => clearInterval(t);
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        {/* header skeleton */}
        <div className="h-[60px] bg-card rounded-2xl shimmer-bg" />
        {/* kpi row */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        {/* middle row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-56 bg-card rounded-2xl shimmer-bg" />
          <div className="h-56 bg-card rounded-2xl shimmer-bg" />
        </div>
        {/* charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 bg-card rounded-2xl shimmer-bg" />
          <div className="h-64 bg-card rounded-2xl shimmer-bg" />
        </div>
      </div>
    );
  }

  const errorTotal = errors
    ? errors.new + errors.in_progress + errors.resolved + errors.ignored
    : 0;

  const errorRows = errors ? [
    { label: 'New',      value: errors.new,         dot: 'bg-red-400',     bar: 'bg-red-500' },
    { label: 'In Work',  value: errors.in_progress, dot: 'bg-amber-400',   bar: 'bg-amber-500' },
    { label: 'Fixed',    value: errors.resolved,    dot: 'bg-emerald-400', bar: 'bg-emerald-500' },
    { label: 'Ignored',  value: errors.ignored,     dot: 'bg-text-dim',    bar: 'bg-white/[0.15]' },
  ] : [];

  const activityItems = analytics ? [
    { icon: <UserPlus size={14} />,  label: 'New today',     value: analytics.newUsersToday,            color: 'text-blue-400',    bg: 'bg-blue-500/[0.1]' },
    { icon: <TrendingUp size={14} />, label: 'This week',    value: analytics.newUsersThisWeek,         color: 'text-violet-400',  bg: 'bg-violet-500/[0.1]' },
    { icon: <Monitor size={14} />,   label: 'Watch Parties', value: analytics.watchPartiesCreatedToday, color: 'text-emerald-400', bg: 'bg-emerald-500/[0.1]' },
    { icon: <Swords size={14} />,    label: 'Battles',       value: analytics.battlesCreatedToday,      color: 'text-amber-400',   bg: 'bg-amber-500/[0.1]' },
  ] : [];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {greeting}, Admin
          </h1>
          <p className="text-text-muted text-[13px] mt-0.5">{dateStr}</p>
        </div>

        {/* Live pill */}
        <div className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full bg-card border border-white/[0.07] text-[11px] text-text-dim select-none">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          Live&nbsp;·&nbsp;{countdown}s
        </div>
      </div>

      {/* ── KPI stat cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard label="Users"        value={stats?.totalUsers ?? 0}          LIcon={Users}    color="violet"  />
        <StatCard label="Active"        value={stats?.activeUsers ?? 0}         LIcon={Activity} color="emerald" />
        <StatCard label="Content"       value={stats?.totalMovies ?? 0}         LIcon={Film}     color="blue"    />
        <StatCard label="Battles"       value={stats?.activeBattles ?? 0}       LIcon={Swords}   color="amber"   />
        <StatCard label="Watch Parties" value={stats?.activeWatchParties ?? 0}  LIcon={Tv2}      color="rose"    />
      </div>

      {/* ── Middle: error health + today activity ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {errors && (
          <SectionPanel
            title="Error Health"
            sub={errors.new > 0 ? `${errors.new} new` : undefined}
            icon={<AlertCircle size={13} className="text-red-400" />}
          >
            <div className="grid grid-cols-2 gap-2.5">
              {errorRows.map((e) => (
                <div key={e.label} className="bg-surface rounded-xl px-3.5 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-text-muted">{e.label}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${e.dot}`} />
                  </div>
                  <p className="text-xl font-bold text-white tabular-nums">{e.value}</p>
                  {errorTotal > 0 && (
                    <div className="mt-2 h-0.5 bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${e.bar} rounded-full transition-all duration-700`}
                        style={{ width: `${Math.round((e.value / errorTotal) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionPanel>
        )}

        {analytics && (
          <SectionPanel
            title="Today Activity"
            icon={<Zap size={13} className="text-amber-400" />}
          >
            <div className="grid grid-cols-2 gap-2.5">
              {activityItems.map((item) => (
                <div key={item.label} className="bg-surface rounded-xl px-3.5 py-3">
                  <div className={`w-7 h-7 rounded-lg ${item.bg} ${item.color} flex items-center justify-center mb-2.5`}>
                    {item.icon}
                  </div>
                  <p className="text-xl font-bold text-white tabular-nums">{item.value}</p>
                  <p className="text-[11px] text-text-muted mt-0.5 leading-tight">{item.label}</p>
                </div>
              ))}
            </div>
          </SectionPanel>
        )}
      </div>

      {/* ── Charts ────────────────────────────────────────────── */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Top movies */}
          <SectionPanel
            title="Top by Views"
            sub={`${analytics.topMovies?.length ?? 0} movies`}
            icon={<Film size={13} className="text-blue-400" />}
          >
            {analytics.topMovies?.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={analytics.topMovies}
                  layout="vertical"
                  margin={{ left: 0, right: 24, top: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="barGradH" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6C63FF" stopOpacity={1} />
                      <stop offset="100%" stopColor="#9B95FF" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    type="number"
                    tick={{ fill: '#4E4D6A', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="title"
                    width={96}
                    tick={{ fill: '#8886AA', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: string) => v.length > 13 ? v.slice(0, 13) + '…' : v}
                  />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="viewCount" fill="url(#barGradH)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-text-muted text-sm py-10 text-center">No data</p>
            )}
          </SectionPanel>

          {/* Genre distribution */}
          <SectionPanel
            title="By Genre"
            sub={`${analytics.genreDistribution?.length ?? 0} genres`}
            icon={<Activity size={13} className="text-violet-400" />}
          >
            {analytics.genreDistribution?.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={analytics.genreDistribution}
                  margin={{ left: 0, right: 0, top: 0, bottom: 28 }}
                >
                  <defs>
                    <linearGradient id="barGradV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6C63FF" stopOpacity={1} />
                      <stop offset="100%" stopColor="#4940C5" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="genre"
                    tick={{ fill: '#4E4D6A', fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    angle={-30}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fill: '#4E4D6A', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="count" fill="url(#barGradV)" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-text-muted text-sm py-10 text-center">No data</p>
            )}
          </SectionPanel>
        </div>
      )}
    </div>
  );
}
