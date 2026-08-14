'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Share2, MoreVertical, Pencil, Check, X, Clapperboard, Link2 } from 'lucide-react';
import { useWatchPartyStore } from '@/store/watch-party.store';
import { useAuthStore } from '@/store/auth.store';
import { useTranslations } from 'next-intl';
import { InviteDialog } from '@/components/party/InviteDialog';
import { LeaveRoomDialog } from '@/components/party/LeaveRoomDialog';
import { toast } from '@/store/toast.store';
import { trackClick } from '@/lib/analytics';
import { avatarColor } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface Props {
  renameRoom: (name: string) => void;
  /** Opens the video-candidate picker (T-S189 follow-up) — owner-only, wired from RoomContent
   * since the socket state/emit lives there, same reason renameRoom is a prop here too. */
  onPickDifferentVideo: () => void;
  /** Switches the sidebar to the Queue tab (where the existing URL input + "Play Now" lives) —
   * just a reachability shortcut, doesn't duplicate any UI. */
  onChangeSource: () => void;
}

export function RoomHeader({ renameRoom, onPickDifferentVideo, onChangeSource }: Props) {
  const t = useTranslations('party');
  const tHome = useTranslations('home');
  const router = useRouter();
  const room = useWatchPartyStore((s) => s.room);
  const storeMembers = useWatchPartyStore((s) => s.members);
  const isConnected = useWatchPartyStore((s) => s.isConnected);
  const currentUser = useAuthStore((s) => s.user);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

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

  function startEditingName() {
    setNameDraft(room?.name ?? room?.videoTitle ?? '');
    setIsEditingName(true);
  }

  function submitRename() {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== room?.name) {
      renameRoom(trimmed);
    }
    setIsEditingName(false);
  }

  return (
    <>
      <header className="relative z-10 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[var(--ww-line)] bg-[rgba(5,5,10,0.72)] px-3 backdrop-blur-xl sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {/* Ulanish holati. Jonli bo'lsa tarqaluvchi nuqta (.ww-live-dot, o'zining CSS
              pulse animatsiyasi bilan) — statik nuqta qolgan kulrang chrome ichida ko'zga
              tashlanmasdi (foydalanuvchi fikri: xona "g'isht kabi"). Uzilganda animatsiya
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
          {!room ? (
            <span className="skeleton h-4 w-32 shrink-0 rounded sm:w-44" aria-hidden="true" />
          ) : isEditingName ? (
            <div className="flex min-w-0 items-center gap-1">
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitRename();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                maxLength={80}
                className="ww-field h-8 w-40 min-w-0 px-2 text-[15px] font-medium sm:w-56"
              />
              <button
                onClick={submitRename}
                aria-label={t('save')}
                className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded text-[var(--ww-online)] hover:bg-[var(--ww-surface-2)]"
              >
                <Check size={13} />
              </button>
              <button
                onClick={() => setIsEditingName(false)}
                aria-label={t('cancel')}
                className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded text-[var(--ww-text-4)] hover:bg-[var(--ww-surface-2)]"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <div className="flex min-w-0 items-center gap-1.5">
              <h1 className="truncate text-[15px] font-semibold leading-snug tracking-[-0.01em] text-[var(--ww-text)] sm:text-[16px]">
                {room.name ?? room.videoTitle ?? tHome('title')}
              </h1>
              {isOwner && (
                <button
                  onClick={startEditingName}
                  aria-label={t('renameRoom')}
                  className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-[var(--ww-text-4)] transition-colors hover:bg-[var(--ww-surface-2)] hover:text-[var(--ww-text-2)]"
                >
                  <Pencil size={11} />
                </button>
              )}
            </div>
          )}

          {room?.videoPlatform && (
            <span className="hidden shrink-0 text-[10px] uppercase tracking-[0.12em] text-[var(--ww-text-4)] sm:inline">
              {room.videoPlatform}
            </span>
          )}

          {/* Face-pile — social presence beats a bare number: makes an otherwise plain text
              header feel like an actual room with people in it, not a settings page. On phones
              (real report 2026-08-03: header content clipped past the screen edge, "1 участники"
              cut off entirely) the count next to it is a bare tabular number, not a "N members"
              label — the avatars alone already say "people are here". */}
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

        <div className="flex shrink-0 items-center gap-1.5">
          {/* Primary action — renamed from "Ссылка" (link? copy? share? — unclear what happens)
              to "Пригласить" (invite), which names the outcome instead of the mechanism. Text
              label drops below sm — icon-only keeps a full 44px+ touch target without forcing
              the title down to a 3-character sliver on a phone-width header. */}
          <button
            type="button"
            onClick={() => { trackClick('room:open_invite'); setInviteOpen(true); }}
            aria-label={t('invite')}
            className="ww-btn-accent flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-[var(--ww-r-sm)] px-2.5 text-[12.5px] font-medium sm:px-3"
          >
            <Share2 size={14} aria-hidden="true" />
            <span className="hidden sm:inline">{t('invite')}</span>
          </button>

          {/* Leave used to sit at the same visual weight as Invite (same size, one bg-color swap
              away from looking like a co-equal action) — real-user feedback flagged this as a
              destructive action reading as just another primary button. Tucked behind an
              overflow menu instead, same "dangerous action lives in a secondary spot" pattern
              already used for logout elsewhere in this app (AppNav account popover). */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label={t('leave')}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[var(--ww-r-sm)] text-[var(--ww-text-3)] transition-colors hover:bg-[var(--ww-surface-2)] hover:text-[var(--ww-text)]"
              >
                <MoreVertical size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwner && (
                <>
                  <DropdownMenuItem
                    onClick={() => { trackClick('room:menu_pick_different_video'); onPickDifferentVideo(); }}
                  >
                    <Clapperboard size={13} className="mr-2" />
                    {t('pickDifferentVideo')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => { trackClick('room:menu_change_source'); onChangeSource(); }}
                  >
                    <Link2 size={13} className="mr-2" />
                    {t('changeSource')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={() => { void handleLeaveClick(); }}
                className="text-[var(--ww-danger)] focus:bg-[var(--ww-danger-soft)] focus:text-[var(--ww-danger)]"
              >
                <LogOut size={13} className="mr-2" />
                {t('leave')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
