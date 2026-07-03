'use client';

import { useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useUploadAvatar } from '@/hooks/use-profile';
import { toast } from '@/store/toast.store';

interface Props {
  avatar?: string;
  username?: string;
}

export function AvatarUpload({ avatar, username }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useUploadAvatar();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Maksimal 5 MB');
      return;
    }

    try {
      await upload.mutateAsync(file);
      toast.success('Avatar yangilandi');
    } catch {
      toast.error('Avatar yuklab bo\'lmadi');
    }
  }

  return (
    <div className="relative group">
      <div className="w-24 h-24 rounded-full overflow-hidden bg-violet-600/20 flex items-center justify-center">
        {avatar ? (
          <img src={avatar} alt={username ?? ''} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl font-bold text-violet-300">
            {username?.[0]?.toUpperCase() ?? '?'}
          </span>
        )}
      </div>

      <button
        onClick={() => fileRef.current?.click()}
        disabled={upload.isPending}
        className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
      >
        {upload.isPending
          ? <Loader2 size={20} className="animate-spin text-white" />
          : <Camera size={20} className="text-white" />}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
