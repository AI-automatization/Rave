import { useEffect, useState, useCallback } from 'react';
import { UserCog, Plus } from 'lucide-react';
import { staffApi } from '../api/staff.api';
import { useAuthStore } from '../store/auth.store';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
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
      setFormError('Заполните все поля'); return;
    }
    if (form.password !== form.confirmPassword) {
      setFormError('Пароли не совпадают'); return;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) {
      setFormError('Username: 3-20 символов, буквы/цифры/_'); return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/.test(form.password)) {
      setFormError('Пароль: мин. 8 символов, заглавная + строчная + цифра'); return;
    }
    setCreating(true);
    try {
      await staffApi.create({ email: form.email, username: form.username, password: form.password, role: form.role });
      setCreateModal(false);
      setForm(INITIAL_FORM);
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg ?? 'Ошибка при создании');
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
        <p className="text-text-muted text-sm">Доступ только для Superadmin</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Персонал</h1>
          <p className="text-text-muted text-sm mt-0.5">{meta.total} сотрудников</p>
        </div>
        <Button variant="primary" onClick={() => { setCreateModal(true); setForm(INITIAL_FORM); setFormError(''); }}>
          <Plus size={15} /> Добавить
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {['Сотрудник', 'Email', 'Роль', 'Последний вход', ''].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-text-dim uppercase tracking-wider last:text-right">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-white/[0.05] rounded animate-pulse" style={{ width: `${55 + (i * j * 9) % 35}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : staff.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-text-muted">
                  <UserCog size={32} className="text-text-dim mx-auto mb-3" />
                  Сотрудников нет
                </td>
              </tr>
            ) : staff.map((member) => {
              const hue = (member.email.charCodeAt(0) * 137) % 360;
              return (
                <tr key={member._id} className="tr-hover">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: `hsl(${hue},40%,20%)`, color: `hsl(${hue},70%,70%)` }}
                      >
                        {member.username.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-white">{member.username}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-text-muted text-xs">{member.email}</td>
                  <td className="px-5 py-4">
                    <Badge variant={ROLE_BADGE[member.role]}>{ROLE_LABEL[member.role]}</Badge>
                  </td>
                  <td className="px-5 py-4 text-text-muted text-xs">
                    {member.lastLoginAt
                      ? new Date(member.lastLoginAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {member.role !== 'superadmin' && (
                      <Button size="sm" variant="danger" onClick={() => setDeleteConfirm(member)}>
                        Удалить
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

      {/* Create modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Новый сотрудник">
        <div className="flex flex-col gap-4">
          <div className="bg-amber-500/[0.08] border border-amber-500/20 rounded-xl px-3 py-2.5 text-xs text-amber-400">
            Если этот email уже зарегистрирован как пользователь — аккаунт будет переведён в статус сотрудника.
          </div>

          <Select label="Роль" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as CreateForm['role'] }))}>
            <option value="admin">Admin</option>
            <option value="operator">Operator</option>
            <option value="moderator">Moderator</option>
          </Select>
          <Input label="Email" type="email" placeholder="staff@rave.com" value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Input label="Username" placeholder="username (3–20 знаков)" value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
          <Input label="Пароль" type="password" placeholder="Мин. 8 знаков" value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          <Input label="Подтвердить пароль" type="password" placeholder="Повторите пароль" value={form.confirmPassword}
            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))} />

          {formError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-xs text-red-400">
              {formError}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setCreateModal(false)}>Отмена</Button>
            <Button variant="primary" loading={creating} onClick={() => void handleCreate()}>Создать</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Удалить сотрудника">
        {deleteConfirm && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-muted">
              Удалить <span className="text-white font-medium">{deleteConfirm.username}</span>{' '}
              (<span className="text-text-dim">{deleteConfirm.email}</span>)?
              Действие необратимо.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Отмена</Button>
              <Button variant="danger" loading={deleting} onClick={() => void handleDelete()}>Удалить</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
