'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
      <div className="glass-nav relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-2.5 min-w-0">
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

          {/* Skeleton while the room is still loading rather than the generic "Watch Party"
              fallback — on a slow connection that fallback read as the room's actual name for
              seconds at a time (prod audit 2026-08-01, mobile). */}
          {room ? (
            <h2 className="font-[family-name:var(--font-display)] text-[15px] sm:text-[16px] font-medium tracking-wide text-white truncate leading-snug">
              {room.name ?? room.videoTitle ?? tHome('title')}
            </h2>
          ) : (
            <div className="skeleton h-4 w-32 sm:w-44 rounded shrink-0" aria-hidden="true" />
          )}

          {room?.videoPlatform && (
            <span className="hidden sm:inline text-[10px] text-slate-600 uppercase tracking-wide shrink-0">
              {room.videoPlatform}
            </span>
          )}

          {/* Face-pile — social presence beats a bare number: makes an otherwise plain text
              header feel like an actual room with people in it, not a settings page. */}
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
            <span className="text-[11px] text-slate-500">{memberCount}</span>
          </div>
        </div>

        {/* Labels drop below `sm` — at 390px the two labelled buttons pushed "leave" off the
            right edge of the screen (prod audit 2026-08-01). Icon-only keeps both reachable and
            still at a 36px target; the accessible name moves to aria-label. */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => { trackClick('room:open_invite'); setInviteOpen(true); }}
            aria-label={t('link')}
            className="h-9 px-2.5 sm:px-3 rounded-lg text-xs font-medium text-zinc-300 bg-white/[0.05] border border-white/[0.09] hover:bg-white/[0.1] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 size={13} />
            <span className="hidden sm:inline">{t('link')}</span>
          </button>
          <button
            onClick={() => { void handleLeaveClick(); }}
            aria-label={t('leave')}
            className="h-9 px-2.5 sm:px-3 rounded-lg text-xs font-medium text-red-400 bg-red-500/[0.07] border border-red-500/[0.15] hover:bg-red-500/[0.14] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">{t('leave')}</span>
          </button>
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
