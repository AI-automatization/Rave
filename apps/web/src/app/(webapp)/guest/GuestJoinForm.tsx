'use client';

import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Loader2, ArrowRight, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { trackClick } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { WeWatchLogo } from '@/components/common/WeWatchLogo';

const MAX_NAME_LENGTH = 30;

// Only same-origin relative paths — never bounce a guest to an arbitrary external URL.
function safeRedirect(raw: string | null): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/home';
}

// A friend opens a shared room link → lands here → types a name → is in the room.
// No email, password or OTP: POST /api/auth/guest creates a real (guest) account and sets the
// same session cookies as login, so the room, chat and sync work exactly as for registered users.
export function GuestJoinForm() {
  const t = useTranslations('guest');
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const redirect = safeRedirect(searchParams.get('redirect'));
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    trackClick('guest:submit');
    setError(null);

    startTransition(() => {
      void (async () => {
        try {
          const res = await fetch('/api/auth/guest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name: trimmed }),
          });
          const data = await res.json() as { data?: { user?: unknown }; message?: string; errors?: string[] | null };
          if (!res.ok) {
            setError(data.errors?.[0] ?? data.message ?? t('error'));
            return;
          }
          setUser((data.data?.user ?? null) as Parameters<typeof setUser>[0]);
          // Full navigation so middleware + socket pick up the fresh cookies.
          window.location.href = redirect;
        } catch {
          setError(t('error'));
        }
      })();
    });
  }

  const loginHref = `/login?redirect=${encodeURIComponent(redirect)}`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="mb-8">
          <WeWatchLogo variant="stacked" iconSize={48} />
        </div>

        <h1 className="text-xl font-semibold text-white text-center mb-2">{t('title')}</h1>
        <p className="text-sm text-slate-400 text-center mb-6">{t('subtitle')}</p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <Field label={t('nameLabel')}>
            <Input
              autoFocus
              icon={User}
              value={name}
              maxLength={MAX_NAME_LENGTH}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              data-testid="guest-name"
            />
          </Field>

          {error && <Notice variant="danger">{error}</Notice>}

          <Button type="submit" disabled={isPending || !name.trim()} data-testid="guest-submit">
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            {t('submit')}
          </Button>
        </form>

        <p className="mt-6 text-xs text-slate-500 text-center">
          {t('haveAccount')}{' '}
          <Link href={loginHref} className="text-violet-400 hover:text-violet-300">{t('login')}</Link>
        </p>
      </div>
    </div>
  );
}
