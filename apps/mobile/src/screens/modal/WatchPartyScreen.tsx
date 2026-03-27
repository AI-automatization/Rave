// CineSync Mobile — WatchPartyScreen
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Alert, Platform } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AVPlaybackStatus } from 'expo-av';
import { useWatchParty } from '@hooks/useWatchParty';
import { useAuthStore } from '@store/auth.store';
import { watchPartyApi } from '@api/watchParty.api';
import { disconnectSocket, getSocket, CLIENT_EVENTS } from '@socket/client';
import { ChatPanel } from '@components/watchParty/ChatPanel';
import { VoiceChat } from '@components/watchParty/VoiceChat';
import { EmojiPickerBar } from '@components/watchParty/EmojiFloat';
import { UniversalPlayerRef, detectVideoPlatform } from '@components/video/UniversalPlayer';
import { VideoSection, FloatingEmoji } from '@components/watchParty/VideoSection';
import { RoomInfoBar } from '@components/watchParty/RoomInfoBar';
import { InviteCard } from '@components/watchParty/InviteCard';
import { QualityMenu, QualityOption } from '@components/watchParty/QualityMenu';
import { EpisodeMenu, Episode } from '@components/watchParty/EpisodeMenu';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { ModalStackParamList } from '@app-types/index';
import { useT } from '@i18n/index';

type RouteType = RouteProp<ModalStackParamList, 'WatchParty'>;
type NavProp = NativeStackNavigationProp<ModalStackParamList>;

const { width: SCREEN_W } = Dimensions.get('window');

export function WatchPartyScreen() {
  const { params } = useRoute<RouteType>();
  const videoReferer = params.videoReferer;
  const navigation = useNavigation<NavProp>();
  const userId = useAuthStore(s => s.user?._id) ?? '';
  const { colors } = useTheme();
  const s = useStyles();

  const { t } = useT();
  const { room, syncState, messages, activeMembers, isOwner, adminMonitoring, roomClosed, emitPlay, emitPause, emitSeek, sendMessage, sendEmoji } =
    useWatchParty(params.roomId);
  // emitVoiceJoin/Leave handled directly inside VoiceChat via getSocket()

  const playerRef = useRef<UniversalPlayerRef>(null);
  const isSyncing = useRef(false);
  const lastSyncId = useRef('');
  const prevIsPlayingRef = useRef(false);

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
  // E68: Quality/Episode menus
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showEpisodeMenu, setShowEpisodeMenu] = useState(false);
  const [extractQualities, setExtractQualities] = useState<QualityOption[]>([]);
  const [extractEpisodes, setExtractEpisodes] = useState<Episode[]>([]);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');

  // 15 soniya ichida room kelmasa — xabar ko'rsatish
  useEffect(() => {
    if (room) return;
    const timer = setTimeout(() => setConnectTimeout(true), 15000);
    return () => clearTimeout(timer);
  }, [room]);

  // ROOM_CLOSED handler — reason ga qarab Alert yoki redirect
  useEffect(() => {
    if (!roomClosed) return;

    if (roomClosed.reason === 'account_blocked') {
      navigation.goBack();
      return;
    }

    let message = '';
    if (roomClosed.reason === 'inactivity') {
      message = t('watchParty', 'closedInactivity') ?? 'Xona 5 daqiqa faolsizlikdan avtomatik yopildi';
    } else if (roomClosed.reason === 'owner_left') {
      message = t('watchParty', 'closedOwnerLeft') ?? 'Xona egasi xonani yopdi';
    } else if (roomClosed.reason === 'admin_closed') {
      message = `${t('watchParty', 'closedByAdmin') ?? 'Xona admin tomonidan yopildi'}`;
      if (roomClosed.adminEmail) message += ` (${roomClosed.adminEmail})`;
      if (roomClosed.closeReason) message += `\n${t('watchParty', 'reason') ?? 'Sabab'}: ${roomClosed.closeReason}`;
    }

    Alert.alert(
      t('watchParty', 'roomClosed') ?? 'Xona yopildi',
      message,
      [{ text: 'OK', onPress: () => navigation.goBack() }],
    );
  }, [roomClosed, navigation, t]);

  useEffect(() => {
    if (!syncState) return;
    const syncId = `${syncState.serverTimestamp}`;
    if (lastSyncId.current === syncId) return;
    lastSyncId.current = syncId;

    isSyncing.current = true;
    playerRef.current
      ?.seekTo(syncState.currentTime * 1000)
      .then(() => {
        if (syncState.isPlaying) return playerRef.current?.play();
        else return playerRef.current?.pause();
      })
      .catch(() => {})
      .finally(() => { isSyncing.current = false; });
  }, [syncState]);

  // Owner periodic sync heartbeat — every 5 seconds, emit current position
  // Keeps members in sync even if individual play/pause events are missed
  useEffect(() => {
    if (!isOwner || !room) return;
    const interval = setInterval(async () => {
      if (isSyncing.current) return;
      const posMs = (await playerRef.current?.getPositionMs()) ?? 0;
      if (isPlaying) {
        emitPlay(posMs / 1000);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isOwner, room, isPlaying, emitPlay]);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded || isSyncing.current) return;
    const nowPlaying = status.isPlaying;
    setIsPlaying(nowPlaying);

    // Progress bar update (expo-av direct streams)
    setVideoCurrentTime(status.positionMillis / 1000);
    if (status.durationMillis) setVideoDuration(status.durationMillis / 1000);

    // Owner: emit play/pause when expo-av video state changes
    if (isOwner) {
      const posSecs = status.positionMillis / 1000;
      if (nowPlaying && !prevIsPlayingRef.current) emitPlay(posSecs);
      if (!nowPlaying && prevIsPlayingRef.current) emitPause(posSecs);
    }
    prevIsPlayingRef.current = nowPlaying;
  }, [isOwner, emitPlay, emitPause]);

  const handleWebViewPlay = useCallback((secs: number) => {
    setIsPlaying(true);
    if (isOwner && !isSyncing.current) emitPlay(secs);
  }, [isOwner, emitPlay]);

  const handleWebViewPause = useCallback((secs: number) => {
    setIsPlaying(false);
    if (isOwner && !isSyncing.current) emitPause(secs);
  }, [isOwner, emitPause]);

  const handleWebViewSeek = useCallback((secs: number) => {
    if (isOwner && !isSyncing.current) emitSeek(secs);
  }, [isOwner, emitSeek]);

  // WebView progress (currentTime/duration from JS injection)
  const handleProgress = useCallback((currentTimeSecs: number, durationSecs: number) => {
    setVideoCurrentTime(currentTimeSecs);
    if (durationSecs > 0) setVideoDuration(durationSecs);
  }, []);

  const handleProgressSeek = useCallback(async (secs: number) => {
    if (!isOwner || videoIsLive) return;
    const ms = secs * 1000;
    await playerRef.current?.seekTo(ms);
    emitSeek(secs);
  }, [isOwner, videoIsLive, emitSeek]);

  const handlePlayPause = useCallback(async () => {
    if (!isOwner) return;
    const posMs = (await playerRef.current?.getPositionMs()) ?? 0;
    if (isPlaying) {
      await playerRef.current?.pause();
      emitPause(posMs / 1000);
    } else {
      await playerRef.current?.play();
      emitPlay(posMs / 1000);
    }
  }, [isOwner, isPlaying, emitPlay, emitPause]);

  const handleStop = useCallback(async () => {
    if (!isOwner) return;
    await playerRef.current?.seekTo(0);
    await playerRef.current?.pause();
    emitPause(0);
    setIsPlaying(false);
  }, [isOwner, emitPause]);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(v => !v);
  }, []);

  const handleSeekDirection = useCallback(async (direction: 'forward' | 'back') => {
    if (!isOwner || videoIsLive) return;
    const posMs = (await playerRef.current?.getPositionMs()) ?? 0;
    const delta = direction === 'forward' ? 10 : -10;
    const newMs = Math.max(0, posMs + delta * 1000);
    await playerRef.current?.seekTo(newMs);
    emitSeek(newMs / 1000);
  }, [isOwner, videoIsLive, emitSeek]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    sendEmoji(emoji);
    setFloatingEmojis(prev => [
      ...prev,
      { id: `${Date.now()}`, emoji, x: Math.random() * (SCREEN_W - 60) + 10 },
    ]);
  }, [sendEmoji]);

  const handleRemoveEmoji = useCallback((id: string) => {
    setFloatingEmojis(prev => prev.filter(e => e.id !== id));
  }, []);

  const handleChangeMedia = useCallback(() => {
    if (!isOwner) return;
    navigation.navigate('SourcePicker', { context: 'change_media', roomId: params.roomId });
  }, [isOwner, navigation, params.roomId]);

  // E68-3/E68-4: Quality/Episode selection → CHANGE_MEDIA socket event
  const handleQualitySelect = useCallback((option: QualityOption) => {
    if (!isOwner || !room) return;
    getSocket()?.emit(CLIENT_EVENTS.CHANGE_MEDIA, {
      roomId: params.roomId,
      videoUrl: option.url,
      videoTitle: room.videoTitle ?? 'Video',
      videoPlatform: room.videoPlatform ?? 'direct',
    });
    setCurrentVideoUrl(option.url);
  }, [isOwner, room, params.roomId]);

  const handleEpisodeSelect = useCallback((episode: Episode) => {
    if (!isOwner || !room) return;
    getSocket()?.emit(CLIENT_EVENTS.CHANGE_MEDIA, {
      roomId: params.roomId,
      videoUrl: episode.url,
      videoTitle: episode.title,
      videoPlatform: room.videoPlatform ?? 'direct',
    });
    setCurrentVideoUrl(episode.url);
  }, [isOwner, room, params.roomId]);

  const handleLeave = () => {
    Alert.alert('Chiqish', 'Watch Party dan chiqmoqchimisiz?', [
      { text: 'Bekor', style: 'cancel' },
      {
        text: isOwner ? 'Xonani yopish' : 'Chiqish',
        style: 'destructive',
        onPress: async () => {
          try {
            if (isOwner) await watchPartyApi.closeRoom(params.roomId);
            else await watchPartyApi.leaveRoom(params.roomId);
          } catch {
            // Room may already be gone — proceed with leaving
          }
          disconnectSocket();
          navigation.goBack();
        },
      },
    ]);
  };

  if (connectTimeout && !room) {
    return (
      <View style={s.errorRoot}>
        <Text style={s.errorTitle}>Ulanib bo'lmadi</Text>
        <Text style={s.errorSub}>Socket serverga ulanishda xatolik yuz berdi</Text>
        <TouchableOpacity style={s.errorBtn} onPress={() => navigation.goBack()}>
          <Text style={s.errorBtnText}>Orqaga qaytish</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <VideoSection
        playerRef={playerRef}
        videoUrl={room?.videoUrl || ''}
        videoReferer={videoReferer}
        isWebView={['youtube', 'webview'].includes(detectVideoPlatform(room?.videoUrl || ''))}
        isReady={!!room}
        isOwner={isOwner}
        isPlaying={isPlaying}
        isFullscreen={isFullscreen}
        videoIsLive={videoIsLive}
        floatingEmojis={floatingEmojis}
        onPlay={handleWebViewPlay}
        onPause={handleWebViewPause}
        onSeek={handleWebViewSeek}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        onProgress={handleProgress}
        onStreamResolved={({ isLive }) => setVideoIsLive(isLive)}
        onPlayPause={handlePlayPause}
        currentTime={videoCurrentTime}
        duration={videoDuration}
        onProgressSeek={handleProgressSeek}
        onStop={handleStop}
        onSeekDirection={handleSeekDirection}
        onToggleFullscreen={handleToggleFullscreen}
        onRemoveEmoji={handleRemoveEmoji}
      />

      {!isFullscreen && (
        <>
          <RoomInfoBar
            roomName={room?.name ?? 'Watch Party'}
            memberCount={activeMembers.length}
            isOwner={isOwner}
            hasMessages={messages.length > 0}
            onToggleInvite={() => setShowInvite(v => !v)}
            onToggleChat={() => { setShowChat(v => !v); setShowVoice(false); }}
            onToggleVoice={() => { setShowVoice(v => !v); setShowChat(false); }}
            onLeave={handleLeave}
          />

          {/* Owner: кнопка смены медиа источника */}
          {isOwner && (
            <TouchableOpacity style={s.changeMediaBtn} onPress={handleChangeMedia}>
              <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
              <Text style={s.changeMediaText}>
                {room?.videoTitle ? room.videoTitle.slice(0, 36) : 'Выбрать источник'}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          )}

          {/* E68-3: Quality/Episode buttons — owner only, when data available */}
          {isOwner && (extractQualities.length > 0 || extractEpisodes.length > 0) && (
            <View style={s.gearRow}>
              {extractQualities.length > 0 && (
                <TouchableOpacity style={s.gearBtn} onPress={() => setShowQualityMenu(true)}>
                  <Ionicons name="settings-outline" size={14} color={colors.textMuted} />
                  <Text style={s.gearBtnText}>Сифат</Text>
                </TouchableOpacity>
              )}
              {extractEpisodes.length > 0 && (
                <TouchableOpacity style={s.gearBtn} onPress={() => setShowEpisodeMenu(true)}>
                  <Ionicons name="list-outline" size={14} color={colors.textMuted} />
                  <Text style={s.gearBtnText}>Эпизодлар</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {adminMonitoring && (
            <View style={s.adminBanner}>
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.warning} />
              <Text style={s.adminBannerText}>{t('blocked', 'adminMonitoring')}</Text>
            </View>
          )}

          {showInvite && room?.inviteCode && (
            <InviteCard
              inviteCode={room.inviteCode}
              roomId={params.roomId}
              roomName={room.name ?? 'Watch Party'}
            />
          )}

          <View style={[s.emojiBar, Platform.OS === 'ios' ? null : s.emojiBarAndroid]}>
            <EmojiPickerBar onSelect={handleEmojiSelect} />
          </View>

          {showVoice && (
            <VoiceChat
              roomId={params.roomId}
              currentUserId={userId}
              visible={showVoice}
              onClose={() => setShowVoice(false)}
            />
          )}

          {showChat && (
            <View style={s.chatPanel}>
              <ChatPanel messages={messages} currentUserId={userId} onSend={sendMessage} />
            </View>
          )}

          {/* E68-1/E68-2: Quality and Episode modals */}
          <QualityMenu
            visible={showQualityMenu}
            qualities={extractQualities}
            currentUrl={currentVideoUrl || room?.videoUrl || ''}
            onSelect={handleQualitySelect}
            onClose={() => setShowQualityMenu(false)}
          />
          <EpisodeMenu
            visible={showEpisodeMenu}
            episodes={extractEpisodes}
            currentUrl={currentVideoUrl || room?.videoUrl || ''}
            onSelect={handleEpisodeSelect}
            onClose={() => setShowEpisodeMenu(false)}
          />
        </>
      )}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgVoid },
  changeMediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(229,9,20,0.06)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  changeMediaText: {
    flex: 1,
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
  },
  gearRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  gearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.full,
  },
  gearBtnText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  emojiBar: { padding: spacing.md, alignItems: 'center' },
  emojiBarAndroid: { marginTop: spacing.sm },
  chatPanel: { flex: 1 },
  errorRoot: {
    flex: 1,
    backgroundColor: colors.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  errorTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  errorSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  errorBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  errorBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(245,158,11,0.12)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  adminBannerText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '600',
  },
}));
