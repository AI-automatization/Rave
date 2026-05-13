import { useState } from 'react';
import { Bell, Send, Users, User, CheckCircle, XCircle, Megaphone } from 'lucide-react';
import { notificationsApi, type NotifType } from '../api/notifications.api';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { FilterTabs } from '../components/ui/FilterTabs';

const MODE_TABS = [
  { value: 'broadcast', label: 'Broadcast' },
  { value: 'direct',    label: 'Direct' },
];

const BROADCAST_TYPES: { value: NotifType; label: string; description: string }[] = [
  { value: 'announcement', label: 'Announcement',  description: 'General platform news' },
  { value: 'maintenance',  label: 'Maintenance',   description: 'Planned downtime or works' },
  { value: 'promo',        label: 'Promo',          description: 'New content, promotions' },
  { value: 'update',       label: 'Update',         description: 'App version or feature update' },
];

const DIRECT_TYPES: { value: NotifType; label: string; description: string }[] = [
  { value: 'system',   label: 'System',   description: 'Account or system message' },
  { value: 'warning',  label: 'Warning',  description: 'Policy violation notice' },
  { value: 'announcement', label: 'Announcement', description: 'Platform news' },
];

interface SendResult { ok: boolean; message: string; }

function NotifPreview({ title, body, type }: { title: string; body: string; type: string }) {
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const typeColor: Record<string, string> = {
    announcement: 'text-accent', maintenance: 'text-amber-400',
    promo: 'text-emerald-400',   update: 'text-blue-400',
    system: 'text-text-dim',     warning: 'text-red-400',
  };
  return (
    <div className="relative mx-auto w-[260px]">
      {/* Phone shell */}
      <div className="bg-[#0a0a14] border border-white/[0.12] rounded-[28px] p-3 shadow-modal">
        {/* Status bar */}
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[10px] text-text-dim font-mono">{time}</span>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-text-dim" />
            <div className="w-1 h-1 rounded-full bg-text-dim" />
            <div className="w-1 h-1 rounded-full bg-text-dim" />
          </div>
        </div>

        {/* Notification card */}
        <div className="bg-surface/80 backdrop-blur rounded-2xl p-3.5 border border-white/[0.07]">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent-dim flex items-center justify-center shrink-0">
              <Bell size={14} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-[10px] font-semibold text-white">Rave</span>
                <span className={`text-[9px] font-medium uppercase tracking-[0.06em] ${typeColor[type] ?? 'text-text-dim'}`}>
                  {type}
                </span>
              </div>
              <p className="text-[12px] font-semibold text-white leading-tight truncate">
                {title || 'Notification title'}
              </p>
              <p className="text-[11px] text-text-muted leading-snug mt-0.5 line-clamp-2">
                {body || 'Notification body text will appear here...'}
              </p>
            </div>
          </div>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center mt-3">
          <div className="w-16 h-1 bg-white/20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function NotificationsPage() {
  const [mode, setMode] = useState<'broadcast' | 'direct'>('broadcast');

  const [type, setType]   = useState<NotifType>('announcement');
  const [title, setTitle] = useState('');
  const [body, setBody]   = useState('');
  const [userId, setUserId] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<SendResult | null>(null);

  const resetForm = () => { setTitle(''); setBody(''); setUserId(''); };

  const handleModeChange = (v: string) => {
    setMode(v as 'broadcast' | 'direct');
    setType(v === 'broadcast' ? 'announcement' : 'system');
    setResult(null);
    resetForm();
  };

  const canSend = title.trim().length >= 3 && body.trim().length >= 5 &&
    (mode === 'broadcast' || userId.trim().length >= 10);

  const handleSend = async () => {
    if (!canSend) return;
    setLoading(true);
    setResult(null);
    try {
      if (mode === 'broadcast') {
        await notificationsApi.broadcast(title.trim(), body.trim(), type);
        setResult({ ok: true, message: 'Broadcast sent to all users' });
      } else {
        await notificationsApi.sendToUser(userId.trim(), title.trim(), body.trim(), type);
        setResult({ ok: true, message: 'Notification delivered' });
      }
      resetForm();
    } catch {
      setResult({ ok: false, message: 'Failed to send — check logs' });
    } finally {
      setLoading(false);
    }
  };

  const types = mode === 'broadcast' ? BROADCAST_TYPES : DIRECT_TYPES;

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title="Notifications"
        description="Send push notifications to users"
        badge={
          <span className="inline-flex items-center gap-1 text-[11px] text-accent bg-accent/10 border border-accent/20 rounded-full px-2 py-0.5 font-medium">
            <Bell size={10} />
            FCM
          </span>
        }
      />

      <FilterTabs
        options={MODE_TABS}
        value={mode}
        onChange={handleModeChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        {/* Form */}
        <div className="bg-card rounded-2xl shadow-card border border-white/[0.055] p-5 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

          <div className="flex flex-col gap-4">
            {/* Mode hint */}
            <div className={`flex items-center gap-3 rounded-xl px-3.5 py-3 border ${
              mode === 'broadcast'
                ? 'bg-accent/[0.06] border-accent/20'
                : 'bg-blue-500/[0.06] border-blue-500/20'
            }`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                mode === 'broadcast' ? 'bg-accent/15' : 'bg-blue-500/15'
              }`}>
                {mode === 'broadcast'
                  ? <Megaphone size={15} className="text-accent" />
                  : <User size={15} className="text-blue-400" />}
              </div>
              <div>
                {mode === 'broadcast' ? (
                  <>
                    <p className="text-[13px] font-medium text-white">Broadcast to all users</p>
                    <p className="text-[11px] text-text-dim mt-0.5">Push notification sent via FCM to every registered device</p>
                  </>
                ) : (
                  <>
                    <p className="text-[13px] font-medium text-white">Direct message</p>
                    <p className="text-[11px] text-text-dim mt-0.5">In-app + push notification to a specific user</p>
                  </>
                )}
              </div>
            </div>

            {/* User ID (direct only) */}
            {mode === 'direct' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-text-dim uppercase tracking-[0.06em]">User ID</label>
                <div className="relative">
                  <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
                  <input
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="68a1b2c3d4e5f6..."
                    className="input-base pl-9 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-text-dim uppercase tracking-[0.06em]">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {types.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-150 ${
                      type === t.value
                        ? 'bg-accent/[0.08] border-accent/30 text-white'
                        : 'bg-surface border-border hover:border-border-md text-text-muted hover:text-white'
                    }`}
                  >
                    <span className="text-[12px] font-medium">{t.label}</span>
                    <span className="text-[10px] text-text-dim">{t.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-text-dim uppercase tracking-[0.06em]">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title..."
                maxLength={80}
                className="input-base"
              />
              <div className="flex justify-between">
                <span className="text-[10px] text-text-dim">Min 3 chars</span>
                <span className="text-[10px] text-text-dim tabular-nums">{title.length}/80</span>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-text-dim uppercase tracking-[0.06em]">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Notification text..."
                rows={4}
                maxLength={300}
                className="bg-surface border border-border rounded-xl px-3 py-2.5 text-[13px] text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/40 resize-none transition-all"
              />
              <div className="flex justify-between">
                <span className="text-[10px] text-text-dim">Min 5 chars</span>
                <span className="text-[10px] text-text-dim tabular-nums">{body.length}/300</span>
              </div>
            </div>

            {/* Result */}
            {result && (
              <div className={`flex items-center gap-2 text-[13px] rounded-xl px-3.5 py-2.5 border ${
                result.ok
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {result.ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
                {result.message}
              </div>
            )}

            {/* Send button */}
            <div className="flex justify-end pt-1 border-t border-white/[0.05]">
              <Button
                variant="primary"
                loading={loading}
                disabled={!canSend}
                onClick={() => void handleSend()}
              >
                <Send size={14} className="mr-1.5" />
                {mode === 'broadcast' ? 'Send to all' : 'Send to user'}
              </Button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col gap-3">
          <p className="text-[11px] text-text-dim uppercase tracking-[0.08em] px-1">Preview</p>
          <div className="bg-card rounded-2xl shadow-card border border-white/[0.055] p-5 flex items-center justify-center min-h-[320px]">
            <NotifPreview title={title} body={body} type={type} />
          </div>
          <div className="bg-surface/50 rounded-xl px-3.5 py-3 border border-white/[0.05] text-[11px] text-text-dim leading-relaxed">
            {mode === 'broadcast' ? (
              <>Sends a <span className="text-white">push notification</span> to all users with registered FCM tokens. In-app notification is <span className="text-amber-400">not created</span> for broadcast.</>
            ) : (
              <>Creates an <span className="text-white">in-app notification</span> + sends a <span className="text-white">push notification</span> to the user's device if FCM token is registered.</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
