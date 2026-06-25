'use client';

import { useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useUpdateProfile } from '@/hooks/use-profile';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { toast } from '@/store/toast.store';
import { parseApiError } from '@/lib/api-error';
import { useAuthStore } from '@/store/auth.store';
import type { IUser } from '@/types';

interface Props {
  user: IUser;
}

export function ProfileCard({ user }: Props) {
  const t = useTranslations('profile');
  const update = useUpdateProfile();
  const setUser = useAuthStore((s) => s.setUser);
  const [username, setUsername] = useState(user.username ?? '');
  const [bio, setBio] = useState(user.bio ?? '');

  const hasChanges = username !== (user.username ?? '') || bio !== (user.bio ?? '');

  async function handleSave() {
    try {
      const res = await update.mutateAsync({ username, bio });
      if (res.data) setUser(res.data);
      toast.success(t('saved'));
    } catch (err) {
      toast.error(parseApiError(err, t('saveError')));
    }
  }

  return (
    <div className="liquid-glass p-6 flex flex-col items-center gap-5">
      <AvatarUpload avatar={user.avatar} username={user.username} />

      <div className="w-full flex flex-col gap-4">
        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">{t('usernameLabel')}</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="glass-input w-full h-9 rounded-md px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/40 transition-colors"
          />
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">{t('bioLabel')}</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={200}
            className="glass-input w-full rounded-md px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 resize-none focus:outline-none focus:border-violet-500/40 transition-colors"
          />
        </div>

        {/* Save */}
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={update.isPending}
            className="self-start h-9 px-4 rounded-md text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 flex items-center gap-2 transition-colors cursor-pointer active:scale-[0.97]"
          >
            {update.isPending
              ? <><Loader2 size={14} className="animate-spin" />{t('saving')}</>
              : <><Check size={14} />{t('save')}</>}
          </button>
        )}
      </div>
    </div>
  );
}
