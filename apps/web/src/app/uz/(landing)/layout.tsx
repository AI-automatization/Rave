import { LandingShell } from '@/components/common/LandingShell';

// The Uzbek locale itself comes from app/uz/layout.tsx (LocaleBoundary), which
// wraps this one. This layout only adds the marketing chrome.
export default function UzLandingLayout({ children }: { children: React.ReactNode }) {
  return <LandingShell>{children}</LandingShell>;
}
