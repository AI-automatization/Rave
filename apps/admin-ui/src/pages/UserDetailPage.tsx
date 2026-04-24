import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Mail, Shield, Calendar, Smartphone, Clock,
  Ban, CheckCircle, AlertTriangle, ExternalLink, Bug,
} from 'lucide-react';
import { usersApi } from '../api/users.api';
import { errorsApi, MobileIssue } from '../api/errors.api';
import type { AdminUser } from '../types';

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const ROLE_COLOR: Record<string, string> = {
  superadmin: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
  admin: 'bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/30',
  operator: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  user: 'bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/30',
};

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0">
      <span className="text-text-dim shrink-0">{icon}</span>
      <span className="text-text-muted text-sm w-36 shrink-0">{label}</span>
      <span className="text-white text-sm flex-1">{value}</span>
    </div>
  );
}

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [errors, setErrors] = useState<MobileIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      usersApi.getById(id),
      errorsApi.list({ search: id, limit: 10 }),
    ])
      .then(([u, e]) => { setUser(u); setErrors(e.data); })
      .catch(() => navigate('/users'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleBlock = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      if (user.isBlocked) { await usersApi.unblock(user._id); flash('Разблокирован'); }
      else { await usersApi.block(user._id, 'Заблокирован администратором'); flash('Заблокирован'); }
      const updated = await usersApi.getById(user._id);
      setUser(updated);
    } catch { flash('Ошибка'); } finally { setActionLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  const initials = (user.username || user.email).slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Back */}
      <button onClick={() => navigate('/users')} className="flex items-center gap-2 text-text-muted hover:text-white text-sm transition-colors w-fit">
        <ArrowLeft size={15} />
        Назад к пользователям
      </button>

      {/* Flash */}
      {msg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-2.5 rounded-lg">
          {msg}
        </div>
      )}

      {/* Profile card */}
      <div className="bg-[#0d0d14] border border-white/[0.06] rounded-2xl overflow-hidden">
        {/* Header banner */}
        <div className="h-24 bg-gradient-to-br from-accent/20 via-accent/5 to-transparent" />

        <div className="px-6 pb-6">
          {/* Avatar + actions */}
          <div className="flex items-end justify-between -mt-10 mb-5">
            <div className="w-20 h-20 rounded-2xl bg-accent/20 border-4 border-[#0d0d14] flex items-center justify-center">
              {user.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full rounded-xl object-cover" />
                : <span className="text-accent text-2xl font-bold">{initials}</span>
              }
            </div>
            <div className="flex items-center gap-2 pb-1">
              <a
                href={`mailto:${user.email}`}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs hover:bg-accent/20 transition-colors"
              >
                <Mail size={13} />
                Написать
              </a>
              <button
                onClick={handleBlock}
                disabled={actionLoading}
                className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs border transition-colors ${
                  user.isBlocked
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                    : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                }`}
              >
                {user.isBlocked ? <><CheckCircle size={13} /> Разблокировать</> : <><Ban size={13} /> Заблокировать</>}
              </button>
            </div>
          </div>

          {/* Name + role */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-white">{user.username || '—'}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLOR[user.role] ?? ROLE_COLOR.user}`}>
                {user.role}
              </span>
              {user.isBlocked && (
                <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                  <Ban size={11} /> Заблокирован
                </span>
              )}
            </div>
            <p className="text-text-muted text-sm">{user.email}</p>
          </div>

          {/* Info rows */}
          <div className="bg-white/[0.02] rounded-xl px-4">
            <InfoRow icon={<Mail size={15} />} label="Email" value={
              <div className="flex items-center gap-2">
                {user.email}
                {user.isEmailVerified
                  ? <CheckCircle size={13} className="text-emerald-400" />
                  : <AlertTriangle size={13} className="text-amber-400" />}
                <span className="text-xs text-text-dim">{user.isEmailVerified ? 'Верифицирован' : 'Не верифицирован'}</span>
              </div>
            } />
            <InfoRow icon={<Shield size={15} />} label="Роль" value={
              <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLOR[user.role] ?? ROLE_COLOR.user}`}>{user.role}</span>
            } />
            <InfoRow icon={<Calendar size={15} />} label="Регистрация" value={formatDate(user.createdAt)} />
            <InfoRow icon={<Clock size={15} />} label="Последний вход" value={
              user.lastLoginAt ? `${formatDate(user.lastLoginAt)} (${relativeTime(user.lastLoginAt)})` : '—'
            } />
            <InfoRow icon={<Smartphone size={15} />} label="Устройство" value={user.lastDevice ?? '—'} />
            {user.isBlocked && user.blockReason && (
              <InfoRow icon={<Ban size={15} />} label="Причина блока" value={
                <span className="text-red-400">{user.blockReason}</span>
              } />
            )}
            <InfoRow icon={<Shield size={15} />} label="Auth ID" value={
              <span className="font-mono text-xs text-text-dim">{user.authId}</span>
            } />
          </div>
        </div>
      </div>

      {/* Errors section */}
      <div className="bg-[#0d0d14] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
          <Bug size={16} className="text-red-400" />
          <h2 className="text-sm font-semibold text-white">Ошибки пользователя</h2>
          {errors.length > 0 && (
            <span className="ml-auto text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">{errors.length}</span>
          )}
        </div>
        {errors.length === 0 ? (
          <div className="px-5 py-8 text-center text-text-muted text-sm">Ошибок не найдено 🎉</div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {errors.map((e) => (
              <div key={e.id} className="px-5 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{e.title}</p>
                  <p className="text-xs text-text-muted truncate">{e.message || '—'}</p>
                </div>
                <span className="text-xs text-text-dim font-mono">{e.count}×</span>
                <Link to="/errors" className="text-text-dim hover:text-white transition-colors">
                  <ExternalLink size={14} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
