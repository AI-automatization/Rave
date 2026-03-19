import { useEffect, useState, useCallback } from 'react';
import { systemApi } from '../api/system.api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { SystemHealth } from '../types';

const SERVICES = ['auth', 'user', 'content', 'watch-party', 'battle', 'notification'];

const AUTO_REFRESH_INTERVAL_MS = 30_000;

export function SystemPage() {
  const [health, setHealth]         = useState<SystemHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError]     = useState<string | null>(null);

  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody]   = useState('');
  const [sendLoading, setSendLoading]       = useState(false);
  const [sendResult, setSendResult]         = useState<{ ok: boolean; message: string } | null>(null);

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const data = await systemApi.getHealth();
      setHealth(data);
    } catch {
      setHealthError('Failed to fetch service health');
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHealth();
    const interval = setInterval(() => { void loadHealth(); }, AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadHealth]);

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return;
    setSendLoading(true);
    setSendResult(null);
    try {
      await systemApi.broadcast(broadcastTitle.trim(), broadcastBody.trim());
      setSendResult({ ok: true, message: 'Broadcast sent successfully' });
      setBroadcastTitle('');
      setBroadcastBody('');
    } catch {
      setSendResult({ ok: false, message: 'Failed to send broadcast' });
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold text-white">System</h1>
        <p className="text-text-muted text-sm mt-0.5">Service health and notifications</p>
      </div>

      {/* Section 1: Service Health */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Service Health</h2>
          <button
            onClick={() => void loadHealth()}
            className="text-xs text-text-muted hover:text-white px-3 py-1.5 rounded-md border border-border hover:border-border-light transition-colors"
          >
            Refresh
          </button>
        </div>

        {healthError && (
          <p className="text-sm text-red-400">{healthError}</p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SERVICES.map((name) => {
            const svc = health?.[name];
            const isOk = svc?.status === 'ok';
            return (
              <div
                key={name}
                className="bg-surface border border-border rounded-xl px-4 py-4 flex flex-col gap-2"
              >
                <p className="text-xs text-text-muted font-mono truncate">{name}</p>
                {healthLoading ? (
                  <div className="h-5 w-16 bg-overlay rounded animate-pulse" />
                ) : svc ? (
                  <>
                    <Badge variant={isOk ? 'green' : 'red'}>{svc.status}</Badge>
                    {svc.latency !== undefined && (
                      <p className="text-xs text-text-muted font-mono">{svc.latency}ms</p>
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

      {/* Section 2: Broadcast Notification */}
      <section className="flex flex-col gap-4 max-w-lg">
        <h2 className="text-base font-semibold text-white">Broadcast Notification</h2>

        <Input
          label="Title"
          placeholder="Notification title..."
          value={broadcastTitle}
          onChange={(e) => setBroadcastTitle(e.target.value)}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted font-medium">Body</label>
          <textarea
            rows={4}
            placeholder="Notification body..."
            value={broadcastBody}
            onChange={(e) => setBroadcastBody(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
          />
        </div>

        {sendResult && (
          <p className={`text-sm ${sendResult.ok ? 'text-emerald-400' : 'text-red-400'}`}>
            {sendResult.message}
          </p>
        )}

        <div>
          <Button
            variant="primary"
            loading={sendLoading}
            onClick={() => void handleBroadcast()}
            disabled={!broadcastTitle.trim() || !broadcastBody.trim()}
          >
            Send Broadcast
          </Button>
        </div>
      </section>
    </div>
  );
}
