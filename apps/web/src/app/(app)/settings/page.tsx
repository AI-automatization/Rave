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
  const { user, updateUser, clearAuth } = useAuthStore();
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
      await apiClient.post('/api/auth/logout', {});
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
      <h1 className="text-3xl font-display text-white">{t('title')}</h1>

      <form onSubmit={(e) => void handleSave(e)} className="space-y-5">
        {/* Profile photo */}
        <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-5 space-y-4">
          <h2 className="font-display text-lg text-white">{t('profilePhoto')}</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center">
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="Avatar" width={64} height={64} className="w-full h-full object-cover" unoptimized />
                ) : (
                  <span className="text-xl font-display text-[#7C3AED]">{user?.username[0].toUpperCase()}</span>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#7C3AED] text-white hover:bg-[#6D28D9] cursor-pointer transition-all">
                <FaCamera size={12} />
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <p className="text-xs text-zinc-500 whitespace-pre-line">{t('photoHint')}</p>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-5 space-y-4">
          <h2 className="font-display text-lg text-white">{t('notifTitle')}</h2>
          <div className="space-y-3">
            {(Object.keys(NOTIF_LABELS) as Array<keyof Settings['notifications']>).map((key) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-zinc-300">{NOTIF_LABELS[key]}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings[key]}
                    onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.checked }))}
                  />
                  <div className="w-9 h-5 rounded-full bg-white/[0.08] peer-checked:bg-[#7C3AED] transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full h-10 rounded-xl bg-[#7C3AED] text-white font-semibold text-sm hover:bg-[#6D28D9] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(124,58,237,0.3)]"
        >
          {saving ? (
            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : saved ? (
            <>✓ {t('saved')}</>
          ) : (
            <><FaSave size={14} /> {t('save')}</>
          )}
        </button>
      </form>

      {/* Danger zone */}
      <div className="bg-[#111118] border border-red-500/20 rounded-2xl p-5">
        <h2 className="font-display text-lg text-red-400 mb-2">{t('dangerZone')}</h2>
        <p className="text-sm text-zinc-500 mb-4">{t('logoutInfo')}</p>
        <button
          onClick={() => void handleLogout()}
          className="h-9 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm hover:bg-red-500/20 transition-colors flex items-center gap-2"
        >
          <FaSignOutAlt size={14} />
          {t('logout')}
        </button>
      </div>
    </div>
  );
}
