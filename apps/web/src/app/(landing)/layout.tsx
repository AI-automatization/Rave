import { LandingNav } from '@/components/common/LandingNav';
import { Footer } from '@/components/common/Footer';

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0F]">
      <LandingNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
