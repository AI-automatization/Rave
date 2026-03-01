'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaSearch, FaBell, FaUser } from 'react-icons/fa';
import { useAuthStore } from '@/store/auth.store';

export function TopBar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = (fd.get('q') as string)?.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-base-100/90 backdrop-blur-md border-b border-base-300">
      <div className="flex items-center justify-between px-4 py-3 gap-4">
        {/* Logo (mobile only) */}
        <Link href="/home" className="lg:hidden text-xl font-display text-primary tracking-wider">
          CS
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg">
          <div className="relative">
            <FaSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              name="q"
              type="search"
              placeholder="Film, janr, rejissyor..."
              className="input input-bordered input-sm w-full pl-9 bg-base-200"
              aria-label="Qidirish"
            />
          </div>
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link href="/notifications" className="btn btn-ghost btn-sm btn-circle" aria-label="Bildirishnomalar">
            <FaBell size={18} />
          </Link>
          {user ? (
            <Link href={`/profile/${user.username}`} className="btn btn-ghost btn-sm btn-circle">
              {user.avatar ? (
                <div className="avatar">
                  <div className="w-7 rounded-full">
                    <Image src={user.avatar} alt={user.username} width={28} height={28} className="object-cover" unoptimized />
                  </div>
                </div>
              ) : (
                <FaUser size={18} />
              )}
            </Link>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm">Kirish</Link>
          )}
        </div>
      </div>
    </header>
  );
}
