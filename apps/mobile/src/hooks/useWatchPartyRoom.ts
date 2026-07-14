// WeWatch — useWatchPartyRoom: socket sync, playback callbacks, room state management
import { useRef, useState, useEffect, useCallback } from 'react';
import { Dimensions, Platform, AppState } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PlaybackStatus } from '@app-types/index';
import { useWatchParty } from '@hooks/useWatchParty';
import { useVideoExtraction } from '@hooks/useVideoExtraction';
import { useAuthStore } from '@store/auth.store';

const CONTENT_BASE_URL = process.env.EXPO_PUBLIC_CONTENT_URL ?? '';
import { useWatchPartyStore } from '@store/watchParty.store';
import { watchPartyApi } from '@api/watchParty.api';
import { syncStatsApi } from '@api/syncStats.api';
import { activeRoomStorage } from '@utils/storage';
import { disconnectSocket, getSocket, CLIENT_EVENTS } from '@socket/client';
import { UniversalPlayerRef, detectVideoPlatform, detectEmbedPlatform } from '@components/video/UniversalPlayer';
import type { FloatingEmoji } from '@components/watchParty/VideoSection';
import type { QualityOption } from '@components/watchParty/QualityMenu';
import type { Episode } from '@components/watchParty/EpisodeMenu';
import { ModalStackParamList } from '@app-types/index';
import { useT } from '@i18n/index';
import { appAlert } from '@components/common/AppAlert';

type NavProp = NativeStackNavigationProp<ModalStackParamList>;
const { width: SCREEN_W } = Dimensions.get('window');

// T-E098: Predictive sync — scheduledAt from backend (T-S054)
// Optional field: when absent, falls back to immediate execution
interface PredictiveSyncState {
  scheduledAt?: number; // Unix ms — exact time all peers should execute action
}

// T-E099: Drift correction — dual-mode TvMediaSynchronizer (Rave APK pattern)
// Macro sync: hard seekTo for large drifts >2s (instant, covers join latency / network gaps)
// Micro sync: playback rate adjustment for small drifts 0.3s–2.0s (Android only, non-disruptive)
//   Rate proportional to drift magnitude: at ±5–15% correction converges in 2–4 heartbeats.
//   Previous 1.02x attempt took 75+ cycles for 1.5s drift — this scales to the actual offset.
const DRIFT_MACRO_SEEK_SECS = 2.0;    // macro: hard seekTo threshold
const DRIFT_MICRO_RATE_SECS = 0.3;    // micro: start rate adjustment below macro threshold
const DRIFT_RATE_MAX = 0.15;           // max rate offset ±15% from 1.0 (hit at ~2s drift)
// Android: 2s heartbeat so micro-sync converges in 2–4 cycles (~6–8s).
// iOS: 5s is fine — micro-sync not enabled on iOS.
const HEARTBEAT_INTERVAL_MS = Platform.OS === 'android' ? 2000 : 5000;

// Clock-skew guards. Sync relies on absolute server/owner timestamps normalised by the
// measured clock offset. If that offset is stale/0 (offset not yet measured, or the phone
// clock drifted), the skew must NOT leak into playback. These cap the blast radius:
//   MAX_SYNC_SCHEDULE_WAIT_MS — the scheduledAt window is only ~500ms (socket) / 150ms (mesh).
//     A larger computed wait means clock skew, not a real schedule → execute now (F1).
//   MAX_HEARTBEAT_EXTRAPOLATION_MS — how far we extrapolate the owner position from a heartbeat.
//     Clamps a skewed "time since heartbeat" so it can't fabricate a multi-second phantom drift (F2).
//   MAX_COMPENSATION_SECS — upper bound on elapsed-time catch-up; a late-join seed beyond this is
//     recovered by drift correction instead of one huge (possibly skew-inflated) seek (F4/F5).
const MAX_SYNC_SCHEDULE_WAIT_MS = 1500;
const MAX_HEARTBEAT_EXTRAPOLATION_MS = 3000;
const MAX_COMPENSATION_SECS = 30;
// On play/pause, skip the hard seekTo if the player is already this close to the target — a seek
// flushes ExoPlayer's HLS buffer (1-2s re-buffer). Small residual gaps are closed by drift micro-sync.
const SEEK_SKIP_THRESHOLD_MS = 1000;

// T-E101: Buffer event debounce — 2000ms so brief HLS segment-loading stalls (normal ExoPlayer
// behaviour, typically <1s) don't trigger democratic pause for all viewers.
const BUFFER_DEBOUNCE_MS = 2000;
const REACTION_RATE_LIMIT = 10;
// Skip-10s button: a single press still fires an immediate seek+emit (unchanged feel). A second
// press landing within this window doesn't seek again right away — it accumulates on top of the
// pending target and only the FINAL combined position is sent once presses stop, so mashing the
// button 5x sends one seek (one HLS re-buffer for the whole room), not five.
const SKIP_BURST_WINDOW_MS = 600;
const SKIP_STEP_SECS = 10;

export function useWatchPartyRoom(roomId: string, videoReferer?: string) {
  const navigation = useNavigation<NavProp>();
  const userId = useAuthStore(s => s.user?._id) ?? '';
  const { t } = useT();

  const { room, syncState, messages, activeMembers, playlist, isOwner, adminMonitoring, roomClosed, heartbeat, bufferingUsers, lastReaction, activeTransport, getTransportSnapshot,
    emitPlay, emitPause, emitSeek, emitHeartbeat, sendMessage, sendEmoji } = useWatchParty(roomId);
  const { isExtracting, result: extractResult, fallbackMode: extractFallback, error: extractionError, extract, reset: resetExtraction } = useVideoExtraction();

  const playerRef = useRef<UniversalPlayerRef>(null);
  const isSyncing = useRef(false);
  const lastSyncId = useRef('');
  const prevIsPlayingRef = useRef(false);
  const isActionInFlight = useRef(false);
  const intendedPlayingRef = useRef(false);
  const extractStartedRef = useRef(false);
  // After initial join sync, owner skips server-pushed play/pause — owner is source of truth.
  // Democratic buffer resume (io.to(roomId)) would otherwise seek owner backward to stale Redis pos.
  const ownerInitialSyncedRef = useRef(false);
  const prevVideoUrlRef = useRef<string | null | undefined>(undefined);
  const extractFnRef = useRef(extract);
  extractFnRef.current = extract;
  const resetExtractionFnRef = useRef(resetExtraction);
  resetExtractionFnRef.current = resetExtraction;
  const bufferDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressBufferRef = useRef(false);     // true for 5s after a sync seek (HLS proxy buffering window)
  const suppressBufferTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressDriftRef = useRef(false);      // true for 8s after sync/ready (Android proxy buffer time)
  const suppressDriftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionTimestampsRef = useRef<number[]>([]);
  const isBufferingRef = useRef(false);
  const videoCurrentTimeRef = useRef(0);
  // Skip-10s burst batching (see SKIP_BURST_WINDOW_MS) — skipTargetSecsRef is the position
  // already sent (or about to be sent) for this burst; further taps add SKIP_STEP_SECS on top.
  const skipBurstActiveRef = useRef(false);
  const skipAccumSecsRef = useRef(0);
  const skipTargetSecsRef = useRef(0);
  const skipBurstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentRateRef = useRef(1.0); // tracks active playback rate (micro-sync may change it)
  const heartbeatRef = useRef(heartbeat); // latest heartbeat — read in AppState callback without adding to deps
  heartbeatRef.current = heartbeat;
  // Live member count — read inside emitBufferState without re-creating the callback.
  // Solo room (owner alone) must not emit buffer signals: there is nobody to keep in sync,
  // and the server's democratic buffer-pause would otherwise pause the owner against itself
  // (root cause of the "owner alone → video play/pause/play/pause by itself" loop). Mirrors
  // the server-side `members <= 1` guard in videoEvents.handler.ts — defense in depth.
  const activeMembersCountRef = useRef(1);
  activeMembersCountRef.current = activeMembers.length;
  const isWebViewModeRef = useRef(false); // updated after isWebViewMode is computed each render
  const isYouTubeEmbedRef = useRef(false); // true only for YouTube IFrame embed (discrete rates — micro-sync excluded)
  const isVkRutubeEmbedRef = useRef(false); // true for VK/Rutube embed iframe — postMessage has no rate API, micro-sync excluded
  // Unified pending sync — deferred until player signals onReady (works for both expo-av and WebView)
  const playerReadyRef = useRef(false);
  const pendingSyncRef = useRef<{ currentTime: number; isPlaying: boolean; serverTimestamp: number } | null>(null);
  // Tracks the last sync actually executed so proxy-fallback reloads can re-sync.
  // When CDN URL fails and ExoPlayer switches to proxy, UniversalPlayer fires onReady again.
  // Without this, handlePlayerReady returns early (playerReadyRef already true) and the
  // proxy source starts from position 0 — completely out of sync with the owner.
  const lastExecutedSyncRef = useRef<{ currentTime: number; isPlaying: boolean; serverTimestamp: number } | null>(null);

  // T-S118: sync-quality telemetry accumulated for this room session, flushed once on handleLeave.
  const sessionStartRef = useRef(Date.now());
  const macroSeekCountRef = useRef(0);
  const microAdjustCountRef = useRef(0);
  const driftSumMsRef = useRef(0);
  const driftSampleCountRef = useRef(0);
  const maxDriftMsRef = useRef(0);
  const syncErrorsRef = useRef<string[]>([]);
  const recordDrift = (driftMs: number) => {
    driftSumMsRef.current += driftMs;
    driftSampleCountRef.current += 1;
    if (driftMs > maxDriftMsRef.current) maxDriftMsRef.current = driftMs;
  };

  // Chat panel open by default — fills the space below the video and puts the main
  // social surface right at hand on room entry. Voice still auto-joins muted in the
  // background (see screen) and can be toggled from the room bar.
  const [showChat, setShowChat] = useState(true);
  const [showVoice, setShowVoice] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoIsLive, setVideoIsLive] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  // Running total (seconds, signed) while a skip-10s burst is accumulating; null when idle.
  // Drives the "±Ns" label on the skip buttons so mashing the button shows what will be sent.
  const [pendingSkipSecs, setPendingSkipSecs] = useState<number | null>(null);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [connectTimeout, setConnectTimeout] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showEpisodeMenu, setShowEpisodeMenu] = useState(false);
  const [extractQualities, setExtractQualities] = useState<QualityOption[]>([]);
  const [extractEpisodes, setExtractEpisodes] = useState<Episode[]>([]);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');

  const setWatchPartyOpen = useWatchPartyStore((s) => s.setWatchPartyOpen);
  useEffect(() => { setWatchPartyOpen(true); return () => setWatchPartyOpen(false); }, [setWatchPartyOpen]);

  // Persist active room so AppNavigator can restore it on cold start
  useEffect(() => {
    if (!room) return;
    void activeRoomStorage.save(roomId, videoReferer);
  }, [room?._id, roomId, videoReferer]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const rawUrl = room?.videoUrl;
    if (!rawUrl || extractStartedRef.current) return;
    extractStartedRef.current = true;
    void extractFnRef.current(rawUrl);
    return () => { extractStartedRef.current = false; resetExtractionFnRef.current(); };
  }, [room?.videoUrl]); // extract/resetExtraction excluded via refs to prevent re-trigger on token refresh

  useEffect(() => {
    if (!extractResult) return;
    if (extractResult.qualities?.length) setExtractQualities(extractResult.qualities);
    if (extractResult.episodes?.length) {
      setExtractEpisodes(extractResult.episodes.map(e => ({ title: e.title, url: e.url, season: e.season, episode: e.episode })));
    }
  }, [extractResult]);

  useEffect(() => {
    if (extractionError) syncErrorsRef.current.push(`extraction_error: ${String(extractionError)}`);
  }, [extractionError]);

  useEffect(() => {
    if (room) return;
    const timer = setTimeout(() => {
      setConnectTimeout(true);
      syncErrorsRef.current.push('connect_timeout');
      // Room not found within timeout — clear stale restore data
      void activeRoomStorage.clear();
    }, 15000);
    return () => clearTimeout(timer);
  }, [room]);

  useEffect(() => {
    if (!roomClosed) return;
    void activeRoomStorage.clear();
    const safeGoBack = () => { if (navigation.canGoBack()) navigation.goBack(); };
    if (roomClosed.reason === 'account_blocked') { safeGoBack(); return; }
    let message = '';
    if (roomClosed.reason === 'inactivity') message = t('watchParty', 'closedInactivity') ?? 'Xona 5 daqiqa faolsizlikdan avtomatik yopildi';
    else if (roomClosed.reason === 'owner_left') message = t('watchParty', 'closedOwnerLeft') ?? 'Xona egasi xonani yopdi';
    else if (roomClosed.reason === 'admin_closed') {
      message = `${t('watchParty', 'closedByAdmin') ?? 'Xona admin tomonidan yopildi'}`;
      if (roomClosed.adminEmail) message += ` (${roomClosed.adminEmail})`;
      if (roomClosed.closeReason) message += `\n${t('watchParty', 'reason') ?? 'Sabab'}: ${roomClosed.closeReason}`;
    }
    appAlert(t('watchParty', 'roomClosed') ?? 'Xona yopildi', message, [{ text: 'OK', onPress: safeGoBack }]);
  }, [roomClosed, navigation, t]);

  // T-E098: Predictive sync — scheduledAt support
  useEffect(() => {
    if (!syncState) return;
    const syncId = `${syncState.serverTimestamp}`;
    if (lastSyncId.current === syncId) return;
    lastSyncId.current = syncId;
    intendedPlayingRef.current = syncState.isPlaying;

    // Player not ready yet — defer until handlePlayerReady fires (same for expo-av and WebView)
    if (!playerReadyRef.current) {
      pendingSyncRef.current = { currentTime: syncState.currentTime, isPlaying: syncState.isPlaying, serverTimestamp: syncState.serverTimestamp };
      // Mark owner's initial sync as queued so subsequent buffer events are skipped even
      // if the actual seek happens later via handlePlayerReady (pendingSyncRef path).
      if (isOwner) ownerInitialSyncedRef.current = true;
      return;
    }

    // Owner is source of truth after the initial join sync.
    // Server broadcasts democratic buffer pause/resume via io.to(roomId) which reaches the owner too.
    // Without this guard the owner's video would jump to the stale Redis position on every
    // member buffer event — particularly frequent on Android due to ExoPlayer HLS segment fetching.
    if (isOwner) {
      if (ownerInitialSyncedRef.current) {
        intendedPlayingRef.current = syncState.isPlaying;
        return;
      }
      ownerInitialSyncedRef.current = true;
    }

    isSyncing.current = true;

    const scheduled = (syncState as PredictiveSyncState).scheduledAt;
    const serverTs = syncState.serverTimestamp;

    // Suppress sync-induced buffer events for 5s so they don't trigger democratic pause.
    // Was 2s — HLS proxy buffering after seekTo can take 1-2s on Android.
    const startSuppressBuffer = () => {
      suppressBufferRef.current = true;
      if (suppressBufferTimerRef.current) clearTimeout(suppressBufferTimerRef.current);
      suppressBufferTimerRef.current = setTimeout(() => {
        suppressBufferRef.current = false;
        suppressBufferTimerRef.current = null;
      }, 5000);
    };

    // Compute compensation at execution time: how long has passed since the server
    // processed this event. Only apply when playing — pause freezes at currentTime.
    const executeSync = () => {
      // Player not mounted yet — sync will be re-attempted via pendingSyncRef when ready.
      if (!playerRef.current) { isSyncing.current = false; return; }
      // Reset micro-sync rate before hard seek — rate correction must not fight against the seek
      if (currentRateRef.current !== 1.0) { currentRateRef.current = 1.0; playerRef.current.setRate(1.0); }
      lastExecutedSyncRef.current = { currentTime: syncState.currentTime, isPlaying: syncState.isPlaying, serverTimestamp: syncState.serverTimestamp };
      startSuppressBuffer();
      // Suppress drift correction for 8s after each sync — ExoPlayer HLS proxy needs
      // 1-2s to buffer the new position; without this the next heartbeat (every 5s)
      // sees that buffering latency as drift and fires a redundant rate correction.
      suppressDriftRef.current = true;
      if (suppressDriftTimerRef.current) clearTimeout(suppressDriftTimerRef.current);
      suppressDriftTimerRef.current = setTimeout(() => { suppressDriftRef.current = false; suppressDriftTimerRef.current = null; }, 8000);
      const compensationSecs = syncState.isPlaying
        ? Math.min(MAX_COMPENSATION_SECS, Math.max(0, (Date.now() - serverTs) / 1000))
        : 0;
      const targetMs = (syncState.currentTime + compensationSecs) * 1000;
      // WebView seekTo resolves immediately (JS injection is fire-and-forget).
      // On Android WebView the actual seek takes 150-400ms; calling play() before
      // that completes starts playback at the old position → visible ratchet effect.
      // 250ms on Android / 0ms on iOS (expo-av seekTo is awaitable and reliable).
      const seekPlayDelayMs = Platform.OS === 'android' ? 250 : 0;
      // Skip the seek when we're already within SEEK_SKIP_THRESHOLD_MS of the target. A hard
      // seekTo forces ExoPlayer to flush + re-buffer the HLS segment (1-2s stall), so on a
      // play/pause where the member is already aligned it just adds 2-3s latency for nothing —
      // just play/pause in place and let drift micro-sync close the small residual gap. A real
      // seek (owner scrubbed elsewhere) lands far from current → we still do the hard seek.
      Promise.resolve(playerRef.current.getPositionMs())
        .then((curMs) => {
          const needSeek = Math.abs((curMs ?? targetMs) - targetMs) > SEEK_SKIP_THRESHOLD_MS;
          if (needSeek) {
            return playerRef.current!.seekTo(targetMs)
              .then(() => new Promise<void>(resolve => { setTimeout(resolve, seekPlayDelayMs); }));
          }
          return undefined;
        })
        .then(() => syncState.isPlaying ? playerRef.current?.play() : playerRef.current?.pause())
        .catch((e: unknown) => { syncErrorsRef.current.push(`executeSync: ${String(e)}`); })
        .finally(() => { setTimeout(() => { isSyncing.current = false; }, 400); });
    };

    if (scheduled && scheduled > 0) {
      const delay = scheduled - Date.now();
      // Only honour a schedule within the real window (~500ms socket / 150ms mesh + jitter).
      // A larger "delay" means the clock offset is stale/skewed, not a genuine future schedule —
      // waiting it out would freeze the member for seconds while the owner plays on (F1). Execute
      // now instead; executeSync's elapsed-time compensation lands the correct position.
      if (delay > 0 && delay <= MAX_SYNC_SCHEDULE_WAIT_MS) {
        // Future (within window): wait until scheduledAt, then execute with compensation
        const timerId = setTimeout(executeSync, delay);
        return () => clearTimeout(timerId);
      }
      // Past scheduledAt, or delay too large (clock skew) → execute immediately
      executeSync();
    } else {
      // No scheduledAt — execute immediately
      executeSync();
    }
  }, [syncState]);

  useEffect(() => {
    if (!isOwner || !room) return;
    const interval = setInterval(async () => {
      // Skip while syncing or buffering: a heartbeat sent during an owner buffer stall carries a
      // frozen position with an advancing timestamp, so members over-extrapolate and seek past the
      // owner's real position (F6).
      if (isSyncing.current || isBufferingRef.current) return;
      const posMs = (await playerRef.current?.getPositionMs()) ?? 0;
      if (isPlaying) emitHeartbeat(posMs / 1000);
    }, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isOwner, room, isPlaying, emitHeartbeat]);

  // Keep videoCurrentTimeRef up-to-date without triggering drift correction on every position tick.
  // Drift correction reads the ref so videoCurrentTime is not in its deps array.
  useEffect(() => { videoCurrentTimeRef.current = videoCurrentTime; }, [videoCurrentTime]);

  // T-E099: Drift correction — dual-mode TvMediaSynchronizer (Rave APK pattern, Android only for micro).
  // Fires on heartbeat change only; videoCurrentTime excluded from deps (ref read avoids 500ms loop).
  // Macro: large drift >2s → hard seekTo + suppress buffer/drift to prevent cascade.
  // Micro: small drift 0.3–2s (Android only) → rate adjustment proportional to magnitude.
  //   Rate resets to 1.0 when drift falls below threshold (converged) or macro fires (reset before seek).
  useEffect(() => {
    if (isOwner || !heartbeat || !isPlaying || isSyncing.current || suppressDriftRef.current) return;

    // Extrapolate the owner position from the heartbeat, but clamp "time since heartbeat" to a
    // sane bound. A stale/0 clock offset can make heartbeat.timestamp land in the future
    // (negative elapsed) or far in the past → without this clamp the skew becomes a phantom
    // multi-second drift and fires a spurious macro-seek every heartbeat (F2).
    const sinceHeartbeatSecs = Math.min(MAX_HEARTBEAT_EXTRAPOLATION_MS, Math.max(0, Date.now() - heartbeat.timestamp)) / 1000;
    const expected = heartbeat.currentTime + sinceHeartbeatSecs;
    const drift = videoCurrentTimeRef.current - expected; // positive = ahead of owner, negative = behind
    const absDrift = Math.abs(drift);

    if (absDrift > DRIFT_MACRO_SEEK_SECS) {
      // Macro sync — reset micro-sync rate first, then hard seek
      macroSeekCountRef.current += 1;
      recordDrift(absDrift * 1000);
      if (currentRateRef.current !== 1.0) { currentRateRef.current = 1.0; playerRef.current?.setRate(1.0); }
      suppressBufferRef.current = true;
      if (suppressBufferTimerRef.current) clearTimeout(suppressBufferTimerRef.current);
      suppressBufferTimerRef.current = setTimeout(() => { suppressBufferRef.current = false; suppressBufferTimerRef.current = null; }, 5000);
      suppressDriftRef.current = true;
      if (suppressDriftTimerRef.current) clearTimeout(suppressDriftTimerRef.current);
      suppressDriftTimerRef.current = setTimeout(() => { suppressDriftRef.current = false; suppressDriftTimerRef.current = null; }, 8000);
      isSyncing.current = true;
      const seekPlayDelayMs = Platform.OS === 'android' ? 250 : 0;
      playerRef.current?.seekTo(expected * 1000);
      setTimeout(() => { isSyncing.current = false; }, 2000 + seekPlayDelayMs);
    } else if (Platform.OS === 'android' && absDrift > (isWebViewModeRef.current ? 0.6 : DRIFT_MICRO_RATE_SECS) && !isYouTubeEmbedRef.current && !isVkRutubeEmbedRef.current) {
      // Micro sync (Android only) — adjust rate proportional to drift magnitude.
      // YouTube IFrame excluded: discrete rates [0.25,0.5,1,1.25,1.5,2] — fractional rate snaps to 1.0.
      // VK/Rutube embed excluded: postMessage API has no playbackRate command, setRate is a no-op.
      // WebView threshold 0.6s (vs 0.3s native) to absorb ±500ms position-poll noise.
      // fraction 0→1 as drift goes from DRIFT_MICRO_RATE_SECS→DRIFT_MACRO_SEEK_SECS.
      // behind (drift < 0): speed up; ahead (drift > 0): slow down.
      const fraction = (absDrift - DRIFT_MICRO_RATE_SECS) / (DRIFT_MACRO_SEEK_SECS - DRIFT_MICRO_RATE_SECS);
      const rateOffset = fraction * DRIFT_RATE_MAX;
      const targetRate = parseFloat((drift < 0 ? 1.0 + rateOffset : 1.0 - rateOffset).toFixed(3));
      if (Math.abs(targetRate - currentRateRef.current) > 0.01) {
        currentRateRef.current = targetRate;
        playerRef.current?.setRate(targetRate);
        microAdjustCountRef.current += 1;
        recordDrift(absDrift * 1000);
      }
    } else if (currentRateRef.current !== 1.0) {
      // Within sync threshold — restore normal speed
      currentRateRef.current = 1.0;
      playerRef.current?.setRate(1.0);
    }
  }, [heartbeat, isOwner, isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  // T-E106: Show incoming reactions from other members as floating emoji
  useEffect(() => {
    if (!lastReaction || lastReaction.userId === userId) return;
    setFloatingEmojis(prev => [
      ...prev,
      { id: `${lastReaction.userId}-${lastReaction.timestamp}`, emoji: lastReaction.emoji, x: Math.random() * (SCREEN_W - 60) + 10 },
    ]);
  }, [lastReaction, userId]);

  // T-E101: Buffer signal — debounced emit to server; suppressed for 2s after sync seek
  const emitBufferState = useCallback((buffering: boolean) => {
    if (activeMembersCountRef.current <= 1) return; // solo room — no one to sync, don't feed democratic pause loop
    if (suppressBufferRef.current) return; // sync-induced buffering — don't trigger democratic pause
    if (bufferDebounceRef.current) clearTimeout(bufferDebounceRef.current);
    bufferDebounceRef.current = setTimeout(() => {
      if (isBufferingRef.current === buffering) return; // no change
      isBufferingRef.current = buffering;
      const socket = getSocket();
      if (!socket) return;
      socket.emit(buffering ? CLIENT_EVENTS.BUFFER_START : CLIENT_EVENTS.BUFFER_END, { roomId });
    }, BUFFER_DEBOUNCE_MS);
  }, [roomId]);

  // Cleanup timers on unmount; restore rate in case micro-sync left it non-1.0
  useEffect(() => () => {
    if (bufferDebounceRef.current) clearTimeout(bufferDebounceRef.current);
    if (suppressBufferTimerRef.current) clearTimeout(suppressBufferTimerRef.current);
    if (suppressDriftTimerRef.current) clearTimeout(suppressDriftTimerRef.current);
    if (skipBurstTimerRef.current) clearTimeout(skipBurstTimerRef.current);
    if (currentRateRef.current !== 1.0) { currentRateRef.current = 1.0; playerRef.current?.setRate(1.0); }
  }, []);

  // Android: re-sync when app comes back to foreground (background → active).
  // ExoPlayer may have drifted or paused while backgrounded; heartbeat-based compensation
  // brings the member back to the correct owner position immediately on return.
  // Not needed on iOS — AVPlayer continues in background and doesn't drift.
  useEffect(() => {
    if (Platform.OS !== 'android' || isOwner) return;
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return;
      if (!playerRef.current || !playerReadyRef.current || isSyncing.current) return;
      const hb = heartbeatRef.current;
      if (!hb) return;
      const elapsed = (Date.now() - hb.timestamp) / 1000;
      // Cap at 120s: beyond 2min the video has likely been paused by owner anyway
      const compensationSecs = intendedPlayingRef.current ? Math.min(120, Math.max(0, elapsed)) : 0;
      const targetSecs = hb.currentTime + compensationSecs;
      if (currentRateRef.current !== 1.0) { currentRateRef.current = 1.0; playerRef.current.setRate(1.0); }
      isSyncing.current = true;
      suppressBufferRef.current = true;
      if (suppressBufferTimerRef.current) clearTimeout(suppressBufferTimerRef.current);
      suppressBufferTimerRef.current = setTimeout(() => { suppressBufferRef.current = false; suppressBufferTimerRef.current = null; }, 5000);
      suppressDriftRef.current = true;
      if (suppressDriftTimerRef.current) clearTimeout(suppressDriftTimerRef.current);
      suppressDriftTimerRef.current = setTimeout(() => { suppressDriftRef.current = false; suppressDriftTimerRef.current = null; }, 8000);
      // 250ms delay for WebView seekTo (fire-and-forget); harmless for expo-av
      const seekDelayMs = isWebViewModeRef.current ? 250 : 0;
      playerRef.current.seekTo(targetSecs * 1000)
        .then(() => new Promise<void>(resolve => { setTimeout(resolve, seekDelayMs); }))
        .then(() => intendedPlayingRef.current ? playerRef.current?.play() : playerRef.current?.pause())
        .catch(() => {})
        .finally(() => { setTimeout(() => { isSyncing.current = false; }, 400); });
    });
    return () => sub.remove();
  }, [isOwner]); // eslint-disable-line react-hooks/exhaustive-deps

  const onPlaybackStatusUpdate = useCallback((status: PlaybackStatus) => {
    if (!status.isLoaded) return;
    if (!isSyncing.current) { setIsPlaying(status.isPlaying); intendedPlayingRef.current = status.isPlaying; }
    setVideoCurrentTime(status.positionMillis / 1000);
    if (status.durationMillis) setVideoDuration(status.durationMillis / 1000);
    // Only signal buffering when video is supposed to be playing — avoids BUFFER_START
    // during initial load / owner-paused state which would trigger democratic pause incorrectly.
    if (status.isBuffering !== undefined && intendedPlayingRef.current) emitBufferState(status.isBuffering);
    if (isOwner && !isSyncing.current && status.didJustFinish) emitPause(status.durationMillis ? status.durationMillis / 1000 : 0);
    prevIsPlayingRef.current = status.isPlaying;
  }, [isOwner, emitPause, emitBufferState]);

  const handleWebViewPlay = useCallback((secs: number) => {
    setIsPlaying(true);
    if (isOwner && !isSyncing.current) emitPlay(secs);
  }, [isOwner, emitPlay]);
  const handleWebViewPause = useCallback((secs: number) => { setIsPlaying(false); if (isOwner && !isSyncing.current) emitPause(secs); }, [isOwner, emitPause]);
  // T-E101: WebView buffering callback
  const handleWebViewBuffering = useCallback((isBuffering: boolean) => { emitBufferState(isBuffering); }, [emitBufferState]);
  const handleWebViewSeek = useCallback((secs: number) => { if (isOwner && !isSyncing.current) emitSeek(secs); }, [isOwner, emitSeek]);
  // isSyncing guard: while a manual/drift seek is in flight, the WebView's own position-poll
  // (or a stale 'timeupdate' from the page's currentTime getter, which some adapters don't update
  // until the underlying player's seek actually lands 1-2s later) can report the PRE-seek position
  // for a tick or two. Without this guard that stale tick overwrote videoCurrentTime immediately
  // after seekTo(), snapping the progress bar back to the old position before catching up again —
  // the reported "seek to 20:00 jerks back to ~6-7min" bug.
  const handleProgress = useCallback((currentTimeSecs: number, durationSecs: number) => {
    if (!isSyncing.current) setVideoCurrentTime(currentTimeSecs);
    if (durationSecs > 0) setVideoDuration(durationSecs);
  }, []);

  const handleProgressSeek = useCallback(async (secs: number) => {
    if (!isOwner || videoIsLive) return;
    isSyncing.current = true;
    await playerRef.current?.seekTo(secs * 1000);
    emitSeek(secs);
    // 1.5s, not 400ms: HLS proxy re-buffer after a hard seekTo takes 1-2s on Android (same
    // figure used elsewhere in this file, e.g. suppressBufferRef) — 400ms let a stale
    // position-poll tick land inside handleProgress before the real seek settled.
    setTimeout(() => { isSyncing.current = false; }, 1500);
  }, [isOwner, videoIsLive, emitSeek]);

  const handlePlayPause = useCallback(async () => {
    if (!isOwner || isActionInFlight.current) return;
    isActionInFlight.current = true;
    try {
      const nextPlaying = !intendedPlayingRef.current;
      intendedPlayingRef.current = nextPlaying;
      setIsPlaying(nextPlaying);
      isSyncing.current = true;
      const posMs = (await playerRef.current?.getPositionMs()) ?? 0;
      if (nextPlaying) { await playerRef.current?.play(); emitPlay(posMs / 1000); }
      else { await playerRef.current?.pause(); emitPause(posMs / 1000); }
    } finally { setTimeout(() => { isActionInFlight.current = false; isSyncing.current = false; }, 300); }
  }, [isOwner, emitPlay, emitPause]);

  const handleStop = useCallback(async () => {
    if (!isOwner) return;
    await playerRef.current?.seekTo(0);
    await playerRef.current?.pause();
    emitPause(0);
    setIsPlaying(false);
  }, [isOwner, emitPause]);

  // Flushes an in-progress skip burst: applies ONE seek+emit for the accumulated total instead
  // of one per tap. Only runs when a burst is actually active (2nd+ tap arrived) — a lone tap
  // never reaches here, it already sent its own seek immediately in handleSeekDirection below.
  const flushSkipBurst = useCallback(async () => {
    skipBurstTimerRef.current = null;
    skipBurstActiveRef.current = false;
    const total = skipAccumSecsRef.current;
    skipAccumSecsRef.current = 0;
    setPendingSkipSecs(null);
    if (total === 0) return;
    const target = Math.max(0, skipTargetSecsRef.current + total);
    skipTargetSecsRef.current = target;
    isSyncing.current = true;
    await playerRef.current?.seekTo(target * 1000);
    emitSeek(target);
    setTimeout(() => { isSyncing.current = false; }, 1500);
  }, [emitSeek]);

  const handleSeekDirection = useCallback(async (direction: 'forward' | 'back') => {
    if (!isOwner || videoIsLive) return;
    const deltaSecs = direction === 'forward' ? SKIP_STEP_SECS : -SKIP_STEP_SECS;

    if (!skipBurstActiveRef.current) {
      // First tap of a burst: unchanged behaviour — seek and emit right away, no latency.
      skipBurstActiveRef.current = true;
      const posMs = (await playerRef.current?.getPositionMs()) ?? 0;
      const target = Math.max(0, posMs / 1000 + deltaSecs);
      skipTargetSecsRef.current = target;
      isSyncing.current = true;
      await playerRef.current?.seekTo(target * 1000);
      emitSeek(target);
      setTimeout(() => { isSyncing.current = false; }, 1500);
      // Burst window stays open after the immediate seek — a tap landing inside it accumulates
      // (below) instead of firing another seek of its own.
      skipBurstTimerRef.current = setTimeout(() => { skipBurstActiveRef.current = false; }, SKIP_BURST_WINDOW_MS);
      return;
    }

    // Tap landed inside an active burst — accumulate and (re)schedule a single flush, showing
    // the running total so the owner sees what will be sent once they stop pressing.
    skipAccumSecsRef.current += deltaSecs;
    setPendingSkipSecs(skipAccumSecsRef.current);
    if (skipBurstTimerRef.current) clearTimeout(skipBurstTimerRef.current);
    skipBurstTimerRef.current = setTimeout(flushSkipBurst, SKIP_BURST_WINDOW_MS);
  }, [isOwner, videoIsLive, emitSeek, flushSkipBurst]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    const now = Date.now();
    reactionTimestampsRef.current = reactionTimestampsRef.current.filter(t => now - t < 1000);
    if (reactionTimestampsRef.current.length >= REACTION_RATE_LIMIT) return;
    reactionTimestampsRef.current.push(now);
    sendEmoji(emoji);
    setFloatingEmojis(prev => [...prev, { id: `${now}`, emoji, x: Math.random() * (SCREEN_W - 60) + 10 }]);
  }, [sendEmoji]);

  const handleRemoveEmoji = useCallback((id: string) => { setFloatingEmojis(prev => prev.filter(e => e.id !== id)); }, []);

  const handleChangeMedia = useCallback(() => {
    if (!isOwner) return;
    navigation.navigate('SourcePicker', { mode: 'change', roomId });
  }, [isOwner, navigation, roomId]);

  const handleQualitySelect = useCallback((option: QualityOption) => {
    if (!isOwner || !room) return;
    getSocket()?.emit(CLIENT_EVENTS.CHANGE_MEDIA, { roomId, videoUrl: option.url, videoTitle: room.videoTitle ?? 'Video', videoPlatform: room.videoPlatform ?? 'direct' });
    setCurrentVideoUrl(option.url);
  }, [isOwner, room, roomId]);

  const handleEpisodeSelect = useCallback((episode: Episode) => {
    if (!isOwner || !room) return;
    getSocket()?.emit(CLIENT_EVENTS.CHANGE_MEDIA, { roomId, videoUrl: episode.url, videoTitle: episode.title, videoPlatform: room.videoPlatform ?? 'direct' });
    setCurrentVideoUrl(episode.url);
  }, [isOwner, room, roomId]);

  const handleAddToQueue = useCallback(() => {
    if (!isOwner) return;
    navigation.navigate('SourcePicker', { mode: 'queue', roomId });
  }, [isOwner, navigation, roomId]);

  const handlePlaylistRemove = useCallback(async (index: number) => {
    if (!isOwner) return;
    try { await watchPartyApi.removeFromPlaylist(roomId, index); } catch {}
  }, [isOwner, roomId]);

  const handlePlaylistNext = useCallback(async () => {
    if (!isOwner) return;
    try { await watchPartyApi.playNext(roomId); } catch {}
  }, [isOwner, roomId]);

  const handleLeave = useCallback(() => {
    appAlert('Chiqish', 'Watch Party dan chiqmoqchimisiz?', [
      { text: 'Bekor', style: 'cancel' },
      { text: isOwner ? 'Xonani yopish' : 'Chiqish', style: 'destructive', onPress: async () => {
        void activeRoomStorage.clear();
        const { transport, meshEverConnected } = getTransportSnapshot();
        void syncStatsApi.ingest({
          roomId,
          userId: userId || undefined,
          isOwner,
          sessionStart: sessionStartRef.current,
          transport,
          macroSeekCount: macroSeekCountRef.current,
          microAdjustCount: microAdjustCountRef.current,
          avgDriftMs: driftSampleCountRef.current > 0 ? driftSumMsRef.current / driftSampleCountRef.current : 0,
          maxDriftMs: maxDriftMsRef.current,
          meshConnectFailed: activeMembers.length > 1 && !meshEverConnected,
          syncErrors: syncErrorsRef.current,
        });
        try { if (isOwner) await watchPartyApi.closeRoom(roomId); else await watchPartyApi.leaveRoom(roomId); } catch {}
        disconnectSocket();
        navigation.goBack();
      }},
    ]);
  }, [isOwner, roomId, navigation, userId, activeMembers.length, getTransportSnapshot]);

  // Video URL computation
  const originalVideoUrl = room?.videoUrl ?? '';
  const accessToken = useAuthStore(s => s.accessToken);
  const rawExtractedUrl = (!extractFallback && extractResult?.videoUrl) ? extractResult.videoUrl : undefined;
  const iosWebmBlocked = !!(rawExtractedUrl && Platform.OS === 'ios' && /\.webm(\?|#|$)/i.test(rawExtractedUrl));
  const extractedVideoUrl = iosWebmBlocked ? undefined : rawExtractedUrl;

  const platform = detectVideoPlatform(originalVideoUrl);
  // Android: VK and Rutube HLS CDN URLs are IP-locked to Railway → use embed iframe.
  // Exception: if server extracted an mp4 (not HLS), allow direct ExoPlayer attempt —
  // mp4 is a single-file download and may not have the same IP-lock as HLS chunked streams.
  // On 403 error, UniversalPlayer falls back to embed WebView (webviewEmbedFailed path).
  const androidEmbedPlatform = detectEmbedPlatform(originalVideoUrl);
  const vkRutubeExtractedMp4 = (androidEmbedPlatform === 'vk' || androidEmbedPlatform === 'rutube')
    && extractResult?.type === 'mp4' && !!extractedVideoUrl;
  const isAndroidVkOrRutube = Platform.OS === 'android' &&
    (androidEmbedPlatform === 'vk' || androidEmbedPlatform === 'rutube') &&
    !vkRutubeExtractedMp4; // mp4 extraction → try ExoPlayer first, not embed

  const androidPlayUrl = Platform.OS === 'android' && !isAndroidVkOrRutube
    ? (extractedVideoUrl ?? (platform !== 'youtube' ? originalVideoUrl : undefined))
    : undefined;

  // HLS detection: prefer extractResult.type when available; infer from URL patterns as fallback
  // so the HLS proxy is used even when extraction failed but room already has a CDN HLS URL.
  const isHlsStream = extractResult?.type === 'hls'
    || (!extractResult && !!(androidPlayUrl && (
      /\.(m3u8|mpd)(\?|#|$)/i.test(androidPlayUrl)
      || /\/(hls|stream|manifest|playlist\.m3u8|master\.m3u8|chunklist)/i.test(androidPlayUrl)
      || /\/(video|vod|cdn|media)\/[^/]+\/(index|master|720p|480p|360p|1080p|hls)/i.test(androidPlayUrl)
    )));

  const baseExtractedHeaders = extractedVideoUrl ? extractResult?.httpHeaders : undefined;
  // Authorization header is only for the WeWatch HLS proxy (/content/hls-proxy) which
  // validates the token before fetching segments from CDN. On iOS there is no proxy
  // (androidPlayUrl = undefined), so sending Authorization directly to the CDN is wrong —
  // most CDNs ignore it but some return 403, causing expo-video to enter error state.
  const extractedVideoHeaders: Record<string, string> | undefined = (isHlsStream && accessToken && !!androidPlayUrl)
    ? { ...baseExtractedHeaders, Authorization: `Bearer ${accessToken}` }
    : baseExtractedHeaders;

  // For HLS streams use the HLS proxy (/content/hls-proxy) which rewrites every segment URL
  // in the m3u8 manifest to also go through the proxy server with the correct Referer header.
  // Without this, ExoPlayer fetches segments directly from CDN — CDN blocks mobile device IP
  // or fingerprint → 403 → frequent buffer stalls → choppy playback.
  // For mp4 / non-HLS, the generic proxy (/content/proxy/stream) is sufficient (single file).
  // videoReferer: navigation param (owner), room?.videoReferer: stored on create (members via invite link).
  const proxyReferer = videoReferer ?? room?.videoReferer ?? originalVideoUrl;
  const proxyUpstreamHeaders: Record<string, string> = {};
  if (extractedVideoHeaders) {
    for (const [k, v] of Object.entries(extractedVideoHeaders)) {
      if (!/^(user-agent|authorization)$/i.test(k)) proxyUpstreamHeaders[k] = v;
    }
  }
  if (videoReferer) proxyUpstreamHeaders['Referer'] = videoReferer;
  const proxyHeadersParam = Object.keys(proxyUpstreamHeaders).length > 0
    ? `&h=${encodeURIComponent(JSON.stringify(proxyUpstreamHeaders))}`
    : '';
  const extractedVideoProxyUrl = (androidPlayUrl && accessToken)
    ? isHlsStream
      ? `${CONTENT_BASE_URL}/content/hls-proxy?url=${encodeURIComponent(androidPlayUrl)}&referer=${encodeURIComponent(proxyReferer)}`
      : `${CONTENT_BASE_URL}/content/proxy/stream?url=${encodeURIComponent(androidPlayUrl)}&token=${encodeURIComponent(accessToken)}${proxyHeadersParam}`
    : undefined;
  // iOS VK/Rutube: same CDN IP-lock issue as Android — the CDN HLS manifests are served from
  // the Railway extraction server's IP. AVPlayer fetching segments from a different IP gets
  // blocked/throttled, causing indefinite buffering. Use embed WebView instead (VK/Rutube
  // iframes handle CDN auth internally). Exception: mp4 extracted URLs are single-file and
  // often work without IP-lock, so let AVPlayer try first (falls back to embed on error).
  const iosVkOrRutube = Platform.OS === 'ios' &&
    (androidEmbedPlatform === 'vk' || androidEmbedPlatform === 'rutube') &&
    !vkRutubeExtractedMp4;

  // Android: YouTube + embed platforms (VK, Rutube, Twitch, Vimeo, Dailymotion) without an
  // extracted URL use WebView. Embed detection matches UniversalPlayer.useWebview logic so
  // VideoSection blocks direct touches to the embed and shows our own owner controls
  // instead (isOwnerMode = isOwner, unconditional — see VideoSection.tsx tap-catcher).
  // iOS: also use embed for VK/Rutube (IP-lock), plus existing fallbacks.
  const embedPlatformDetected = !!androidEmbedPlatform;
  const isWebViewMode = Platform.OS === 'ios'
    ? (iosVkOrRutube || !extractedVideoUrl && (iosWebmBlocked || platform === 'youtube' || extractFallback))
    : (isAndroidVkOrRutube || (!extractedVideoUrl && (platform === 'youtube' || embedPlatformDetected)));

  isWebViewModeRef.current = isWebViewMode; // keep ref in sync so drift effect can read it without re-running
  // YouTube IFrame embed uses discrete rates [0.25,0.5,1,1.25,1.5,2] — fractional rate snaps to 1.0.
  // VK/Rutube embed iframe: postMessage API has no playbackRate command → micro-sync excluded for both.
  // Once CDN URL is sniffed (handleCdnUrlSniffed clears the flag), ExoPlayer is used and micro-sync works.
  isYouTubeEmbedRef.current = Platform.OS === 'android' && !extractedVideoUrl && platform === 'youtube';
  // isVkRutubeEmbedRef is managed via handleCdnUrlSniffed below — starts true, cleared on sniff.
  if (isAndroidVkOrRutube || iosVkOrRutube) isVkRutubeEmbedRef.current = true;

  // Hide extractedUrl from player when using embed to prevent UniversalPlayer from
  // trying the CDN URL before falling back (hasExtracted=false → useWebview=true in UniversalPlayer).
  const playerExtractedUrl = (isAndroidVkOrRutube || iosVkOrRutube) ? undefined : extractedVideoUrl;
  const playerProxyUrl = extractedVideoProxyUrl; // HLS proxy / generic proxy as fallback when raw URL fails

  // Reset player ready state when video URL changes (new media)
  // Skip reset on initial URL load — pendingSyncRef from ROOM_JOINED must survive until player is ready.
  // Bug: ROOM_JOINED batches setRoom+setSyncState; syncState effect stores pendingSyncRef, then this
  // effect fires (same render) and clears it → handlePlayerReady finds null → video stands still.
  useEffect(() => {
    const prevUrl = prevVideoUrlRef.current;
    prevVideoUrlRef.current = room?.videoUrl;
    if (!prevUrl) return; // initial load — don't wipe pendingSyncRef
    playerReadyRef.current = false;
    pendingSyncRef.current = null;
    lastExecutedSyncRef.current = null;
    ownerInitialSyncedRef.current = false; // new media — allow one initial sync for owner too
  }, [room?.videoUrl]);

  // Called by UniversalPlayer when the player is ready to receive seek/play commands.
  // Also called when ExoPlayer switches from a failed direct CDN URL to the HLS proxy
  // (UniversalPlayer resets readyFiredRef on source change → fires onReady again).
  // Uses pendingSyncRef (first join, player not ready yet) OR lastExecutedSyncRef (proxy
  // fallback re-sync) — with elapsed-time compensation in both cases.
  const handlePlayerReady = useCallback(() => {
    playerReadyRef.current = true;
    // Pending sync (deferred because player wasn't ready yet) takes priority.
    // Fall back to lastExecutedSyncRef so proxy-fallback re-loads re-sync to the correct position
    // instead of starting from 0 (which leaves isPlaying=false → drift correction never fires).
    const syncToExecute = pendingSyncRef.current ?? lastExecutedSyncRef.current;
    pendingSyncRef.current = null;
    if (!syncToExecute) return;
    lastExecutedSyncRef.current = syncToExecute; // update in case this is a fresh pendingSync
    isSyncing.current = true;
    intendedPlayingRef.current = syncToExecute.isPlaying; // needed so drift/buffer guards work correctly
    // Reset micro-sync rate before the initial seek
    if (currentRateRef.current !== 1.0) { currentRateRef.current = 1.0; playerRef.current?.setRate(1.0); }
    suppressBufferRef.current = true;
    if (suppressBufferTimerRef.current) clearTimeout(suppressBufferTimerRef.current);
    suppressBufferTimerRef.current = setTimeout(() => { suppressBufferRef.current = false; suppressBufferTimerRef.current = null; }, 5000);
    suppressDriftRef.current = true;
    if (suppressDriftTimerRef.current) clearTimeout(suppressDriftTimerRef.current);
    suppressDriftTimerRef.current = setTimeout(() => { suppressDriftRef.current = false; suppressDriftTimerRef.current = null; }, 8000);
    // Compensate for elapsed time since server event — catches up to current owner position.
    // Works for both initial join AND proxy-fallback: compensation grows with elapsed time.
    // Cap compensation at 30s — if lastExecutedSyncRef is stale (minutes old, e.g. after
    // a long proxy-fallback delay), uncapped compensation would seek hundreds of seconds past
    // the actual position and land past the video end.
    const compensationSecs = syncToExecute.isPlaying
      ? Math.min(MAX_COMPENSATION_SECS, Math.max(0, (Date.now() - syncToExecute.serverTimestamp) / 1000))
      : 0;
    const targetMs = (syncToExecute.currentTime + compensationSecs) * 1000;
    if (!playerRef.current) { isSyncing.current = false; return; }
    playerRef.current.seekTo(targetMs)
      .then(() => syncToExecute.isPlaying ? playerRef.current?.play() : playerRef.current?.pause())
      .catch((e: unknown) => { syncErrorsRef.current.push(`handlePlayerReady: ${String(e)}`); })
      .finally(() => { setTimeout(() => { isSyncing.current = false; }, 400); });
  }, []);

  // Called by UniversalPlayer when a CDN URL is sniffed from VK/Rutube hidden WebView.
  // Clears isVkRutubeEmbedRef so micro-sync via ExoPlayer rate adjustment is re-enabled.
  const handleCdnUrlSniffed = useCallback(() => {
    isVkRutubeEmbedRef.current = false;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    playerRef, userId, room, messages, activeMembers, isOwner, adminMonitoring, connectTimeout, activeTransport,
    isExtracting, extractResult, extractionError, showChat, showVoice, showInvite, isPlaying, isFullscreen,
    videoIsLive, videoCurrentTime, videoDuration, pendingSkipSecs, floatingEmojis, showQualityMenu, showEpisodeMenu,
    extractQualities, extractEpisodes, currentVideoUrl, bufferingUsers,
    originalVideoUrl, extractedVideoUrl: playerExtractedUrl, extractedVideoHeaders, extractedVideoProxyUrl: playerProxyUrl, isWebViewMode,
    setShowChat, setShowVoice, setShowInvite, setShowQualityMenu, setShowEpisodeMenu, setVideoIsLive,
    sendMessage, sendEmoji,
    onPlaybackStatusUpdate, handleWebViewPlay, handleWebViewPause, handleWebViewSeek,
    handleWebViewBuffering, handleProgress, handleProgressSeek, handlePlayPause, handleStop,
    handleToggleFullscreen: useCallback(() => setIsFullscreen(v => !v), []),
    handleSeekDirection, handleEmojiSelect, handleRemoveEmoji,
    handleChangeMedia, handleQualitySelect, handleEpisodeSelect, handleLeave, handlePlayerReady,
    handleCdnUrlSniffed,
    playlist, handleAddToQueue, handlePlaylistRemove, handlePlaylistNext,
  };
}
