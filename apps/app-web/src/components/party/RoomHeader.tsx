'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
  const memberCount = storeMembers.length || ((room as any)?.members as unknown[])?.length || 0;
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
      <div className="glass-nav relative z-10 flex items-center justify-between gap-2 px-3 sm:px-5 py-3.5 border-b border-white/[0.07] overflow-hidden">
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          {/* Connection dot — a live pulse reads as "this room is actually alive right now" at a
              glance, where a static dot (the previous state) blended into the rest of the muted
              chrome and went unnoticed (real-user feedback: room "feels like a brick"). */}
          <span className="relative flex w-2 h-2 shrink-0">
            {isConnected && (
              <motion.span
                className="absolute inset-0 rounded-full bg-emerald-400"
                animate={{ scale: [1, 2.2], opacity: [0.55, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
            <span
              className="relative w-2 h-2 rounded-full"
              style={{ background: isConnected ? '#34d399' : '#f87171' }}
            />
          </span>

          {isEditingName ? (
            <div className="flex items-center gap-1 min-w-0">
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitRename();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                maxLength={80}
                className="min-w-0 w-40 sm:w-56 bg-white/[0.06] border border-white/[0.12] rounded-md px-2 py-0.5 text-[15px] font-medium text-white outline-none focus:border-violet-500/50"
              />
              <button
                onClick={submitRename}
                aria-label={t('save')}
                className="h-6 w-6 rounded text-emerald-400 hover:bg-white/[0.06] flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Check size={13} />
              </button>
              <button
                onClick={() => setIsEditingName(false)}
                aria-label={t('cancel')}
                className="h-6 w-6 rounded text-zinc-500 hover:bg-white/[0.06] flex items-center justify-center shrink-0 cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <h2
                className="font-[family-name:var(--font-display)] text-[16px] font-medium tracking-wide text-white truncate leading-snug"
              >
                {room?.name ?? room?.videoTitle ?? tHome('title')}
              </h2>
              {isOwner && (
                <button
                  onClick={startEditingName}
                  aria-label={t('renameRoom')}
                  className="h-5 w-5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Pencil size={11} />
                </button>
              )}
            </div>
          )}

          {room?.videoPlatform && (
            <span className="hidden sm:inline text-[10px] text-slate-600 uppercase tracking-wide shrink-0">
              {room.videoPlatform}
            </span>
          )}

          {/* Face-pile — social presence beats a bare number: makes an otherwise plain text
              header feel like an actual room with people in it, not a settings page. On phones
              (real report 2026-08-03: header content clipped past the screen edge, "1 участники"
              cut off entirely) the numeric label is the first thing to go — the avatars alone
              already say "people are here", the exact count isn't worth the width on a 360-400px
              screen once title + invite + overflow menu are already fighting for the same row. */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center -space-x-2">
              {storeMembers.slice(0, 4).map((m) => (
                <div
                  key={m._id}
                  title={m.username}
                  className="w-5 h-5 rounded-full border-2 border-[#09090B] overflow-hidden shrink-0"
                >
                  {m.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element -- user-uploaded avatar URL
                    <img src={m.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-[8px] font-bold text-white"
                      style={{ background: avatarColor(m.username ?? '?') }}
                    >
                      {(m.username?.[0] ?? '?').toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
              {storeMembers.length > 4 && (
                <div className="w-5 h-5 rounded-full border-2 border-[#09090B] bg-white/10 flex items-center justify-center text-[8px] font-semibold text-zinc-300 shrink-0">
                  +{storeMembers.length - 4}
                </div>
              )}
            </div>
            <span className="hidden sm:inline text-[11px] text-slate-500">{memberCount} {t('members').toLowerCase()}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Primary action — renamed from "Ссылка" (link? copy? share? — unclear what happens)
              to "Пригласить" (invite), which names the outcome instead of the mechanism. Text
              label drops below sm — icon-only keeps a full 44px+ touch target without forcing
              the title down to a 3-character sliver on a phone-width header. */}
          <button
            onClick={() => { trackClick('room:open_invite'); setInviteOpen(true); }}
            aria-label={t('invite')}
            className="h-8 px-2.5 sm:px-3 rounded-lg text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Share2 size={12} />
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
                className="h-8 w-8 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors flex items-center justify-center cursor-pointer"
              >
                <MoreVertical size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#16162a] border-white/[0.08] text-white/90">
              {isOwner && (
                <>
                  <DropdownMenuItem
                    onClick={() => { trackClick('room:menu_pick_different_video'); onPickDifferentVideo(); }}
                    className="cursor-pointer"
                  >
                    <Clapperboard size={13} className="mr-2" />
                    {t('pickDifferentVideo')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => { trackClick('room:menu_change_source'); onChangeSource(); }}
                    className="cursor-pointer"
                  >
                    <Link2 size={13} className="mr-2" />
                    {t('changeSource')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/[0.08]" />
                </>
              )}
              <DropdownMenuItem
                onClick={() => { void handleLeaveClick(); }}
                className="text-red-400 focus:bg-red-500/[0.1] focus:text-red-400 cursor-pointer"
              >
                <LogOut size={13} className="mr-2" />
                {t('leave')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

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
