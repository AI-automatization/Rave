import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import {
  BarChart2, Users, Clock, Smartphone, TrendingDown,
  ChevronRight, Zap, Activity, LogOut,
} from 'lucide-react';
import { analyticsApi, type OverviewData, type FunnelStep, type SessionItem, type DropOffData } from '../api/analytics.api';

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
  after_register:    'Сразу после регистрации',
  after_watch_party: 'После просмотра',
  immediate_exit:    'Мгновенный выход (<10с)',
  single_screen:     'Один экран',
  normal:            'Обычный выход',
};

const PLATFORM_COLORS: Record<string, string> = {
  ios:     '#7C6FFF',
  android: '#4CAF82',
  web:     '#F4B942',
};

function ms(ms: number): string {
  if (!ms) return '—';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}с`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}м ${rem}с` : `${m}м`;
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

function StatCard({ label, value, sub, icon, color = '#7C6FFF' }: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; color?: string;
}) {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-card relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.09] to-transparent" />
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-dim text-[12px]">{label}</span>
        <span style={{ color }} className="opacity-70">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-[11px] text-text-dim mt-1">{sub}</div>}
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

function SessionRow({ s, onClick }: { s: SessionItem; onClick: () => void }) {
  const dur = s.duration ? ms(s.duration) : s.isActive ? '🟢 онлайн' : '—';
  const ctx = s.exitContext ? (EXIT_CONTEXT_LABELS[s.exitContext] ?? s.exitContext) : '—';
  const platform = s.platform === 'ios' ? '🍎' : s.platform === 'android' ? '🤖' : '🌐';

  return (
    <tr
      onClick={onClick}
      className="border-b border-white/[0.04] hover:bg-white/[0.03] cursor-pointer transition-colors"
    >
      <td className="py-2.5 px-3 text-[12px] text-text-dim">{platform} {s.platform}</td>
      <td className="py-2.5 px-3 text-[12px] text-white">{s.isNewUser ? '🆕 новый' : 'вернувшийся'}</td>
      <td className="py-2.5 px-3 text-[12px] text-white">{s.screens.length} экранов</td>
      <td className="py-2.5 px-3 text-[12px] text-[#7C6FFF]">{dur}</td>
      <td className="py-2.5 px-3 text-[12px] text-text-dim">{s.exitScreen ?? '—'}</td>
      <td className="py-2.5 px-3 text-[12px] text-text-dim max-w-[140px] truncate">{ctx}</td>
      <td className="py-2.5 px-3">
        <div className="flex items-center justify-between">
          <span className={`text-[11px] px-2 py-0.5 rounded-full ${s.engagementScore > 60 ? 'bg-green-900/40 text-green-400' : s.engagementScore > 30 ? 'bg-yellow-900/40 text-yellow-400' : 'bg-red-900/40 text-red-400'}`}>
            {s.engagementScore}
          </span>
          <ChevronRight className="w-3 h-3 text-text-dim ml-2" />
        </div>
      </td>
    </tr>
  );
}

function SessionDetail({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const [data, setData] = useState<{ session: SessionItem; events: Array<{ event: string; screen?: string; ts: string; meta?: Record<string, unknown> }> } | null>(null);

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
        className="bg-card rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-[14px]">Детали сессии</h3>
          <button onClick={onClose} className="text-text-dim hover:text-white text-sm">✕</button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5 text-[12px]">
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-text-dim mb-1">Платформа</div>
            <div className="text-white font-medium">{session.platform} {session.deviceModel}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-text-dim mb-1">Длительность</div>
            <div className="text-white font-medium">{session.duration ? ms(session.duration) : '—'}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-text-dim mb-1">Вовлечённость</div>
            <div className="text-white font-medium">{session.engagementScore}/100</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-text-dim text-[11px] uppercase tracking-wider mb-2">Маршрут по экранам</div>
          <div className="flex flex-wrap gap-1.5">
            {session.screens.map((s, i) => (
              <div key={i} className="bg-white/5 rounded-lg px-2.5 py-1 text-[11px] text-white flex items-center gap-1.5">
                <span>{s.screen}</span>
                {s.duration && <span className="text-text-dim">{ms(s.duration)}</span>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-text-dim text-[11px] uppercase tracking-wider mb-2">События</div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {events.map((e, i) => (
              <div key={i} className="flex items-center gap-3 text-[11px] py-1 border-b border-white/[0.04]">
                <span className="text-text-dim w-20 shrink-0">{new Date(e.ts).toLocaleTimeString()}</span>
                <span className="text-[#7C6FFF] font-mono">{e.event}</span>
                {e.screen && <span className="text-white/60">{e.screen}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const DAYS_OPTIONS = [7, 14, 30];

export function AnalyticsPage() {
  const [days, setDays]               = useState(7);
  const [overview, setOverview]       = useState<OverviewData | null>(null);
  const [funnel, setFunnel]           = useState<FunnelStep[]>([]);
  const [sessions, setSessions]       = useState<SessionItem[]>([]);
  const [dropoff, setDropoff]         = useState<DropOffData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [selectedSession, setSession] = useState<string | null>(null);
  const [sessionsPage, setPage]       = useState(1);
  const [totalSessions, setTotal]     = useState(0);

  const loadAll = useCallback(async (d: number, page: number) => {
    setLoading(true);
    try {
      const [ov, fn, sess, do_] = await Promise.all([
        analyticsApi.getOverview(d),
        analyticsApi.getFunnel(d),
        analyticsApi.getSessions(page, 15),
        analyticsApi.getDropOff(d),
      ]);
      setOverview(ov);
      setFunnel(fn);
      setSessions(sess.sessions);
      setTotal(sess.total);
      setDropoff(do_);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadAll(days, sessionsPage); }, [days, sessionsPage, loadAll]);

  const maxFunnelCount = funnel[0]?.count ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-lg font-bold">Аналитика</h1>
          <p className="text-text-dim text-[12px] mt-0.5">Поведение пользователей, воронки и drop-off точки</p>
        </div>
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
            <StatCard label="Сессий за период" value={overview?.totalSessions ?? 0} sub={`${overview?.todaySessions ?? 0} сегодня`} icon={<Activity className="w-4 h-4" />} />
            <StatCard label="Средняя сессия"   value={ms((overview?.avgSessionDuration ?? 0) * 1000)} icon={<Clock className="w-4 h-4" />} color="#4CAF82" />
            <StatCard label="Вовлечённость"    value={`${overview?.avgEngagementScore ?? 0}/100`} icon={<Zap className="w-4 h-4" />} color="#F4B942" />
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
                  <Tooltip {...CHART_TOOLTIP} formatter={(v: number) => [v, 'Посещений']} />
                  <Bar dataKey="visits" fill="#7C6FFF" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
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

            {/* Platform breakdown */}
            <SectionPanel title="Платформы" icon={<Smartphone className="w-4 h-4 text-primary" />}>
              <div className="space-y-2">
                {(overview?.platformBreakdown ?? []).map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1 text-[12px] text-white/80 capitalize">{item._id}</div>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${overview?.totalSessions ? (item.count / overview.totalSessions) * 100 : 0}%`,
                          background: PLATFORM_COLORS[item._id] ?? '#7C6FFF',
                        }}
                      />
                    </div>
                    <span className="text-[12px] text-text-dim w-8 text-right">{item.count}</span>
                  </div>
                ))}
              </div>
            </SectionPanel>

            {/* Drop-off contexts */}
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
                  <span className="text-text-dim ml-1">сессий длиной &lt;10с</span>
                </div>
              )}
            </SectionPanel>
          </div>

          {/* Sessions table */}
          <SectionPanel title="Последние сессии" icon={<Activity className="w-4 h-4 text-primary" />} sub={`всего ${totalSessions}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Платформа', 'Тип', 'Экраны', 'Время', 'Вышел с', 'Контекст', 'Score'].map((h) => (
                      <th key={h} className="py-2 px-3 text-left text-[11px] text-text-dim font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <SessionRow key={s.sessionId} s={s} onClick={() => setSession(s.sessionId)} />
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
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
