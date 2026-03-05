'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaSave, FaCamera, FaSignOutAlt } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import type { ApiResponse } from '@/types';

interface Settings {
  notifications: {
    friendRequest:  boolean;
    battleInvite:   boolean;
    battleResult:   boolean;
    partyInvite:    boolean;
    achievement:    boolean;
    system:         boolean;
  };
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const router = useRouter();
  const { user, updateUser, clearAuth, refreshToken } = useAuthStore();
  const [settings, setSettings] = useState<Settings['notifications']>({
    friendRequest: true,
    battleInvite:  true,
    battleResult:  true,
    partyInvite:   true,
    achievement:   true,
    system:        true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar ?? '');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get<ApiResponse<Settings>>('/users/me/settings');
        if (res.data.data?.notifications) {
          setSettings(res.data.data.notifications);
        }
      } catch (err) {
        logger.error('Sozlamalar yuklashda xato', err);
      }
    };
    void load();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return;
    if (file.size > 5 * 1024 * 1024) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        const res = await apiClient.patch<ApiResponse<{ avatar: string }>>('/users/me/avatar', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data.data?.avatar) {
          updateUser({ avatar: res.data.data.avatar });
        }
      }
      await apiClient.patch('/users/me/settings', { notifications: settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      logger.error('Sozlamalar saqlashda xato', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.post('/api/auth/logout', { refreshToken });
    } catch (err) {
      logger.warn('Logout xatosi', err);
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  const NOTIF_LABELS: Record<keyof Settings['notifications'], string> = {
    friendRequest: t('notifFriendRequest'),
    battleInvite:  t('notifBattleInvite'),
    battleResult:  t('notifBattleResult'),
    partyInvite:   t('notifPartyInvite'),
    achievement:   t('notifAchievement'),
    system:        t('notifSystem'),
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-3xl font-display">{t('title')}</h1>

      <form onSubmit={(e) => void handleSave(e)} className="space-y-6">
        <div className="card bg-base-200">
          <div className="card-body p-5 gap-4">
            <h2 className="font-display text-lg">{t('profilePhoto')}</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-primary text-primary-content flex items-center justify-center">
                  {avatarPreview ? (
                    <Image src={avatarPreview} alt="Avatar" width={64} height={64} className="w-full h-full object-cover" unoptimized />
                  ) : (
                    <span className="text-xl font-display">{user?.username[0].toUpperCase()}</span>
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 inline-flex items-center justify-center h-6 w-6 rounded-full bg-cyan-500 text-slate-900 hover:bg-cyan-400 cursor-pointer transition-all">
                  <FaCamera size={12} />
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>
              <div className="text-xs text-base-content/50 whitespace-pre-line">
                {t('photoHint')}
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body p-5 gap-4">
            <h2 className="font-display text-lg">{t('notifTitle')}</h2>
            <div className="space-y-3">
              {(Object.keys(NOTIF_LABELS) as Array<keyof Settings['notifications']>).map((key) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm">{NOTIF_LABELS[key]}</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-sm"
                    checked={settings[key]}
                    onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.checked }))}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <button type="submit" className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 transition-all font-medium active:scale-95 w-full" disabled={saving}>
          {saving ? (
            <span className="animate-spin">⟳</span>
          ) : saved ? (
            <>✓ {t('saved')}</>
          ) : (
            <>
              <FaSave size={16} />
              {t('save')}
            </>
          )}
        </button>
      </form>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-5">
        <h2 className="font-display text-lg text-red-400 mb-2">{t('dangerZone')}</h2>
        <p className="text-sm text-slate-400 mb-4">{t('logoutInfo')}</p>
        <button onClick={() => void handleLogout()} className="inline-flex items-center justify-center gap-2 h-8 px-3 rounded-lg border-2 border-red-500 text-red-400 hover:bg-red-500/10 hover:shadow-lg hover:shadow-red-500/30 transition-all text-sm font-medium w-fit">
          <FaSignOutAlt size={14} />
          {t('logout')}
        </button>
      </div>
    </div>
  );
}
