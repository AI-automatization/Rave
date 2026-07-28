import { LandingShell } from '@/components/common/LandingShell';

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <LandingShell>{children}</LandingShell>;
}
