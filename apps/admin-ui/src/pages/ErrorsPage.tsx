import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Mail, User, X, AlertTriangle, Clock, Smartphone, ChevronDown, ChevronRight, Cpu, Globe, Layers, Zap, Tag, MonitorSmartphone, Code2, Database, Shield } from 'lucide-react';
import { errorsApi, MobileIssue, MobileEvent, IssueStatus, ErrorStats } from '../api/errors.api';
import { usersApi } from '../api/users.api';
import { Badge } from '../components/ui/Badge';
import { Pagination } from '../components/ui/Pagination';
import type { AdminUser } from '../types';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}с назад`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}м назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}ч назад`;
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const STATUS_CONFIG: Record<IssueStatus, { label: string; variant: 'red' | 'yellow' | 'green' | 'gray' }> = {
  new:         { label: 'Новая',    variant: 'red' },
  in_progress: { label: 'В работе', variant: 'yellow' },
  resolved:    { label: 'Решено',   variant: 'green' },
  ignored:     { label: 'Игнор',    variant: 'gray' },
};

const PLATFORM_ICON: Record<string, string> = { ios: '🍎', android: '🤖', unknown: '📱' };

// ── Stat filter button ────────────────────────────────────────────────────────

function StatFilter({ value, label, active, onClick, color }: {
  value: number; label: string; active: boolean; onClick: () => void;
  color: 'red' | 'amber' | 'green' | 'gray';
}) {
  const colors = {
    red:   { dot: 'bg-red-400',     ring: 'ring-red-500/30',     bg: 'bg-red-500/10' },
    amber: { dot: 'bg-amber-400',   ring: 'ring-amber-500/30',   bg: 'bg-amber-500/10' },
    green: { dot: 'bg-emerald-400', ring: 'ring-emerald-500/30', bg: 'bg-emerald-500/10' },
    gray:  { dot: 'bg-text-muted',  ring: 'ring-white/10',       bg: 'bg-white/5' },
  }[color];
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all border w-full shadow-card
        ${active
          ? `${colors.bg} ring-1 ${colors.ring} border-white/[0.08]`
          : 'bg-card border-white/[0.06] hover:border-white/[0.1]'
        }`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
      <div>
        <p className="text-xl font-bold text-white tabular-nums">{value}</p>
        <p className="text-xs text-text-muted mt-0.5">{label}</p>
      </div>
    </button>
  );
}

// ── UserCard ─────────────────────────────────────────────────────────────────

function UserCard({ userId }: { userId: string }) {
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    usersApi.getById(userId).then(setUser).catch(() => {});
  }, [userId]);

  if (!user) return (
    <div className="flex items-center gap-2 text-xs text-text-dim">
      <User size={13} />
      <span className="font-mono">{userId.slice(-12)}</span>
    </div>
  );

  const hue = (user.email.charCodeAt(0) * 137) % 360;
  return (
    <div className="flex items-center gap-3 bg-accent/[0.06] border border-accent/15 rounded-xl px-3 py-2.5">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: `hsl(${hue},40%,20%)`, color: `hsl(${hue},70%,70%)` }}
      >
        {(user.username || user.email).slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">{user.username || user.email}</p>
        <p className="text-[11px] text-text-muted truncate">{user.email}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <a
          href={`mailto:${user.email}`}
          className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
        >
          <Mail size={11} /> Связаться
        </a>
        <Link
          to={`/users/${user._id}`}
          className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-white/[0.06] text-text-muted hover:text-white hover:bg-white/[0.1] transition-colors"
        >
          <User size={11} /> Профиль
        </Link>
      </div>
    </div>
  );
}

// ── EventDrawer ───────────────────────────────────────────────────────────────

function EventDrawer({ issue, onClose }: { issue: MobileIssue; onClose: () => void }) {
  const [events, setEvents]   = useState<MobileEvent[]>([]);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedRaw, setExpandedRaw] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    errorsApi.getEvents(issue.id, page)
      .then((r) => {
        setEvents(r.data);
        setTotal(r.meta.total);
        if (r.data.length > 0) setExpandedEvent(r.data[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [issue.id, page]);

  return (
    <div className="fixed inset-0 z-40 flex animate-fade-in">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-[680px] bg-bg border-l border-white/[0.07] flex flex-col h-full overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-text-dim">{PLATFORM_ICON[issue.platform]} {issue.platform}</span>
              {issue.appVersion && <span className="text-xs text-text-dim">v{issue.appVersion}</span>}
              <Badge variant={STATUS_CONFIG[issue.status]?.variant ?? 'gray'} dot>
                {STATUS_CONFIG[issue.status]?.label ?? issue.status}
              </Badge>
            </div>
            <h2 className="text-sm font-semibold text-white">{issue.title}</h2>
            <p className="text-xs text-text-muted mt-0.5 line-clamp-2 leading-relaxed">{issue.message}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-white hover:bg-white/[0.07] transition-colors shrink-0">
            <X size={14} />
          </button>
        </div>

        {/* Meta row */}
        <div className="px-5 py-2.5 border-b border-white/[0.04] flex flex-wrap gap-x-5 gap-y-1 shrink-0">
          {[
            { icon: AlertTriangle, label: 'Событий',   value: String(issue.count) },
            { icon: User,          label: 'Юзеров',    value: String(issue.affectedUsers) },
            { icon: Clock,         label: 'Первый',    value: relativeTime(issue.firstSeen) },
            { icon: Clock,         label: 'Последний', value: relativeTime(issue.lastSeen) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-text-muted">
              <Icon size={11} className="text-text-dim" />
              <span>{label}:</span>
              <span className="text-white font-medium">{value}</span>
            </div>
          ))}
        </div>

        {/* Events list */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {loading && Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-40 bg-card rounded-2xl animate-pulse" />
          ))}
          {!loading && events.length === 0 && (
            <div className="text-center py-12 text-text-muted text-sm">Нет событий</div>
          )}
          {events.map((ev) => {
            const raw = ev.context as {
              contexts?: {
                os?: { name?: string; version?: string; api_level?: number; brand?: string; manufacturer?: string; fingerprint?: string; model?: string; is_tablet?: boolean };
                device?: { model?: string; name?: string; brand?: string; manufacturer?: string; screen_width?: number; screen_height?: number; window_width?: number; window_height?: number; screen_density?: number; screen_scale?: number; color_scheme?: string; is_tablet?: boolean };
                app?: { app_version?: string; build_number?: string; app_name?: string; execution_env?: string; is_expo_go?: boolean; app_state?: string; session_id?: string };
                runtime?: { expo_sdk?: string; js_engine?: string; rn_version?: string };
                culture?: { timezone?: string; locale?: string };
              };
              tags?: Record<string, string>;
              extra?: Record<string, unknown>;
              componentStack?: string;
            } | null;
            const ctx = raw?.contexts;
            const stackFrames = (ev.stackTrace as { values?: { stacktrace?: { frames?: Array<{ filename?: string; function?: string; lineno?: number }> } }[] }).values?.[0]?.stacktrace?.frames ?? [];
            const isRawExpanded = expandedRaw === ev.id;
            const deviceName = [ctx?.device?.manufacturer ?? ctx?.device?.brand, ctx?.device?.model ?? ctx?.device?.name].filter(Boolean).join(' ') || ev.device || 'Unknown Device';
            const osLabel = ctx?.os ? `${ctx.os.name ?? ''} ${ctx.os.version ?? ''}`.trim() : ev.osVersion || '—';
            const levelColor = ev.level === 'fatal' ? { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/25', dot: 'bg-red-400' } :
                               ev.level === 'error' ? { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/25', dot: 'bg-orange-400' } :
                               { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/25', dot: 'bg-amber-400' };
            const extraEntries = raw?.extra ? Object.entries(raw.extra) : [];

            const isExpanded = expandedEvent === ev.id;

            return (
              <div key={ev.id} className="rounded-2xl border border-white/[0.07] overflow-hidden bg-[#0d0d14]">

                {/* ── Event top bar — click to expand ── */}
                <button
                  onClick={() => setExpandedEvent(isExpanded ? null : ev.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 border-b ${levelColor.border} ${levelColor.bg} hover:brightness-110 transition-all`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-widest ${levelColor.bg} ${levelColor.text} ${levelColor.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${levelColor.dot} animate-pulse`} />
                      {ev.level}
                    </span>
                    <span className="text-xs text-text-muted font-medium">{PLATFORM_ICON[ev.platform] ?? '📱'} {ev.platform}</span>
                    {ctx?.culture?.locale && (
                      <span className="text-[11px] text-text-dim bg-white/[0.05] px-2 py-0.5 rounded-md border border-white/[0.06]">{ctx.culture.locale}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-text-dim font-mono tabular-nums">{relativeTime(ev.timestamp)}</span>
                    {isExpanded ? <ChevronDown size={13} className="text-text-dim" /> : <ChevronRight size={13} className="text-text-dim" />}
                  </div>
                </button>

                {/* ── Collapsed: just Device Hero ── */}
                {!isExpanded && (
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => setExpandedEvent(ev.id)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                      <MonitorSmartphone size={15} className="text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{deviceName}</p>
                      <p className="text-[11px] text-text-muted truncate">{osLabel}{ctx?.os?.api_level ? ` · API ${ctx.os.api_level}` : ''}</p>
                    </div>
                    <span className="text-[10px] text-text-dim">нажми для деталей →</span>
                  </div>
                )}

                {/* ── Expanded: full details ── */}
                {isExpanded && <div className="p-4 flex flex-col gap-4">

                  {/* ── Device Hero ── */}
                  <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl p-3.5 border border-white/[0.05]">
                    <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                      <MonitorSmartphone size={20} className="text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{deviceName}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-text-muted">{osLabel}</span>
                        {ctx?.os?.api_level && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">API {ctx.os.api_level}</span>
                        )}
                        {ctx?.app?.is_expo_go && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">Expo Go</span>
                        )}
                        {ctx?.device?.is_tablet && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Tablet</span>
                        )}
                        {ctx?.device?.color_scheme && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-text-dim border border-white/[0.07]">
                            {ctx.device.color_scheme === 'dark' ? '🌙' : '☀️'} {ctx.device.color_scheme}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] text-text-dim">App State</p>
                      <span className={`text-[11px] font-medium ${ctx?.app?.app_state === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {ctx?.app?.app_state ?? '—'}
                      </span>
                    </div>
                  </div>

                  {/* ── 4-column info grid ── */}
                  <div className="grid grid-cols-2 gap-3">

                    {/* Device */}
                    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border-b border-white/[0.05]">
                        <Smartphone size={12} className="text-accent" />
                        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Device</span>
                      </div>
                      <div className="p-3 flex flex-col gap-2">
                        {[
                          ['Модель',      ctx?.device?.model ?? '—'],
                          ['Бренд',       ctx?.device?.brand ?? '—'],
                          ['Производитель', ctx?.device?.manufacturer ?? '—'],
                          ['Экран',       ctx?.device?.screen_width ? `${Math.round(ctx.device.screen_width)}×${Math.round(ctx.device.screen_height ?? 0)}` : '—'],
                          ['Плотность',   ctx?.device?.screen_density ? `${ctx.device.screen_density}x` : '—'],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between items-center gap-2">
                            <span className="text-[10px] text-text-dim shrink-0">{k}</span>
                            <span className="text-[11px] text-white font-medium text-right truncate max-w-[120px]">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* OS */}
                    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border-b border-white/[0.05]">
                        <Layers size={12} className="text-cyan-400" />
                        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">OS</span>
                      </div>
                      <div className="p-3 flex flex-col gap-2">
                        {[
                          ['Система',   ctx?.os?.name ?? '—'],
                          ['Версия',    ctx?.os?.version ?? '—'],
                          ['API Level', ctx?.os?.api_level ? String(ctx.os.api_level) : '—'],
                          ['Бренд',     ctx?.os?.brand ?? '—'],
                          ['Произ.',    ctx?.os?.manufacturer ?? '—'],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between items-center gap-2">
                            <span className="text-[10px] text-text-dim shrink-0">{k}</span>
                            <span className="text-[11px] text-white font-medium text-right truncate max-w-[120px]">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Runtime */}
                    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border-b border-white/[0.05]">
                        <Zap size={12} className="text-yellow-400" />
                        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Runtime</span>
                      </div>
                      <div className="p-3 flex flex-col gap-2">
                        {[
                          ['JS Engine',  ctx?.runtime?.js_engine ?? '—'],
                          ['RN Version', ctx?.runtime?.rn_version ?? '—'],
                          ['Expo SDK',   ctx?.runtime?.expo_sdk ?? '—'],
                          ['Среда',      ctx?.app?.execution_env ?? '—'],
                          ['App v',      ctx?.app?.app_version ? `${ctx.app.app_version} (${ctx.app.build_number ?? '0'})` : ev.appVersion ?? '—'],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between items-center gap-2">
                            <span className="text-[10px] text-text-dim shrink-0">{k}</span>
                            <span className="text-[11px] text-white font-medium text-right truncate max-w-[120px]">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Culture */}
                    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border-b border-white/[0.05]">
                        <Globe size={12} className="text-emerald-400" />
                        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Culture</span>
                      </div>
                      <div className="p-3 flex flex-col gap-2">
                        {[
                          ['Timezone', ctx?.culture?.timezone ?? '—'],
                          ['Locale',   ctx?.culture?.locale ?? '—'],
                          ['App Name', ctx?.app?.app_name ?? '—'],
                          ['Session',  ctx?.app?.session_id ? ctx.app.session_id.slice(0, 8) + '…' : '—'],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between items-center gap-2">
                            <span className="text-[10px] text-text-dim shrink-0">{k}</span>
                            <span className="text-[11px] text-white font-medium text-right truncate max-w-[120px]">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── Fingerprint ── */}
                  {ctx?.os?.fingerprint && ctx.os.fingerprint !== 'unknown' && (
                    <div className="flex items-start gap-2.5 bg-white/[0.02] rounded-xl px-3 py-2.5 border border-white/[0.05]">
                      <Shield size={12} className="text-text-dim mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-text-dim uppercase tracking-wider mb-0.5">Build Fingerprint</p>
                        <p className="text-[11px] font-mono text-text-muted break-all leading-relaxed">{ctx.os.fingerprint}</p>
                      </div>
                    </div>
                  )}

                  {/* ── Tags ── */}
                  {raw?.tags && Object.keys(raw.tags).length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Tag size={11} className="text-text-dim" />
                        <span className="text-[10px] text-text-dim uppercase tracking-wider font-semibold">Tags</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(raw.tags).map(([k, v]) => (
                          <span key={k} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-accent/10 border border-accent/20 text-accent/90 font-mono">
                            <span className="text-accent/50">{k}:</span>{v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Extra ── */}
                  {extraEntries.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Database size={11} className="text-text-dim" />
                        <span className="text-[10px] text-text-dim uppercase tracking-wider font-semibold">Extra</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {extraEntries.map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between gap-2 bg-white/[0.03] rounded-lg px-2.5 py-1.5 border border-white/[0.05]">
                            <span className="text-[10px] text-text-dim">{k}</span>
                            <span className="text-[11px] text-amber-300 font-mono">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── User ── */}
                  {ev.userId && <UserCard userId={ev.userId} />}

                  {/* ── Stack trace ── */}
                  {stackFrames.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Code2 size={11} className="text-text-dim" />
                        <span className="text-[10px] text-text-dim uppercase tracking-wider font-semibold">Stack Trace</span>
                        <span className="text-[10px] text-text-dim bg-white/[0.05] px-1.5 py-0.5 rounded">{stackFrames.length} frames</span>
                      </div>
                      <div className="bg-[#080810] rounded-xl border border-white/[0.06] overflow-hidden">
                        <div className="overflow-x-auto max-h-56 p-3 flex flex-col gap-0.5">
                          {[...stackFrames].reverse().map((f, i) => {
                            const filename = f.filename?.split('/').pop() ?? f.filename ?? '?';
                            const isTop = i === 0;
                            return (
                              <div key={i} className={`flex items-start gap-2 py-0.5 rounded px-1 ${isTop ? 'bg-red-500/10' : 'hover:bg-white/[0.02]'}`}>
                                <span className={`text-[10px] font-mono w-4 shrink-0 text-right tabular-nums mt-0.5 ${isTop ? 'text-red-400' : 'text-text-dim'}`}>{i + 1}</span>
                                <div className="min-w-0">
                                  <span className={`text-[11px] font-mono font-medium ${isTop ? 'text-red-300' : 'text-accent/80'}`}>{f.function ?? '?'}</span>
                                  <span className="text-text-dim text-[10px] font-mono"> · {filename}</span>
                                  <span className={`text-[10px] font-mono ml-1 ${isTop ? 'text-red-400/70' : 'text-text-dim'}`}>:{f.lineno ?? '?'}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Component stack ── */}
                  {raw?.componentStack && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Cpu size={11} className="text-text-dim" />
                        <span className="text-[10px] text-text-dim uppercase tracking-wider font-semibold">Component Stack</span>
                      </div>
                      <div className="bg-[#080810] rounded-xl p-3 text-[11px] font-mono text-amber-300/80 overflow-x-auto max-h-28 whitespace-pre border border-white/[0.06]">
                        {raw.componentStack.trim()}
                      </div>
                    </div>
                  )}

                  {/* ── Raw JSON toggle ── */}
                  <button
                    onClick={() => setExpandedRaw(isRawExpanded ? null : ev.id)}
                    className="flex items-center gap-1.5 text-[11px] text-text-dim hover:text-text-muted transition-colors self-start"
                  >
                    {isRawExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    Raw JSON
                  </button>
                  {isRawExpanded && (
                    <div className="bg-[#080810] rounded-xl p-3 text-[11px] font-mono text-text-muted overflow-x-auto max-h-48 whitespace-pre border border-white/[0.06]">
                      {JSON.stringify(ev.context, null, 2)}
                    </div>
                  )}

                </div>}

              </div>
            );
          })}
        </div>

        {total > 10 && (
          <div className="px-5 py-3 border-t border-white/[0.06] shrink-0">
            <Pagination page={page} totalPages={Math.ceil(total / 10)} total={total} limit={10} onChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ErrorsPage() {
  const [issues, setIssues]     = useState<MobileIssue[]>([]);
  const [stats, setStats]       = useState<ErrorStats>({ new: 0, in_progress: 0, resolved: 0, ignored: 0 });
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState<IssueStatus | ''>('');
  const [search, setSearch]     = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selected, setSelected] = useState<MobileIssue | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadStats = useCallback(() => {
    errorsApi.stats().then(setStats).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await errorsApi.list({ page, limit: 20, status: statusFilter || undefined, search: search || undefined });
      setIssues(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, statusFilter, search]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { void load(); }, [load]);

  const handleStatusChange = async (issue: MobileIssue, newStatus: IssueStatus) => {
    setUpdating(issue.id);
    try {
      const updated = await errorsApi.updateStatus(issue.id, newStatus);
      setIssues((prev) => prev.map((i) => i.id === issue.id ? { ...i, status: updated.status } : i));
      loadStats();
    } catch { /* silent */ }
    finally { setUpdating(null); }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ошибки</h1>
          <p className="text-text-muted text-sm mt-0.5">Мобильные краши и исключения</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-dim bg-card rounded-xl px-3 py-2 border border-white/[0.06]">
          <Smartphone size={13} />
          <span>{total.toLocaleString('ru')} всего</span>
        </div>
      </div>

      {/* Stat filters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatFilter value={stats.new}         label="Новые"        color="red"   active={statusFilter === 'new'}         onClick={() => { setStatusFilter(statusFilter === 'new' ? '' : 'new'); setPage(1); }} />
        <StatFilter value={stats.in_progress} label="В работе"     color="amber" active={statusFilter === 'in_progress'} onClick={() => { setStatusFilter(statusFilter === 'in_progress' ? '' : 'in_progress'); setPage(1); }} />
        <StatFilter value={stats.resolved}    label="Исправлено"   color="green" active={statusFilter === 'resolved'}    onClick={() => { setStatusFilter(statusFilter === 'resolved' ? '' : 'resolved'); setPage(1); }} />
        <StatFilter value={stats.ignored}     label="Игнорируется" color="gray"  active={statusFilter === 'ignored'}     onClick={() => { setStatusFilter(statusFilter === 'ignored' ? '' : 'ignored'); setPage(1); }} />
      </div>

      {/* Search + status */}
      <div className="flex flex-wrap items-center gap-2.5">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Поиск по ошибке, сообщению..."
            className="w-full bg-surface border border-border hover:border-border-md rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
          />
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as IssueStatus | ''); setPage(1); }}
          className="bg-surface border border-border hover:border-border-md rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
        >
          <option value="">Все статусы</option>
          <option value="new">Новые</option>
          <option value="in_progress">В работе</option>
          <option value="resolved">Исправлено</option>
          <option value="ignored">Игнорируется</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {['Ошибка', 'Платформа', 'Событий', 'Юзеров', 'Последний', 'Статус'].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-text-dim uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-white/[0.05] rounded animate-pulse" style={{ width: `${50 + (i * j * 11) % 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : issues.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-text-muted">Ошибок нет 🎉</td>
              </tr>
            ) : issues.map((issue) => (
              <tr key={issue.id} className="tr-hover cursor-pointer" onClick={() => setSelected(issue)}>
                <td className="px-5 py-4 max-w-xs">
                  <p className="font-medium text-white truncate">{issue.title}</p>
                  <p className="text-xs text-text-muted truncate mt-0.5">{issue.message || '—'}</p>
                </td>
                <td className="px-5 py-4 text-text-muted text-xs whitespace-nowrap">
                  {PLATFORM_ICON[issue.platform]} {issue.platform}
                  {issue.appVersion && <span className="ml-1 text-text-dim">v{issue.appVersion}</span>}
                </td>
                <td className="px-5 py-4">
                  <span className="font-mono font-semibold text-white">{issue.count}</span>
                </td>
                <td className="px-5 py-4 text-text-muted">{issue.affectedUsers}</td>
                <td className="px-5 py-4 text-text-muted text-xs whitespace-nowrap">{relativeTime(issue.lastSeen)}</td>
                <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={issue.status}
                    disabled={updating === issue.id}
                    onChange={(e) => void handleStatusChange(issue, e.target.value as IssueStatus)}
                    className={`text-xs rounded-lg px-2.5 py-1 border focus:outline-none cursor-pointer transition-all appearance-none ${
                      issue.status === 'new'         ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      issue.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      issue.status === 'resolved'    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      'bg-white/5 text-text-muted border-white/10'
                    }`}
                  >
                    {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-5 border-t border-white/[0.04]">
            <Pagination page={page} totalPages={totalPages} total={total} limit={20} onChange={setPage} />
          </div>
        )}
      </div>

      {selected && <EventDrawer issue={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
