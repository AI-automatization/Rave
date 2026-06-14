'use client';

import { useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { useUpdateProfile } from '@/hooks/use-profile';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { toast } from '@/store/toast.store';
import type { IUser } from '@/types';

interface Props {
  user: IUser;
}

export function ProfileCard({ user }: Props) {
  const update = useUpdateProfile();
  const [username, setUsername] = useState(user.username ?? '');
  const [bio, setBio] = useState(user.bio ?? '');

  const hasChanges = username !== (user.username ?? '') || bio !== (user.bio ?? '');

  async function handleSave() {
    try {
      await update.mutateAsync({ username, bio });
      toast.success('Profil saqlandi');
    } catch {
      toast.error('Saqlab bo\'lmadi');
    }
  }

  return (
    <div className="card p-6 flex flex-col items-center gap-6">
      <AvatarUpload avatar={user.avatar} username={user.username} />

      <div className="w-full flex flex-col gap-5">
        {/* Username */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full h-[54px] bg-[#111118] border border-white/[0.06] rounded-2xl px-5 text-sm text-white focus:outline-none focus:border-violet-500/45 focus:bg-violet-500/5 transition-all"
          />
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={200}
            className="w-full bg-[#111118] border border-white/[0.06] rounded-2xl px-5 py-4 text-sm text-white resize-none focus:outline-none focus:border-violet-500/45 focus:bg-violet-500/5 transition-all"
          />
        </div>

        {/* Save */}
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={update.isPending}
            className="w-full h-[54px] rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-[0.97] transition-all cursor-pointer disabled:opacity-40 shadow-lg shadow-violet-500/20"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}
          >
            {update.isPending
              ? <><Loader2 size={16} className="animate-spin" />Saqlanmoqda...</>
              : <><Check size={16} />Saqlash</>}
          </button>
        )}
      </div>
    </div>
  );
}
