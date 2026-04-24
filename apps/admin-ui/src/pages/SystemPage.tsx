import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Bell, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { systemApi } from '../api/system.api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import type { SystemHealth } from '../types';

const SERVICES = ['auth', 'user', 'content', 'watch-party', 'battle', 'notification'];

const BROADCAST_TYPES = [
  { value: 'announcement', label: 'Объявление' },
  { value: 'maintenance',  label: 'Техработы' },
  { value: 'promo',        label: 'Акция / Новинка' },
  { value: 'update',       label: 'Обновление' },
];

export function SystemPage() {
  const [health, setHealth]               = useState<SystemHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError]     = useState<string | null>(null);

  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody]   = useState('');
  const [broadcastType, setBroadcastType]   = useState('announcement');
  const [sendLoading, setSendLoading]       = useState(false);
  const [sendResult, setSendResult]         = useState<{ ok: boolean; message: string } | null>(null);

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const data = await systemApi.getHealth();
      setHealth(data);
    } catch {
      setHealthError('Не удалось получить статус сервисов');
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHealth();
    const t = setInterval(() => void loadHealth(), 30_000);
    return () => clearInterval(t);
  }, [loadHealth]);

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return;
    setSendLoading(true);
    setSendResult(null);
    try {
      await systemApi.broadcast(broadcastTitle.trim(), broadcastBody.trim(), broadcastType);
      setSendResult({ ok: true, message: 'Broadcast успешно отправлен' });
      setBroadcastTitle('');
      setBroadcastBody('');
      setBroadcastType('announcement');
    } catch {
      setSendResult({ ok: false, message: 'Ошибка при отправке broadcast' });
    } finally {
      setSendLoading(false);
    }
  };

  const overallOk = !healthError && health && SERVICES.every((s) => health[s]?.status === 'ok');

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Система</h1>
          <p className="text-text-muted text-sm mt-0.5">Здоровье сервисов и уведомления</p>
        </div>
        {overallOk !== null && (
          <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border ${
            overallOk ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {overallOk ? <CheckCircle size={13} /> : <XCircle size={13} />}
            {overallOk ? 'Все сервисы работают' : 'Проблемы с сервисами'}
          </div>
        )}
      </div>

      {/* Service Health */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Сервисы</h2>
          <button
            onClick={() => void loadHealth()}
            disabled={healthLoading}
            className="flex items-center gap-1.5 text-xs text-text-dim hover:text-white px-3 py-1.5 rounded-lg border border-white/[0.07] hover:border-white/[0.12] transition-colors"
          >
            <RefreshCw size={12} className={healthLoading ? 'animate-spin' : ''} />
            Обновить
          </button>
        </div>

        {healthError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
            {healthError}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {SERVICES.map((name) => {
            const svc = health?.[name];
            const isOk = svc?.status === 'ok';
            return (
              <div key={name} className="bg-card rounded-2xl border border-white/[0.06] p-4 shadow-card flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text-muted font-mono truncate">{name}</p>
                  {!healthLoading && svc && (
                    <div className={`w-2 h-2 rounded-full ${isOk ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  )}
                  {healthLoading && <Loader2 size={12} className="text-text-dim animate-spin" />}
                </div>
                {healthLoading ? (
                  <div className="h-5 w-16 bg-white/[0.05] rounded animate-pulse" />
                ) : svc ? (
                  <>
                    <Badge variant={isOk ? 'green' : 'red'}>{svc.status}</Badge>
                    {svc.latency !== undefined && (
                      <p className="text-[11px] text-text-dim font-mono">{svc.latency}ms</p>
                    )}
                  </>
                ) : (
                  <Badge variant="gray">unknown</Badge>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Broadcast */}
      <section className="flex flex-col gap-4 max-w-lg">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-accent" />
          <h2 className="text-sm font-semibold text-white">Broadcast уведомление</h2>
        </div>

        <div className="bg-card rounded-2xl border border-white/[0.06] shadow-card p-5 flex flex-col gap-4">
          <select
            value={broadcastType}
            onChange={(e) => setBroadcastType(e.target.value)}
            className="bg-surface border border-border hover:border-border-md rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
          >
            {BROADCAST_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <input
            placeholder="Заголовок уведомления..."
            value={broadcastTitle}
            onChange={(e) => setBroadcastTitle(e.target.value)}
            className="bg-surface border border-border hover:border-border-md rounded-xl px-3 py-2.5 text-sm text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
          />

          <textarea
            rows={4}
            placeholder="Текст уведомления..."
            value={broadcastBody}
            onChange={(e) => setBroadcastBody(e.target.value)}
            className="bg-surface border border-border hover:border-border-md rounded-xl px-3 py-2.5 text-sm text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 resize-none transition-all"
          />

          {sendResult && (
            <div className={`flex items-center gap-2 text-sm rounded-xl px-3 py-2.5 ${
              sendResult.ok
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {sendResult.ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
              {sendResult.message}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="primary"
              loading={sendLoading}
              onClick={() => void handleBroadcast()}
              disabled={!broadcastTitle.trim() || !broadcastBody.trim()}
            >
              <Bell size={14} /> Отправить всем
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
