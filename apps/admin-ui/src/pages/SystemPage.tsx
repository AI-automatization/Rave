import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, CheckCircle, XCircle, Loader2, Bell, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { systemApi } from '../api/system.api';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import type { SystemHealth } from '../types';

const SERVICES = ['auth', 'user', 'content', 'watch-party', 'battle', 'notification'];

export function SystemPage() {
  const navigate = useNavigate();
  const [health, setHealth]               = useState<SystemHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError]     = useState<string | null>(null);

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const data = await systemApi.getHealth();
      setHealth(data);
    } catch {
      setHealthError('Failed to fetch service status');
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHealth();
    const t = setInterval(() => void loadHealth(), 30_000);
    return () => clearInterval(t);
  }, [loadHealth]);

  const overallOk = !healthError && health && SERVICES.every((s) => health[s]?.status === 'ok');

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title="System"
        description="Service health · updated every 30s"
        actions={
          <div className="flex items-center gap-2">
            {overallOk !== null && !healthLoading && (
              <div className={`flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-xl border ${
                overallOk
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {overallOk ? <CheckCircle size={13} /> : <XCircle size={13} />}
                {overallOk ? 'All services up' : 'Service issues'}
              </div>
            )}
            <button
              onClick={() => void loadHealth()}
              disabled={healthLoading}
              className="flex items-center gap-1.5 text-[12px] text-text-dim hover:text-white px-3 py-1.5 rounded-xl border border-white/[0.07] hover:border-white/[0.12] transition-colors"
            >
              <RefreshCw size={12} className={healthLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        }
      />

      {healthError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-[13px] text-red-400">
          {healthError}
        </div>
      )}

      {/* Service grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {SERVICES.map((name) => {
          const svc = health?.[name];
          const isOk = svc?.status === 'ok';
          return (
            <div key={name} className="bg-card rounded-2xl border border-white/[0.06] p-4 shadow-card relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-text-muted font-mono truncate">{name}</p>
                {healthLoading
                  ? <Loader2 size={12} className="text-text-dim animate-spin shrink-0" />
                  : svc
                    ? <div className={`w-2 h-2 rounded-full shrink-0 ${isOk ? 'bg-emerald-400' : 'bg-red-400'} ${isOk ? 'shadow-[0_0_6px_rgba(52,211,153,0.6)]' : ''}`} />
                    : null}
              </div>
              {healthLoading ? (
                <div className="h-5 w-16 shimmer-bg rounded" />
              ) : svc ? (
                <>
                  <Badge variant={isOk ? 'green' : 'red'}>{svc.status}</Badge>
                  {svc.latency !== undefined && (
                    <p className="text-[11px] text-text-dim font-mono mt-1.5">{svc.latency}ms</p>
                  )}
                </>
              ) : (
                <Badge variant="gray">unknown</Badge>
              )}
            </div>
          );
        })}
      </div>

      {/* Notifications shortcut */}
      <button
        onClick={() => navigate('/notifications')}
        className="group bg-card rounded-2xl border border-white/[0.055] shadow-card p-5 flex items-center gap-4 hover:border-accent/30 transition-all duration-200 text-left relative overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
        <div className="w-10 h-10 rounded-xl bg-accent/[0.1] flex items-center justify-center shrink-0 group-hover:bg-accent/[0.15] transition-colors">
          <Bell size={18} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white">Notifications</p>
          <p className="text-[12px] text-text-dim mt-0.5">Broadcast to all users or send direct push to a specific user</p>
        </div>
        <ArrowRight size={16} className="text-text-dim group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
      </button>
    </div>
  );
}
