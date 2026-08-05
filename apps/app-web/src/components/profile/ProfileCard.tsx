'use client';

import { useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useUpdateProfile } from '@/hooks/use-profile';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { Field, Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { toast } from '@/store/toast.store';
import { useApiError } from '@/hooks/use-api-error';
import { useAuthStore } from '@/store/auth.store';
import type { IUser } from '@/types';
import { trackClick } from '@/lib/analytics';

interface Props {
  user: IUser;
}

const BIO_MAX = 200;

export function ProfileCard({ user }: Props) {
  const t = useTranslations('profile');
  const parseError = useApiError();
  const update = useUpdateProfile();
  const setUser = useAuthStore((s) => s.setUser);
  const [username, setUsername] = useState(user.username ?? '');
  const [bio, setBio] = useState(user.bio ?? '');

  const hasChanges = username !== (user.username ?? '') || bio !== (user.bio ?? '');

  async function handleSave() {
    trackClick('profile:save');
    try {
      const res = await update.mutateAsync({ username, bio });
      if (res.data) setUser(res.data);
      toast.success(t('saved'));
    } catch (err) {
      toast.error(parseError(err, t('saveError')));
    }
  }

  return (
    <div className="ww-panel flex flex-col items-center gap-6 p-6">
      <AvatarUpload avatar={user.avatar} username={user.username} />

      <div className="flex w-full flex-col gap-5">
        {/* Maydonlar auth formalari bilan bir xil `Field`/`Input` primitivida —
            label↔input bog'lanishi va `aria-invalid` avtomatik. */}
        <Field label={t('usernameLabel')}>
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </Field>

        <Field label={t('bioLabel')} hint={`${bio.length}/${BIO_MAX}`}>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={BIO_MAX}
            className="ww-field ww-textarea"
          />
        </Field>

        {/* Tugma har doim ko'rinadi, faqat o'chirilgan bo'ladi. Ilgari u
            o'zgarish bo'lgandagina paydo bo'lardi — karta balandligi sakrab,
            "saqlash umuman bormi?" degan savol tug'ilardi. */}
        <Button
          type="button"
          variant="accent"
          size="xl"
          onClick={() => { void handleSave(); }}
          disabled={!hasChanges || update.isPending}
          className="self-start px-6"
        >
          {update.isPending
            ? <><Loader2 size={16} aria-hidden="true" className="animate-spin" />{t('saving')}</>
            : <><Check size={16} aria-hidden="true" />{t('save')}</>}
        </Button>
      </div>
    </div>
  );
}
