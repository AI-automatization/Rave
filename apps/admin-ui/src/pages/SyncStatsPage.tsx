import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import {
  Activity, Clock, Wifi, AlertTriangle, RefreshCw, ChevronRight, Zap,
} from 'lucide-react';
import {
  syncStatsApi,
  type SyncStatsOverview, type SyncStatsRoom, type SyncStatsSession,
} from '../api/syncStats.api';

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

const TRANSPORT_COLORS: Record<string, string> = {
  P2P:    '#4CAF82',
  TURN:   '#F4B942',
  Server: 'rgba(255,255,255,0.35)',
};

function msFormat(ms: number): string {
  if (!ms) return '0мс';
  if (ms < 1000) return `${Math.round(ms)}мс`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}с`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
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

function RoomRow({ r, onClick }: { r: SyncStatsRoom; onClick: () => void }) {
  return (
    <tr
      onClick={onClick}
      className="border-b border-white/[0.04] hover:bg-white/[0.03] cursor-pointer transition-colors"
    >
      <td className="py-2.5 px-3 text-[12px] text-white font-mono truncate max-w-[140px]">{r.roomId}</td>
      <td className="py-2.5 px-3 text-[12px] text-white">{r.participants}</td>
      <td className="py-2.5 px-3 text-[12px] text-[#7C6FFF]">{msFormat(r.avgDriftMs)}</td>
      <td className="py-2.5 px-3 text-[12px] text-yellow-400">{msFormat(r.maxDriftMs)}</td>
      <td className="py-2.5 px-3 text-[12px]">
        {r.errorCount > 0
          ? <span className="text-red-400 font-medium">{r.errorCount}</span>
          : <span className="text-text-dim">—</span>}
      </td>
      <td className="py-2.5 px-3 text-[12px]">
        {r.meshConnectFailedCount > 0
          ? <span className="text-red-400 font-medium">{r.meshConnectFailedCount}</span>
          : <span className="text-emerald-400">✓</span>}
      </td>
      <td className="py-2.5 px-3 text-[12px] text-text-dim">{new Date(r.lastSessionAt).toLocaleString()}</td>
      <td className="py-2.5 px-3"><ChevronRight className="w-3 h-3 text-text-dim" /></td>
    </tr>
  );
}

function RoomDetail({ roomId, onClose }: { roomId: string; onClose: () => void }) {
  const [sessions, setSessions] = useState<SyncStatsSession[] | null>(null);

  useEffect(() => {
    syncStatsApi.getRoomSessions(roomId).then(setSessions).catch(() => setSessions([]));
  }, [roomId]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card rounded-2xl p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-[14px] font-mono">{roomId}</h3>
          <button onClick={onClose} className="text-text-dim hover:text-white text-sm">✕</button>
        </div>

        {!sessions ? (
          <div className="text-text-dim text-sm">Загрузка...</div>
        ) : sessions.length === 0 ? (
          <div className="text-text-dim text-sm">Нет сессий</div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s._id} className="bg-white/[0.04] rounded-xl p-3 text-[12px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">
                    {s.isOwner ? '👑 Владелец' : '👤 Участник'} · {s.platform} {s.appVersion}
                  </span>
                  <span className="text-text-dim">{new Date(s.createdAt).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <div><span className="text-text-dim">P2P: </span><span className="text-emerald-400">{msFormat(s.transport.p2pMs)}</span></div>
                  <div><span className="text-text-dim">TURN: </span><span className="text-yellow-400">{msFormat(s.transport.turnMs)}</span></div>
                  <div><span className="text-text-dim">Server: </span><span className="text-white/60">{msFormat(s.transport.socketMs)}</span></div>
                  <div><span className="text-text-dim">Длит.: </span><span className="text-white">{msFormat(s.durationMs)}</span></div>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <div><span className="text-text-dim">Ср. дрифт: </span><span className="text-[#7C6FFF]">{msFormat(s.avgDriftMs)}</span></div>
                  <div><span className="text-text-dim">Макс. дрифт: </span><span className="text-yellow-400">{msFormat(s.maxDriftMs)}</span></div>
                  <div><span className="text-text-dim">Macro-seek: </span><span className="text-white">{s.macroSeekCount}</span></div>
                  <div><span className="text-text-dim">Micro-adj: </span><span className="text-white">{s.microAdjustCount}</span></div>
                </div>
                {s.meshConnectFailed && (
                  <div className="text-red-400 text-[11px] mb-1">⚠ Mesh (P2P/TURN) не подключился</div>
                )}
                {s.syncErrors?.length > 0 && (
                  <div className="bg-red-900/20 rounded-lg p-2 mt-2 space-y-0.5">
                    {s.syncErrors.map((e, i) => (
                      <div key={i} className="text-red-400 text-[11px] font-mono truncate">{e}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const DAYS_OPTIONS = [7, 14, 30];

export function SyncStatsPage() {
  const [days, setDays]           = useState(7);
  const [overview, setOverview]   = useState<SyncStatsOverview | null>(null);
  const [rooms, setRooms]         = useState<SyncStatsRoom[]>([]);
  const [totalRooms, setTotal]    = useState(0);
  const [page, setPage]           = useState(1);
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const loadAll = useCallback(async (d: number, p: number, hasErrors: boolean) => {
    setLoading(true);
    try {
      const [ov, rm] = await Promise.all([
        syncStatsApi.getOverview(d),
        syncStatsApi.getRooms(p, 15, { hasErrors: hasErrors || undefined }),
      ]);
      setOverview(ov);
      setRooms(rm.rooms);
      setTotal(rm.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadAll(days, page, onlyErrors); }, [days, page, onlyErrors, loadAll]);

  const transportPieData = overview ? [
    { name: 'P2P', value: overview.transportBreakdown.p2pPct },
    { name: 'TURN', value: overview.transportBreakdown.turnPct },
    { name: 'Server', value: overview.transportBreakdown.socketPct },
  ].filter((d) => d.value > 0) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-lg font-bold">Качество синхронизации</h1>
          <p className="text-text-dim text-[12px] mt-0.5">Транспорт, дрифт и ошибки по watch-party комнатам</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadAll(days, page, onlyErrors)}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Сессий за период" value={overview?.totalSessions ?? 0} icon={<Activity className="w-4 h-4" />} />
            <StatCard label="Средний дрифт" value={msFormat(overview?.avgDriftMs ?? 0)} icon={<Clock className="w-4 h-4" />} color="#7C6FFF" />
            <StatCard
              label="Mesh не подключился"
              value={overview?.meshConnectFailedCount ?? 0}
              icon={<Wifi className="w-4 h-4" />}
              color="#FF6B6B"
            />
            <StatCard
              label="Сессий с ошибками"
              value={overview?.errorSessionsCount ?? 0}
              icon={<AlertTriangle className="w-4 h-4" />}
              color="#F4B942"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <SectionPanel title="Транспорт" icon={<Wifi className="w-4 h-4 text-primary" />} sub="% времени сессий">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={transportPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                    {transportPieData.map((entry) => (
                      <Cell key={entry.name} fill={TRANSPORT_COLORS[entry.name] ?? '#7C6FFF'} />
                    ))}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP} formatter={(v: number, name: string) => [`${v}%`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {transportPieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-2 h-2 rounded-full" style={{ background: TRANSPORT_COLORS[d.name] }} />
                    <span className="text-text-dim">{d.name} {d.value}%</span>
                  </div>
                ))}
              </div>
            </SectionPanel>

            <SectionPanel title="Дрифт по дням" icon={<Clock className="w-4 h-4 text-primary" />} sub="ms">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={overview?.dailyTrend ?? []}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8B8EA8' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#8B8EA8' }} tickLine={false} axisLine={false} />
                  <Tooltip {...CHART_TOOLTIP} formatter={(v: number) => [msFormat(v), 'Ср. дрифт']} />
                  <Line type="monotone" dataKey="avgDrift" stroke="#7C6FFF" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </SectionPanel>

            <SectionPanel title="Коррекции" icon={<Zap className="w-4 h-4 text-primary" />} sub="в среднем на сессию">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name: 'Macro-seek', value: overview?.avgMacroSeekCount ?? 0 },
                  { name: 'Micro-adjust', value: overview?.avgMicroAdjustCount ?? 0 },
                ]}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8B8EA8' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#8B8EA8' }} tickLine={false} axisLine={false} />
                  <Tooltip {...CHART_TOOLTIP} />
                  <Bar dataKey="value" fill="#F4B942" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </SectionPanel>
          </div>

          <SectionPanel title="Комнаты" icon={<Activity className="w-4 h-4 text-primary" />} sub={`всего ${totalRooms}`}>
            <div className="flex items-center gap-2 mb-4">
              <label className="flex items-center gap-1.5 text-[12px] text-text-dim cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyErrors}
                  onChange={(e) => { setOnlyErrors(e.target.checked); setPage(1); }}
                  className="accent-[#7C6FFF]"
                />
                Только с ошибками
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Комната', 'Участников', 'Ср. дрифт', 'Макс. дрифт', 'Ошибки', 'Mesh OK', 'Последняя сессия', ''].map((h) => (
                      <th key={h} className="py-2 px-3 text-left text-[11px] text-text-dim font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((r) => (
                    <RoomRow key={r.roomId} r={r} onClick={() => setSelectedRoom(r.roomId)} />
                  ))}
                  {!rooms.length && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-text-dim text-[13px]">Нет данных</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-[11px] text-text-dim">
                Стр. {page} из {Math.ceil(totalRooms / 15) || 1}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-[12px] rounded-lg bg-white/5 text-text-dim hover:text-white disabled:opacity-30"
                >
                  ← Назад
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(totalRooms / 15)}
                  className="px-3 py-1 text-[12px] rounded-lg bg-white/5 text-text-dim hover:text-white disabled:opacity-30"
                >
                  Вперёд →
                </button>
              </div>
            </div>
          </SectionPanel>
        </>
      )}

      {selectedRoom && <RoomDetail roomId={selectedRoom} onClose={() => setSelectedRoom(null)} />}
    </div>
  );
}
