'use client';

import { useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useUploadAvatar } from '@/hooks/use-profile';
import { toast } from '@/store/toast.store';
import { avatarColor } from '@/lib/utils';
import { trackClick } from '@/lib/analytics';

interface Props {
  avatar?: string;
  username?: string;
}

const MAX_BYTES = 5 * 1024 * 1024;

export function AvatarUpload({ avatar, username }: Props) {
  const t = useTranslations('profile');
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useUploadAvatar();
  const color = avatarColor(username ?? 'u');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_BYTES) {
      toast.error(t('avatarTooLarge'));
      return;
    }

    try {
      await upload.mutateAsync(file);
      toast.success(t('avatarUpdated'));
    } catch {
      toast.error(t('avatarError'));
    } finally {
      // Bir xil faylni qayta tanlash ham `change` hodisasini bersin
      e.target.value = '';
    }
  }

  return (
    <div className="relative">
      <span
        className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full text-[32px] font-semibold"
        style={{ background: `${color}2E`, border: `1px solid ${color}59`, color }}
      >
        {avatar ? (
          <img src={avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          (username?.[0]?.toUpperCase() ?? '?')
        )}
      </span>

      {/* Ilgari butun avatarni qoplaydigan `opacity-0 group-hover:opacity-100`
          qatlam edi — telefonda hover yo'q, ya'ni avatarni umuman almashtirib
          bo'lmasdi. Endi bu doim ko'rinadigan 36px li nishon tugma. */}
      <button
        type="button"
        onClick={() => { trackClick('profile:avatar_upload'); fileRef.current?.click(); }}
        disabled={upload.isPending}
        aria-label={t('avatarChange')}
        className="absolute -bottom-0.5 -right-0.5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-[var(--ww-panel-solid)] bg-[var(--ww-accent)] text-white transition-[filter,transform] duration-[var(--ww-dur)] hover:brightness-110 active:scale-95 disabled:cursor-default disabled:opacity-60"
      >
        {upload.isPending
          ? <Loader2 size={16} aria-hidden="true" className="animate-spin" />
          : <Camera size={16} aria-hidden="true" />}
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
