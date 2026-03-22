import { useEffect, useState, useCallback } from 'react';
import { staffApi } from '../api/staff.api';
import { useAuthStore } from '../store/auth.store';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import type { StaffMember, StaffRole, PaginationMeta } from '../types';

type BadgeVariant = 'green' | 'blue' | 'yellow' | 'red' | 'gray';

const ROLE_BADGE: Record<StaffRole, BadgeVariant> = {
  superadmin: 'red',
  admin: 'blue',
  operator: 'green',
  moderator: 'yellow',
};

const ROLE_LABELS: Record<StaffRole, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  operator: 'Operator',
  moderator: 'Moderator',
};

interface CreateForm {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'operator' | 'moderator';
}

const INITIAL_FORM: CreateForm = {
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  role: 'admin',
};

export function StaffPage() {
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState<CreateForm>(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<StaffMember | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await staffApi.list({ page, limit: 50 });
      setStaff(res.data);
      setMeta(res.meta);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { void load(); }, [load]);

  const handleCreate = async () => {
    setFormError('');
    if (!form.email || !form.username || !form.password || !form.role) {
      setFormError('Barcha maydonlarni to\'ldiring');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setFormError('Parollar mos kelmaydi');
      return;
    }
    if (form.password.length < 8) {
      setFormError('Parol kamida 8 ta belgi bo\'lishi kerak');
      return;
    }
    setCreating(true);
    try {
      await staffApi.create({ email: form.email, username: form.username, password: form.password, role: form.role });
      setCreateModal(false);
      setForm(INITIAL_FORM);
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg ?? 'Xatolik yuz berdi');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await staffApi.delete(deleteConfirm.authId);
      setDeleteConfirm(null);
      await load();
    } finally {
      setDeleting(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-muted">Bu sahifaga faqat Super Admin kira oladi.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Xodimlar boshqaruvi</h1>
          <p className="text-text-muted text-sm mt-0.5">{meta.total} ta xodim</p>
        </div>
        <Button variant="primary" onClick={() => { setCreateModal(true); setForm(INITIAL_FORM); setFormError(''); }}>
          + Yangi xodim
        </Button>
      </div>

      {/* Staff table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-text-muted font-medium">Xodim</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Email</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Lavozim</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Oxirgi kirish</th>
                <th className="text-right px-4 py-3 text-text-muted font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">Yuklanmoqda...</td></tr>
              ) : staff.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">Xodimlar topilmadi</td></tr>
              ) : staff.map((member) => (
                <tr key={member._id} className="border-b border-border/50 hover:bg-overlay/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                        {member.username.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{member.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">{member.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={ROLE_BADGE[member.role]}>{ROLE_LABELS[member.role]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {member.lastLoginAt
                      ? new Date(member.lastLoginAt).toLocaleString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {member.role !== 'superadmin' && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setDeleteConfirm(member)}
                      >
                        O'chirish
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4">
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onChange={setPage} />
        </div>
      </div>

      {/* Create staff modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Yangi xodim yaratish">
        <div className="flex flex-col gap-4">
          <p className="text-xs text-text-muted bg-overlay rounded-lg px-3 py-2">
            Agar bu emailda oddiy foydalanuvchi bo'lsa — u o'chirilib, o'rniga xodim akaunt yaratiladi.
          </p>

          <Select
            label="Lavozim"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as CreateForm['role'] }))}
          >
            <option value="admin">Admin</option>
            <option value="operator">Operator</option>
            <option value="moderator">Moderator</option>
          </Select>

          <Input
            label="Email"
            type="email"
            placeholder="admin@example.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />

          <Input
            label="Username"
            placeholder="username (3-20 belgi, harf/raqam/_)"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          />

          <Input
            label="Parol"
            type="password"
            placeholder="Kamida 8 ta belgi"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />

          <Input
            label="Parolni tasdiqlash"
            type="password"
            placeholder="Parolni qayta kiriting"
            value={form.confirmPassword}
            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
          />

          {formError && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{formError}</p>
          )}

          <div className="flex gap-2 justify-end">
            <Button onClick={() => setCreateModal(false)}>Bekor</Button>
            <Button variant="primary" loading={creating} onClick={() => void handleCreate()}>
              Yaratish
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Xodimni o'chirish"
      >
        {deleteConfirm && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-muted">
              <span className="text-white font-medium">{deleteConfirm.username}</span> (
              <span className="text-text-muted">{deleteConfirm.email}</span>) xodimni o'chirmoqchimisiz?
              Bu amal qaytarib bo'lmaydi.
            </p>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setDeleteConfirm(null)}>Bekor</Button>
              <Button variant="danger" loading={deleting} onClick={() => void handleDelete()}>
                O'chirish
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
