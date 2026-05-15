// CineSync Mobile — WatchPartyScreen
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet, Dimensions } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { ReportRoomModal } from '@components/common/ReportRoomModal';
import { ReportUserModal } from '@components/common/ReportUserModal';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ChatPanel, ChatMessage } from '@components/watchParty/ChatPanel';
import { VoiceChat } from '@components/watchParty/VoiceChat';
import { EmojiPickerBar } from '@components/watchParty/EmojiFloat';
import { VideoSection } from '@components/watchParty/VideoSection';
import { RoomInfoBar } from '@components/watchParty/RoomInfoBar';
import { InviteCard } from '@components/watchParty/InviteCard';
import { QualityMenu } from '@components/watchParty/QualityMenu';
import { EpisodeMenu } from '@components/watchParty/EpisodeMenu';
import { PlaylistPanel } from '@components/watchParty/PlaylistPanel';
import { BlockedDomainView } from '@components/common/BlockedDomainView';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, borderRadius, typography } from '@theme/index';
import { ModalStackParamList } from '@app-types/index';
import { useT } from '@i18n/index';
import { useWatchPartyRoom } from '@hooks/useWatchPartyRoom';
import { MembersStrip } from '@components/watchParty/MembersStrip';
import { VideoProgressBar } from '@components/watchParty/VideoProgressBar';
import { isDomainBlocked } from '@constants/blockedDomains';
import { extractDomain } from '@utils/videoPlayer';

const SCREEN_H = Dimensions.get('window').height;

type RouteType = RouteProp<ModalStackParamList, 'WatchParty'>;

export function WatchPartyScreen() {
  const { params } = useRoute<RouteType>();
  const { colors } = useTheme();
  const { t } = useT();

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportUserId, setReportUserId] = useState<string | null>(null);

  const {
    playerRef, userId, room, messages, activeMembers, isOwner, adminMonitoring, connectTimeout,
    showChat, showVoice, showInvite, isPlaying, isFullscreen, videoIsLive,
    videoCurrentTime, videoDuration, floatingEmojis, showQualityMenu, showEpisodeMenu,
    extractQualities, extractEpisodes, currentVideoUrl, extractionError,
    originalVideoUrl, extractedVideoUrl, extractedVideoHeaders, isWebViewMode, isExtracting,
    playlist, handleAddToQueue, handlePlaylistRemove, handlePlaylistNext,
    setShowChat, setShowVoice, setShowInvite, setShowQualityMenu, setShowEpisodeMenu, setVideoIsLive,
    sendMessage,
    onPlaybackStatusUpdate, handleWebViewPlay, handleWebViewPause, handleWebViewSeek,
    handleWebViewBuffering, handleProgress, handleProgressSeek, handlePlayPause, handleStop,
    handleToggleFullscreen, handleSeekDirection, handleEmojiSelect, handleRemoveEmoji,
    handleChangeMedia, handleQualitySelect, handleEpisodeSelect, handleLeave,
  } = useWatchPartyRoom(params.roomId, params.videoReferer);

  // Lock orientation: landscape in fullscreen, portrait otherwise
  useEffect(() => {
    if (isFullscreen) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } else {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
  }, [isFullscreen]);

  // Restore portrait when leaving the screen
  useEffect(() => {
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  if (connectTimeout && !room) {
    return (
      <View style={s.errorRoot}>
        <View style={s.errorIconWrap}>
          <Ionicons name="wifi-outline" size={32} color="rgba(255,255,255,0.3)" />
        </View>
        <Text style={s.errorTitle}>Ulanib bo&apos;lmadi</Text>
        <Text style={s.errorSub}>Socket serverga ulanishda xatolik yuz berdi</Text>
        <TouchableOpacity style={s.errorBtn} onPress={handleLeave} activeOpacity={0.8}>
          <Text style={s.errorBtnText}>Orqaga qaytish</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const activeVideoUrl = room?.videoUrl ?? originalVideoUrl ?? '';
  const domainName = activeVideoUrl ? extractDomain(activeVideoUrl) : null;
  const domainBlocked = domainName ? isDomainBlocked(activeVideoUrl) : false;

  if (domainBlocked && domainName) {
    return <BlockedDomainView domain={domainName} onClose={handleLeave} />;
  }

  // Hide members strip when chat/voice is shown — gives more vertical space
  const showMembers = !isFullscreen && !!room && !showChat && !showVoice;

  return (
    <View style={s.root}>

      {/* Expired source banner */}
      {extractionError === 'video_source_expired' && (
        <View style={s.expiredBanner}>
          <Ionicons name="warning-outline" size={14} color="#F59E0B" />
          <Text style={s.expiredText}>
            {isOwner ? 'Видео источник устарел' : 'Видео источник устарел — хозяин обновит'}
          </Text>
          {isOwner && (
            <TouchableOpacity style={s.expiredBtn} onPress={handleChangeMedia} activeOpacity={0.8}>
              <Text style={s.expiredBtnText}>Yangilash</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Members strip — hidden when chat/voice open */}
      {showMembers && (
        <MembersStrip
          activeMembers={activeMembers}
          ownerId={room!.ownerId}
          currentUserId={userId}
          onMemberPress={uid => setReportUserId(uid)}
        />
      )}

      {/* Video */}
      <VideoSection
        playerRef={playerRef}
        videoUrl={extractionError === 'video_source_expired' ? '' : originalVideoUrl}
        extractedUrl={extractionError === 'video_source_expired' ? undefined : extractedVideoUrl}
        videoReferer={params.videoReferer}
        videoHeaders={extractionError === 'video_source_expired' ? undefined : extractedVideoHeaders}
        isWebView={extractionError === 'video_source_expired' ? false : isWebViewMode}
        isReady={extractionError === 'video_source_expired' ? true : !!room && (!isExtracting || isWebViewMode)}
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

      {/* ── Fullscreen overlay (renders above absolute VideoSection) ── */}
      {isFullscreen && (
        <View style={s.fsOverlay} pointerEvents="box-none">

          {/* Chat panel */}
          {showChat && (
            <View style={s.fsChatWrap}>
              <ChatPanel messages={messages} currentUserId={userId} onSend={sendMessage} />
            </View>
          )}

          {/* Voice chat */}
          {showVoice && (
            <VoiceChat
              roomId={params.roomId}
              currentUserId={userId}
              visible={showVoice}
              onClose={() => setShowVoice(false)}
            />
          )}

          {/* Progress bar */}
          {!videoIsLive && videoDuration > 0 && (
            <View style={s.fsProgressWrap}>
              <VideoProgressBar
                currentTime={videoCurrentTime}
                duration={videoDuration}
                isOwner={isOwner}
                isLive={videoIsLive}
                onSeek={handleProgressSeek}
              />
            </View>
          )}

          {/* Bottom action bar */}
          <View style={s.fsBar}>
            <EmojiPickerBar onSelect={handleEmojiSelect} />
            <View style={s.fsBarActions}>
              <TouchableOpacity
                style={[s.fsBarBtn, showChat && s.fsBarBtnChatActive]}
                onPress={() => { setShowChat(v => !v); setShowVoice(false); }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={showChat ? 'chatbubble' : 'chatbubble-outline'}
                  size={20}
                  color={showChat ? '#7B72F8' : 'rgba(255,255,255,0.75)'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.fsBarBtn, showVoice && s.fsBarBtnVoiceActive]}
                onPress={() => { setShowVoice(v => !v); setShowChat(false); }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={showVoice ? 'mic' : 'mic-outline'}
                  size={20}
                  color={showVoice ? '#4ADE80' : 'rgba(255,255,255,0.75)'}
                />
              </TouchableOpacity>
              {isOwner && (
                <TouchableOpacity style={s.fsBarBtn} onPress={handleChangeMedia} activeOpacity={0.8}>
                  <Ionicons name="add-circle-outline" size={20} color="rgba(255,255,255,0.75)" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={s.fsBarBtn} onPress={handleToggleFullscreen} activeOpacity={0.8}>
                <Ionicons name="contract-outline" size={20} color="rgba(255,255,255,0.75)" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {!isFullscreen && (
        <>
          {/* Room info bar */}
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

          {/* Quality / Episode gear row */}
          {isOwner && !showPlaylist && (extractQualities.length > 0 || extractEpisodes.length > 0) && (
            <View style={s.gearRow}>
              {extractQualities.length > 0 && (
                <TouchableOpacity style={s.gearChip} onPress={() => setShowQualityMenu(true)} activeOpacity={0.75}>
                  <Ionicons name="settings-outline" size={13} color="rgba(255,255,255,0.5)" />
                  <Text style={s.gearChipText}>Sifat</Text>
                </TouchableOpacity>
              )}
              {extractEpisodes.length > 0 && (
                <TouchableOpacity style={s.gearChip} onPress={() => setShowEpisodeMenu(true)} activeOpacity={0.75}>
                  <Ionicons name="list-outline" size={13} color="rgba(255,255,255,0.5)" />
                  <Text style={s.gearChipText}>Epizodlar</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Admin monitoring banner */}
          {adminMonitoring && (
            <View style={s.adminBanner}>
              <Ionicons name="shield-checkmark-outline" size={13} color="#F59E0B" />
              <Text style={s.adminBannerText}>{t('blocked', 'adminMonitoring')}</Text>
            </View>
          )}

          {/* Invite card */}
          {showInvite && room?.inviteCode && (
            <InviteCard
              inviteCode={room.inviteCode}
              roomId={params.roomId}
              roomName={room.name ?? 'Watch Party'}
            />
          )}

          {/* Emoji reaction bar */}
          <View style={[s.emojiBar, Platform.OS !== 'ios' && s.emojiBarAndroid]}>
            <EmojiPickerBar onSelect={handleEmojiSelect} />
          </View>

          {/* Voice chat panel */}
          {showVoice && (
            <VoiceChat
              roomId={params.roomId}
              currentUserId={userId}
              visible={showVoice}
              onClose={() => setShowVoice(false)}
            />
          )}

          {/* Chat panel */}
          {showChat && (
            <View style={s.chatPanel}>
              <ChatPanel messages={messages} currentUserId={userId} onSend={sendMessage} />
            </View>
          )}

          {/* Playlist overlay */}
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

          {/* FAB: Change media (owner) */}
          {isOwner && !showPlaylist && (
            <TouchableOpacity style={s.fabPrimary} onPress={handleChangeMedia} activeOpacity={0.85}>
              <Ionicons name="add" size={26} color="#fff" />
            </TouchableOpacity>
          )}

          {/* FAB: Playlist */}
          {!showPlaylist && (
            <TouchableOpacity
              style={[s.fabSecondary, playlist.length > 0 && s.fabSecondaryActive]}
              onPress={() => setShowPlaylist(v => !v)}
              activeOpacity={0.8}
            >
              <Ionicons name="list" size={19} color="#fff" />
              {playlist.length > 0 && (
                <View style={s.fabBadge}>
                  <Text style={s.fabBadgeText}>{playlist.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* FAB: Report (viewer only) */}
          {!isOwner && (
            <TouchableOpacity style={s.fabReport} onPress={() => setShowReport(true)} activeOpacity={0.8}>
              <Ionicons name="flag-outline" size={17} color="rgba(255,255,255,0.45)" />
            </TouchableOpacity>
          )}

          {/* Menus & modals */}
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
          {room && (
            <ReportRoomModal
              visible={showReport}
              roomId={params.roomId}
              onClose={() => setShowReport(false)}
            />
          )}
          {reportUserId && (
            <ReportUserModal
              visible
              userId={reportUserId}
              onClose={() => setReportUserId(null)}
            />
          )}
        </>
      )}
    </View>
  );
}

const FAB_BOTTOM = 70;
const FAB_PRIMARY_SIZE = 52;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#08080E',
  },

  // ── Error screen ────────────────────────────────────────────────
  errorRoot: {
    flex: 1,
    backgroundColor: '#0D0D1A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  errorIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  errorSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBtn: {
    backgroundColor: '#7B72F8',
    paddingHorizontal: 32,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: '#7B72F8',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  errorBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // ── Expired banner ──────────────────────────────────────────────
  expiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245,158,11,0.10)',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245,158,11,0.20)',
  },
  expiredText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  expiredBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  expiredBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 11,
  },

  // ── Gear row ────────────────────────────────────────────────────
  gearRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#0D0D1A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  gearChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  gearChipText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
  },

  // ── Admin banner ────────────────────────────────────────────────
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(245,158,11,0.08)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245,158,11,0.12)',
  },
  adminBannerText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
  },

  // ── Emoji bar ───────────────────────────────────────────────────
  emojiBar: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#0D0D1A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  emojiBarAndroid: {
    paddingTop: 12,
  },

  // ── Chat / Voice panels ─────────────────────────────────────────
  chatPanel: { flex: 1 },

  // ── Playlist overlay ────────────────────────────────────────────
  playlistSheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    zIndex: 15, elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
  },

  // ── FABs ────────────────────────────────────────────────────────
  fabPrimary: {
    position: 'absolute',
    right: 16,
    bottom: FAB_BOTTOM,
    width: FAB_PRIMARY_SIZE,
    height: FAB_PRIMARY_SIZE,
    borderRadius: FAB_PRIMARY_SIZE / 2,
    backgroundColor: '#7B72F8',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 20, elevation: 10,
    shadowColor: '#7B72F8',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
  },
  fabSecondary: {
    position: 'absolute',
    right: 16,
    bottom: FAB_BOTTOM + FAB_PRIMARY_SIZE + 10,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 20, elevation: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  fabSecondaryActive: {
    backgroundColor: 'rgba(123,114,248,0.40)',
    borderColor: 'rgba(123,114,248,0.50)',
  },
  fabBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#7B72F8',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#08080E',
  },
  fabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  fabReport: {
    position: 'absolute',
    left: 16,
    bottom: FAB_BOTTOM,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },

  // ── Fullscreen overlay ──────────────────────────────────────────
  fsOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'flex-end',
  },
  fsChatWrap: {
    height: Math.round(SCREEN_H * 0.38),
    backgroundColor: '#0D0D1A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  fsProgressWrap: {
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingVertical: 2,
  },
  fsBar: {
    backgroundColor: 'rgba(8,8,18,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    gap: 6,
  },
  fsBarActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  fsBarBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  fsBarBtnChatActive: {
    backgroundColor: 'rgba(123,114,248,0.18)',
    borderColor: 'rgba(123,114,248,0.55)',
  },
  fsBarBtnVoiceActive: {
    backgroundColor: 'rgba(74,222,128,0.15)',
    borderColor: 'rgba(74,222,128,0.50)',
  },
});
