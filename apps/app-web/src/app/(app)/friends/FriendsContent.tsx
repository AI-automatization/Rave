'use client';

/**
 * Do'stlar sahifasi — WW v2 ("Kinematik dark") ga ko'chirilgan (T-S195).
 *
 * Tuzilma /notifications bilan bir xil: sahifa sarlavhasi panel ichida emas,
 * ro'yxat esa bitta `.ww-card` ichidagi chegara bilan ajratilgan qatorlar.
 */

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Inbox, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useFriends, useFriendRequests } from '@/hooks/use-friends';
import { useAuthStore } from '@/store/auth.store';
import { FriendCard } from '@/components/friends/FriendCard';
import { RequestCard } from '@/components/friends/RequestCard';
import { FriendSearch } from '@/components/friends/FriendSearch';
import { trackClick } from '@/lib/analytics';

type Tab = 'friends' | 'requests' | 'search';
const TABS: Tab[] = ['friends', 'requests', 'search'];

/** Haqiqiy qator shaklidagi skeleton — ma'lumot kelganda tartib siljimaydi */
function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--ww-line)] px-4 py-3.5 last:border-0">
      <div className="skeleton h-10 w-10 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-2.5 w-1/5 rounded" />
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--ww-line)] bg-[var(--ww-surface-1)]">
        <Icon size={20} aria-hidden="true" className="text-[var(--ww-text-4)]" />
      </span>
      <p className="text-[13px] text-[var(--ww-text-3)]">{text}</p>
    </div>
  );
}

export function FriendsContent() {
  const t = useTranslations('friends');
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>('friends');
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});

  const { data: friends, isLoading: loadingFriends } = useFriends();
  const { data: requests, isLoading: loadingRequests } = useFriendRequests();

  const labels: Record<Tab, string> = {
    friends: t('tabFriends'),
    requests: t('tabRequests'),
    search: t('tabSearch'),
  };
  const counts: Partial<Record<Tab, number | undefined>> = {
    friends: friends?.length,
    requests: requests?.length,
  };

  function select(next: Tab) {
    trackClick('friends:tab', { tab: next });
    setTab(next);
  }

  /* WAI-ARIA tab naqshi: o'q tugmalari bilan almashish + roving tabindex.
     Ilgari bular bir-biriga bog'liqligi belgilanmagan oddiy tugmalar edi —
     ekran o'quvchi ularni guruh sifatida ko'rmasdi. */
  function onTabKeyDown(e: React.KeyboardEvent) {
    const i = TABS.indexOf(tab);
    let next: Tab | null = null;
    if (e.key === 'ArrowRight') next = TABS[(i + 1) % TABS.length];
    else if (e.key === 'ArrowLeft') next = TABS[(i - 1 + TABS.length) % TABS.length];
    else if (e.key === 'Home') next = TABS[0];
    else if (e.key === 'End') next = TABS[TABS.length - 1];
    if (!next) return;
    e.preventDefault();
    select(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-[26px] font-semibold tracking-[-0.025em] text-[var(--ww-text)] sm:text-[30px]">
          {t('title')}
        </h1>
        {friends && friends.length > 0 && (
          <p className="mt-1 text-[13px] text-[var(--ww-text-3)]">
            {t('friendCount', { count: friends.length })}
          </p>
        )}
      </header>

      {/* Segment boshqaruvi. `.ww-card` emas — uning `--ww-r-lg` radiusi qatlamsiz
          CSS bo'lgani uchun Tailwind bilan kichraytirib bo'lmaydi (globals.css
          dagi `.ww-otp` izohiga qarang), shuning uchun sirt bu yerda to'g'ridan
          tokenlardan yig'ilgan. */}
      <div
        role="tablist"
        aria-label={t('title')}
        onKeyDown={onTabKeyDown}
        className="flex gap-1 rounded-[var(--ww-r-md)] border border-[var(--ww-line)] bg-[var(--ww-surface-1)] p-1"
      >
        {TABS.map((key) => {
          const active = tab === key;
          const count = counts[key];
          return (
            <button
              key={key}
              ref={(el) => { tabRefs.current[key] = el; }}
              type="button"
              role="tab"
              id={`friends-tab-${key}`}
              aria-selected={active}
              aria-controls={`friends-panel-${key}`}
              tabIndex={active ? 0 : -1}
              onClick={() => select(key)}
              className={`flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[var(--ww-r-sm)] text-[13px] font-medium transition-colors ${
                active
                  ? 'bg-[var(--ww-surface-3)] text-[var(--ww-text)]'
                  : 'text-[var(--ww-text-3)] hover:bg-[var(--ww-surface-1)] hover:text-[var(--ww-text-2)]'
              }`}
            >
              {labels[key]}
              {count !== undefined && count > 0 && (
                <span
                  className={`text-[11.5px] tabular-nums ${
                    active ? 'text-[var(--ww-accent-hi)]' : 'text-[var(--ww-text-4)]'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === 'friends' && (
        <div role="tabpanel" id="friends-panel-friends" aria-labelledby="friends-tab-friends">
          {loadingFriends && (
            <div className="ww-card overflow-hidden" aria-busy="true">
              {[0, 1, 2].map((i) => <RowSkeleton key={i} />)}
            </div>
          )}
          {!loadingFriends && (!friends || friends.length === 0) && (
            <div className="ww-card">
              <EmptyState icon={Users} text={t('empty')} />
            </div>
          )}
          {!loadingFriends && friends && friends.length > 0 && (
            <ul className="ww-card ww-rise overflow-hidden">
              {friends.map((f) => (
                <FriendCard
                  key={f._id}
                  user={f}
                  onMessage={() => { trackClick('friends:message'); router.push(`/messages?peer=${f._id}`); }}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div role="tabpanel" id="friends-panel-requests" aria-labelledby="friends-tab-requests">
          {loadingRequests && (
            <div className="ww-card overflow-hidden" aria-busy="true">
              {[0, 1].map((i) => <RowSkeleton key={i} />)}
            </div>
          )}
          {!loadingRequests && (!requests || requests.length === 0) && (
            <div className="ww-card">
              <EmptyState icon={Inbox} text={t('noRequests')} />
            </div>
          )}
          {!loadingRequests && requests && requests.length > 0 && (
            <ul className="ww-card ww-rise overflow-hidden">
              {requests.map((req) => (
                <RequestCard key={req._id} request={req} currentUserId={currentUser?._id ?? ''} />
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'search' && (
        <div role="tabpanel" id="friends-panel-search" aria-labelledby="friends-tab-search">
          <FriendSearch />
        </div>
      )}
    </div>
  );
}
