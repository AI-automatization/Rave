'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, LogOut, Trash2, Crown } from 'lucide-react';
import { Field, Input, PasswordInput } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { trackClick } from '@/lib/analytics';
import { useLocaleStore } from '@/store/locale.store';
import { paymentApi, type PlanInfo, type BillingProvider } from '@/lib/api/payment.api';
import { ApiError } from '@/lib/api-client';

// The app ships uz/ru/en and Providers re-renders on locale change, but the only switcher UI lived
// in LandingNav — a component this app never renders (the landing moved to apps/web). So the
// picker had no home and users were stuck on whatever the cookie said, with no way to change it.
const LOCALES = [
  { value: 'uz', flag: '🇺🇿', label: "O'zbek" },
  { value: 'ru', flag: '🇷🇺', label: 'Русский' },
  { value: 'en', flag: '🇬🇧', label: 'English' },
] as const;

/** Bo'lim sarlavhasi — to'rtala bo'limda bir xil tipografik pog'ona */
function SectionTitle({ children, tone = 'muted' }: { children: React.ReactNode; tone?: 'muted' | 'danger' }) {
  return (
    <h2
      className={`mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] ${
        tone === 'danger' ? 'text-[var(--ww-danger)]' : 'text-[var(--ww-text-3)]'
      }`}
    >
      {children}
    </h2>
  );
}

export function SettingsContent() {
  const t = useTranslations('settings');
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  // Plan / Pro obuna
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    paymentApi.getPlan()
      .then((res) => setPlan(res.data))
      .catch(() => setPlan(null))
      .finally(() => setPlanLoading(false));
  }, []);

  // tezcode-billing checkout muvaffaqiyatli/bekor bo'lib qaytgandan keyin (services/payment
  // startCheckout() shu sahifaga ?checkout=success|canceled bilan redirect qiladi)
  useEffect(() => {
    const checkoutResult = searchParams.get('checkout');
    if (checkoutResult === 'success') {
      toast({ title: t('planUpgraded') });
      paymentApi.getPlan().then((res) => setPlan(res.data)).catch(() => {});
    } else if (checkoutResult === 'canceled') {
      toast({ title: t('planCheckoutCanceled'), variant: 'destructive' });
    } else {
      return;
    }
    // Strip ?checkout=... once shown — otherwise a refresh or back-navigation replays the
    // same toast (and re-fetches the plan) every time.
    router.replace('/settings');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleUpgrade(provider: BillingProvider) {
    trackClick('settings:upgrade_to_pro', { provider });
    setCheckoutLoading(true);
    try {
      const res = await paymentApi.startCheckout(provider);
      if (!res.data) throw new Error('Empty checkout response');
      window.location.href = res.data.checkoutUrl;
    } catch (err) {
      const message = err instanceof ApiError ? (err.data as { message?: string })?.message : undefined;
      toast({ title: message ?? t('planCheckoutError'), variant: 'destructive' });
      setCheckoutLoading(false);
    }
  }

  // Change password state. `show*` bayroqlari yo'q — ko'zni `PasswordInput`
  // o'zi boshqaradi (a11y yorlig'i bilan birga).
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    trackClick('settings:change_password_submit');

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
    trackClick('settings:logout_all_confirm');
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
    trackClick('settings:delete_account_confirm');
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
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-[26px] font-semibold tracking-[-0.025em] text-[var(--ww-text)] sm:text-[30px]">
        {t('title')}
      </h1>

      {/* Til */}
      <section className="ww-panel p-6">
        <SectionTitle>{t('language')}</SectionTitle>
        {/* Buttons, not the hover dropdown from LanguageSwitcher — that one never opens on touch. */}
        <div className="flex flex-wrap gap-2">
          {LOCALES.map(({ value, flag, label }) => {
            const active = locale === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => { trackClick('settings:locale', { locale: value }); setLocale(value); }}
                className={`flex h-11 cursor-pointer items-center gap-2 rounded-[var(--ww-r-md)] px-4 text-[13.5px] transition-colors ${
                  active
                    ? 'border border-[rgba(124,58,237,0.45)] bg-[var(--ww-accent-soft)] font-medium text-[var(--ww-accent-hi)]'
                    : 'ww-btn-subtle text-[var(--ww-text-2)]'
                }`}
              >
                <span aria-hidden="true">{flag}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Tarif (Pro obuna) — tezcode-billing orqali, checkout services/payment'ga POST
          qilinadi, hech qanday billing kaliti bu yerga (client) yetib kelmaydi */}
      <section className="ww-panel p-6">
        <SectionTitle>{t('planTitle')}</SectionTitle>
        {planLoading ? (
          <Loader2 size={18} aria-hidden="true" className="animate-spin text-[var(--ww-text-3)]" />
        ) : plan?.plan === 'pro' ? (
          <div className="flex items-center gap-3">
            <Crown size={20} aria-hidden="true" className="text-[var(--ww-accent-hi)]" />
            <div>
              <p className="text-[14px] font-medium text-[var(--ww-text)]">{t('planPro')}</p>
              {plan.currentPeriodEnd && (
                <p className="text-[12.5px] text-[var(--ww-text-3)]">
                  {t('planRenewsOn', { date: new Date(plan.currentPeriodEnd).toLocaleDateString(locale) })}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-[13.5px] leading-relaxed text-[var(--ww-text-2)]">{t('planFreeDesc')}</p>
            {/* Ikkita alohida tugma — bitta "Upgrade" tugmasi + keyingi provider tanlovi o'rniga,
                chunki tezcode-billing checkout so'rovi provider'ni oldindan talab qiladi
                (docs/INTEGRATION.md). UZUM hali onboarding jarayonida — shu sabab ko'rsatilmaydi. */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="accent"
                size="xl"
                onClick={() => { void handleUpgrade('PAYME'); }}
                disabled={checkoutLoading}
                className="px-6"
              >
                {checkoutLoading && <Loader2 size={16} aria-hidden="true" className="animate-spin" />}
                <Crown size={16} aria-hidden="true" />
                {t('planUpgradeCta')} — Payme
              </Button>
              <Button
                type="button"
                variant="subtle"
                size="xl"
                onClick={() => { void handleUpgrade('CLICK'); }}
                disabled={checkoutLoading}
                className="px-6"
              >
                {t('planUpgradeCta')} — Click
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Parolni almashtirish */}
      <section className="ww-panel p-6">
        <SectionTitle>{t('changePassword')}</SectionTitle>
        {/* Uchta maydon ham `Field` + `PasswordInput` primitivida. Ilgari shu
            faylda lokal `PasswordField` bor edi — o'z `useId` i, o'z ko'z
            tugmasi va boshqa fayllardagilardan biroz farqli o'lchamlari
            bilan. Endi manba bitta: components/ui/field.tsx */}
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <Field label={t('currentPassword')}>
            <PasswordInput
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              // Was missing entirely, so password managers offered nothing here and browsers could
              // not tell the current password apart from the new one.
              autoComplete="current-password"
              toggleLabel={t('togglePassword')}
            />
          </Field>
          <Field label={t('newPassword')}>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              toggleLabel={t('togglePassword')}
            />
          </Field>
          <Field label={t('confirmNewPassword')}>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              toggleLabel={t('togglePassword')}
            />
          </Field>

          {/* Xato forma darajasida (server "joriy parol noto'g'ri" ham deyishi
              mumkin), shuning uchun bitta maydonga bog'lanmaydi */}
          {pwError && <Notice variant="danger">{pwError}</Notice>}

          <Button
            type="submit"
            variant="accent"
            size="xl"
            disabled={pwLoading}
            className="self-start px-6"
          >
            {pwLoading && <Loader2 size={16} aria-hidden="true" className="animate-spin" />}
            {t('save')}
          </Button>
        </form>
      </section>

      {/* Seanslar */}
      <section className="ww-panel p-6">
        <SectionTitle>{t('sessions')}</SectionTitle>
        {logoutAllOpen ? (
          <div className="flex flex-col gap-4">
            <p className="text-[13.5px] leading-relaxed text-[var(--ww-text-2)]">{t('signOutConfirm')}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="accent"
                size="xl"
                onClick={() => { void handleLogoutAll(); }}
                disabled={logoutAllLoading}
                className="px-6"
              >
                {logoutAllLoading && <Loader2 size={16} aria-hidden="true" className="animate-spin" />}
                {t('confirm')}
              </Button>
              <Button type="button" variant="subtle" size="xl" onClick={() => setLogoutAllOpen(false)} className="px-6">
                {t('cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="subtle" size="xl" onClick={() => setLogoutAllOpen(true)} className="px-5">
            <LogOut size={16} aria-hidden="true" />
            {t('signOutAll')}
          </Button>
        )}
      </section>

      {/* Xavfli hudud — inline `style` bilan yozilgan qizil shisha edi;
          endi holat tokenlaridan (`--ww-danger-*`) yig'iladi. */}
      <section className="rounded-[var(--ww-r-xl)] border border-[var(--ww-danger-line)] bg-[var(--ww-danger-soft)] p-6">
        <SectionTitle tone="danger">{t('dangerZone')}</SectionTitle>
        {deleteOpen ? (
          <form onSubmit={handleDeleteAccount} className="flex flex-col gap-4">
            <p className="text-[13.5px] leading-relaxed text-[var(--ww-text-2)]">{t('deleteConfirm')}</p>
            <Field label={t('yourPassword')} error={deleteError || undefined}>
              <Input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder={t('yourPassword')}
                autoComplete="current-password"
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={deleteLoading}
                className="flex h-12 cursor-pointer items-center gap-2 rounded-[var(--ww-r-md)] bg-[var(--ww-danger)] px-6 text-[15px] font-medium text-[#1A0808] transition-[filter] duration-[var(--ww-dur)] hover:brightness-110 disabled:cursor-default disabled:opacity-50"
              >
                {deleteLoading && <Loader2 size={16} aria-hidden="true" className="animate-spin" />}
                {t('deleteMyAccount')}
              </button>
              <Button
                type="button"
                variant="subtle"
                size="xl"
                onClick={() => { setDeleteOpen(false); setDeletePassword(''); setDeleteError(''); }}
                className="px-6"
              >
                {t('cancel')}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <Notice variant="danger" title={t('deleteAccount')}>
              {t('deleteHint')}
            </Notice>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="flex h-12 cursor-pointer items-center gap-2 self-start rounded-[var(--ww-r-md)] border border-[var(--ww-danger-line)] px-5 text-[15px] font-medium text-[var(--ww-danger)] transition-colors hover:bg-[rgba(255,107,107,0.14)]"
            >
              <Trash2 size={16} aria-hidden="true" />
              {t('deleteAccount')}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
