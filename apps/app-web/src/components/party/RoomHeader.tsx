'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Share2 } from 'lucide-react';
import { useWatchPartyStore } from '@/store/watch-party.store';
import { useAuthStore } from '@/store/auth.store';
import { useTranslations } from 'next-intl';
import { InviteDialog } from '@/components/party/InviteDialog';
import { LeaveRoomDialog } from '@/components/party/LeaveRoomDialog';
import { toast } from '@/store/toast.store';
import { trackClick } from '@/lib/analytics';
import { avatarColor } from '@/lib/utils';

export function RoomHeader() {
  const t = useTranslations('party');
  const tHome = useTranslations('home');
  const router = useRouter();
  const room = useWatchPartyStore((s) => s.room);
  const storeMembers = useWatchPartyStore((s) => s.members);
  const isConnected = useWatchPartyStore((s) => s.isConnected);
  const currentUser = useAuthStore((s) => s.user);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  // storeMembers is the live list (ROOM_JOINED seeds it, MEMBER_JOINED/MEMBER_LEFT keep it current);
  // room.members is the REST snapshot from page load and never changes afterwards. Reading the
  // snapshot first made the count go stale the moment someone joined — the face-pile showed three
  // avatars next to the number "2". Fall back to the snapshot only before the socket has joined.
  const memberCount = storeMembers.length || room?.members?.length || 0;
  const isOwner = !!currentUser && room?.ownerId === currentUser._id;
  const otherMembers = storeMembers.filter((m) => m._id !== currentUser?._id);

  async function handleLeaveClick() {
    trackClick('room:leave');
    if (!room?._id) { router.push('/home'); return; }

    if (isOwner && otherMembers.length > 0) {
      setLeaveOpen(true);
      return;
    }

    try {
      const url = isOwner ? `/api/rooms/${room._id}` : `/api/rooms/${room._id}/leave`;
      const res = await fetch(url, {
        method: isOwner ? 'DELETE' : 'POST',
        credentials: 'include',
        headers: isOwner ? undefined : { 'Content-Type': 'application/json' },
        body: isOwner ? undefined : JSON.stringify({}),
      });
      if (!res.ok) throw new Error('failed');
    } catch {
      toast.error(t('leaveError'));
    }
    router.push('/home');
  }

  return (
    <>
      <header className="relative z-10 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[var(--ww-line)] bg-[rgba(5,5,10,0.72)] px-3 backdrop-blur-xl sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {/* Ulanish holati. Jonli bo'lsa tarqaluvchi nuqta (.ww-live-dot) —
              statik nuqta qolgan kulrang chrome ichida ko'zga tashlanmasdi
              (foydalanuvchi fikri: xona "g'isht kabi"). Uzilganda animatsiya
              yo'q: qizil turg'un nuqta muammoni yaxshiroq bildiradi. */}
          {isConnected ? (
            <span
              className="ww-live-dot shrink-0"
              aria-label={t('connected')}
              /* .ww-live-dot o'zi qizil (jonli efir rangi) — bu yerda esa
                 "ulangan" ma'nosi, ya'ni yashil bo'lishi kerak. Klassni
                 nusxalash o'rniga u ishlatadigan o'zgaruvchi shu element
                 uchun qayta belgilanadi. */
              style={{ '--ww-live': 'var(--ww-online)' } as React.CSSProperties}
            />
          ) : (
            <span
              aria-label={t('disconnected')}
              className="h-2 w-2 shrink-0 rounded-full bg-[var(--ww-danger)]"
            />
          )}

          {/* Skeleton while the room is still loading rather than the generic "Watch Party"
              fallback — on a slow connection that fallback read as the room's actual name for
              seconds at a time (prod audit 2026-08-01, mobile). */}
          {room ? (
            <h1 className="truncate text-[15px] font-semibold leading-snug tracking-[-0.01em] text-[var(--ww-text)] sm:text-[16px]">
              {room.name ?? room.videoTitle ?? tHome('title')}
            </h1>
          ) : (
            <span className="skeleton h-4 w-32 shrink-0 rounded sm:w-44" aria-hidden="true" />
          )}

          {room?.videoPlatform && (
            <span className="hidden shrink-0 text-[10px] uppercase tracking-[0.12em] text-[var(--ww-text-4)] sm:inline">
              {room.videoPlatform}
            </span>
          )}

          {/* Face-pile — social presence beats a bare number: makes an otherwise plain text
              header feel like an actual room with people in it, not a settings page. */}
          <div className="flex shrink-0 items-center gap-1.5">
            <div className="flex items-center -space-x-2">
              {storeMembers.slice(0, 4).map((m) => (
                <span
                  key={m._id}
                  title={m.username}
                  /* Chegara fon rangida — avatarlar bir-birining ustiga
                     minganda ajralib turishi uchun. Ilgari `#09090B` qotirib
                     yozilgandi, yangi fon esa #05050A */
                  className="h-5 w-5 shrink-0 overflow-hidden rounded-full border-2 border-[var(--ww-bg)]"
                >
                  {m.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element -- user-uploaded avatar URL
                    <img src={m.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span
                      className="flex h-full w-full items-center justify-center text-[8px] font-bold text-white"
                      style={{ background: avatarColor(m.username ?? '?') }}
                    >
                      {(m.username?.[0] ?? '?').toUpperCase()}
                    </span>
                  )}
                </span>
              ))}
              {storeMembers.length > 4 && (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[var(--ww-bg)] bg-[var(--ww-surface-3)] text-[8px] font-semibold text-[var(--ww-text-2)]">
                  +{storeMembers.length - 4}
                </span>
              )}
            </div>
            <span className="text-[11px] tabular-nums text-[var(--ww-text-3)]">{memberCount}</span>
          </div>
        </div>

        {/* Labels drop below `sm` — at 390px the two labelled buttons pushed "leave" off the
            right edge of the screen (prod audit 2026-08-01). Icon-only keeps both reachable and
            still at a 36px target; the accessible name moves to aria-label. */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => { trackClick('room:open_invite'); setInviteOpen(true); }}
            aria-label={t('link')}
            className="ww-btn-subtle flex h-9 cursor-pointer items-center gap-1.5 rounded-[var(--ww-r-sm)] px-2.5 text-[12.5px] font-medium text-[var(--ww-text-2)] sm:px-3"
          >
            <Share2 size={14} aria-hidden="true" />
            <span className="hidden sm:inline">{t('link')}</span>
          </button>
          <button
            type="button"
            onClick={() => { void handleLeaveClick(); }}
            aria-label={t('leave')}
            className="flex h-9 cursor-pointer items-center gap-1.5 rounded-[var(--ww-r-sm)] border border-[var(--ww-danger-line)] bg-[var(--ww-danger-soft)] px-2.5 text-[12.5px] font-medium text-[var(--ww-danger)] transition-colors hover:bg-[rgba(255,107,107,0.18)] sm:px-3"
          >
            <LogOut size={14} aria-hidden="true" />
            <span className="hidden sm:inline">{t('leave')}</span>
          </button>
        </div>
      </header>

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      {room?._id && (
        <LeaveRoomDialog
          open={leaveOpen}
          onOpenChange={setLeaveOpen}
          roomId={room._id}
          otherMembers={otherMembers}
        />
      )}
    </>
  );
}
