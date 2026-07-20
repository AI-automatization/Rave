'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useFriends } from '@/hooks/use-friends';
import { trackClick } from '@/lib/analytics';

const PALETTE = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626', '#DB2777', '#0891B2'];
function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

// ui-ux-pro-max skill: visible focus ring for keyboard nav (Accessibility, CRITICAL).
const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0e0a20]';

// The rail+panel two-tier sidebar (AppSidebar.tsx) shows this as the "Друзья" space's context
// panel — fills the whole column (no outer card chrome of its own, the panel container supplies
// that), same idea as Discord's channel list next to the server rail.
export function FriendsPanel() {
  const t = useTranslations('friends');
  const router = useRouter();
  const { data: friends, isLoading } = useFriends();

  const online = (friends ?? []).filter((f) => f.isOnline);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1.5 px-3 h-11 border-b border-white/[0.06] shrink-0">
        <p className="flex-1 text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
          {t('tabFriends')}
        </p>
        <span
          className={`flex items-center gap-1 text-[11px] font-semibold px-1.5 h-[18px] rounded-full ${
            online.length > 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-600 bg-white/[0.04]'
          }`}
        >
          {online.length > 0 && (
            <span className="relative flex w-1.5 h-1.5">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </span>
          )}
          {online.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5">
        {isLoading && (
          <div className="flex flex-col gap-1 px-1.5 py-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2.5 h-10 animate-pulse">
                <div className="w-7 h-7 rounded-full bg-white/[0.06] shrink-0" />
                <div className="h-2.5 w-20 rounded bg-white/[0.06]" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && online.length === 0 && (
          <div className="flex flex-col items-center gap-1 py-6 px-2 text-center">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            <p className="text-[12px] text-zinc-600 leading-snug">{t('empty')}</p>
          </div>
        )}

        {!isLoading && online.length > 0 && (
          <div className="flex flex-col gap-0.5">
            {online.map((f) => {
              const color = avatarColor(f._id);
              return (
                <button
                  key={f._id}
                  onClick={() => { trackClick('sidebar:online_friend', { friendId: f._id }); router.push(`/messages?peer=${f._id}`); }}
                  aria-label={`${t('online')}: ${f.username}`}
                  className={`group flex items-center gap-2.5 px-1.5 h-10 rounded-lg text-[13px] text-zinc-300 hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors w-full text-left cursor-pointer ${FOCUS_RING}`}
                >
                  <div className="relative shrink-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white overflow-hidden ring-2 ring-emerald-400/40 group-hover:ring-emerald-400/70 transition-all"
                      style={{ background: f.avatar ? undefined : color }}
                    >
                      {f.avatar
                        ? <img src={f.avatar} alt="" className="w-full h-full object-cover" />
                        : (f.username?.[0]?.toUpperCase() ?? '?')}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0e0a20]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium leading-tight">{f.username}</p>
                    <p className="text-[10.5px] text-emerald-500/80 leading-tight">{t('online')}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Link
        href="/friends"
        onClick={() => trackClick('sidebar:see_all_friends')}
        className={`flex items-center justify-center h-10 text-[12px] font-medium text-violet-400/90 hover:text-violet-300 active:text-violet-200 hover:bg-white/[0.03] border-t border-white/[0.06] transition-colors shrink-0 ${FOCUS_RING}`}
      >
        {t('tabFriends')} →
      </Link>
    </div>
  );
}
