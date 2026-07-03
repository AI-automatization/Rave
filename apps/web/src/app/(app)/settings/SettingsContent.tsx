'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff, Loader2, LogOut, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function SettingsContent() {
  const t = useTranslations('settings');
  const router = useRouter();

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');

  // Logout-all state
  const [logoutAllOpen, setLogoutAllOpen] = useState(false);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);

  // Delete account state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');

    if (newPassword.length < 8) {
      setPwError(t('pwMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError(t('pwMismatch'));
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        toast({ title: t('pwChanged'), description: t('pwChangedDesc') });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json() as { message?: string };
        setPwError(data.message ?? t('saveError'));
      }
    } catch {
      setPwError(t('saveError'));
    } finally {
      setPwLoading(false);
    }
  }

  async function handleLogoutAll() {
    setLogoutAllLoading(true);
    try {
      const res = await fetch('/api/auth/logout-all', {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        router.push('/login');
      } else {
        toast({ title: t('logoutError'), variant: 'destructive' });
      }
    } catch {
      toast({ title: t('logoutError'), variant: 'destructive' });
    } finally {
      setLogoutAllLoading(false);
      setLogoutAllOpen(false);
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleteError('');
    if (!deletePassword) {
      setDeleteError(t('pwRequired'));
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/user/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: deletePassword }),
      });
      if (res.ok) {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        router.push('/');
      } else {
        const data = await res.json() as { message?: string };
        setDeleteError(data.message ?? t('deleteFailed'));
      }
    } catch {
      setDeleteError(t('saveError'));
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <h1 className="text-xl font-bold text-white">{t('title')}</h1>

      {/* Change Password */}
      <section className="liquid-glass p-6">
        <p className="text-zinc-500 text-[11px] font-semibold tracking-[0.14em] uppercase mb-5">
          {t('changePassword')}
        </p>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
          <PasswordField
            label={t('currentPassword')}
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
          />
          <PasswordField
            label={t('newPassword')}
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
          />
          <PasswordField
            label={t('confirmNewPassword')}
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
          />
          {pwError && <p className="text-red-400 text-xs">{pwError}</p>}
          <button
            type="submit"
            disabled={pwLoading}
            className="self-start h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
          >
            {pwLoading && <Loader2 size={14} className="animate-spin" />}
            {t('save')}
          </button>
        </form>
      </section>

      {/* Sessions */}
      <section className="liquid-glass p-6">
        <p className="text-zinc-500 text-[11px] font-semibold tracking-[0.14em] uppercase mb-5">
          {t('sessions')}
        </p>
        {logoutAllOpen ? (
          <div className="flex flex-col gap-3">
            <p className="text-slate-300 text-sm">{t('signOutConfirm')}</p>
            <div className="flex gap-2">
              <button
                onClick={handleLogoutAll}
                disabled={logoutAllLoading}
                className="h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                {logoutAllLoading && <Loader2 size={14} className="animate-spin" />}
                {t('confirm')}
              </button>
              <button
                onClick={() => setLogoutAllOpen(false)}
                className="h-9 px-4 rounded-lg bg-white/[0.06] border border-white/[0.08] text-slate-300 text-sm font-medium hover:bg-white/[0.1] transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setLogoutAllOpen(true)}
            className="h-9 px-4 rounded-lg bg-white/[0.06] border border-white/[0.08] text-slate-300 text-sm font-medium hover:bg-white/[0.1] transition-colors flex items-center gap-2 cursor-pointer"
          >
            <LogOut size={14} />
            {t('signOutAll')}
          </button>
        )}
      </section>

      {/* Danger zone */}
      <section
        className="rounded-2xl p-6"
        style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.20)', backdropFilter: 'blur(36px)', WebkitBackdropFilter: 'blur(36px)', boxShadow: 'inset 0 1px 0 rgba(255,100,100,0.15)' }}
      >
        <p className="text-red-400 text-[11px] font-semibold tracking-[0.14em] uppercase mb-5">
          {t('dangerZone')}
        </p>
        {deleteOpen ? (
          <form onSubmit={handleDeleteAccount} className="flex flex-col gap-3">
            <p className="text-slate-300 text-sm">{t('deleteConfirm')}</p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder={t('yourPassword')}
              className="glass-input h-10 px-3 rounded-lg text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-red-500/50"
            />
            {deleteError && <p className="text-red-400 text-xs">{deleteError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={deleteLoading}
                className="h-9 px-4 rounded-lg bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                {deleteLoading && <Loader2 size={14} className="animate-spin" />}
                {t('deleteMyAccount')}
              </button>
              <button
                type="button"
                onClick={() => { setDeleteOpen(false); setDeletePassword(''); setDeleteError(''); }}
                className="h-9 px-4 rounded-lg bg-white/[0.06] border border-white/[0.08] text-slate-300 text-sm font-medium hover:bg-white/[0.1] transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setDeleteOpen(true)}
            className="h-9 px-4 rounded-lg bg-red-600/10 border border-red-500/30 text-red-400 hover:bg-red-600/20 text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Trash2 size={14} />
            {t('deleteAccount')}
          </button>
        )}
      </section>
    </div>
  );
}

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}

function PasswordField({ label, value, onChange, show, onToggle }: PasswordFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-slate-400 text-xs">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="glass-input w-full h-10 px-3 pr-10 rounded-lg text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/40 transition-colors"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}
