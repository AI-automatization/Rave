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

const MAX_SHOWN = 6;

export function OnlineFriendsWidget() {
  const t = useTranslations('friends');
  const router = useRouter();
  const { data: friends } = useFriends();

  const online = (friends ?? []).filter((f) => f.isOnline);

  return (
    <div className="px-2 mt-3">
      <div className="flex items-center justify-between px-2 mb-1.5">
        <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-700 uppercase">
          {t('tabFriends')}
        </p>
        {online.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {online.length}
          </span>
        )}
      </div>

      {online.length === 0 ? (
        <p className="px-2 text-[12px] text-zinc-600">{t('empty')}</p>
      ) : (
        <div className="flex flex-col gap-0.5">
          {online.slice(0, MAX_SHOWN).map((f) => {
            const color = avatarColor(f._id);
            return (
              <button
                key={f._id}
                onClick={() => { trackClick('sidebar:online_friend', { friendId: f._id }); router.push(`/messages?peer=${f._id}`); }}
                className="flex items-center gap-2.5 px-2 h-8 rounded-md text-[13px] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors w-full text-left cursor-pointer"
              >
                <div className="relative shrink-0">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white overflow-hidden"
                    style={{ background: f.avatar ? undefined : color }}
                  >
                    {f.avatar
                      ? <img src={f.avatar} alt="" className="w-full h-full object-cover" />
                      : (f.username?.[0]?.toUpperCase() ?? '?')}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border-2 border-[#07070D]" />
                </div>
                <span className="flex-1 truncate">{f.username}</span>
              </button>
            );
          })}
        </div>
      )}

      {(friends?.length ?? 0) > 0 && (
        <Link
          href="/friends"
          onClick={() => trackClick('sidebar:see_all_friends')}
          className="block px-2 mt-1 text-[12px] text-violet-400/80 hover:text-violet-300 transition-colors"
        >
          {t('tabFriends')} →
        </Link>
      )}
    </div>
  );
}
