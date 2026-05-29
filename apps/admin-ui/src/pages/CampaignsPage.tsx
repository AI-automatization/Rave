import { useState, useEffect, useCallback } from 'react';
import { Mail, Plus, Send, Eye, EyeOff, Trash2, Edit2, Users, CheckCircle, Clock, FileText } from 'lucide-react';
import { campaignsApi, type Campaign } from '../api/campaigns.api';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { Modal } from '../components/ui/Modal';

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Campaign['status'] }) {
  const map = {
    draft:  { label: 'Draft',  cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
    active: { label: 'Active', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    sent:   { label: 'Sent',   cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full border ${cls}`}>
      {label}
    </span>
  );
}

// ── Campaign form ─────────────────────────────────────────────────────────────
interface FormState { name: string; description: string; emailSubject: string; emailBody: string; }
const EMPTY: FormState = { name: '', description: '', emailSubject: '', emailBody: '' };

function CampaignForm({
  initial, onSave, onCancel, loading,
}: { initial: FormState; onSave: (f: FormState) => void; onCancel: () => void; loading: boolean }) {
  const [form, setForm] = useState<FormState>(initial);
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-xs text-text-dim mb-1.5">Campaign name *</label>
        <input value={form.name} onChange={set('name')} placeholder="Android Launch"
          className="w-full bg-surface border border-border-md rounded-xl px-3 py-2 text-sm text-white placeholder:text-text-dim focus:outline-none focus:border-accent/50" />
      </div>
      <div>
        <label className="block text-xs text-text-dim mb-1.5">Description (shown on landing page)</label>
        <input value={form.description} onChange={set('description')} placeholder="Be the first to know when we launch"
          className="w-full bg-surface border border-border-md rounded-xl px-3 py-2 text-sm text-white placeholder:text-text-dim focus:outline-none focus:border-accent/50" />
      </div>
      <div>
        <label className="block text-xs text-text-dim mb-1.5">Email subject</label>
        <input value={form.emailSubject} onChange={set('emailSubject')} placeholder="WeWatch Android is here! 🎉"
          className="w-full bg-surface border border-border-md rounded-xl px-3 py-2 text-sm text-white placeholder:text-text-dim focus:outline-none focus:border-accent/50" />
      </div>
      <div>
        <label className="block text-xs text-text-dim mb-1.5">Email body (HTML supported)</label>
        <textarea value={form.emailBody} onChange={set('emailBody')} rows={8}
          placeholder="<h1>It's here!</h1><p>Download on Google Play →</p>"
          className="w-full bg-surface border border-border-md rounded-xl px-3 py-2 text-sm text-white placeholder:text-text-dim focus:outline-none focus:border-accent/50 font-mono resize-none" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" loading={loading} onClick={() => onSave(form)} disabled={!form.name.trim()}>
          Save Campaign
        </Button>
      </div>
    </div>
  );
}

// ── Send confirmation modal ───────────────────────────────────────────────────
function SendConfirmModal({ campaign, onConfirm, onCancel, loading }: {
  campaign: Campaign; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <Send size={16} className="text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-white mb-1">Send to all subscribers?</p>
          <p className="text-xs text-text-muted">
            This will email <strong className="text-white">{campaign.subscriberCount}</strong> subscribers of
            &ldquo;<strong className="text-white">{campaign.name}</strong>&rdquo;.
            This action cannot be undone.
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" loading={loading} onClick={onConfirm}>
          <Send size={13} /> Send Now
        </Button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [sending, setSending]     = useState(false);

  const [createOpen, setCreateOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState<Campaign | null>(null);
  const [sendTarget, setSendTarget]     = useState<Campaign | null>(null);
  const [toast, setToast]               = useState<{ ok: boolean; msg: string } | null>(null);

  const showToast = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setCampaigns(await campaignsApi.list());
    } catch { showToast(false, 'Failed to load campaigns'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleCreate = async (form: FormState) => {
    try {
      setSaving(true);
      await campaignsApi.create(form);
      setCreateOpen(false);
      showToast(true, 'Campaign created');
      void load();
    } catch { showToast(false, 'Failed to create'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (form: FormState) => {
    if (!editTarget) return;
    try {
      setSaving(true);
      await campaignsApi.update(editTarget.slug, form);
      setEditTarget(null);
      showToast(true, 'Campaign updated');
      void load();
    } catch { showToast(false, 'Failed to update'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (c: Campaign) => {
    try {
      if (c.status === 'active') await campaignsApi.deactivate(c.slug);
      else                       await campaignsApi.activate(c.slug);
      showToast(true, c.status === 'active' ? 'Deactivated (hidden from landing)' : 'Activated (visible on landing)');
      void load();
    } catch { showToast(false, 'Failed'); }
  };

  const handleDelete = async (c: Campaign) => {
    if (!confirm(`Delete "${c.name}" and all its ${c.subscriberCount} subscribers?`)) return;
    try {
      await campaignsApi.delete(c.slug);
      showToast(true, 'Campaign deleted');
      void load();
    } catch { showToast(false, 'Failed to delete'); }
  };

  const handleSend = async () => {
    if (!sendTarget) return;
    try {
      setSending(true);
      const result = await campaignsApi.send(sendTarget.slug);
      setSendTarget(null);
      showToast(true, `Sending to ${result.total} subscribers...`);
      void load();
    } catch { showToast(false, 'Failed to send'); }
    finally { setSending(false); }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Campaigns"
        subtitle="Create email newsletters — subscribers sign up from the landing page"
        icon={<Mail size={18} />}
        action={<Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}><Plus size={13} /> New Campaign</Button>}
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border ${
          toast.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'
        }`}>
          {toast.ok ? <CheckCircle size={14} /> : <Mail size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Campaign list */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-text-dim text-sm">Loading...</div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Mail size={20} className="text-accent" />
          </div>
          <p className="text-white font-semibold">No campaigns yet</p>
          <p className="text-text-dim text-sm max-w-xs">Create a campaign — it will appear on the landing page as a subscribe section.</p>
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}><Plus size={13} /> Create first campaign</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {campaigns.map(c => (
            <div key={c._id} className="bg-surface border border-border-sm rounded-2xl p-5 flex items-start gap-4 hover:border-border-md transition-colors">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                <FileText size={16} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-semibold text-white truncate">{c.name}</span>
                  <StatusBadge status={c.status} />
                </div>
                {c.description && <p className="text-xs text-text-muted mb-2 leading-relaxed">{c.description}</p>}
                <div className="flex items-center gap-4 text-xs text-text-dim flex-wrap">
                  <span className="flex items-center gap-1"><Users size={11} /> {c.subscriberCount} subscribers</span>
                  {c.emailSubject && <span className="flex items-center gap-1"><Mail size={11} /> {c.emailSubject}</span>}
                  {c.sentAt && <span className="flex items-center gap-1"><CheckCircle size={11} className="text-blue-400" /> Sent {new Date(c.sentAt).toLocaleDateString()}</span>}
                  {!c.sentAt && <span className="flex items-center gap-1"><Clock size={11} /> Created {new Date(c.createdAt).toLocaleDateString()}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {c.status !== 'sent' && (
                  <Button size="xs" variant="ghost" title={c.status === 'active' ? 'Hide from landing' : 'Show on landing'}
                    onClick={() => handleToggle(c)}>
                    {c.status === 'active' ? <EyeOff size={13} /> : <Eye size={13} />}
                  </Button>
                )}
                {c.status !== 'sent' && (
                  <Button size="xs" variant="ghost" onClick={() => setEditTarget(c)}><Edit2 size={13} /></Button>
                )}
                {c.status === 'active' && c.subscriberCount > 0 && (
                  <Button size="xs" variant="primary" onClick={() => setSendTarget(c)}>
                    <Send size={11} /> Send
                  </Button>
                )}
                <Button size="xs" variant="danger" onClick={() => handleDelete(c)}><Trash2 size={13} /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Campaign">
        <CampaignForm initial={EMPTY} onSave={handleCreate} onCancel={() => setCreateOpen(false)} loading={saving} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Campaign">
        {editTarget && (
          <CampaignForm
            initial={{ name: editTarget.name, description: editTarget.description, emailSubject: editTarget.emailSubject, emailBody: editTarget.emailBody }}
            onSave={handleUpdate} onCancel={() => setEditTarget(null)} loading={saving}
          />
        )}
      </Modal>

      {/* Send confirmation */}
      <Modal open={!!sendTarget} onClose={() => setSendTarget(null)} title="Confirm Send">
        {sendTarget && (
          <SendConfirmModal campaign={sendTarget} onConfirm={handleSend} onCancel={() => setSendTarget(null)} loading={sending} />
        )}
      </Modal>
    </div>
  );
}
