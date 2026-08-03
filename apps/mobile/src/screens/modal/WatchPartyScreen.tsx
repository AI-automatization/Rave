// WeWatch Mobile — WatchPartyScreen
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import * as ScreenOrientation from 'expo-screen-orientation';
import { ReportRoomModal } from '@components/common/ReportRoomModal';
import { ReportUserModal } from '@components/common/ReportUserModal';
import { UserActionSheet } from '@components/common/UserActionSheet';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChatPanel, ChatMessage } from '@components/watchParty/ChatPanel';
import { VoiceStrip } from '@components/watchParty/VoiceStrip';
import { useVoiceChat } from '@hooks/useVoiceChat';
import { EmojiPickerBar } from '@components/watchParty/EmojiFloat';
import { VideoSection } from '@components/watchParty/VideoSection';
import { VirtualBrowserPlayer } from '@components/watchParty/VirtualBrowserPlayer';
import { useVirtualBrowser } from '@hooks/useVirtualBrowser';
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
import { getSocket, CLIENT_EVENTS } from '@socket/client';
import { analyticsService } from '@services/analyticsService';
import { MembersStrip } from '@components/watchParty/MembersStrip';
import { VideoProgressBar } from '@components/watchParty/VideoProgressBar';
import { isDomainBlocked } from '@constants/blockedDomains';
import { extractDomain } from '@utils/videoPlayer';
import { blockedUsersStorage } from '@utils/storage';
import { userApi } from '@api/user.api';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useFriendsStore } from '@store/friends.store';
import { appAlert } from '@components/common/AppAlert';

type NavProp = NativeStackNavigationProp<ModalStackParamList, 'WatchParty'>;

type RouteType = RouteProp<ModalStackParamList, 'WatchParty'>;

export function WatchPartyScreen() {
  const { params } = useRoute<RouteType>();
  const { colors } = useTheme();
  const { t } = useT();
  const navigation = useNavigation<NavProp>();
  const { height: winHeight } = useWindowDimensions();

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportUserId, setReportUserId] = useState<string | null>(null);
  const [actionSheetUserId, setActionSheetUserId] = useState<string | null>(null);

  const { data: actionSheetProfile } = useQuery({
    queryKey: ['user-public', actionSheetUserId],
    queryFn: () => userApi.getPublicProfile(actionSheetUserId!),
    enabled: !!actionSheetUserId,
    staleTime: 5 * 60 * 1000,
  });

  const handleMemberPress = (uid: string) => {
    setActionSheetUserId(uid);
  };

  const handleActionSheetClose = () => setActionSheetUserId(null);

  // "Add friend" only makes sense for someone who isn't already one — the room is full of
  // strangers, which is exactly why the action belongs here and not only on the friends screen.
  const friends = useFriendsStore((s) => s.friends);
  const isAlreadyFriend = friends.some((f) => f._id === actionSheetUserId);

  const addFriendMutation = useMutation({
    mutationFn: (uid: string) => userApi.sendFriendRequest(uid),
    onSuccess: () => appAlert('✓', t('friends', 'requestSentAlert')),
    onError: () => appAlert(t('common', 'error'), t('friends', 'requestError')),
  });

  const handleActionSheetAddFriend = () => {
    const uid = actionSheetUserId;
    setActionSheetUserId(null);
    if (uid) addFriendMutation.mutate(uid);
  };

  const handleActionSheetViewProfile = () => {
    const uid = actionSheetUserId;
    setActionSheetUserId(null);
    if (uid) navigation.push('FriendProfile', { userId: uid });
  };

  const handleActionSheetSendMessage = () => {
    const uid = actionSheetUserId;
    const name = actionSheetProfile?.username ?? uid ?? '';
    setActionSheetUserId(null);
    if (uid) {
      navigation.push('DMChat', { peerId: uid, peerName: name });
    }
  };

  const handleActionSheetReport = () => {
    const uid = actionSheetUserId;
    setActionSheetUserId(null);
    if (uid) setReportUserId(uid);
  };

  const handleActionSheetBlock = () => {
    const uid = actionSheetUserId;
    setActionSheetUserId(null);
    if (!uid) return;
    appAlert(
      t('friends', 'blockUserTitle'),
      t('friends', 'blockUserMsg'),
      [
        { text: t('common', 'cancel'), style: 'cancel' },
        {
          text: t('friends', 'blockUser'),
          style: 'destructive',
          onPress: async () => {
            await blockedUsersStorage.add(uid);
            await userApi.blockUser(uid).catch(() => null);
          },
        },
      ],
    );
  };

  const {
    playerRef, userId, room, messages, activeMembers, isOwner, adminMonitoring, connectTimeout, activeTransport,
    showChat, showInvite, isPlaying, isFullscreen, videoIsLive,
    videoCurrentTime, videoDuration, pendingSkipSecs, floatingEmojis, showQualityMenu, showEpisodeMenu,
    extractQualities, extractEpisodes, currentVideoUrl, extractionError,
    originalVideoUrl, extractedVideoUrl, extractedVideoHeaders, extractedVideoProxyUrl, isWebViewMode, isYouTubeWebViewMode, isExtracting, extractFallback,
    playlist, handleAddToQueue, handlePlaylistRemove, handlePlaylistNext,
    setShowChat, setShowInvite, setShowQualityMenu, setShowEpisodeMenu, setVideoIsLive,
    sendMessage,
    onPlaybackStatusUpdate, handleWebViewPlay, handleWebViewPause, handleWebViewSeek,
    handleWebViewBuffering, handleProgress, handleProgressSeek, handlePlayPause, handleStop,
    handleToggleFullscreen, handleSeekDirection, handleEmojiSelect, handleRemoveEmoji,
    handleChangeMedia, handleQualitySelect, handleEpisodeSelect, handleLeave, handlePlayerReady,
    handleCdnUrlSniffed,
  } = useWatchPartyRoom(params.roomId, params.videoReferer);

  // Voice connection lifted to screen level — stays alive across panel switches.
  // Auto-joins muted once the room is loaded; persists while user views chat.
  const voice = useVoiceChat(!!room);

  // Virtual Browser (T-S188) — server auto-falls back to this when CHANGE_MEDIA's extraction
  // pipeline can't produce a playable result (services/watch-party roomEvents.handler.ts). No
  // manual "open browser" trigger on mobile (out of scope) — vb.active flips on/off purely from
  // the server-driven VB_STARTED/VB_STOPPED broadcast, same as web's automatic fallback path.
  const vb = useVirtualBrowser(isOwner);

  // T-S189: room was created with a raw, unverified URL (user forced it via "try current
  // page anyway" — no client/server detection confirmed it beforehand). Mirrors web's
  // ?verify=1 (RoomContent.tsx): re-submit the room's own videoUrl through CHANGE_MEDIA once,
  // right after it's loaded, so the server's extraction pipeline actually runs — and falls back
  // to Virtual Browser automatically if it can't produce a playable result. Deliberately kept
  // OUT of useWatchPartyRoom.ts (fragile, sync-critical file) — this only needs `room`+`isOwner`,
  // both already returned by it, and fires at most once via the ref guard.
  const verifiedRef = useRef(false);
  useEffect(() => {
    if (!params.needsVerify || verifiedRef.current || !room || !isOwner) return;
    verifiedRef.current = true;
    getSocket()?.emit(CLIENT_EVENTS.CHANGE_MEDIA, {
      roomId: params.roomId,
      videoUrl: room.videoUrl,
      videoTitle: room.videoTitle,
      videoPlatform: room.videoPlatform,
    });
  }, [params.needsVerify, params.roomId, room, isOwner]);

  // Lock orientation: landscape in fullscreen, portrait otherwise.
  // Entering fullscreen also closes the chat overlay so the video is the focus by default —
  // the user can tap the chat icon in the fullscreen action bar to bring it back.
  useEffect(() => {
    if (isFullscreen) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      setShowChat(false);
    } else {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullscreen]);

  // Restore portrait when leaving the screen
  useEffect(() => {
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  // Analytics: watch party session tracking
  useEffect(() => {
    analyticsService.watchPartyEnter();
    return () => { analyticsService.watchPartyExit(); };
  }, []);

  if (connectTimeout && !room) {
    return (
      <View style={s.errorRoot}>
        <View style={s.errorIconWrap}>
          <Ionicons name="wifi-outline" size={32} color="rgba(255,255,255,0.3)" />
        </View>
        <Text style={s.errorTitle}>{t('watchParty', 'connectionError')}</Text>
        <Text style={s.errorSub}>{t('watchParty', 'connectionErrorSub')}</Text>
        <TrackedTouchable trackId="watchparty:error_go_back" style={s.errorBtn} onPress={handleLeave} activeOpacity={0.8}>
          <Text style={s.errorBtnText}>{t('watchParty', 'goBack')}</Text>
        </TrackedTouchable>
      </View>
    );
  }

  const activeVideoUrl = room?.videoUrl ?? originalVideoUrl ?? '';
  const domainName = activeVideoUrl ? extractDomain(activeVideoUrl) : null;
  const domainBlocked = domainName ? isDomainBlocked(activeVideoUrl) : false;

  if (domainBlocked && domainName) {
    return <BlockedDomainView domain={domainName} onClose={handleLeave} />;
  }

  // Keep the members strip visible with voice open (voice is about who's in the room).
  // Only hide it for text chat, which needs the extra vertical space.
  const showMembers = !isFullscreen && !!room && !showChat;

  return (
    <View style={s.root}>

      {/* Expired source banner */}
      {extractionError === 'video_source_expired' && (
        <View style={s.expiredBanner}>
          <Ionicons name="warning-outline" size={14} color="#F59E0B" />
          <Text style={s.expiredText}>
            {isOwner ? t('watchParty', 'videoSourceExpiredOwner') : t('watchParty', 'videoSourceExpiredViewer')}
          </Text>
          {isOwner && (
            <TrackedTouchable trackId="watchparty:update_expired_source" style={s.expiredBtn} onPress={handleChangeMedia} activeOpacity={0.8}>
              <Text style={s.expiredBtnText}>{t('watchParty', 'updateSource')}</Text>
            </TrackedTouchable>
          )}
        </View>
      )}

      {/* Members strip — hidden when chat/voice open */}
      {showMembers && (
        <MembersStrip
          activeMembers={activeMembers}
          ownerId={room!.ownerId}
          currentUserId={userId}
          onMemberPress={handleMemberPress}
        />
      )}

      {/* Video — Virtual Browser (T-S188) takes over whenever the server auto-falls back to it;
          fullscreen isn't supported for VB yet (VideoSection's fullscreen variant doesn't apply
          here), so it only renders in the normal, non-fullscreen layout. */}
      {vb.active && !isFullscreen ? (
        <VirtualBrowserPlayer
          isOwner={isOwner}
          frame={vb.frame}
          dimensions={vb.dimensions}
          error={vb.error}
          remoteCursor={vb.remoteCursor}
          stop={vb.stop}
          sendInput={vb.sendInput}
        />
      ) : (
      <VideoSection
        playerRef={playerRef}
        videoUrl={extractionError === 'video_source_expired' ? '' : originalVideoUrl}
        extractedUrl={extractionError === 'video_source_expired' ? undefined : extractedVideoUrl}
        videoReferer={params.videoReferer}
        videoHeaders={extractionError === 'video_source_expired' ? undefined : extractedVideoHeaders}
        videoProxyUrl={extractionError === 'video_source_expired' ? undefined : extractedVideoProxyUrl}
        isWebView={extractionError === 'video_source_expired' ? false : isWebViewMode}
        isYouTubeEmbed={extractionError === 'video_source_expired' ? false : isYouTubeWebViewMode}
        // extractFallback means the extraction attempt gave up with nothing to play — for a
        // known embed platform (isWebViewMode true) that's fine, UniversalPlayer's own embed
        // WebView takes over. For everything else it's the gap before the server-side VB
        // auto-fallback kicks in (vb.active flips true and swaps this whole component out) —
        // staying "not ready" here keeps the loading box up instead of letting UniversalPlayer
        // mount with nothing extracted, which used to fall back to rendering the raw source
        // page (uncontrollable, no sync — see T-S189 follow-up).
        isReady={extractionError === 'video_source_expired' ? true : !!room && !isExtracting && (isWebViewMode || !extractFallback)}
        loadingStage={extractFallback && !isWebViewMode ? 'vb' : 'extracting'}
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
        onReady={handlePlayerReady}
        onPlayPause={handlePlayPause}
        currentTime={videoCurrentTime}
        duration={videoDuration}
        onProgressSeek={handleProgressSeek}
        onStop={handleStop}
        onSeekDirection={handleSeekDirection}
        pendingSkipSecs={pendingSkipSecs}
        onToggleFullscreen={handleToggleFullscreen}
        onRemoveEmoji={handleRemoveEmoji}
        onCdnUrlSniffed={handleCdnUrlSniffed}
      />
      )}

      {/* ── Fullscreen overlay (renders above absolute VideoSection) ── */}
      {isFullscreen && (
        <View style={s.fsOverlay} pointerEvents="box-none">

          {/* Chat panel — voice strip (T-S167, variant C) sits above it, always together now */}
          {showChat && (
            <View style={[s.fsChatWrap, { height: Math.round(winHeight * 0.38) }]}>
              <VoiceStrip
                currentUserId={userId}
                isJoined={voice.isJoined}
                isMuted={voice.isMuted}
                isLoading={voice.isLoading}
                errorMsg={voice.errorMsg}
                participants={voice.participants}
                onJoin={voice.joinVoice}
                onLeave={voice.leaveVoice}
              />
              <ChatPanel messages={messages} currentUserId={userId} onSend={sendMessage} onOpenProfile={handleMemberPress} />
            </View>
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
              <TrackedTouchable
                trackId="watchparty:fs_toggle_chat"
                style={[s.fsBarBtn, showChat && s.fsBarBtnChatActive]}
                onPress={() => setShowChat(v => !v)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={showChat ? 'chatbubble' : 'chatbubble-outline'}
                  size={20}
                  color={showChat ? '#7B72F8' : 'rgba(255,255,255,0.75)'}
                />
              </TrackedTouchable>
              {/* T-S167 (variant C): the voice panel toggle is gone — voice is always visible
                  as a strip inside the chat panel above. This button is now the same always-
                  reachable mute control RoomInfoBar has (which isn't rendered in fullscreen). */}
              <TrackedTouchable
                trackId="watchparty:fs_toggle_mute"
                style={[s.fsBarBtn, voice.isJoined && !voice.isMuted && s.fsBarBtnVoiceActive]}
                onPress={voice.toggleMute}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={voice.isMuted || !voice.isJoined ? 'mic-off-outline' : 'mic'}
                  size={20}
                  color={voice.isJoined && !voice.isMuted ? '#4ADE80' : 'rgba(255,255,255,0.75)'}
                />
              </TrackedTouchable>
              {isOwner && (
                <TrackedTouchable trackId="watchparty:fs_change_media" style={s.fsBarBtn} onPress={handleChangeMedia} activeOpacity={0.8}>
                  <Ionicons name="add-circle-outline" size={20} color="rgba(255,255,255,0.75)" />
                </TrackedTouchable>
              )}
              <TrackedTouchable trackId="watchparty:fs_exit_fullscreen" style={s.fsBarBtn} onPress={handleToggleFullscreen} activeOpacity={0.8}>
                <Ionicons name="contract-outline" size={20} color="rgba(255,255,255,0.75)" />
              </TrackedTouchable>
            </View>
          </View>
        </View>
      )}

      {!isFullscreen && (
        <>
          {/* Room info bar */}
          <RoomInfoBar
            roomName={room?.videoTitle ?? room?.name ?? 'Watch Party'}
            memberCount={activeMembers.length}
            participantsLabel={t('watchParty', 'participantsSuffix')}
            ownerLabel={t('watchParty', 'ownerBadge')}
            activeTransport={activeTransport}
            isOwner={isOwner}
            hasMessages={messages.length > 0}
            isVoiceJoined={voice.isJoined}
            isVoiceMuted={voice.isMuted}
            onToggleInvite={() => setShowInvite(v => !v)}
            onToggleChat={() => setShowChat(v => !v)}
            onToggleMute={voice.toggleMute}
            onLeave={handleLeave}
          />

          {/* Quality / Episode gear row */}
          {isOwner && !showPlaylist && (extractQualities.length > 0 || extractEpisodes.length > 0) && (
            <View style={s.gearRow}>
              {extractQualities.length > 0 && (
                <TrackedTouchable trackId="watchparty:open_quality_menu" style={s.gearChip} onPress={() => setShowQualityMenu(true)} activeOpacity={0.75}>
                  <Ionicons name="settings-outline" size={13} color="rgba(255,255,255,0.5)" />
                  <Text style={s.gearChipText}>{t('watchParty', 'quality')}</Text>
                </TrackedTouchable>
              )}
              {extractEpisodes.length > 0 && (
                <TrackedTouchable trackId="watchparty:open_episode_menu" style={s.gearChip} onPress={() => setShowEpisodeMenu(true)} activeOpacity={0.75}>
                  <Ionicons name="list-outline" size={13} color="rgba(255,255,255,0.5)" />
                  <Text style={s.gearChipText}>{t('watchParty', 'episodes')}</Text>
                </TrackedTouchable>
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
              roomName={room.videoTitle ?? room.name ?? 'Watch Party'}
            />
          )}

          {/* Emoji reaction bar */}
          <View style={[s.emojiBar, Platform.OS !== 'ios' && s.emojiBarAndroid]}>
            <EmojiPickerBar onSelect={handleEmojiSelect} />
          </View>

          {/* Chat panel — voice strip (T-S167, variant C) always renders above it now, replacing
              the old separate toggled VoiceChat panel that made voice invisible while chatting. */}
          {showChat && (
            <View style={s.chatPanel}>
              <VoiceStrip
                currentUserId={userId}
                isJoined={voice.isJoined}
                isMuted={voice.isMuted}
                isLoading={voice.isLoading}
                errorMsg={voice.errorMsg}
                participants={voice.participants}
                onJoin={voice.joinVoice}
                onLeave={voice.leaveVoice}
              />
              <ChatPanel messages={messages} currentUserId={userId} onSend={sendMessage} onOpenProfile={handleMemberPress} />
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
            <TrackedTouchable trackId="watchparty:fab_change_media" style={s.fabPrimary} onPress={handleChangeMedia} activeOpacity={0.85}>
              <Ionicons name="add" size={26} color="#fff" />
            </TrackedTouchable>
          )}

          {/* FAB: Playlist */}
          {!showPlaylist && (
            <TrackedTouchable
              trackId="watchparty:fab_playlist_toggle"
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
            </TrackedTouchable>
          )}

          {/* FAB: Report (viewer only) */}
          {!isOwner && (
            <TrackedTouchable trackId="watchparty:fab_report" style={s.fabReport} onPress={() => setShowReport(true)} activeOpacity={0.8}>
              <Ionicons name="flag-outline" size={17} color="rgba(255,255,255,0.45)" />
            </TrackedTouchable>
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
          {actionSheetUserId && (
            <UserActionSheet
              visible
              userId={actionSheetUserId}
              username={actionSheetProfile?.username ?? '···'}
              avatar={actionSheetProfile?.avatar ?? null}
              isSelf={actionSheetUserId === userId}
              onClose={handleActionSheetClose}
              onViewProfile={handleActionSheetViewProfile}
              onSendMessage={handleActionSheetSendMessage}
              onReport={handleActionSheetReport}
              onBlock={handleActionSheetBlock}
              onAddFriend={
                actionSheetUserId !== userId && !isAlreadyFriend
                  ? handleActionSheetAddFriend
                  : undefined
              }
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
    // height set inline from useWindowDimensions() (see JSX usage) — the fixed landscape
    // window height isn't known until render, and a module-level Dimensions.get('window')
    // constant would freeze at the portrait value captured on app launch and never update
    // when fullscreen locks to landscape (was the T-S130 bug: a portrait-sized chat panel
    // swallowing almost the entire landscape screen, leaving only a sliver of video).
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
