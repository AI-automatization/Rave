// CineSync Mobile — WatchPartyScreen
import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ChatPanel } from '@components/watchParty/ChatPanel';
import { VoiceChat } from '@components/watchParty/VoiceChat';
import { EmojiPickerBar } from '@components/watchParty/EmojiFloat';
import { VideoSection } from '@components/watchParty/VideoSection';
import { RoomInfoBar } from '@components/watchParty/RoomInfoBar';
import { InviteCard } from '@components/watchParty/InviteCard';
import { QualityMenu } from '@components/watchParty/QualityMenu';
import { EpisodeMenu } from '@components/watchParty/EpisodeMenu';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { ModalStackParamList } from '@app-types/index';
import { useT } from '@i18n/index';
import { useWatchPartyRoom } from '@hooks/useWatchPartyRoom';

type RouteType = RouteProp<ModalStackParamList, 'WatchParty'>;

export function WatchPartyScreen() {
  const { params } = useRoute<RouteType>();
  const { colors } = useTheme();
  const s = useStyles();
  const { t } = useT();

  const {
    playerRef, userId, room, messages, activeMembers, isOwner, adminMonitoring, connectTimeout,
    showChat, showVoice, showInvite, isPlaying, isFullscreen, videoIsLive,
    videoCurrentTime, videoDuration, floatingEmojis, showQualityMenu, showEpisodeMenu,
    extractQualities, extractEpisodes, currentVideoUrl,
    originalVideoUrl, extractedVideoUrl, isWebViewMode, isExtracting,
    setShowChat, setShowVoice, setShowInvite, setShowQualityMenu, setShowEpisodeMenu, setVideoIsLive,
    sendMessage,
    onPlaybackStatusUpdate, handleWebViewPlay, handleWebViewPause, handleWebViewSeek,
    handleProgress, handleProgressSeek, handlePlayPause, handleStop,
    handleToggleFullscreen, handleSeekDirection, handleEmojiSelect, handleRemoveEmoji,
    handleChangeMedia, handleQualitySelect, handleEpisodeSelect, handleLeave,
  } = useWatchPartyRoom(params.roomId, params.videoReferer);

  if (connectTimeout && !room) {
    return (
      <View style={s.errorRoot}>
        <Text style={s.errorTitle}>Ulanib bo'lmadi</Text>
        <Text style={s.errorSub}>Socket serverga ulanishda xatolik yuz berdi</Text>
        <TouchableOpacity style={s.errorBtn} onPress={handleLeave}>
          <Text style={s.errorBtnText}>Orqaga qaytish</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <VideoSection
        playerRef={playerRef}
        videoUrl={originalVideoUrl}
        extractedUrl={extractedVideoUrl}
        videoReferer={params.videoReferer}
        isWebView={isWebViewMode}
        isReady={!!room && !isExtracting}
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

          {isOwner && (
            <TouchableOpacity style={s.changeMediaFab} onPress={handleChangeMedia}>
              <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
          )}

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
            <InviteCard inviteCode={room.inviteCode} roomId={params.roomId} roomName={room.name ?? 'Watch Party'} />
          )}

          <View style={[s.emojiBar, Platform.OS === 'ios' ? null : s.emojiBarAndroid]}>
            <EmojiPickerBar onSelect={handleEmojiSelect} />
          </View>

          {showVoice && <VoiceChat roomId={params.roomId} currentUserId={userId} visible={showVoice} onClose={() => setShowVoice(false)} />}

          {showChat && (
            <View style={s.chatPanel}>
              <ChatPanel messages={messages} currentUserId={userId} onSend={sendMessage} />
            </View>
          )}

          <QualityMenu visible={showQualityMenu} qualities={extractQualities} currentUrl={currentVideoUrl || room?.videoUrl || ''} onSelect={handleQualitySelect} onClose={() => setShowQualityMenu(false)} />
          <EpisodeMenu visible={showEpisodeMenu} episodes={extractEpisodes} currentUrl={currentVideoUrl || room?.videoUrl || ''} onSelect={handleEpisodeSelect} onClose={() => setShowEpisodeMenu(false)} />
        </>
      )}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgVoid },
  changeMediaFab: {
    position: 'absolute', right: spacing.lg, bottom: 72,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10, elevation: 8,
    shadowColor: '#000', shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 8,
  },
  gearRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.05)' },
  gearBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.bgSurface, borderRadius: borderRadius.full },
  gearBtnText: { ...typography.caption, color: colors.textMuted },
  emojiBar: { padding: spacing.md, alignItems: 'center' },
  emojiBarAndroid: { marginTop: spacing.sm },
  chatPanel: { flex: 1 },
  errorRoot: { flex: 1, backgroundColor: colors.bgBase, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xl },
  errorTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  errorSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  errorBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderRadius: 12 },
  errorBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  adminBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: 'rgba(245,158,11,0.12)', paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  adminBannerText: { ...typography.caption, color: colors.warning, fontWeight: '600' },
}));
