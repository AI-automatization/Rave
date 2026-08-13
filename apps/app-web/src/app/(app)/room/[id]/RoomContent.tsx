'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { MessageCircle, Users as UsersIcon, ListVideo, X, ChevronRight, Loader2, Play, Plus, Globe } from 'lucide-react';
import type { IChatReplyTo, VideoCandidate } from '@/types';
import { useWatchParty } from '@/hooks/use-watch-party';
import { useVirtualBrowser } from '@/hooks/use-virtual-browser';
import { VideoPlayer } from '@/components/party/VideoPlayer';
import { VirtualBrowserPlayer } from '@/components/party/VirtualBrowserPlayer';
import { ChatPanel } from '@/components/party/ChatPanel';
import { MemberList } from '@/components/party/MemberList';
import { RoomHeader } from '@/components/party/RoomHeader';
import { EmojiReactions } from '@/components/party/EmojiReactions';
import { ReactionOverlay } from '@/components/party/ReactionOverlay';
import { VideoCandidatePicker } from '@/components/party/VideoCandidatePicker';
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
    pending:  { color: 'bg-[var(--ww-text-4)] animate-pulse', title: labels.pending },
    ready:    { color: 'bg-[var(--ww-online)]',               title: labels.ready },
    needs_vb: { color: 'bg-[var(--ww-streak)]',               title: labels.needsVb },
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

// Shared by PlaylistPanel's "Play Now" and the video-candidate picker's confirm action — both
// ultimately call sendMediaChange with a raw URL and need the same rough videoPlatform guess.
function detectVideoPlatform(url: string): string {
  return YOUTUBE_RE.test(url) ? 'youtube' : 'other';
}

// vbSession.helper.ts (services/watch-party) wraps whatever media VB finds into
// `<watchPartyServiceUrl>/api/v1/watch-party/vb-media-proxy/stream.<ext>?url=<encoded original>`
// (proxiedMediaUrl()) and broadcasts that as the new room.videoUrl. If that wrapped URL is ever
// fed back into vbStart() as-is — e.g. VB relaunches and its sniffer catches media again — the
// helper wraps it a SECOND time, and each further round nests one level deeper:
// `...?url=<proxy>?url=<proxy>?url=...`. Confirmed in production 2026-08-04: nested 13 levels
// deep, 133 requests, all 502 (the fix that shipped as ed7e5c22/1fb1b330 and had to be rolled
// back). Recovering the ORIGINAL url from the proxy's own `?url=` param — instead of just
// refusing to retry on a proxied URL at all — means a genuinely-failing proxied stream can still
// retry VB against the real source page. Returns the input unchanged if it isn't a proxy URL,
// and `null` if it IS a proxy URL but no valid original can be recovered (caller should skip the
// VB fallback rather than guess).
//
// Unwraps REPEATEDLY, not just once: rooms created during the broken deploy still hold
// multi-level-nested URLs in Mongo, and a single unwrap would hand back a still-proxied URL —
// re-creating the exact nesting loop this exists to prevent. The iteration cap is a cheap
// guarantee of termination regardless of how deep a stored URL happens to be.
const MAX_PROXY_UNWRAP_DEPTH = 16;
function unwrapVbProxyUrl(url: string): string | null {
  let current = url;
  for (let depth = 0; depth < MAX_PROXY_UNWRAP_DEPTH; depth++) {
    let parsed: URL;
    try {
      parsed = new URL(current);
    } catch {
      return null;
    }
    // /vb-capture/ (the raw byte-buffer endpoint, vbSession.helper.ts's other own-URL kind
    // besides vb-media-proxy) carries no `?url=` — there is no original page to recover, unlike
    // vb-media-proxy below. Real prod bug 2026-08-11 (yummyani.me): falling through to the
    // `!includes('/vb-media-proxy/') → return current` branch made THIS look like "not a proxy
    // URL, must be the real source page" — originalSourceUrlRef then got overwritten with our own
    // vb-capture URL, and the next fatal-error retry called vbStart() on it: VB navigated to its
    // own (already-dead once the feeding session got torn down) endpoint instead of the actual
    // page, so nothing could ever be found again. Must return null here, same contract as an
    // unrecoverable vb-media-proxy nesting — caller skips the VB fallback rather than loop on it.
    if (parsed.pathname.includes('/vb-capture/')) return null;
    if (!parsed.pathname.includes('/vb-media-proxy/')) return current;
    const original = parsed.searchParams.get('url'); // URLSearchParams already decodes the value
    if (!original) return null;
    current = original;
  }
  return null; // nested deeper than any legitimate URL would be — refuse rather than guess
}

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
    onPlayNow(normalizedUrl, detectVideoPlatform(normalizedUrl));
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
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--ww-line)] bg-[var(--ww-accent-soft)]">
            <ListVideo size={18} aria-hidden="true" className="text-[var(--ww-accent-hi)]" />
          </span>
          <div>
            <p className="text-[12.5px] font-medium text-[var(--ww-text-2)]">{t('queueEmpty')}</p>
            <p className="mt-0.5 text-[11.5px] text-[var(--ww-text-4)]">
              {isOwner ? t('queueEmptyHint') : t('queueEmptyHintMember')}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-2">
          {playlist.map((item, i) => (
            <div
              key={i}
              className="group flex items-center gap-2 rounded-[var(--ww-r-sm)] bg-[var(--ww-surface-1)] px-2 py-1.5"
            >
              <span className="w-4 shrink-0 text-[10.5px] tabular-nums text-[var(--ww-text-4)]">
                {i + 1}
              </span>
              <QueueStatusDot
                status={item.resolveStatus}
                labels={{
                  pending: t('queueStatusPending'),
                  ready: t('queueStatusReady'),
                  needsVb: t('queueStatusNeedsVb'),
                }}
              />
              <p className="flex-1 truncate text-[12.5px] text-[var(--ww-text-2)]">
                {item.videoTitle ?? item.videoUrl}
              </p>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  aria-label={t('removeFromQueue')}
                  /* Sichqonchasiz qurilmada hover yo'q — u yerda tugma doim
                     ko'rinadi (`opacity-100`), faqat kattaroq ekranda
                     yashiriladi */
                  className="cursor-pointer p-1 text-[var(--ww-text-4)] transition-all hover:text-[var(--ww-danger)] sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isOwner && (
        /* Boshqaruv 32px balandlikda edi — barmoq uchun juda kichik.
           Hammasi 40px ga ko'tarildi (WCAG 2.2 minimumi 24px, qulay chegara
           44px; bu yerda tor ustunga sig'adigan eng kattasi). */
        <div className="flex flex-col gap-2 border-t border-[var(--ww-line)] p-2">
          {playlist.length > 0 && (
            <button
              type="button"
              onClick={handleNext}
              disabled={nextLoading}
              className="ww-btn-accent flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-[var(--ww-r-sm)] text-[12.5px] font-semibold text-white"
            >
              {nextLoading
                ? <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                : <><ChevronRight size={14} aria-hidden="true" /> {t('next')}</>}
            </button>
          )}
          <div className="flex gap-1.5">
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              placeholder={t('videoUrlPlaceholder')}
              aria-label={t('videoUrlPlaceholder')}
              className="ww-field !h-10 min-w-0 flex-1 px-2.5 text-[12.5px]"
            />
            <button
              type="button"
              onClick={handlePlayNow}
              disabled={!urlInput.trim()}
              title={t('playNow')}
              aria-label={t('playNow')}
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-[var(--ww-r-sm)] bg-[rgba(61,220,132,0.16)] text-[var(--ww-online)] transition-colors hover:bg-[rgba(61,220,132,0.26)] disabled:opacity-40"
            >
              <Play size={13} fill="currentColor" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding || !urlInput.trim()}
              title={t('addToQueue')}
              aria-label={t('addToQueue')}
              className="ww-btn-subtle flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-[var(--ww-r-sm)] text-[var(--ww-text)]"
            >
              {adding
                ? <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                : <Plus size={15} aria-hidden="true" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type RightTab = 'chat' | 'members' | 'playlist';

/** Tab strip + voice control + active tab body. Rendered twice — as the desktop right rail and
 *  as the mobile panel under the video. Until 2026-08-01 this markup lived inline inside a
 *  `hidden md:flex` wrapper with no mobile counterpart, so under 768px the room shipped with no
 *  chat, no member list and no queue at all (found in the prod audit, confirmed at 390px). */
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

  const tabs = [
    { id: 'chat' as const, icon: MessageCircle, label: t('chat'), show: true },
    { id: 'members' as const, icon: UsersIcon, label: t('members'), show: true },
    { id: 'playlist' as const, icon: ListVideo, label: t('queue'), show: isOwner },
  ].filter((tab) => tab.show);

  return (
    <>
      {/* role="tablist" yo'q edi — ekran o'quvchi uchta alohida tugmani
          ko'rardi, ular bitta guruh ekani bilinmasdi */}
      <div role="tablist" className="flex shrink-0 border-b border-[var(--ww-line)]">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            onClick={() => { trackClick(`room:tab_${id}`); setRightTab(id); }}
            aria-selected={rightTab === id}
            className={`relative flex h-12 flex-1 cursor-pointer items-center justify-center gap-1.5 text-[12.5px] font-medium transition-colors ${
              rightTab === id
                ? 'text-[var(--ww-text)]'
                : 'text-[var(--ww-text-3)] hover:text-[var(--ww-text-2)]'
            }`}
          >
            <Icon size={14} aria-hidden="true" />
            {label}
            {rightTab === id && (
              <span
                aria-hidden="true"
                className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[var(--ww-accent-hi)]"
              />
            )}
          </button>
        ))}
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
  const { sendMessage, sendPlay, sendPause, sendSeek, sendEmoji, sendHeartbeat, sendBufferStart, sendBufferEnd, sendMediaChange, reactions, reactionCooldownSec, videoCandidates, requestCandidates, kickMember, muteMember, unmuteMember, renameRoom } = useWatchParty(roomId);
  const [rightTab, setRightTab] = useState<RightTab>('chat');
  /** Whose profile the modal is showing — `null` means closed. */
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  // Video-candidate picker (T-S189 follow-up) — owner-only, manually triggered from the "⋮" menu.
  const [candidatePickerOpen, setCandidatePickerOpen] = useState(false);
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
  // VB's found candidate never auto-commits (see vbSession.helper.ts) — it lands in the same
  // picker as "Это не то видео", just auto-opened instead of waiting for the owner to find the
  // menu entry themselves.
  const { frame: vbFrame, active: vbActive, dimensions: vbDimensions, error: vbError, remoteCursor: vbRemoteCursor, start: vbStart, stop: vbStop, sendInput: vbSendInput } = useVirtualBrowser(isOwner, () => setCandidatePickerOpen(true));
  const [showVBPanel, setShowVBPanel] = useState(false);
  const showVB = vbActive || (isOwner && showVBPanel);
  const handleVBStop = () => { vbStop(); setShowVBPanel(false); };

  // Extraction reporting "success" (found a videoUrl) doesn't guarantee our own proxy can
  // actually retrieve it — a file-host mirror 403ing our proxied request is a different failure
  // class than a broken URL outright (confirmed live 2026-08-03/04: extraction succeeded, the
  // video area just showed "Видео не загрузилось" / sat on the autoplay overlay forever, no
  // fallback ever kicked in). Mobile already has this exact recovery path (WatchPartyScreen.tsx
  // handleVideoFatalError) — web never did. Same shape here: owner-only, falls back to the
  // shared Virtual Browser on the original page.
  //
  // Guard is keyed by URL, not a single boolean: a boolean reset on every `room?.videoUrl` change
  // (the original, since-rolled-back implementation) self-defeats, because VB mutates
  // room.videoUrl every time it finds new media — the very event the guard needs to survive.
  // Tracking the set of URLs already attempted means each distinct source gets at most one VB
  // attempt, and the reset can never fire mid-loop because there IS no reset. The size cap is a
  // second, independent backstop in case some future URL variation (query-param reordering,
  // trailing slash, etc.) slips past the exact-string dedup.
  const vbAttemptedUrlsRef = useRef<Set<string>>(new Set());
  const VB_MAX_ATTEMPTS_PER_SESSION = 3;

  // Tracks the last genuine owner-submitted SOURCE PAGE (never a vb-media-proxy rewrite) so a
  // fatal-error retry can re-open VB on the actual page instead of the raw sniffed media file.
  // unwrapVbProxyUrl(url) === url is how the function itself signals "not a proxy URL" (per its
  // own contract above) — reused here rather than re-deriving the same check.
  // Real prod bug 2026-08-04: retrying on the unwrapped CDN file URL (e.g. a raw .mp4/.m3u8) made
  // VB call page.goto() on a media file, not a page — that either downloads the file (mp4) or
  // gets net::ERR_CONNECTION_RESET (CDNs that reject direct manifest requests outside their
  // normal referrer/session context), never re-triggering the sniffer.
  const originalSourceUrlRef = useRef<string | null>(null);
  useEffect(() => {
    const url = room?.videoUrl;
    if (url && unwrapVbProxyUrl(url) === url) originalSourceUrlRef.current = url;
  }, [room?.videoUrl]);

  const handleVideoFatalError = useCallback(() => {
    if (!isOwner || showVB) return;
    const targetUrl = originalSourceUrlRef.current;
    if (!targetUrl) return; // no known source page to retry (e.g. fatal error before any CHANGE_MEDIA)
    if (vbAttemptedUrlsRef.current.has(targetUrl)) return; // this exact source was already tried
    if (vbAttemptedUrlsRef.current.size >= VB_MAX_ATTEMPTS_PER_SESSION) return; // hard cap backstop
    vbAttemptedUrlsRef.current.add(targetUrl);
    vbStart(targetUrl);
  }, [isOwner, showVB, vbStart]);

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

  // The old ?verify=1 client round-trip (re-submit the initial videoUrl through CHANGE_MEDIA once
  // the socket connected) is gone — backend now starts VB server-side directly at room creation
  // (watchParty.controller.ts createRoom, 2026-08-10), so there is nothing left for the client to
  // re-verify.

  // ww-grain (design-system grain overlay): deep black + ONE soft violet halo, replacing the old
  // three-radial-gradient "breathing" background. No -m-4/md:-m-6/lg:-m-8 or `100vh-3rem` height
  // math needed — the room route no longer sits inside (app)/layout.tsx's padded `main` or under
  // the global AppNav (both are hidden for /room/* — see (app)/layout.tsx's `inRoom` check — so
  // this component owns the full viewport itself).
  return (
    <div className="ww-grain relative flex h-screen flex-col overflow-hidden">
      {/* Ambient depth — real-user feedback (2026-07-28): the room "feels like a brick", too dark,
          doesn't feel alive. Root cause was that this glow sat at 6-12% opacity — a fraction of
          what /home's own background actually uses (see globals.css body{} — 48%/22%/10%). Panels
          on top were also flat near-opaque black instead of the app's own `.liquid-glass` violet
          tint, so almost none of this ever showed through. Matched to /home's real intensity, plus
          a slow drift so the glow itself reads as motion, not a static poster behind the UI. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 60% at 30% -10%, rgba(124,58,237,0.20), transparent 65%)',
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        <RoomHeader
          renameRoom={renameRoom}
          onPickDifferentVideo={() => setCandidatePickerOpen(true)}
          onChangeSource={() => setRightTab('playlist')}
        />

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
              className="relative rounded-[var(--ww-r-lg)]"
              style={{
                boxShadow: isConnected
                  ? '0 0 0 1px rgba(124,58,237,0.32), 0 0 32px rgba(124,58,237,0.12)'
                  : '0 0 0 1px var(--ww-line)',
              }}
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
                onPickDifferentVideo={() => setCandidatePickerOpen(true)}
              />
            )}
            </div>

            {isOwner && !showVB && (
              <button
                onClick={() => { trackClick('room:open_vb_panel'); setShowVBPanel(true); }}
                type="button"
                className="ww-btn-subtle flex h-9 cursor-pointer items-center gap-1.5 self-start rounded-[var(--ww-r-sm)] px-3 text-[12.5px] font-medium text-[var(--ww-text-2)]"
              >
                <Globe size={14} aria-hidden="true" />
                {t('virtualBrowser')}
              </button>
            )}

            <EmojiReactions onSend={sendEmoji} cooldownSec={reactionCooldownSec} />
          </div>

          {/* Chat / A'zolar / Navbat — desktopda o'ng ustun, mobilda video ostidagi panel. Sirt
              endi WW v2 tokenida: fondan bir pog'ona yorqinroq + yupqa chegara. Ilgari
              `glass-panel` (binafsha rangli blur) edi — u eski tizimning klassi va yangi tekis
              fon ustida o'zini oqlamaydi.
              Redesigned 2026-08-04 (mobile stacking): used to be `hidden md:flex`, reachable on
              mobile only through a bottom sheet covering ~75% of the screen (video peeking out
              above it) — real report: "нужно чтобы пользователь мог одновременно нормально
              смотреть видео и писать в чат и разговаривать" (watch, chat, and talk AT THE SAME
              TIME). Below md this stacks directly under the video instead — video keeps its
              natural aspect-ratio height, panel takes the rest via its own `min-h-0 flex-1`. Row
              layout only from md up. */}
          <aside className="flex min-h-0 flex-1 flex-col border-t border-[var(--ww-line)] bg-[var(--ww-surface-1)] backdrop-blur-xl md:flex-none md:w-80 md:border-l md:border-t-0">
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
          </aside>
        </div>
        </div>


      <UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />

      {isOwner && (
        <VideoCandidatePicker
          open={candidatePickerOpen}
          onOpenChange={setCandidatePickerOpen}
          candidates={videoCandidates}
          onRequestCandidates={requestCandidates}
          onConfirm={(candidate: VideoCandidate) => sendMediaChange(candidate.url, candidate.title, detectVideoPlatform(candidate.url))}
        />
      )}

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
