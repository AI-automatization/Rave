import { useEffect, useState, useCallback } from 'react';
import { UserCog, Plus } from 'lucide-react';
import { staffApi } from '../api/staff.api';
import { useAuthStore } from '../store/auth.store';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { PageHeader } from '../components/ui/PageHeader';
import type { StaffMember, StaffRole, PaginationMeta } from '../types';

const ROLE_BADGE: Record<StaffRole, 'red' | 'blue' | 'green' | 'yellow'> = {
  superadmin: 'red', admin: 'blue', operator: 'green', moderator: 'yellow',
};
const ROLE_LABEL: Record<StaffRole, string> = {
  superadmin: 'Superadmin', admin: 'Admin', operator: 'Operator', moderator: 'Moderator',
};

interface CreateForm {
  email: string; username: string; password: string; confirmPassword: string;
  role: 'admin' | 'operator' | 'moderator';
}
const INITIAL_FORM: CreateForm = { email: '', username: '', password: '', confirmPassword: '', role: 'admin' };

function SkeletonRow() {
  return (
    <tr>
      {[28, 22, 12, 16, 8].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 shimmer-bg rounded" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function StaffPage() {
  const currentUser  = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [staff, setStaff]     = useState<StaffMember[]>([]);
  const [meta, setMeta]       = useState<PaginationMeta>({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);

  const [createModal, setCreateModal] = useState(false);
  const [form, setForm]               = useState<CreateForm>(INITIAL_FORM);
  const [formError, setFormError]     = useState('');
  const [creating, setCreating]       = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<StaffMember | null>(null);
  const [deleting, setDeleting]           = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await staffApi.list({ page, limit: 50 });
      setStaff(res.data);
      setMeta(res.meta);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { void load(); }, [load]);

  const handleCreate = async () => {
    setFormError('');
    if (!form.email || !form.username || !form.password || !form.role) {
      setFormError('Fill in all fields'); return;
    }
    if (form.password !== form.confirmPassword) {
      setFormError('Passwords do not match'); return;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) {
      setFormError('Username: 3-20 chars, letters/digits/_'); return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/.test(form.password)) {
      setFormError('Password: min 8 chars, uppercase + lowercase + digit'); return;
    }
    setCreating(true);
    try {
      await staffApi.create({ email: form.email, username: form.username, password: form.password, role: form.role });
      setCreateModal(false);
      setForm(INITIAL_FORM);
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg ?? 'Error creating staff member');
    } finally { setCreating(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try { await staffApi.delete(deleteConfirm.authId); setDeleteConfirm(null); await load(); }
    finally { setDeleting(false); }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64 bg-card rounded-2xl shadow-card border border-white/[0.06]">
        <p className="text-text-muted text-sm">Superadmin access only</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title="Staff"
        meta={`${meta.total} members`}
        actions={
          <Button variant="primary" onClick={() => { setCreateModal(true); setForm(INITIAL_FORM); setFormError(''); }}>
            <Plus size={14} className="mr-1.5" />
            Add member
          </Button>
        }
      />

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {['Member', 'Email', 'Role', 'Last login', ''].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-[10px] font-semibold text-text-dim uppercase tracking-[0.08em] last:text-right">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              : staff.length === 0
              ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                        <UserCog size={20} className="text-text-dim" />
                      </div>
                      <p className="text-text-muted text-sm font-medium">No staff members</p>
                    </div>
                  </td>
                </tr>
              )
              : staff.map((member) => {
                const hue = (member.email.charCodeAt(0) * 137) % 360;
                return (
                  <tr key={member._id} className="tr-hover">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: `hsl(${hue},40%,18%)`, color: `hsl(${hue},70%,65%)` }}
                        >
                          {member.username.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[13px] font-medium text-white">{member.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-text-muted text-[12px]">{member.email}</td>
                    <td className="px-5 py-4">
                      <Badge variant={ROLE_BADGE[member.role]}>{ROLE_LABEL[member.role]}</Badge>
                    </td>
                    <td className="px-5 py-4 text-text-muted text-[12px]">
                      {member.lastLoginAt
                        ? new Date(member.lastLoginAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {member.role !== 'superadmin' && (
                        <Button size="xs" variant="danger" onClick={() => setDeleteConfirm(member)}>
                          Remove
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {meta.totalPages > 1 && (
          <div className="px-5 border-t border-white/[0.04]">
            <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onChange={setPage} />
          </div>
        )}
      </div>

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="New staff member">
        <div className="flex flex-col gap-4">
          <div className="bg-amber-500/[0.08] border border-amber-500/20 rounded-xl px-3 py-2.5 text-[12px] text-amber-400">
            If this email is already registered as a user — the account will be converted to a staff role.
          </div>
          <Select label="Role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as CreateForm['role'] }))}>
            <option value="admin">Admin</option>
            <option value="operator">Operator</option>
            <option value="moderator">Moderator</option>
          </Select>
          <Input label="Email" type="email" placeholder="staff@rave.com" value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Input label="Username" placeholder="username (3–20 chars)" value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
          <Input label="Password" type="password" placeholder="Min 8 chars" value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          <Input label="Confirm password" type="password" placeholder="Repeat password" value={form.confirmPassword}
            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))} />
          {formError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-[12px] text-red-400">
              {formError}
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button variant="primary" loading={creating} onClick={() => void handleCreate()}>Create</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Remove staff member">
        {deleteConfirm && (
          <div className="flex flex-col gap-4">
            <p className="text-[13px] text-text-muted">
              Remove <span className="text-white font-medium">{deleteConfirm.username}</span>{' '}
              (<span className="text-text-dim">{deleteConfirm.email}</span>)?
              This action is irreversible.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" loading={deleting} onClick={() => void handleDelete()}>Remove</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
