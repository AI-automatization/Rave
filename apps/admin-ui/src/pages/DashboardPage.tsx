import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from 'recharts';
import {
  Users, Tv2, Activity, UserPlus2,
  AlertCircle, Zap, UserPlus, TrendingUp, Monitor, ShieldAlert, Settings, ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard.api';
import { errorsApi } from '../api/errors.api';
import { usersApi } from '../api/users.api';
import { StatCard } from '../components/ui/StatCard';
import type { DashboardStats, Analytics, ActivityFeedItem, AdminUser } from '../types';
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
function SectionPanel({ title, sub, icon, children, className = '' }: {
  title: string;
  sub?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-card rounded-2xl p-5 shadow-card relative overflow-hidden ${className}`}>
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
  const [errorTrend, setErrorTrend] = useState<Array<{ date: string; count: number }>>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetSig, setResetSig] = useState(0);
  const countdown = useCountdown(resetSig);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, a, e, trend, feed, users] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getAnalytics(),
          errorsApi.stats(),
          errorsApi.trend(7),
          dashboardApi.getActivityFeed(20),
          usersApi.list({ page: 1, limit: 6 }),
        ]);
        setStats(s);
        setAnalytics(a);
        setErrors(e);
        setErrorTrend(trend);
        setActivityFeed(feed);
        setRecentUsers(users.data);
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
    { icon: <UserPlus size={14} />,   label: 'New today',     value: analytics.newUsersToday,            color: 'text-blue-400',    bg: 'bg-blue-500/[0.1]' },
    { icon: <TrendingUp size={14} />, label: 'This week',     value: analytics.newUsersThisWeek,         color: 'text-violet-400',  bg: 'bg-violet-500/[0.1]' },
    { icon: <Monitor size={14} />,    label: 'Watch Parties', value: analytics.watchPartiesCreatedToday, color: 'text-emerald-400', bg: 'bg-emerald-500/[0.1]' },
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

      {/* ── KPI stat cards — 4-up, TailAdmin's ecommerce-dashboard row shape ──── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Users"         value={stats?.totalUsers ?? 0}              LIcon={Users}     color="violet"  />
        <StatCard label="Active"        value={stats?.activeUsers ?? 0}             LIcon={Activity}  color="emerald" />
        <StatCard label="Watch Parties" value={stats?.activeWatchParties ?? 0}      LIcon={Tv2}       color="rose"    />
        <StatCard label="New Today"     value={analytics?.newUsersToday ?? 0}       LIcon={UserPlus2} color="blue"    />
      </div>

      {/* ── Charts row — TailAdmin's signature pairing: a wide trend area chart
          next to a radial "target" gauge. Both real data, no filler. ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionPanel
          title="Error Trend"
          sub="last 7 days"
          icon={<TrendingUp size={13} className="text-red-400" />}
          className="lg:col-span-2"
        >
          {errorTrend.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={errorTrend} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#4E4D6A', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis
                  tick={{ fill: '#4E4D6A', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip {...CHART_TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#f87171"
                  strokeWidth={2}
                  fill="url(#areaGrad)"
                  dot={{ r: 3, fill: '#f87171', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-text-muted text-sm py-10 text-center">No data</p>
          )}
        </SectionPanel>

        {/* Resolution Rate gauge — real ratio (resolved / total), not decoration; TailAdmin's
            "Monthly Target" pattern adapted to something this dashboard actually tracks. */}
        <SectionPanel
          title="Resolution Rate"
          sub="all-time"
          icon={<ShieldCheck size={13} className="text-emerald-400" />}
        >
          {errorTotal > 0 ? (
            <div className="relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <RadialBarChart
                  innerRadius="72%"
                  outerRadius="100%"
                  data={[{ value: Math.round((errors!.resolved / errorTotal) * 100) }]}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar dataKey="value" cornerRadius={12} fill="#22C55E" background={{ fill: 'rgba(255,255,255,0.05)' }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-bold text-white tabular-nums">
                  {Math.round((errors!.resolved / errorTotal) * 100)}%
                </p>
                <p className="text-[11px] text-text-muted mt-0.5">{errors!.resolved}/{errorTotal} fixed</p>
              </div>
            </div>
          ) : (
            <p className="text-text-muted text-sm py-10 text-center">No errors logged</p>
          )}
        </SectionPanel>
      </div>

      {/* ── Error Health + Today Activity ───────────────────────── */}
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

      {/* ── Activity Feed ─────────────────────────────────────── */}
      <SectionPanel
        title="Activity Feed"
        sub="last 48 hours"
        icon={<Activity size={13} className="text-emerald-400" />}
      >
        {activityFeed.length === 0 ? (
          <p className="text-text-muted text-sm py-10 text-center">No recent activity</p>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/[0.06]">
            {activityFeed.map((item) => (
              <ActivityFeedRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </SectionPanel>

      {/* ── Recent Users — TailAdmin "Recent Orders" pattern, adapted (T-S-admin-dashboard,
          2026-08-02). Real data via usersApi.list, same source /users itself uses — no
          fabricated rows. */}
      <SectionPanel
        title="Recent Users"
        sub={`${stats?.totalUsers ?? 0} total`}
        icon={<Users size={13} className="text-violet-400" />}
      >
        {recentUsers.length === 0 ? (
          <p className="text-text-muted text-sm py-10 text-center">No users yet</p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.06em] text-text-dim">
                  <th className="font-semibold pb-2 px-1">User</th>
                  <th className="font-semibold pb-2 px-1">Role</th>
                  <th className="font-semibold pb-2 px-1">Joined</th>
                  <th className="font-semibold pb-2 px-1 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => {
                  const hue = (u.email.charCodeAt(0) * 137) % 360;
                  return (
                    <tr key={u._id} className="border-t border-white/[0.05] hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-1">
                        <Link to={`/users/${u._id}`} className="flex items-center gap-2.5 min-w-0 group">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold"
                            style={{ background: `hsl(${hue},40%,18%)`, color: `hsl(${hue},70%,65%)` }}
                          >
                            {u.email.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-medium text-white group-hover:text-accent transition-colors truncate leading-tight">
                              {u.username || u.email}
                            </p>
                            <p className="text-[11px] text-text-dim truncate leading-tight">{u.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="py-2.5 px-1">
                        <span className={`text-[11px] font-medium capitalize px-1.5 py-0.5 rounded-md ${
                          u.role === 'user' ? 'text-text-muted bg-white/[0.04]' : 'text-violet-400 bg-violet-500/[0.1]'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-1 text-[11px] text-text-muted whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="py-2.5 px-1 text-right">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md ${
                          u.isBlocked ? 'text-red-400 bg-red-500/[0.1]' : 'text-emerald-400 bg-emerald-500/[0.1]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isBlocked ? 'bg-red-400' : 'bg-emerald-400'}`} />
                          {u.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Link
              to="/users"
              className="mt-3 flex items-center justify-center h-8 rounded-lg text-[12px] font-medium text-text-muted hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              View all users →
            </Link>
          </div>
        )}
      </SectionPanel>
    </div>
  );
}

// ── Activity Feed Row ────────────────────────────────────────

const ACTIVITY_CONFIG = {
  error:        { icon: <AlertCircle size={12} />, color: 'text-red-400',     bg: 'bg-red-500/[0.1]' },
  admin_action: { icon: <Settings size={12} />,    color: 'text-blue-400',    bg: 'bg-blue-500/[0.1]' },
  report:       { icon: <ShieldAlert size={12} />, color: 'text-amber-400',   bg: 'bg-amber-500/[0.1]' },
} as const;

function ActivityFeedRow({ item }: { item: ActivityFeedItem }) {
  const cfg = ACTIVITY_CONFIG[item.type];
  const timeAgo = (() => {
    const diff = Date.now() - new Date(item.timestamp).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  })();

  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.025] transition-colors">
      <div className={`w-6 h-6 rounded-md ${cfg.bg} ${cfg.color} flex items-center justify-center shrink-0 mt-0.5`}>
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-white truncate">{item.title}</p>
        <p className="text-[11px] text-text-muted truncate">{item.detail}</p>
      </div>
      <span className="text-[10px] text-text-dim shrink-0 mt-0.5">{timeAgo}</span>
    </div>
  );
}
