import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, Ban, CheckCircle, MoreHorizontal, UserX, Copy, Check, ExternalLink } from 'lucide-react';
import { usersApi } from '../api/users.api';
import { useAuthStore } from '../store/auth.store';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import type { AdminUser, PaginationMeta } from '../types';

const ROLE_BADGE: Record<AdminUser['role'], JSX.Element> = {
  superadmin: <Badge variant="red" dot>Superadmin</Badge>,
  admin:      <Badge variant="purple" dot>Admin</Badge>,
  operator:   <Badge variant="blue" dot>Operator</Badge>,
  user:       <Badge variant="gray">User</Badge>,
};

function Avatar({ user }: { user: AdminUser }) {
  const initials = (user.username || user.email).slice(0, 2).toUpperCase();
  const hue = (user.email.charCodeAt(0) * 137) % 360;
  return user.avatar ? (
    <img src={user.avatar} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
  ) : (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={{ background: `hsl(${hue},40%,20%)`, color: `hsl(${hue},70%,70%)` }}
    >
      {initials}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>();
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    void navigator.clipboard.writeText(text);
    setCopied(true);
    clearTimeout(t.current);
    t.current = setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="p-1 rounded text-text-dim hover:text-white transition-colors">
      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
    </button>
  );
}

export function UsersPage() {
  const navigate   = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [users, setUsers]   = useState<AdminUser[]>([]);
  const [meta, setMeta]     = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter]     = useState('');
  const [blockedFilter, setBlockedFilter] = useState('');
  const [page, setPage]     = useState(1);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [roleModal,  setRoleModal]  = useState<{ user: AdminUser } | null>(null);
  const [newRole, setNewRole]       = useState('');
  const [blockModal, setBlockModal] = useState<{ user: AdminUser } | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Parameters<typeof usersApi.list>[0] = { page, limit: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (blockedFilter !== '') params.isBlocked = blockedFilter === 'true';
      const res = await usersApi.list(params);
      setUsers(res.data);
      setMeta(res.meta);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, search, roleFilter, blockedFilter]);

  useEffect(() => { void load(); }, [load]);

  // Close dropdown on outside click
  useEffect(() => {
    const h = () => setOpenMenu(null);
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  const handleUnblock = async (user: AdminUser) => {
    setActionLoading(user._id);
    try { await usersApi.unblock(user.authId); await load(); }
    finally { setActionLoading(null); }
  };

  const handleBlockConfirm = async () => {
    if (!blockModal || blockReason.trim().length < 3) return;
    setActionLoading(blockModal.user._id);
    try { await usersApi.block(blockModal.user.authId, blockReason); setBlockModal(null); setBlockReason(''); await load(); }
    finally { setActionLoading(null); }
  };

  const handleRoleChange = async () => {
    if (!roleModal || !newRole) return;
    setActionLoading(roleModal.user._id);
    try { await usersApi.changeRole(roleModal.user.authId, newRole); setRoleModal(null); await load(); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Удалить "${user.username}"? Действие необратимо.`)) return;
    setActionLoading(user._id);
    try { await usersApi.delete(user.authId); await load(); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Пользователи</h1>
          <p className="text-text-muted text-sm mt-0.5">{meta.total.toLocaleString('ru')} всего</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Поиск по email, имени..."
            className="w-full bg-surface border border-border hover:border-border-md rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="bg-surface border border-border hover:border-border-md rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
        >
          <option value="">Все роли</option>
          <option value="user">User</option>
          <option value="operator">Operator</option>
          <option value="admin">Admin</option>
          <option value="superadmin">Superadmin</option>
        </select>
        <select
          value={blockedFilter}
          onChange={(e) => { setBlockedFilter(e.target.value); setPage(1); }}
          className="bg-surface border border-border hover:border-border-md rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
        >
          <option value="">Все статусы</option>
          <option value="false">Активные</option>
          <option value="true">Заблокированные</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {['Пользователь', 'Роль', 'Статус', 'Регистрация', 'Последний вход', ''].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-text-dim uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-white/[0.05] rounded animate-pulse" style={{ width: `${60 + (i * j * 7) % 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-text-muted">Пользователи не найдены</td>
              </tr>
            ) : users.map((user) => (
              <tr
                key={user._id}
                className="tr-hover"
                onClick={() => navigate(`/users/${user._id}`)}
              >
                {/* User */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar user={user} />
                    <div>
                      <p className="font-medium text-white leading-tight">{user.username || '—'}</p>
                      <p className="text-xs text-text-muted">{user.email}</p>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <span className="font-mono text-[10px] text-text-dim">{user._id.slice(-8)}</span>
                        <CopyButton text={user._id} />
                      </div>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td className="px-5 py-4">{ROLE_BADGE[user.role]}</td>

                {/* Status */}
                <td className="px-5 py-4">
                  {user.isBlocked
                    ? <Badge variant="red" dot>Заблокирован</Badge>
                    : <Badge variant="green" dot>Активен</Badge>}
                </td>

                {/* Created */}
                <td className="px-5 py-4 text-text-muted text-xs">
                  {new Date(user.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>

                {/* Last login */}
                <td className="px-5 py-4 text-text-muted text-xs">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </td>

                {/* Actions */}
                <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === user._id ? null : user._id); }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:text-white hover:bg-white/[0.07] transition-colors"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {openMenu === user._id && (
                      <div className="absolute right-0 top-9 z-20 w-48 bg-overlay border border-white/[0.08] rounded-xl shadow-card py-1 animate-slide-up" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => { navigate(`/users/${user._id}`); setOpenMenu(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-muted hover:text-white hover:bg-white/[0.05] transition-colors">
                          <ExternalLink size={14} /> Профиль
                        </button>
                        {isSuperAdmin && (
                          <button onClick={() => { setRoleModal({ user }); setNewRole(user.role); setOpenMenu(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-muted hover:text-white hover:bg-white/[0.05] transition-colors">
                            <Shield size={14} /> Сменить роль
                          </button>
                        )}
                        {user.isBlocked ? (
                          <button onClick={() => { void handleUnblock(user); setOpenMenu(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-emerald-400 hover:bg-white/[0.05] transition-colors">
                            <CheckCircle size={14} /> Разблокировать
                          </button>
                        ) : (
                          <button onClick={() => { setBlockModal({ user }); setBlockReason(''); setOpenMenu(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-amber-400 hover:bg-white/[0.05] transition-colors">
                            <Ban size={14} /> Заблокировать
                          </button>
                        )}
                        {isSuperAdmin && (
                          <button onClick={() => { void handleDelete(user); setOpenMenu(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-white/[0.05] transition-colors border-t border-white/[0.05] mt-1">
                            <UserX size={14} /> Удалить
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {meta.totalPages > 1 && (
          <div className="px-5 border-t border-white/[0.04]">
            <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onChange={(p) => { setPage(p); }} />
          </div>
        )}
      </div>

      {/* Block modal */}
      <Modal open={!!blockModal} onClose={() => setBlockModal(null)} title={`Заблокировать ${blockModal?.user.username}`}>
        <div className="flex flex-col gap-4">
          <p className="text-text-muted text-sm">Укажите причину блокировки:</p>
          <textarea
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder="Причина..."
            rows={3}
            className="bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 resize-none transition-all"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setBlockModal(null)}>Отмена</Button>
            <Button variant="danger" loading={!!actionLoading} onClick={() => void handleBlockConfirm()}>Заблокировать</Button>
          </div>
        </div>
      </Modal>

      {/* Role modal */}
      <Modal open={!!roleModal} onClose={() => setRoleModal(null)} title={`Роль — ${roleModal?.user.username}`}>
        <div className="flex flex-col gap-4">
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
          >
            {['user', 'operator', 'admin', 'superadmin'].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setRoleModal(null)}>Отмена</Button>
            <Button variant="primary" loading={!!actionLoading} onClick={() => void handleRoleChange()}>Сохранить</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
