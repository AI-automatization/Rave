import { useEffect, useState, useCallback } from 'react';
import { usersApi } from '../api/users.api';
import { useAuthStore } from '../store/auth.store';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import type { AdminUser, PaginationMeta } from '../types';

export function UsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [blockedFilter, setBlockedFilter] = useState('');
  const [page, setPage] = useState(1);

  const [roleModal, setRoleModal] = useState<{ user: AdminUser } | null>(null);
  const [newRole, setNewRole] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (blockedFilter !== '') params.isBlocked = blockedFilter === 'true';
      const res = await usersApi.list(params as Parameters<typeof usersApi.list>[0]);
      setUsers(res.data);
      setMeta(res.meta);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, blockedFilter]);

  useEffect(() => { void load(); }, [load]);

  const handleBlock = async (user: AdminUser) => {
    setActionLoading(user._id);
    try {
      if (user.isBlocked) await usersApi.unblock(user._id);
      else await usersApi.block(user._id);
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async () => {
    if (!roleModal || !newRole) return;
    setActionLoading(roleModal.user._id);
    try {
      await usersApi.changeRole(roleModal.user._id, newRole);
      setRoleModal(null);
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`"${user.username}" ni o'chirish? Bu amalni qaytarib bo'lmaydi.`)) return;
    setActionLoading(user._id);
    try {
      await usersApi.delete(user._id);
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const roleBadge = (role: AdminUser['role']) => {
    const map: Record<AdminUser['role'], 'red' | 'yellow' | 'blue' | 'gray'> = {
      superadmin: 'red', admin: 'yellow', operator: 'blue', user: 'gray',
    };
    return <Badge variant={map[role]}>{role}</Badge>;
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-white">Foydalanuvchilar</h1>
        <p className="text-text-muted text-sm mt-0.5">{meta.total.toLocaleString()} ta jami</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Qidirish (email, username)..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-64"
        />
        <Select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">Barcha rollar</option>
          <option value="user">User</option>
          <option value="operator">Operator</option>
          <option value="admin">Admin</option>
          <option value="superadmin">Superadmin</option>
        </Select>
        <Select value={blockedFilter} onChange={(e) => { setBlockedFilter(e.target.value); setPage(1); }}>
          <option value="">Barcha holat</option>
          <option value="false">Faol</option>
          <option value="true">Bloklangan</option>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-text-muted font-medium">Foydalanuvchi</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Role</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Holat</th>
                <th className="text-left px-4 py-3 text-text-muted font-medium">Ro'yxatga olindi</th>
                <th className="text-right px-4 py-3 text-text-muted font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">Yuklanmoqda...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">Foydalanuvchi topilmadi</td></tr>
              ) : users.map((user) => (
                <tr key={user._id} className="border-b border-border/50 hover:bg-overlay/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover bg-overlay" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-overlay flex items-center justify-center text-text-muted text-xs">
                          {user.username?.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-white">{user.username}</p>
                        <p className="text-xs text-text-muted">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{roleBadge(user.role)}</td>
                  <td className="px-4 py-3">
                    {user.isBlocked
                      ? <Badge variant="red">Bloklangan</Badge>
                      : <Badge variant="green">Faol</Badge>
                    }
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {new Date(user.createdAt).toLocaleDateString('uz-UZ')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant={user.isBlocked ? 'secondary' : 'danger'}
                        loading={actionLoading === user._id}
                        onClick={() => void handleBlock(user)}
                      >
                        {user.isBlocked ? 'Razblok' : 'Blok'}
                      </Button>
                      {isSuperAdmin && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => { setRoleModal({ user }); setNewRole(user.role); }}
                          >
                            Role
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            loading={actionLoading === user._id}
                            onClick={() => void handleDelete(user)}
                          >
                            O'ch
                          </Button>
                        </>
                      )}
                    </div>
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

      {/* Role change modal */}
      <Modal open={!!roleModal} onClose={() => setRoleModal(null)} title="Role o'zgartirish">
        {roleModal && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-muted">
              <span className="text-white font-medium">{roleModal.user.username}</span> foydalanuvchining rolini o'zgartirish
            </p>
            <Select label="Yangi role" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option value="user">User</option>
              <option value="operator">Operator</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </Select>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setRoleModal(null)}>Bekor</Button>
              <Button variant="primary" loading={!!actionLoading} onClick={() => void handleRoleChange()}>
                Saqlash
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
