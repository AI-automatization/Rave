import { Sidebar } from '@/components/common/Sidebar';
import { TopBar } from '@/components/common/TopBar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-base-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 px-5 py-8 pb-24 lg:pb-8 max-w-[90rem] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
