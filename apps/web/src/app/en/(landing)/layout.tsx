import { LandingShell } from '@/components/common/LandingShell';

// The English locale itself comes from app/en/layout.tsx (LocaleBoundary), which
// wraps this one. This layout only adds the marketing chrome.
export default function EnLandingLayout({ children }: { children: React.ReactNode }) {
  return <LandingShell>{children}</LandingShell>;
}
