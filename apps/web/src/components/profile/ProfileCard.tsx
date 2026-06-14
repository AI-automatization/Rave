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
    <div className="card p-6 flex flex-col items-center gap-5">
      <AvatarUpload avatar={user.avatar} username={user.username} />

      <div className="w-full flex flex-col gap-4">
        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full h-10 bg-[#13121F] border border-[#2A2840] rounded-xl px-3 text-sm text-white focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
          />
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={200}
            className="w-full bg-[#13121F] border border-[#2A2840] rounded-xl px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
          />
        </div>

        {/* Save */}
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={update.isPending}
            className="w-full h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}
          >
            {update.isPending
              ? <><Loader2 size={14} className="animate-spin" />Saqlanmoqda...</>
              : <><Check size={14} />Saqlash</>}
          </button>
        )}
      </div>
    </div>
  );
}
