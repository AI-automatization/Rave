import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: "Ro'yxatdan o'tish",
  description: "CineSync da yangi hisob yarating",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
