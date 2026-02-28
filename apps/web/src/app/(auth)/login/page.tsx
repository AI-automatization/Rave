import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Kirish',
  description: 'CineSync hisobingizga kiring',
};

export default function LoginPage() {
  return <LoginForm />;
}
