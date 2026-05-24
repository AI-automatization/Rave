import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import {
  BarChart2, Users, Clock, Smartphone, TrendingDown,
  ChevronRight, Zap, Activity, LogOut, RefreshCw, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  analyticsApi,
  type OverviewData, type FunnelStep, type SessionItem,
  type DropOffData, type RetentionData,
} from '../api/analytics.api';

const CHART_TOOLTIP = {
  contentStyle: {
    background: '#10102a',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    fontSize: 12,
    color: '#F4F4FC',
    padding: '8px 12px',
  },
  cursor: { fill: 'rgba(255,255,255,0.03)' },
};

const EXIT_CONTEXT_LABELS: Record<string, string> = {
  after_register:    'После регистрации',
  after_watch_party: 'После просмотра',
  immediate_exit:    'Мгновенный (<10с)',
  single_screen:     'Один экран',
  normal:            'Обычный выход',
};

const PLATFORM_COLORS: Record<string, string> = {
  ios:     '#7C6FFF',
  android: '#4CAF82',
  web:     '#F4B942',
};

function msFormat(ms: number): string {
  if (!ms) return '—';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}с`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}м ${rem}с` : `${m}м`;
}

function Delta({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return null;
  const positive = value >= 0;
  return (
    <span className={`flex items-center gap-0.5 text-[11px] font-medium ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
      {positive
        ? <ArrowUpRight className="w-3 h-3" />
        : <ArrowDownRight className="w-3 h-3" />
      }
      {Math.abs(value)}%
    </span>
  );
}

function SectionPanel({ title, icon, children, sub }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; sub?: string;
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

function StatCard({ label, value, sub, icon, color = '#7C6FFF', delta }: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; color?: string; delta?: number | null;
}) {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-card relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.09] to-transparent" />
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-dim text-[12px]">{label}</span>
        <span style={{ color }} className="opacity-70">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="flex items-center justify-between mt-1">
        {sub && <div className="text-[11px] text-text-dim">{sub}</div>}
        {delta !== undefined && <Delta value={delta} />}
      </div>
    </div>
  );
}

function FunnelBar({ step, count, pct, maxCount }: {
  step: string; count: number; pct: number; maxCount: number;
}) {
  const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[12px] mb-1">
        <span className="text-white/80">{step}</span>
        <span className="text-text-dim">{count.toLocaleString()} <span className="text-[#7C6FFF]">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${width}%`, background: pct > 50 ? '#4CAF82' : pct > 20 ? '#F4B942' : '#FF6B6B' }}
        />
      </div>
    </div>
  );
}

function RetentionCard({ data }: { data: RetentionData | null }) {
  const metrics = [
    { label: 'D1 удержание',  value: data?.d1,  desc: 'вернулись на след. день' },
    { label: 'D7 удержание',  value: data?.d7,  desc: 'вернулись за 7 дней' },
    { label: 'D30 удержание', value: data?.d30, desc: 'вернулись за 30 дней' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {metrics.map(({ label, value, desc }) => (
        <div key={label} className="bg-white/[0.04] rounded-xl p-3 text-center">
          <div className="text-[11px] text-text-dim mb-1">{label}</div>
          <div className={`text-xl font-bold ${
            value === null || value === undefined ? 'text-text-dim' :
            value >= 40 ? 'text-emerald-400' : value >= 20 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {value === null || value === undefined ? '—' : `${value}%`}
          </div>
          <div className="text-[10px] text-text-dim mt-0.5">{desc}</div>
        </div>
      ))}
      {data && (
        <div className="col-span-3 text-[11px] text-text-dim text-center">
          Когорта: {data.cohortSize} уникальных пользователей
        </div>
      )}
    </div>
  );
}

function SessionRow({ s, onClick }: { s: SessionItem; onClick: () => void }) {
  const dur = s.duration ? msFormat(s.duration) : s.isActive ? '🟢 онлайн' : '—';
  const ctx = s.exitContext ? (EXIT_CONTEXT_LABELS[s.exitContext] ?? s.exitContext) : '—';
  const platform = s.platform === 'ios' ? '🍎' : s.platform === 'android' ? '🤖' : '🌐';

  return (
    <tr
      onClick={onClick}
      className="border-b border-white/[0.04] hover:bg-white/[0.03] cursor-pointer transition-colors"
    >
      <td className="py-2.5 px-3 text-[12px] text-text-dim">{platform} {s.platform}</td>
      <td className="py-2.5 px-3 text-[12px] text-white">{s.isNewUser ? '🆕' : '↩️'}</td>
      <td className="py-2.5 px-3 text-[12px] text-white">{s.screens.length}</td>
      <td className="py-2.5 px-3 text-[12px] text-[#7C6FFF]">{dur}</td>
      <td className="py-2.5 px-3 text-[12px] text-text-dim">{s.exitScreen ?? '—'}</td>
      <td className="py-2.5 px-3 text-[12px] text-text-dim max-w-[130px] truncate">{ctx}</td>
      <td className="py-2.5 px-3">
        <div className="flex items-center justify-between">
          <span className={`text-[11px] px-2 py-0.5 rounded-full ${
            s.engagementScore > 60 ? 'bg-green-900/40 text-green-400' :
            s.engagementScore > 30 ? 'bg-yellow-900/40 text-yellow-400' :
            'bg-red-900/40 text-red-400'
          }`}>
            {s.engagementScore}
          </span>
          <ChevronRight className="w-3 h-3 text-text-dim ml-2" />
        </div>
      </td>
    </tr>
  );
}

function SessionDetail({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const [data, setData] = useState<{
    session: SessionItem;
    events: Array<{ event: string; screen?: string; ts: string; meta?: Record<string, unknown> }>;
  } | null>(null);

  useEffect(() => {
    analyticsApi.getSession(sessionId).then((d) => setData(d as typeof data)).catch(() => null);
  }, [sessionId]);

  if (!data) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
        <div className="bg-card rounded-2xl p-6 w-full max-w-lg text-text-dim text-sm">Загрузка...</div>
      </div>
    );
  }

  const { session, events } = data;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-[14px]">Детали сессии</h3>
          <button onClick={onClose} className="text-text-dim hover:text-white text-sm">✕</button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4 text-[12px]">
          {[
            ['Платформа', `${session.platform} ${session.deviceModel}`],
            ['Длительность', session.duration ? msFormat(session.duration) : '—'],
            ['Вовлечённость', `${session.engagementScore}/100`],
            ['Версия', session.appVersion || '—'],
            ['ОС', session.osVersion || '—'],
            ['Тип', session.isNewUser ? '🆕 новый' : '↩️ вернувшийся'],
          ].map(([label, val]) => (
            <div key={label} className="bg-white/5 rounded-xl p-3">
              <div className="text-text-dim mb-1">{label}</div>
              <div className="text-white font-medium">{val}</div>
            </div>
          ))}
        </div>

        {session.userId && (
          <div className="mb-4 bg-white/[0.04] rounded-xl px-3 py-2 text-[12px]">
            <span className="text-text-dim">User ID: </span>
            <span className="text-[#7C6FFF] font-mono">{session.userId}</span>
          </div>
        )}

        <div className="mb-4">
          <div className="text-text-dim text-[11px] uppercase tracking-wider mb-2">
            Маршрут ({session.screens.length} экранов)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {session.screens.map((s, i) => (
              <div key={i} className="bg-white/5 rounded-lg px-2.5 py-1 text-[11px] text-white flex items-center gap-1.5">
                <span className="text-text-dim">{i + 1}.</span>
                <span>{s.screen}</span>
                {s.duration != null && <span className="text-text-dim">{msFormat(s.duration)}</span>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-text-dim text-[11px] uppercase tracking-wider mb-2">События ({events.length})</div>
          <div className="space-y-1 max-h-52 overflow-y-auto">
            {events.map((e, i) => (
              <div key={i} className="flex items-center gap-3 text-[11px] py-1 border-b border-white/[0.04]">
                <span className="text-text-dim w-20 shrink-0">{new Date(e.ts).toLocaleTimeString()}</span>
                <span className={`font-mono ${e.event.startsWith('action:') ? 'text-[#7C6FFF]' : 'text-white/60'}`}>{e.event}</span>
                {e.screen && <span className="text-white/50">{e.screen}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const DAYS_OPTIONS = [7, 14, 30];

const EXIT_CONTEXT_OPTIONS = [
  { value: '', label: 'Все контексты' },
  { value: 'after_register',    label: 'После регистрации' },
  { value: 'after_watch_party', label: 'После просмотра' },
  { value: 'immediate_exit',    label: 'Мгновенный выход' },
  { value: 'single_screen',     label: 'Один экран' },
  { value: 'normal',            label: 'Обычный выход' },
];

export function AnalyticsPage() {
  const [days, setDays]               = useState(7);
  const [overview, setOverview]       = useState<OverviewData | null>(null);
  const [funnel, setFunnel]           = useState<FunnelStep[]>([]);
  const [sessions, setSessions]       = useState<SessionItem[]>([]);
  const [dropoff, setDropoff]         = useState<DropOffData | null>(null);
  const [retention, setRetention]     = useState<RetentionData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [selectedSession, setSession] = useState<string | null>(null);
  const [sessionsPage, setPage]       = useState(1);
  const [totalSessions, setTotal]     = useState(0);

  // Session filters
  const [filterPlatform,    setFilterPlatform]    = useState('');
  const [filterUserType,    setFilterUserType]    = useState('');
  const [filterExitContext, setFilterExitContext] = useState('');

  const loadAll = useCallback(async (d: number, page: number, filters: Record<string, string>) => {
    setLoading(true);
    try {
      const sessionFilters: Record<string, string> = {};
      if (filters.platform)    sessionFilters.platform = filters.platform;
      if (filters.userType)    sessionFilters.isNewUser = filters.userType;
      if (filters.exitContext) sessionFilters.exitContext = filters.exitContext;

      const [ov, fn, sess, do_, ret] = await Promise.all([
        analyticsApi.getOverview(d),
        analyticsApi.getFunnel(d),
        analyticsApi.getSessions(page, 15, sessionFilters),
        analyticsApi.getDropOff(d),
        analyticsApi.getRetention(),
      ]);
      setOverview(ov);
      setFunnel(fn);
      setSessions(sess.sessions);
      setTotal(sess.total);
      setDropoff(do_);
      setRetention(ret);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll(days, sessionsPage, {
      platform: filterPlatform,
      userType: filterUserType,
      exitContext: filterExitContext,
    });
  }, [days, sessionsPage, filterPlatform, filterUserType, filterExitContext, loadAll]);

  const maxFunnelCount = funnel[0]?.count ?? 0;
  const totalSess = overview?.totalSessions ?? 0;

  const depthData = (dropoff?.depthDistribution ?? []).map((d) => ({
    label: d._id === '20+' ? '20+' : `${d._id}–${typeof d._id === 'number' ? d._id + 1 : ''}`,
    count: d.count,
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-lg font-bold flex items-center gap-2">
            Аналитика
            {overview && overview.activeNow > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-normal bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {overview.activeNow} онлайн
              </span>
            )}
          </h1>
          <p className="text-text-dim text-[12px] mt-0.5">Поведение пользователей, воронки и drop-off точки</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadAll(days, sessionsPage, { platform: filterPlatform, userType: filterUserType, exitContext: filterExitContext })}
            className="p-2 rounded-lg bg-white/5 text-text-dim hover:text-white transition-colors"
            title="Обновить"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <div className="flex gap-1.5">
            {DAYS_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${days === d ? 'bg-primary text-white' : 'bg-white/5 text-text-dim hover:text-white'}`}
              >
                {d}д
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && !overview ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[90px] bg-card rounded-2xl shimmer-bg" />
          ))}
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Сессий за период"
              value={overview?.totalSessions ?? 0}
              sub={`${overview?.todaySessions ?? 0} сегодня`}
              icon={<Activity className="w-4 h-4" />}
              delta={overview?.prevPeriodDelta?.sessions}
            />
            <StatCard
              label="Средняя сессия"
              value={msFormat((overview?.avgSessionDuration ?? 0) * 1000)}
              icon={<Clock className="w-4 h-4" />}
              color="#4CAF82"
              delta={overview?.prevPeriodDelta?.duration}
            />
            <StatCard
              label="Вовлечённость"
              value={`${overview?.avgEngagementScore ?? 0}/100`}
              icon={<Zap className="w-4 h-4" />}
              color="#F4B942"
              delta={overview?.prevPeriodDelta?.engagement}
            />
            <StatCard
              label="Новые / Вернувшиеся"
              value={`${overview?.newVsReturning.new ?? 0} / ${overview?.newVsReturning.returning ?? 0}`}
              icon={<Users className="w-4 h-4" />}
              color="#7C6FFF"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Funnel */}
            <SectionPanel title="Воронка пользователей" icon={<TrendingDown className="w-4 h-4 text-primary" />}>
              <div>
                {funnel.map((step, i) => (
                  <FunnelBar key={i} {...step} maxCount={maxFunnelCount} />
                ))}
              </div>
            </SectionPanel>

            {/* Retention */}
            <SectionPanel
              title="Удержание пользователей"
              icon={<Users className="w-4 h-4 text-primary" />}
              sub={`когорта: ${retention?.cohortSize ?? 0} чел.`}
            >
              <RetentionCard data={retention} />
            </SectionPanel>

            {/* Daily activity */}
            <SectionPanel title="Активность по дням" icon={<BarChart2 className="w-4 h-4 text-primary" />}>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={overview?.dailyActivity ?? []}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8B8EA8' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#8B8EA8' }} tickLine={false} axisLine={false} />
                  <Tooltip {...CHART_TOOLTIP} />
                  <Line type="monotone" dataKey="sessions"    stroke="#7C6FFF" strokeWidth={2} dot={false} name="Сессии" />
                  <Line type="monotone" dataKey="uniqueUsers" stroke="#4CAF82" strokeWidth={2} dot={false} name="Уники" />
                </LineChart>
              </ResponsiveContainer>
            </SectionPanel>

            {/* Top screens */}
            <SectionPanel title="Топ экранов" icon={<Smartphone className="w-4 h-4 text-primary" />} sub="по посещениям">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={overview?.topScreens ?? []} layout="vertical" margin={{ left: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#8B8EA8' }} tickLine={false} />
                  <YAxis type="category" dataKey="_id" tick={{ fontSize: 10, fill: '#8B8EA8' }} tickLine={false} width={90} />
                  <Tooltip
                    {...CHART_TOOLTIP}
                    formatter={(v: number, _name: string, props: { payload?: { avgDuration?: number } }) => {
                      const avg = props.payload?.avgDuration;
                      return [
                        `${v} посещ.${avg ? ` · ср. ${msFormat(avg)}` : ''}`,
                        'Экран',
                      ];
                    }}
                  />
                  <Bar dataKey="visits" fill="#7C6FFF" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </SectionPanel>

            {/* Depth distribution */}
            <SectionPanel
              title="Глубина сессий"
              icon={<BarChart2 className="w-4 h-4 text-yellow-400" />}
              sub="экранов до выхода"
            >
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={depthData}>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8B8EA8' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#8B8EA8' }} tickLine={false} axisLine={false} />
                  <Tooltip {...CHART_TOOLTIP} formatter={(v: number) => [v, 'Сессий']} />
                  <Bar dataKey="count" fill="#F4B942" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </SectionPanel>

            {/* Version breakdown */}
            <SectionPanel title="Версии приложения" icon={<Smartphone className="w-4 h-4 text-primary" />}>
              <div className="space-y-2">
                {(overview?.versionBreakdown ?? []).map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1 text-[12px] text-white/80 font-mono">{item._id || '—'}</div>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#7C6FFF]"
                        style={{ width: `${totalSess ? (item.count / totalSess) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-[12px] text-text-dim w-8 text-right">{item.count}</span>
                  </div>
                ))}
              </div>
            </SectionPanel>

            {/* Exit screens */}
            <SectionPanel title="Экраны выхода" icon={<LogOut className="w-4 h-4 text-red-400" />} sub="откуда уходят">
              <div className="space-y-2">
                {(overview?.topExitScreens ?? []).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[12px]">
                    <span className="text-white/80">{item._id}</span>
                    <span className="text-red-400 font-medium">{item.count}×</span>
                  </div>
                ))}
              </div>
            </SectionPanel>

            {/* Platform + drop-off context */}
            <div className="flex flex-col gap-4">
              <SectionPanel title="Платформы" icon={<Smartphone className="w-4 h-4 text-primary" />}>
                <div className="space-y-2">
                  {(overview?.platformBreakdown ?? []).map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1 text-[12px] text-white/80 capitalize">{item._id}</div>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${totalSess ? (item.count / totalSess) * 100 : 0}%`,
                            background: PLATFORM_COLORS[item._id] ?? '#7C6FFF',
                          }}
                        />
                      </div>
                      <span className="text-[12px] text-text-dim w-8 text-right">{item.count}</span>
                    </div>
                  ))}
                </div>
              </SectionPanel>

              <SectionPanel title="Причины выхода" icon={<TrendingDown className="w-4 h-4 text-yellow-400" />}>
                <div className="space-y-2 mb-3">
                  {(dropoff?.exitContexts ?? []).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-[12px]">
                      <span className="text-white/80">{EXIT_CONTEXT_LABELS[item._id] ?? item._id}</span>
                      <span className="text-yellow-400 font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
                {dropoff && (
                  <div className="bg-red-900/20 rounded-xl p-3 text-[12px]">
                    <span className="text-red-400 font-medium">{dropoff.shortSessions}</span>
                    <span className="text-text-dim ml-1">сессий &lt;10с</span>
                  </div>
                )}
              </SectionPanel>
            </div>
          </div>

          {/* Sessions table */}
          <SectionPanel
            title="Сессии"
            icon={<Activity className="w-4 h-4 text-primary" />}
            sub={`всего ${totalSessions}`}
          >
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <select
                value={filterPlatform}
                onChange={(e) => { setFilterPlatform(e.target.value); setPage(1); }}
                className="bg-white/5 border border-white/[0.08] rounded-xl px-3 py-1.5 text-[12px] text-white focus:outline-none"
              >
                <option value="">Все платформы</option>
                <option value="ios">iOS</option>
                <option value="android">Android</option>
                <option value="web">Web</option>
              </select>
              <select
                value={filterUserType}
                onChange={(e) => { setFilterUserType(e.target.value); setPage(1); }}
                className="bg-white/5 border border-white/[0.08] rounded-xl px-3 py-1.5 text-[12px] text-white focus:outline-none"
              >
                <option value="">Новые и вернувшиеся</option>
                <option value="true">Только новые</option>
                <option value="false">Только вернувшиеся</option>
              </select>
              <select
                value={filterExitContext}
                onChange={(e) => { setFilterExitContext(e.target.value); setPage(1); }}
                className="bg-white/5 border border-white/[0.08] rounded-xl px-3 py-1.5 text-[12px] text-white focus:outline-none"
              >
                {EXIT_CONTEXT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Платформа', 'Тип', 'Экр.', 'Время', 'Вышел с', 'Контекст', 'Score'].map((h) => (
                      <th key={h} className="py-2 px-3 text-left text-[11px] text-text-dim font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <SessionRow key={s.sessionId} s={s} onClick={() => setSession(s.sessionId)} />
                  ))}
                  {!sessions.length && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-text-dim text-[13px]">Нет данных</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-[11px] text-text-dim">
                Стр. {sessionsPage} из {Math.ceil(totalSessions / 15) || 1}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={sessionsPage === 1}
                  className="px-3 py-1 text-[12px] rounded-lg bg-white/5 text-text-dim hover:text-white disabled:opacity-30"
                >
                  ← Назад
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={sessionsPage >= Math.ceil(totalSessions / 15)}
                  className="px-3 py-1 text-[12px] rounded-lg bg-white/5 text-text-dim hover:text-white disabled:opacity-30"
                >
                  Вперёд →
                </button>
              </div>
            </div>
          </SectionPanel>
        </>
      )}

      {selectedSession && (
        <SessionDetail sessionId={selectedSession} onClose={() => setSession(null)} />
      )}
    </div>
  );
}
