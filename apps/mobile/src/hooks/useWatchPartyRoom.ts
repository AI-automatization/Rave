// WeWatch — useWatchPartyRoom: socket sync, playback callbacks, room state management
import { useRef, useState, useEffect, useCallback } from 'react';
import { Alert, Dimensions, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AVPlaybackStatus } from 'expo-av';
import { useWatchParty } from '@hooks/useWatchParty';
import { useVideoExtraction } from '@hooks/useVideoExtraction';
import { useAuthStore } from '@store/auth.store';

const CONTENT_BASE_URL = process.env.EXPO_PUBLIC_CONTENT_URL ?? '';
import { useWatchPartyStore } from '@store/watchParty.store';
import { watchPartyApi } from '@api/watchParty.api';
import { disconnectSocket, getSocket, CLIENT_EVENTS } from '@socket/client';
import { UniversalPlayerRef, detectVideoPlatform, detectEmbedPlatform } from '@components/video/UniversalPlayer';
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
// Rate correction removed: at 1.02x over 5s window it corrects only 0.1s — for 1.5s drift
// that takes ~75 heartbeat cycles (6 min). Hard seek is instant and reliable.
const DRIFT_FORCE_SEEK_SECS = 2.0;   // >2s → hard seekTo (was 3.0 — drifts of 1.5-3s were never corrected)

// T-E101: Buffer event debounce — 2000ms so brief HLS segment-loading stalls (normal ExoPlayer
// behaviour, typically <1s) don't trigger democratic pause for all viewers.
const BUFFER_DEBOUNCE_MS = 2000;
const REACTION_RATE_LIMIT = 10;

export function useWatchPartyRoom(roomId: string, videoReferer?: string) {
  const navigation = useNavigation<NavProp>();
  const userId = useAuthStore(s => s.user?._id) ?? '';
  const { t } = useT();

  const { room, syncState, messages, activeMembers, playlist, isOwner, adminMonitoring, roomClosed, heartbeat, bufferingUsers, lastReaction,
    emitPlay, emitPause, emitSeek, emitHeartbeat, sendMessage, sendEmoji } = useWatchParty(roomId);
  const { isExtracting, result: extractResult, fallbackMode: extractFallback, error: extractionError, extract, reset: resetExtraction } = useVideoExtraction();

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
  const bufferDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressBufferRef = useRef(false);     // true for 5s after a sync seek (HLS proxy buffering window)
  const suppressBufferTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressDriftRef = useRef(false);      // true for 8s after sync/ready (Android proxy buffer time)
  const suppressDriftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionTimestampsRef = useRef<number[]>([]);
  const isBufferingRef = useRef(false);
  const videoCurrentTimeRef = useRef(0);
  // Unified pending sync — deferred until player signals onReady (works for both expo-av and WebView)
  const playerReadyRef = useRef(false);
  const pendingSyncRef = useRef<{ currentTime: number; isPlaying: boolean; serverTimestamp: number } | null>(null);
  // Tracks the last sync actually executed so proxy-fallback reloads can re-sync.
  // When CDN URL fails and ExoPlayer switches to proxy, UniversalPlayer fires onReady again.
  // Without this, handlePlayerReady returns early (playerReadyRef already true) and the
  // proxy source starts from position 0 — completely out of sync with the owner.
  const lastExecutedSyncRef = useRef<{ currentTime: number; isPlaying: boolean; serverTimestamp: number } | null>(null);

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

    // Player not ready yet — defer until handlePlayerReady fires (same for expo-av and WebView)
    if (!playerReadyRef.current) {
      pendingSyncRef.current = { currentTime: syncState.currentTime, isPlaying: syncState.isPlaying, serverTimestamp: syncState.serverTimestamp };
      return;
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
      lastExecutedSyncRef.current = { currentTime: syncState.currentTime, isPlaying: syncState.isPlaying, serverTimestamp: syncState.serverTimestamp };
      startSuppressBuffer();
      // Suppress drift correction for 8s after each sync — ExoPlayer HLS proxy needs
      // 1-2s to buffer the new position; without this the next heartbeat (every 5s)
      // sees that buffering latency as drift and fires a redundant rate correction.
      suppressDriftRef.current = true;
      if (suppressDriftTimerRef.current) clearTimeout(suppressDriftTimerRef.current);
      suppressDriftTimerRef.current = setTimeout(() => { suppressDriftRef.current = false; suppressDriftTimerRef.current = null; }, 8000);
      const compensationSecs = syncState.isPlaying
        ? Math.max(0, (Date.now() - serverTs) / 1000)
        : 0;
      const targetMs = (syncState.currentTime + compensationSecs) * 1000;
      playerRef.current.seekTo(targetMs)
        .then(() => syncState.isPlaying ? playerRef.current?.play() : playerRef.current?.pause())
        .catch(() => {})
        .finally(() => { setTimeout(() => { isSyncing.current = false; }, 400); });
    };

    if (scheduled && scheduled > 0) {
      const delay = scheduled - Date.now();
      if (delay > 0) {
        // Future: wait until scheduledAt, then execute with elapsed-time compensation
        const timerId = setTimeout(executeSync, delay);
        return () => clearTimeout(timerId);
      }
      // Past scheduledAt: execute immediately with elapsed-time compensation
      executeSync();
    } else {
      // No scheduledAt — execute immediately
      executeSync();
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

  // Keep videoCurrentTimeRef up-to-date without triggering drift correction on every position tick.
  // Drift correction reads the ref so videoCurrentTime is not in its deps array.
  useEffect(() => { videoCurrentTimeRef.current = videoCurrentTime; }, [videoCurrentTime]);

  // T-E099: Drift correction — only for members (not owner), fires on heartbeat change only.
  // videoCurrentTime intentionally excluded from deps — we read the ref to avoid re-running
  // every 500ms (expo-av position update) which caused false correction loops.
  // Rate correction removed: at 1.02x/5s window it corrects only 0.1s per heartbeat cycle,
  // taking 75+ cycles (6 min) to fix 1.5s drift. Hard seek is instant and reliable.
  // After drift-correction seek: suppress buffer (5s) and drift (8s) so ExoPlayer's HLS
  // segment buffering doesn't cascade into democratic pause, and the next heartbeat doesn't
  // immediately re-trigger another seek.
  useEffect(() => {
    if (isOwner || !heartbeat || !isPlaying || isSyncing.current || suppressDriftRef.current) return;

    const expected = heartbeat.currentTime + (Date.now() - heartbeat.timestamp) / 1000;
    const absDrift = Math.abs(videoCurrentTimeRef.current - expected);

    if (absDrift > DRIFT_FORCE_SEEK_SECS) {
      suppressBufferRef.current = true;
      if (suppressBufferTimerRef.current) clearTimeout(suppressBufferTimerRef.current);
      suppressBufferTimerRef.current = setTimeout(() => { suppressBufferRef.current = false; suppressBufferTimerRef.current = null; }, 5000);
      suppressDriftRef.current = true;
      if (suppressDriftTimerRef.current) clearTimeout(suppressDriftTimerRef.current);
      suppressDriftTimerRef.current = setTimeout(() => { suppressDriftRef.current = false; suppressDriftTimerRef.current = null; }, 8000);
      isSyncing.current = true;
      playerRef.current?.seekTo(expected * 1000);
      setTimeout(() => { isSyncing.current = false; }, 2000);
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

  // Cleanup timers on unmount
  useEffect(() => () => {
    if (bufferDebounceRef.current) clearTimeout(bufferDebounceRef.current);
    if (suppressBufferTimerRef.current) clearTimeout(suppressBufferTimerRef.current);
    if (suppressDriftTimerRef.current) clearTimeout(suppressDriftTimerRef.current);
  }, []);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
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
  const accessToken = useAuthStore(s => s.accessToken);
  const rawExtractedUrl = (!extractFallback && extractResult?.videoUrl) ? extractResult.videoUrl : undefined;
  const iosWebmBlocked = !!(rawExtractedUrl && Platform.OS === 'ios' && /\.webm(\?|#|$)/i.test(rawExtractedUrl));
  const extractedVideoUrl = iosWebmBlocked ? undefined : rawExtractedUrl;

  const platform = detectVideoPlatform(originalVideoUrl);

  // Android: no WebView fallback — all non-YouTube content uses native ExoPlayer.
  // When extraction fails (edge case), use originalVideoUrl directly (room stores CDN URL after Fix #22).
  const androidPlayUrl = Platform.OS === 'android'
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
  const extractedVideoHeaders: Record<string, string> | undefined = (isHlsStream && accessToken)
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
  // Android: only YouTube uses WebView (needs JS iframe API); all other content is native ExoPlayer.
  // iOS: keep existing fallback behaviour (iosWebmBlocked, extractFallback → WebView).
  const isWebViewMode = Platform.OS === 'ios'
    ? (!extractedVideoUrl && (iosWebmBlocked || platform === 'youtube' || extractFallback))
    : (!extractedVideoUrl && platform === 'youtube');

  // Android + embeddable webview platforms (VK, Rutube, Twitch, Vimeo, Dailymotion):
  // These CDNs block ExoPlayer via TLS fingerprint — proxy (Node.js/Chrome UA) is primary.
  // Android HLS: ExoPlayer does NOT forward custom headers (Referer) to segment requests,
  // only to the initial m3u8 fetch. HLS proxy rewrites all segment URLs → server adds Referer.
  // Without this CDN 403s all segments silently → choppy buffering stalls.
  const isAndroidEmbeddable = Platform.OS === 'android'
    && platform === 'webview'
    && !!detectEmbedPlatform(originalVideoUrl);
  const isAndroidHls = Platform.OS === 'android' && isHlsStream && !!extractedVideoProxyUrl;
  const playerExtractedUrl = isAndroidEmbeddable && extractedVideoProxyUrl
    ? extractedVideoProxyUrl
    : isAndroidHls
      ? extractedVideoProxyUrl  // HLS proxy is primary on Android — correct Referer on all segments
      : extractedVideoUrl;
  const playerProxyUrl = isAndroidEmbeddable
    ? undefined
    : isAndroidHls
      ? extractedVideoUrl  // CDN direct is fallback (if proxy fails, UniversalPlayer switches here)
      : extractedVideoProxyUrl;

  // Reset player ready state when video URL changes (new media)
  useEffect(() => {
    playerReadyRef.current = false;
    pendingSyncRef.current = null;
    lastExecutedSyncRef.current = null;
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
      ? Math.min(30, Math.max(0, (Date.now() - syncToExecute.serverTimestamp) / 1000))
      : 0;
    const targetMs = (syncToExecute.currentTime + compensationSecs) * 1000;
    if (!playerRef.current) { isSyncing.current = false; return; }
    playerRef.current.seekTo(targetMs)
      .then(() => syncToExecute.isPlaying ? playerRef.current?.play() : playerRef.current?.pause())
      .catch(() => {})
      .finally(() => { setTimeout(() => { isSyncing.current = false; }, 400); });
  }, []);

  return {
    playerRef, userId, room, messages, activeMembers, isOwner, adminMonitoring, connectTimeout,
    isExtracting, extractResult, extractionError, showChat, showVoice, showInvite, isPlaying, isFullscreen,
    videoIsLive, videoCurrentTime, videoDuration, floatingEmojis, showQualityMenu, showEpisodeMenu,
    extractQualities, extractEpisodes, currentVideoUrl, bufferingUsers,
    originalVideoUrl, extractedVideoUrl: playerExtractedUrl, extractedVideoHeaders, extractedVideoProxyUrl: playerProxyUrl, isWebViewMode,
    setShowChat, setShowVoice, setShowInvite, setShowQualityMenu, setShowEpisodeMenu, setVideoIsLive,
    sendMessage, sendEmoji,
    onPlaybackStatusUpdate, handleWebViewPlay, handleWebViewPause, handleWebViewSeek,
    handleWebViewBuffering, handleProgress, handleProgressSeek, handlePlayPause, handleStop,
    handleToggleFullscreen: useCallback(() => setIsFullscreen(v => !v), []),
    handleSeekDirection, handleEmojiSelect, handleRemoveEmoji,
    handleChangeMedia, handleQualitySelect, handleEpisodeSelect, handleLeave, handlePlayerReady,
    playlist, handleAddToQueue, handlePlaylistRemove, handlePlaylistNext,
  };
}
