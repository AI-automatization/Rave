// CineSync Mobile — WatchPartyScreen
import React, { useState } from 'react';
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
import { PlaylistPanel } from '@components/watchParty/PlaylistPanel';
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

  const [showPlaylist, setShowPlaylist] = useState(false);

  const {
    playerRef, userId, room, messages, activeMembers, isOwner, adminMonitoring, connectTimeout,
    showChat, showVoice, showInvite, isPlaying, isFullscreen, videoIsLive,
    videoCurrentTime, videoDuration, floatingEmojis, showQualityMenu, showEpisodeMenu,
    extractQualities, extractEpisodes, currentVideoUrl,
    originalVideoUrl, extractedVideoUrl, isWebViewMode, isExtracting,
    playlist, handleAddToQueue, handlePlaylistRemove, handlePlaylistNext,
    setShowChat, setShowVoice, setShowInvite, setShowQualityMenu, setShowEpisodeMenu, setVideoIsLive,
    sendMessage,
    onPlaybackStatusUpdate, handleWebViewPlay, handleWebViewPause, handleWebViewSeek,
    handleWebViewBuffering, handleProgress, handleProgressSeek, handlePlayPause, handleStop,
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
        isReady={!!room && (!isExtracting || isWebViewMode)}
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
        onBuffering={handleWebViewBuffering}
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

          {isOwner && !showPlaylist && (
            <TouchableOpacity style={s.changeMediaFab} onPress={handleChangeMedia}>
              <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
          )}

          {!showPlaylist && (
            <TouchableOpacity
              style={[s.playlistFab, playlist.length > 0 && s.playlistFabActive]}
              onPress={() => setShowPlaylist(v => !v)}
            >
              <Ionicons name="list" size={20} color="#fff" />
              {playlist.length > 0 && (
                <View style={s.playlistBadge}>
                  <Text style={s.playlistBadgeText}>{playlist.length}</Text>
                </View>
              )}
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

          {showPlaylist && (
            <View style={s.playlistSheet}>
              <PlaylistPanel
                playlist={playlist}
                isOwner={isOwner}
                onAddToQueue={handleAddToQueue}
                onRemove={handlePlaylistRemove}
                onPlayNext={handlePlaylistNext}
                onClose={() => setShowPlaylist(false)}
              />
            </View>
          )}

          <QualityMenu visible={showQualityMenu} qualities={extractQualities} currentUrl={currentVideoUrl || room?.videoUrl || ''} onSelect={handleQualitySelect} onClose={() => setShowQualityMenu(false)} />
          <EpisodeMenu visible={showEpisodeMenu} episodes={extractEpisodes} currentUrl={currentVideoUrl || room?.videoUrl || ''} onSelect={handleEpisodeSelect} onClose={() => setShowEpisodeMenu(false)} />
        </>
      )}
    </View>
  );
}

const FAB_BOTTOM = 72;
const FAB_PRIMARY_SIZE = 52;

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgVoid },
  changeMediaFab: {
    position: 'absolute', right: spacing.lg, bottom: FAB_BOTTOM,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 20, elevation: 8,
    shadowColor: '#000', shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 8,
  },
  playlistFab: {
    position: 'absolute', right: spacing.lg, bottom: FAB_BOTTOM + FAB_PRIMARY_SIZE + spacing.sm,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 20, elevation: 7,
  },
  playlistFabActive: { backgroundColor: 'rgba(123,114,248,0.5)' },
  playlistBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  playlistBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
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
  playlistSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    zIndex: 15, elevation: 16,
    shadowColor: '#000', shadowOpacity: 0.35,
    shadowRadius: 20, shadowOffset: { width: 0, height: -4 },
  },
}));
