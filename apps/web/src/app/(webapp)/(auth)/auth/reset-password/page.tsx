import type { Metadata } from 'next';
import { ResetPasswordForm } from './ResetPasswordForm';

// Static title: this is a server component and the locale lives in a client-side cookie, so the
// tab title cannot follow the language switcher. Uses the app's default locale (uz — see
// Providers.tsx, which starts every SSR render in uz).
export const metadata: Metadata = {
  title: 'Parolni tiklash',
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ token?: string }>;
}

// Qobiq (logotip + panel + futer) `(auth)/layout.tsx` da. URL o'zgarmadi —
// `(auth)` guruh nomi yo'lga qo'shilmaydi, ya'ni elektron xatdagi
// `/auth/reset-password?token=...` havolalari avvalgidek ishlaydi.
export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  return <ResetPasswordForm token={token ?? null} />;
}
