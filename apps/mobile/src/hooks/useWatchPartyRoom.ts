// CineSync — useWatchPartyRoom: socket sync, playback callbacks, room state management
import { useRef, useState, useEffect, useCallback } from 'react';
import { Alert, Dimensions, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AVPlaybackStatus } from 'expo-av';
import { useWatchParty } from '@hooks/useWatchParty';
import { useVideoExtraction } from '@hooks/useVideoExtraction';
import { useAuthStore } from '@store/auth.store';
import { useWatchPartyStore } from '@store/watchParty.store';
import { watchPartyApi } from '@api/watchParty.api';
import { disconnectSocket, getSocket, CLIENT_EVENTS } from '@socket/client';
import { UniversalPlayerRef, detectVideoPlatform } from '@components/video/UniversalPlayer';
import type { FloatingEmoji } from '@components/watchParty/VideoSection';
import type { QualityOption } from '@components/watchParty/QualityMenu';
import type { Episode } from '@components/watchParty/EpisodeMenu';
import { ModalStackParamList } from '@app-types/index';
import { useT } from '@i18n/index';

type NavProp = NativeStackNavigationProp<ModalStackParamList>;
const { width: SCREEN_W } = Dimensions.get('window');

// T-E098: Predictive sync — scheduledAt from backend (T-S054)
// Optional field: when absent, falls back to immediate execution
interface PredictiveSyncState {
  scheduledAt?: number; // Unix ms — exact time all peers should execute action
}

// T-E099: Drift correction thresholds
const DRIFT_FORCE_SEEK_SECS = 2.0;   // >2s → hard seekTo
const DRIFT_RATE_ADJUST_SECS = 0.3;  // 0.3-2s → playbackRate correction
const DRIFT_RATE_SLOW = 0.95;
const DRIFT_RATE_FAST = 1.05;
const DRIFT_RATE_RESET_MS = 3000;    // reset to 1.0 after 3s

// T-E101: Buffer event debounce
const BUFFER_DEBOUNCE_MS = 500;
const REACTION_RATE_LIMIT = 10;

export function useWatchPartyRoom(roomId: string, videoReferer?: string) {
  const navigation = useNavigation<NavProp>();
  const userId = useAuthStore(s => s.user?._id) ?? '';
  const { t } = useT();

  const { room, syncState, messages, activeMembers, playlist, isOwner, adminMonitoring, roomClosed, heartbeat, bufferingUsers, lastReaction,
    emitPlay, emitPause, emitSeek, emitHeartbeat, sendMessage, sendEmoji } = useWatchParty(roomId);
  const { isExtracting, result: extractResult, fallbackMode: extractFallback, extract, reset: resetExtraction } = useVideoExtraction();

  const playerRef = useRef<UniversalPlayerRef>(null);
  const isSyncing = useRef(false);
  const lastSyncId = useRef('');
  const prevIsPlayingRef = useRef(false);
  const isActionInFlight = useRef(false);
  const intendedPlayingRef = useRef(false);
  const extractStartedRef = useRef(false);
  const extractFnRef = useRef(extract);
  extractFnRef.current = extract;
  const resetExtractionFnRef = useRef(resetExtraction);
  resetExtractionFnRef.current = resetExtraction;
  const driftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bufferDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionTimestampsRef = useRef<number[]>([]);
  const isBufferingRef = useRef(false);
  // T-E103: WebView pendingSync — defer seekTo until ad finishes
  const pendingSyncRef = useRef<{ currentTime: number; isPlaying: boolean } | null>(null);
  const pendingSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webViewReadyRef = useRef(false);

  const [showChat, setShowChat] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoIsLive, setVideoIsLive] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [connectTimeout, setConnectTimeout] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showEpisodeMenu, setShowEpisodeMenu] = useState(false);
  const [extractQualities, setExtractQualities] = useState<QualityOption[]>([]);
  const [extractEpisodes, setExtractEpisodes] = useState<Episode[]>([]);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');

  const setWatchPartyOpen = useWatchPartyStore((s) => s.setWatchPartyOpen);
  useEffect(() => { setWatchPartyOpen(true); return () => setWatchPartyOpen(false); }, [setWatchPartyOpen]);

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
    if (room) return;
    const timer = setTimeout(() => setConnectTimeout(true), 15000);
    return () => clearTimeout(timer);
  }, [room]);

  useEffect(() => {
    if (!roomClosed) return;
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
    Alert.alert(t('watchParty', 'roomClosed') ?? 'Xona yopildi', message, [{ text: 'OK', onPress: safeGoBack }]);
  }, [roomClosed, navigation, t]);

  // T-E098: Predictive sync — scheduledAt support
  useEffect(() => {
    if (!syncState) return;
    const syncId = `${syncState.serverTimestamp}`;
    if (lastSyncId.current === syncId) return;
    lastSyncId.current = syncId;
    intendedPlayingRef.current = syncState.isPlaying;

    // T-E103: WebView not ready (ad playing) — defer seek until first play event
    if (isWebViewModeRef.current && !webViewReadyRef.current) {
      pendingSyncRef.current = { currentTime: syncState.currentTime, isPlaying: syncState.isPlaying };
      if (pendingSyncTimeoutRef.current) clearTimeout(pendingSyncTimeoutRef.current);
      pendingSyncTimeoutRef.current = setTimeout(() => {
        pendingSyncRef.current = null;
        pendingSyncTimeoutRef.current = null;
      }, 30_000);
      return;
    }

    isSyncing.current = true;

    const scheduled = (syncState as PredictiveSyncState).scheduledAt;

    const executeSync = (compensationSecs: number) => {
      const targetMs = (syncState.currentTime + compensationSecs) * 1000;
      playerRef.current?.seekTo(targetMs)
        .then(() => syncState.isPlaying ? playerRef.current?.play() : playerRef.current?.pause())
        .catch(() => {})
        .finally(() => { setTimeout(() => { isSyncing.current = false; }, 400); });
    };

    if (scheduled && scheduled > 0) {
      const delay = scheduled - Date.now();
      if (delay > 0) {
        // Future: wait until scheduledAt, then execute
        const timerId = setTimeout(() => executeSync(0), delay);
        return () => clearTimeout(timerId);
      }
      // Past: compensate for elapsed time
      executeSync(Math.abs(delay) / 1000);
    } else {
      // No scheduledAt (backend T-S054 not deployed yet) — immediate
      executeSync(0);
    }
  }, [syncState]);

  useEffect(() => {
    if (!isOwner || !room) return;
    const interval = setInterval(async () => {
      if (isSyncing.current) return;
      const posMs = (await playerRef.current?.getPositionMs()) ?? 0;
      if (isPlaying) emitHeartbeat(posMs / 1000);
    }, 5000);
    return () => clearInterval(interval);
  }, [isOwner, room, isPlaying, emitHeartbeat]);

  // T-E099: Drift correction — only for members (not owner), on heartbeat
  useEffect(() => {
    if (isOwner || !heartbeat || !isPlaying || isSyncing.current) return;

    const expected = heartbeat.currentTime + (Date.now() - heartbeat.timestamp) / 1000;
    const drift = videoCurrentTime - expected;
    const absDrift = Math.abs(drift);

    if (absDrift > DRIFT_FORCE_SEEK_SECS) {
      // Large drift — force seek to correct position
      playerRef.current?.seekTo(expected * 1000);
    } else if (absDrift > DRIFT_RATE_ADJUST_SECS) {
      // Moderate drift — gradual correction via playbackRate
      const rate = drift > 0 ? DRIFT_RATE_SLOW : DRIFT_RATE_FAST;
      playerRef.current?.setRate(rate);

      // Clear previous timer if exists
      if (driftTimerRef.current) clearTimeout(driftTimerRef.current);
      driftTimerRef.current = setTimeout(() => {
        playerRef.current?.setRate(1.0);
        driftTimerRef.current = null;
      }, DRIFT_RATE_RESET_MS);
    }
    // drift < 0.3s → ignore, acceptable sync
  }, [heartbeat, isOwner, isPlaying, videoCurrentTime]);

  // Cleanup drift timer on unmount
  useEffect(() => () => { if (driftTimerRef.current) clearTimeout(driftTimerRef.current); }, []);

  // T-E106: Show incoming reactions from other members as floating emoji
  useEffect(() => {
    if (!lastReaction || lastReaction.userId === userId) return;
    setFloatingEmojis(prev => [
      ...prev,
      { id: `${lastReaction.userId}-${lastReaction.timestamp}`, emoji: lastReaction.emoji, x: Math.random() * (SCREEN_W - 60) + 10 },
    ]);
  }, [lastReaction, userId]);

  // T-E101: Buffer signal — debounced emit to server
  const emitBufferState = useCallback((buffering: boolean) => {
    if (bufferDebounceRef.current) clearTimeout(bufferDebounceRef.current);
    bufferDebounceRef.current = setTimeout(() => {
      if (isBufferingRef.current === buffering) return; // no change
      isBufferingRef.current = buffering;
      const socket = getSocket();
      if (!socket) return;
      socket.emit(buffering ? CLIENT_EVENTS.BUFFER_START : CLIENT_EVENTS.BUFFER_END, { roomId });
    }, BUFFER_DEBOUNCE_MS);
  }, [roomId]);

  // Cleanup buffer debounce on unmount
  useEffect(() => () => { if (bufferDebounceRef.current) clearTimeout(bufferDebounceRef.current); }, []);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    if (!isSyncing.current) { setIsPlaying(status.isPlaying); intendedPlayingRef.current = status.isPlaying; }
    setVideoCurrentTime(status.positionMillis / 1000);
    if (status.durationMillis) setVideoDuration(status.durationMillis / 1000);
    // T-E101: Detect buffering from expo-av (isBuffering field)
    if (status.isBuffering !== undefined) emitBufferState(status.isBuffering);
    if (isOwner && !isSyncing.current && status.didJustFinish) emitPause(status.durationMillis ? status.durationMillis / 1000 : 0);
    prevIsPlayingRef.current = status.isPlaying;
  }, [isOwner, emitPause, emitBufferState]);

  const handleWebViewPlay = useCallback((secs: number) => {
    // T-E103: first play after ad — apply deferred sync
    if (!webViewReadyRef.current) {
      webViewReadyRef.current = true;
      if (pendingSyncRef.current) {
        const { currentTime, isPlaying } = pendingSyncRef.current;
        pendingSyncRef.current = null;
        if (pendingSyncTimeoutRef.current) { clearTimeout(pendingSyncTimeoutRef.current); pendingSyncTimeoutRef.current = null; }
        isSyncing.current = true;
        playerRef.current?.seekTo(currentTime * 1000)
          .then(() => isPlaying ? playerRef.current?.play() : playerRef.current?.pause())
          .catch(() => {})
          .finally(() => { setTimeout(() => { isSyncing.current = false; }, 400); });
        return;
      }
    }
    setIsPlaying(true);
    if (isOwner && !isSyncing.current) emitPlay(secs);
  }, [isOwner, emitPlay]);
  const handleWebViewPause = useCallback((secs: number) => { setIsPlaying(false); if (isOwner && !isSyncing.current) emitPause(secs); }, [isOwner, emitPause]);
  // T-E101: WebView buffering callback
  const handleWebViewBuffering = useCallback((isBuffering: boolean) => { emitBufferState(isBuffering); }, [emitBufferState]);
  const handleWebViewSeek = useCallback((secs: number) => { if (isOwner && !isSyncing.current) emitSeek(secs); }, [isOwner, emitSeek]);
  const handleProgress = useCallback((currentTimeSecs: number, durationSecs: number) => { setVideoCurrentTime(currentTimeSecs); if (durationSecs > 0) setVideoDuration(durationSecs); }, []);

  const handleProgressSeek = useCallback(async (secs: number) => {
    if (!isOwner || videoIsLive) return;
    isSyncing.current = true;
    await playerRef.current?.seekTo(secs * 1000);
    emitSeek(secs);
    setTimeout(() => { isSyncing.current = false; }, 400);
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

  const handleSeekDirection = useCallback(async (direction: 'forward' | 'back') => {
    if (!isOwner || videoIsLive) return;
    const posMs = (await playerRef.current?.getPositionMs()) ?? 0;
    const newMs = Math.max(0, posMs + (direction === 'forward' ? 10 : -10) * 1000);
    await playerRef.current?.seekTo(newMs);
    emitSeek(newMs / 1000);
  }, [isOwner, videoIsLive, emitSeek]);

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
    Alert.alert('Chiqish', 'Watch Party dan chiqmoqchimisiz?', [
      { text: 'Bekor', style: 'cancel' },
      { text: isOwner ? 'Xonani yopish' : 'Chiqish', style: 'destructive', onPress: async () => {
        try { if (isOwner) await watchPartyApi.closeRoom(roomId); else await watchPartyApi.leaveRoom(roomId); } catch {}
        disconnectSocket();
        navigation.goBack();
      }},
    ]);
  }, [isOwner, roomId, navigation]);

  // Video URL computation
  const originalVideoUrl = room?.videoUrl ?? '';
  const rawExtractedUrl = (!extractFallback && extractResult?.videoUrl) ? extractResult.videoUrl : undefined;
  const iosWebmBlocked = !!(rawExtractedUrl && Platform.OS === 'ios' && /\.webm(\?|#|$)/i.test(rawExtractedUrl));
  const extractedVideoUrl = iosWebmBlocked ? undefined : rawExtractedUrl;
  const isWebViewMode = !extractedVideoUrl && (iosWebmBlocked || ['youtube', 'webview'].includes(detectVideoPlatform(originalVideoUrl)) || extractFallback);

  // T-E103: keep ref in sync for use inside effects without dependency issues
  const isWebViewModeRef = useRef(false);
  isWebViewModeRef.current = isWebViewMode;

  // T-E103: reset WebView ready state when video URL changes (new media → ad may play again)
  useEffect(() => {
    webViewReadyRef.current = false;
    pendingSyncRef.current = null;
    if (pendingSyncTimeoutRef.current) { clearTimeout(pendingSyncTimeoutRef.current); pendingSyncTimeoutRef.current = null; }
  }, [room?.videoUrl]);

  // T-E103: cleanup pendingSync timeout on unmount
  useEffect(() => () => { if (pendingSyncTimeoutRef.current) clearTimeout(pendingSyncTimeoutRef.current); }, []);

  return {
    playerRef, userId, room, messages, activeMembers, isOwner, adminMonitoring, connectTimeout,
    isExtracting, extractResult, showChat, showVoice, showInvite, isPlaying, isFullscreen,
    videoIsLive, videoCurrentTime, videoDuration, floatingEmojis, showQualityMenu, showEpisodeMenu,
    extractQualities, extractEpisodes, currentVideoUrl, bufferingUsers,
    originalVideoUrl, extractedVideoUrl, isWebViewMode,
    setShowChat, setShowVoice, setShowInvite, setShowQualityMenu, setShowEpisodeMenu, setVideoIsLive,
    sendMessage, sendEmoji,
    onPlaybackStatusUpdate, handleWebViewPlay, handleWebViewPause, handleWebViewSeek,
    handleWebViewBuffering, handleProgress, handleProgressSeek, handlePlayPause, handleStop,
    handleToggleFullscreen: useCallback(() => setIsFullscreen(v => !v), []),
    handleSeekDirection, handleEmojiSelect, handleRemoveEmoji,
    handleChangeMedia, handleQualitySelect, handleEpisodeSelect, handleLeave,
    playlist, handleAddToQueue, handlePlaylistRemove, handlePlaylistNext,
  };
}
