'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MessageCircle, Users as UsersIcon, ListVideo, X, ChevronRight, Loader2, Play, Plus, Globe } from 'lucide-react';
import { useWatchParty } from '@/hooks/use-watch-party';
import { useVirtualBrowser } from '@/hooks/use-virtual-browser';
import { VideoPlayer } from '@/components/party/VideoPlayer';
import { VirtualBrowserPlayer } from '@/components/party/VirtualBrowserPlayer';
import { ChatPanel } from '@/components/party/ChatPanel';
import { MemberList } from '@/components/party/MemberList';
import { RoomHeader } from '@/components/party/RoomHeader';
import { EmojiReactions } from '@/components/party/EmojiReactions';
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

/** Tab strip + voice control + active tab body. Rendered twice — as the desktop right rail and
 *  as the mobile panel under the video. Until 2026-08-01 this markup lived inline inside a
 *  `hidden md:flex` wrapper with no mobile counterpart, so under 768px the room shipped with no
 *  chat, no member list and no queue at all (found in the prod audit, confirmed at 390px). */
function RoomSidePanel({
  roomId, isOwner, rightTab, setRightTab, voice, onSendMessage, onOpenProfile, onPlayNow,
}: {
  roomId: string;
  isOwner: boolean;
  rightTab: 'chat' | 'members' | 'playlist';
  setRightTab: (t: 'chat' | 'members' | 'playlist') => void;
  voice: ReturnType<typeof useVoiceChat>;
  onSendMessage: (text: string) => void;
  onOpenProfile: (userId: string) => void;
  onPlayNow: (videoUrl: string, videoPlatform: string) => void;
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
        isLoading={voice.isLoading}
        errorMsg={voice.errorMsg}
        participants={voice.participants}
        onToggleMute={voice.toggleMute}
        onLeave={voice.leaveVoice}
        onJoin={voice.joinVoice}
      />

      {rightTab === 'chat' && <ChatPanel onSend={onSendMessage} onOpenProfile={onOpenProfile} />}
      {rightTab === 'members' && <MemberList />}
      {rightTab === 'playlist' && (
        <PlaylistPanel roomId={roomId} isOwner={isOwner} onPlayNow={onPlayNow} />
      )}
    </>
  );
}

export function RoomContent({ roomId, inviteCode, needsPassword = false }: Props) {
  const t = useTranslations('party');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { sendMessage, sendPlay, sendPause, sendSeek, sendEmoji, sendHeartbeat, sendBufferStart, sendBufferEnd, sendMediaChange } = useWatchParty(roomId);
  const [rightTab, setRightTab] = useState<'chat' | 'members' | 'playlist'>('chat');
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
  const voice = useVoiceChat(socket, roomJoined);
  const isConnected = useWatchPartyStore((s) => s.isConnected);
  const currentUser = useAuthStore((s) => s.user);
  const isOwner = !!(room && currentUser && room.ownerId === currentUser._id);

  // Kosmi-style shared virtual browser — owner opens a URL in a server-side headless browser,
  // everyone in the room watches the same live stream. `vbActive` is broadcast-driven (true for
  // EVERY member the instant the owner starts a session) — `showVBPanel` is purely local, lets
  // the owner reveal the "enter a URL" form before anything is actually running yet.
  const { frame: vbFrame, active: vbActive, dimensions: vbDimensions, error: vbError, remoteCursor: vbRemoteCursor, start: vbStart, stop: vbStop, sendInput: vbSendInput } = useVirtualBrowser(isOwner);
  const [showVBPanel, setShowVBPanel] = useState(false);
  const showVB = vbActive || (isOwner && showVBPanel);
  const handleVBStop = () => { vbStop(); setShowVBPanel(false); };

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

  // `-m-*` cancels the layout's own padding (incl. its `pb-24`), so the bottom clearance for the
  // floating dock has to be re-added here — without it the dock sits on top of the chat composer
  // on every breakpoint (prod audit 2026-08-01). `dvh` not `vh`: on mobile browsers `vh` is the
  // tallest-possible viewport, so the panel ran under the URL bar.
  return (
    <div className="ww-grain relative -m-4 flex h-[calc(100dvh-3rem)] flex-col overflow-hidden pb-[4.75rem] md:-m-6 lg:-m-8">
      {/* Fon. Ilgari uchta radial gradient bor edi (binafsha + moviy dog'lar,
          8 soniyalik "nafas" animatsiyasi bilan) — u eski, gradientli fon
          uslubidan qolgan. WW v2 yo'nalishi boshqa: chuqur qora + BITTA
          yumshoq binafsha halo + plyonka donadorligi. Moviy dog' brend
          palitrasida umuman yo'q edi, animatsiya esa har kadrda butun ekranni
          qayta chizib, video ustida behuda ish bajarardi. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 60% at 30% -10%, rgba(124,58,237,0.20), transparent 65%)',
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        <RoomHeader />

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
          {/* Left: Video. On mobile it keeps its natural height and the panel below takes the
              rest; on desktop it grows and the 20rem rail stays fixed. */}
          <div className="flex flex-col p-3 md:p-4 gap-3 min-w-0 shrink-0 md:shrink md:flex-1">
            {/* Thin glow frame around the player only (not the toolbar below it) — a colored ring
                signals "this is the live, active surface of the room" instead of the video sitting
                as a bare black rectangle indistinguishable from a broken embed. */}
            <div
              className="rounded-[var(--ww-r-lg)]"
              style={{
                boxShadow: isConnected
                  ? '0 0 0 1px rgba(124,58,237,0.32)'
                  : '0 0 0 1px var(--ww-line)',
              }}
            >
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

            <EmojiReactions onSend={sendEmoji} />
          </div>

          {/* Chat / A'zolar / Navbat — desktopda o'ng ustun, mobilda video
              ostidagi panel. Sirt endi WW v2 tokenida: fondan bir pog'ona
              yorqinroq + yupqa chegara. Ilgari `glass-panel` (binafsha rangli
              blur) edi — u eski tizimning klassi va yangi tekis fon ustida
              o'zini oqlamaydi. */}
          <aside className="flex min-h-0 flex-1 flex-col border-t border-[var(--ww-line)] bg-[var(--ww-surface-1)] backdrop-blur-xl md:flex-none md:w-80 md:border-l md:border-t-0">
            <RoomSidePanel
              roomId={roomId}
              isOwner={isOwner}
              rightTab={rightTab}
              setRightTab={setRightTab}
              voice={voice}
              onSendMessage={sendMessage}
              onOpenProfile={setProfileUserId}
              onPlayNow={(videoUrl, videoPlatform) => sendMediaChange(videoUrl, undefined, videoPlatform)}
            />
          </aside>
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
