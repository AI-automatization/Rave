'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { MessageCircle, Users as UsersIcon, ListVideo, X, ChevronRight, Loader2, Play, Globe } from 'lucide-react';
import type { IChatReplyTo } from '@/types';
import { useWatchParty } from '@/hooks/use-watch-party';
import { useVirtualBrowser } from '@/hooks/use-virtual-browser';
import { VideoPlayer } from '@/components/party/VideoPlayer';
import { VirtualBrowserPlayer } from '@/components/party/VirtualBrowserPlayer';
import { ChatPanel } from '@/components/party/ChatPanel';
import { MemberList } from '@/components/party/MemberList';
import { RoomHeader } from '@/components/party/RoomHeader';
import { EmojiReactions } from '@/components/party/EmojiReactions';
import { ReactionOverlay } from '@/components/party/ReactionOverlay';
import { UserProfileModal } from '@/components/profile/UserProfileModal';
import { VoiceStrip } from '@/components/party/VoiceStrip';
import { RoomPasswordDialog } from '@/components/party/RoomPasswordDialog';
import { useVoiceChat } from '@/hooks/use-voice-chat';
import { useSocket } from '@/hooks/use-socket';
import { roomsApi } from '@/lib/api/rooms.api';
import { useWatchPartyStore } from '@/store/watch-party.store';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/hooks/use-toast';
import { trackClick } from '@/lib/analytics';

interface PlaylistItem {
  videoUrl: string;
  videoTitle?: string;
  addedBy?: string;
  /** Background pre-resolve verdict (T-S173). Absent on items queued before that shipped. */
  resolveStatus?: 'pending' | 'ready' | 'needs_vb';
}

// Shows what the server found out about a queued link. Before T-S176 adding a URL gave no
// feedback at all — the owner only discovered a dead link when the room reached it.
function QueueStatusDot({ status, labels }: {
  status: PlaylistItem['resolveStatus'];
  labels: { pending: string; ready: string; needsVb: string };
}) {
  const map = {
    pending:  { color: 'bg-slate-500 animate-pulse', title: labels.pending },
    ready:    { color: 'bg-emerald-500',             title: labels.ready },
    needs_vb: { color: 'bg-amber-500',               title: labels.needsVb },
  } as const;
  // `pending` also covers a missing value: an item queued before the feature existed was never
  // probed, and claiming it is "ready" would be a guess.
  const s = map[status ?? 'pending'];
  return <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.color}`} title={s.title} />;
}

interface Props {
  roomId: string;
  /** ?code= from the share link — needed to retry the join once a password is supplied. */
  inviteCode?: string;
  /** Server-side join came back `password_required` (page.tsx). */
  needsPassword?: boolean;
}

// Same detection mobile/CreateRoomDialog use — only needs to be good enough for the
// videoPlatform field; the player itself dispatches on the URL, not this field (see VideoPlayer.tsx).
const YOUTUBE_RE = /youtube\.com|youtu\.be/;

function PlaylistPanel({
  roomId, isOwner, onPlayNow,
}: { roomId: string; isOwner: boolean; onPlayNow: (videoUrl: string, videoPlatform: string) => void }) {
  const t = useTranslations('party');
  const room = useWatchPartyStore((s) => s.room);
  const playlist = (room as unknown as { playlist?: PlaylistItem[] }).playlist ?? [];
  const [urlInput, setUrlInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);

  function handlePlayNow() {
    const url = urlInput.trim();
    if (!url) return;
    trackClick('room:playlist_play_now');
    const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    onPlayNow(normalizedUrl, YOUTUBE_RE.test(normalizedUrl) ? 'youtube' : 'other');
    setUrlInput('');
  }

  async function handleAdd() {
    if (!urlInput.trim()) return;
    trackClick('room:playlist_add');
    setAdding(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/playlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ videoUrl: urlInput.trim() }),
      });
      if (res.ok) {
        setUrlInput('');
        toast({ title: t('addToQueue') });
      } else {
        toast({ title: t('addError'), variant: 'destructive' });
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(index: number) {
    trackClick('room:playlist_remove');
    try {
      await fetch(`/api/rooms/${roomId}/playlist/${index}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch {
      toast({ title: t('removeError'), variant: 'destructive' });
    }
  }

  async function handleNext() {
    trackClick('room:playlist_next');
    setNextLoading(true);
    try {
      await fetch(`/api/rooms/${roomId}/playlist/next`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      toast({ title: t('skipError'), variant: 'destructive' });
    } finally {
      setNextLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {playlist.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
          >
            <ListVideo size={18} className="text-violet-400/70" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium">{t('queueEmpty')}</p>
            <p className="text-slate-600 text-[11px] mt-0.5">
              {isOwner ? t('queueEmptyHint') : t('queueEmptyHintMember')}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1.5">
          {playlist.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-2 py-1.5 group"
            >
              <span className="text-slate-600 text-[10px] w-4 shrink-0">{i + 1}</span>
              <QueueStatusDot
                status={item.resolveStatus}
                labels={{
                  pending: t('queueStatusPending'),
                  ready: t('queueStatusReady'),
                  needsVb: t('queueStatusNeedsVb'),
                }}
              />
              <p className="flex-1 text-xs text-slate-300 truncate">
                {item.videoTitle ?? item.videoUrl}
              </p>
              {isOwner && (
                <button
                  onClick={() => handleRemove(i)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isOwner && (
        <div className="border-t border-white/[0.06] p-2 flex flex-col gap-2">
          {playlist.length > 0 && (
            <button
              onClick={handleNext}
              disabled={nextLoading}
              className="h-8 w-full rounded-lg text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {nextLoading
                ? <Loader2 size={12} className="animate-spin" />
                : <><ChevronRight size={12} /> {t('next')}</>}
            </button>
          )}
          <div className="flex gap-1.5">
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              placeholder={t('videoUrlPlaceholder')}
              className="flex-1 h-8 px-2 rounded-lg text-xs bg-white/[0.06] border border-white/[0.08] text-white placeholder-slate-500 outline-none focus:border-violet-500/50"
            />
            <button
              onClick={handlePlayNow}
              disabled={!urlInput.trim()}
              title={t('playNow')}
              className="h-8 w-8 shrink-0 rounded-lg text-white bg-emerald-600 hover:bg-emerald-500 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center"
            >
              <Play size={12} fill="currentColor" />
            </button>
            <button
              onClick={handleAdd}
              disabled={adding || !urlInput.trim()}
              title={t('addToQueue')}
              className="h-8 px-3 rounded-lg text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 transition-colors cursor-pointer disabled:opacity-50"
            >
              {adding ? <Loader2 size={12} className="animate-spin" /> : '+'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type RightTab = 'chat' | 'members' | 'playlist';

// Tab bar + VoiceStrip + active tab content — shared between the desktop persistent sidebar and
// the mobile bottom sheet (T-S-mobile-room-panel, 2026-08-02) so there's exactly one copy of this
// logic, not two drifting implementations.
function RoomSidePanel({
  rightTab, setRightTab, isOwner, voice, roomId, sendMessage, setProfileUserId, sendMediaChange,
  kickMember, muteMember, unmuteMember,
}: {
  rightTab: RightTab;
  setRightTab: (t: RightTab) => void;
  isOwner: boolean;
  voice: ReturnType<typeof useVoiceChat>;
  roomId: string;
  sendMessage: (text: string, replyTo?: IChatReplyTo) => void;
  setProfileUserId: (id: string | null) => void;
  sendMediaChange: (videoUrl: string, videoTitle?: string, videoPlatform?: string) => void;
  kickMember: (targetUserId: string) => void;
  muteMember: (targetUserId: string) => void;
  unmuteMember: (targetUserId: string) => void;
}) {
  const t = useTranslations('party');
  return (
    <>
      {/* Active tab now gets a background pill, not just an underline — spec feedback called
          out that the active state wasn't obvious enough at a glance. Bar itself sits on
          transparent (no border-b) since the pill already separates it from the content below. */}
      <div className="flex gap-1.5 p-2 shrink-0">
        <button
          onClick={() => { trackClick('room:tab_chat'); setRightTab('chat'); }}
          className={`flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
            rightTab === 'chat' ? 'bg-violet-500/[0.14] text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
          }`}
        >
          <MessageCircle size={13} />
          {t('chat')}
        </button>
        <button
          onClick={() => { trackClick('room:tab_members'); setRightTab('members'); }}
          className={`flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
            rightTab === 'members' ? 'bg-violet-500/[0.14] text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
          }`}
        >
          <UsersIcon size={13} />
          {t('members')}
        </button>
        {isOwner && (
          <button
            onClick={() => { trackClick('room:tab_playlist'); setRightTab('playlist'); }}
            className={`flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
              rightTab === 'playlist' ? 'bg-violet-500/[0.14] text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
            }`}
          >
            <ListVideo size={13} />
            {t('queue')}
          </button>
        )}
      </div>

      {/* Above the tab content, not inside it: the mic control has to stay reachable no
          matter which tab is showing. */}
      <VoiceStrip
        isJoined={voice.isJoined}
        isMuted={voice.isMuted}
        forcedMuted={voice.forcedMuted}
        isLoading={voice.isLoading}
        errorMsg={voice.errorMsg}
        participants={voice.participants}
        isOwner={isOwner}
        onToggleMute={voice.toggleMute}
        onLeave={voice.leaveVoice}
        onJoin={voice.joinVoice}
        onSetVolume={voice.setParticipantVolume}
        onMuteMember={muteMember}
        onUnmuteMember={unmuteMember}
      />

      {/* flex-1 min-h-0 is load-bearing here — without it, a flex column with no explicit height
          on any ancestor lets its content grow instead of scroll (browsers default flex items to
          min-height:auto). ChatPanel's own `overflow-y-auto` never kicked in because of this —
          with many messages the whole sidebar just grew past the viewport, pushing the tab bar
          off-screen, instead of scrolling internally. Real-user report: "chat breaks with a lot
          of messages" — this is why. */}
      <div className="flex-1 min-h-0 flex flex-col">
        {rightTab === 'chat' && <ChatPanel onSend={sendMessage} onOpenProfile={setProfileUserId} />}
        {rightTab === 'members' && <MemberList isOwner={isOwner} onKick={kickMember} />}
        {rightTab === 'playlist' && (
          <PlaylistPanel
            roomId={roomId}
            isOwner={isOwner}
            onPlayNow={(videoUrl, videoPlatform) => sendMediaChange(videoUrl, undefined, videoPlatform)}
          />
        )}
      </div>
    </>
  );
}

export function RoomContent({ roomId, inviteCode, needsPassword = false }: Props) {
  const t = useTranslations('party');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { sendMessage, sendPlay, sendPause, sendSeek, sendEmoji, sendHeartbeat, sendBufferStart, sendBufferEnd, sendMediaChange, reactions, reactionCooldownSec, kickMember, muteMember, unmuteMember, renameRoom } = useWatchParty(roomId);
  const [rightTab, setRightTab] = useState<RightTab>('chat');
  /** Whose profile the modal is showing — `null` means closed. */
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const setRoom = useWatchPartyStore((s) => s.setRoom);
  const reset = useWatchPartyStore((s) => s.reset);
  const room = useWatchPartyStore((s) => s.room);
  const roomJoined = useWatchPartyStore((s) => s.roomJoined);

  // Voice runs for the whole room session, not just while the chat tab is open — leaving the tab
  // must not drop the call. Gated on roomJoined because the server only accepts voice:join once
  // the socket has an attached roomId (voiceEvents.handler.ts returns early otherwise).
  const { socket } = useSocket();
  const currentUser = useAuthStore((s) => s.user);
  const voice = useVoiceChat(socket, roomJoined, currentUser?._id);
  const isConnected = useWatchPartyStore((s) => s.isConnected);
  const isOwner = !!(room && currentUser && room.ownerId === currentUser._id);

  // Kosmi-style shared virtual browser — owner opens a URL in a server-side headless browser,
  // everyone in the room watches the same live stream. `vbActive` is broadcast-driven (true for
  // EVERY member the instant the owner starts a session) — `showVBPanel` is purely local, lets
  // the owner reveal the "enter a URL" form before anything is actually running yet.
  const { frame: vbFrame, active: vbActive, dimensions: vbDimensions, error: vbError, remoteCursor: vbRemoteCursor, start: vbStart, stop: vbStop, sendInput: vbSendInput } = useVirtualBrowser(isOwner);
  const [showVBPanel, setShowVBPanel] = useState(false);
  const showVB = vbActive || (isOwner && showVBPanel);
  const handleVBStop = () => { vbStop(); setShowVBPanel(false); };

  // Extraction reporting "success" (found a videoUrl) doesn't guarantee our own proxy can
  // actually retrieve it — a file-host mirror 403ing our proxied request is a different failure
  // class than a broken URL outright (confirmed live 2026-08-03/04: extraction succeeded, the
  // video area just showed "Видео не загрузилось" / sat on the autoplay overlay forever, no
  // fallback ever kicked in). Mobile already has this exact recovery path (WatchPartyScreen.tsx
  // handleVideoFatalError) — web never did. Same shape here: owner-only, once per videoUrl,
  // falls back to the shared Virtual Browser on the original page.
  const vbFallbackTriedRef = useRef(false);
  useEffect(() => { vbFallbackTriedRef.current = false; }, [room?.videoUrl]);
  const handleVideoFatalError = useCallback(() => {
    if (!isOwner || showVB || vbFallbackTriedRef.current) return;
    const url = room?.videoUrl;
    if (!url) return;
    vbFallbackTriedRef.current = true;
    vbStart(url);
  }, [isOwner, showVB, room?.videoUrl, vbStart]);

  // Pre-load room via REST immediately — don't wait 2-3s for socket ROOM_JOINED
  useEffect(() => {
    let mounted = true;
    roomsApi.getById(roomId).then((res) => {
      if (mounted && res.data) setRoom(res.data);
    }).catch(() => {});
    return () => {
      mounted = false;
      // Reset store when leaving room so stale data doesn't flash on next room visit
      reset();
    };
  }, [roomId, setRoom, reset]);

  // Room creation (CreateRoomDialog) is a plain REST call with no socket/room context yet, so it
  // can't run the extraction-then-VB-fallback check CHANGE_MEDIA does (roomEvents.handler.ts) —
  // a URL that needs VB would otherwise just sit there showing "failed to load video" forever.
  // ?verify=1 means "re-submit the room's initial video through CHANGE_MEDIA once the socket is
  // up" — harmless for URLs that already work (server skips the check for official embeds, and
  // broadcasts the same unchanged value for everything else), fixes the ones that don't.
  //
  // Must wait for `roomJoined` (ROOM_JOINED actually received), not just `room` being populated —
  // `room` gets filled in fast from the REST preload above, well before the socket's own
  // JOIN_ROOM round-trip finishes. Firing CHANGE_MEDIA before that lands as "socket has no
  // roomId" server-side and gets silently dropped — a real race that broke this exact fix live.
  const verifiedInitialVideo = useRef(false);
  useEffect(() => {
    if (verifiedInitialVideo.current) return;
    if (searchParams.get('verify') !== '1') return;
    if (!roomJoined || !room?.videoUrl) return;
    verifiedInitialVideo.current = true;
    sendMediaChange(room.videoUrl, room.videoTitle ?? undefined, room.videoPlatform ?? undefined);
    router.replace(`/room/${roomId}`); // strip the param — a refresh shouldn't re-trigger this
  }, [searchParams, room, roomJoined, roomId, sendMediaChange, router]);

  return (
    // No -m-4/md:-m-6/lg:-m-8 or `100vh-3rem` height math needed anymore — the room route no
    // longer sits inside (app)/layout.tsx's padded `main` or under the global AppNav (both are
    // hidden for /room/* so this component owns the full viewport itself).
    <div className="relative flex flex-col h-screen overflow-hidden">
      {/* Ambient depth — real-user feedback (2026-07-28): the room "feels like a brick", too dark,
          doesn't feel alive. Root cause was that this glow sat at 6-12% opacity — a fraction of
          what /home's own background actually uses (see globals.css body{} — 48%/22%/10%). Panels
          on top were also flat near-opaque black instead of the app's own `.liquid-glass` violet
          tint, so almost none of this ever showed through. Matched to /home's real intensity, plus
          a slow drift so the glow itself reads as motion, not a static poster behind the UI. */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 75% 55% at 25% -5%, rgba(124,58,237,0.32), transparent 62%), ' +
            'radial-gradient(ellipse 55% 45% at 100% 105%, rgba(34,211,238,0.16), transparent 60%), ' +
            'radial-gradient(ellipse 40% 35% at 90% 0%, rgba(124,58,237,0.18), transparent 55%)',
        }}
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 flex flex-col h-full">
        <RoomHeader renameRoom={renameRoom} />

        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Left: Video — no longer bare `flex-1` (that made it stretch to swallow the sidebar's
              space on mobile when the sidebar was hidden). `md:flex-1` only grows it to fill
              leftover WIDTH once the layout is a row (md+); on mobile (column) it stays its
              natural aspect-ratio height so the panel below has room.
              `overflow-y-auto` (added 2026-08-04): the video is `aspect-video` sized off the
              column's full WIDTH — on a wide-but-short desktop window that height can exceed the
              row's own stretched height, and this column had no scroll of its own, so the excess
              (VB button, emoji reactions) got silently clipped by the parent row's
              `overflow-hidden` — invisible, not just visually cramped (real report 2026-08-03:
              "где реакции???", root-caused live via a Safari screenshot at a short window size).
              Scoped to md+ only: on mobile the column is already natural-height (shrink-0, no
              flex stretch), so there's nothing to scroll there in the first place. */}
          <div className="shrink-0 md:flex-1 flex flex-col p-3 sm:p-5 gap-3 sm:gap-4 min-w-0 md:overflow-y-auto">
            {/* Thin glow frame around the player only (not the toolbar below it) — a colored ring
                signals "this is the live, active surface of the room" instead of the video sitting
                as a bare black rectangle indistinguishable from a broken embed. */}
            <div
              className="relative rounded-xl"
              style={{ boxShadow: isConnected ? '0 0 0 1px rgba(124,58,237,0.35), 0 0 32px rgba(124,58,237,0.12)' : 'none' }}
            >
            <ReactionOverlay reactions={reactions} />
            {showVB ? (
              <VirtualBrowserPlayer
                isOwner={isOwner}
                frame={vbFrame}
                dimensions={vbDimensions}
                error={vbError}
                remoteCursor={vbRemoteCursor}
                start={vbStart}
                stop={handleVBStop}
                sendInput={vbSendInput}
              />
            ) : (
              <VideoPlayer
                onPlay={sendPlay}
                onPause={sendPause}
                onSeek={sendSeek}
                onHeartbeat={sendHeartbeat}
                onBufferStart={sendBufferStart}
                onBufferEnd={sendBufferEnd}
                onFatalError={handleVideoFatalError}
              />
            )}
            </div>

            {isOwner && !showVB && (
              <button
                onClick={() => { trackClick('room:open_vb_panel'); setShowVBPanel(true); }}
                className="self-start flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium text-zinc-400 hover:text-white border border-white/[0.08] hover:border-white/[0.16] transition-colors cursor-pointer"
              >
                <Globe size={13} />
                {t('virtualBrowser')}
              </button>
            )}

            <EmojiReactions onSend={sendEmoji} cooldownSec={reactionCooldownSec} />
          </div>

          {/* Right: Chat / Members / Playlist / Voice — glass-panel matches the violet-tinted
              surface every other page already uses (see globals.css); the flat neutral rgba this
              replaced is exactly why the sidebar read as dead weight next to a colorful room.
              Redesigned 2026-08-04: used to be `hidden md:flex`, reachable on mobile only through
              a bottom sheet that covered ~75% of the screen (video peeking out above it) — real
              report: "нужно чтобы пользователь мог одновременно нормально смотреть видео и писать
              в чат и разговаривать" (watch video, chat, and talk AT THE SAME TIME, not one modal
              at a time). Below md this now stacks directly under the video instead — video keeps
              its natural aspect-ratio height (no longer stretched by a `flex-1` fighting an empty
              sidebar), panel takes the rest via its own `flex-1`. Row layout only from md up. */}
          <div
            className="glass-panel flex flex-col flex-1 min-h-0 md:flex-none md:w-80 rounded-none border-t border-white/[0.06] md:border-t-0 md:!border-y-0 md:!border-r-0"
          >
            <RoomSidePanel
              rightTab={rightTab}
              setRightTab={setRightTab}
              isOwner={isOwner}
              voice={voice}
              roomId={roomId}
              sendMessage={sendMessage}
              setProfileUserId={setProfileUserId}
              sendMediaChange={sendMediaChange}
              kickMember={kickMember}
              muteMember={muteMember}
              unmuteMember={unmuteMember}
            />
          </div>
        </div>
        </div>


      <UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />

      {/* router.refresh() is not enough here: membership is established server-side and the socket
          has already tried (and failed) to join, so the connection has to be rebuilt from scratch —
          a full reload is the honest way to do that. */}
      {needsPassword && inviteCode && (
        <RoomPasswordDialog
          open
          inviteCode={inviteCode}
          onJoined={() => window.location.reload()}
        />
      )}
    </div>
  );
}
