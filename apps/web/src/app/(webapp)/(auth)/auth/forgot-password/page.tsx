import type { Metadata } from 'next';
import { ForgotPasswordForm } from './ForgotPasswordForm';

// Static title for the same reason as ../reset-password/page.tsx: server component, locale lives
// in a client-side cookie, so the tab title can't follow the language switcher. Default locale (uz).
export const metadata: Metadata = {
  title: 'Parolni tiklash so\'rovi',
  robots: { index: false, follow: false },
};

// Qobiq (logotip + panel + futer) endi `(auth)/layout.tsx` da — login/register
// bilan bir xil. Fayl `(auth)` guruhi ichida bo'lsa ham URL o'zgarmaydi:
// guruh nomi yo'lga qo'shilmaydi, manzil `/auth/forgot-password` bo'lib qoladi.
// Bu ataylab — `/login` dagi "Parolni unutdingizmi?" va tiklash xatlaridagi
// havolalar shu manzilga tayanadi.
export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
