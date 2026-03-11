// CineSync Mobile — WatchPartyScreen
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useWatchParty } from '@hooks/useWatchParty';
import { useAuthStore } from '@store/auth.store';
import { watchPartyApi } from '@api/watchParty.api';
import { ChatPanel } from '@components/watchParty/ChatPanel';
import { EmojiFloatItem, EmojiPickerBar } from '@components/watchParty/EmojiFloat';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { ModalStackParamList } from '@app-types/index';

type RouteType = RouteProp<ModalStackParamList, 'WatchParty'>;

const { width: SCREEN_W } = Dimensions.get('window');
const VIDEO_HEIGHT = (SCREEN_W * 9) / 16;

interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number;
}

export function WatchPartyScreen() {
  const { params } = useRoute<RouteType>();
  const navigation = useNavigation();
  const userId = useAuthStore(s => s.user?._id) ?? '';

  const { room, syncState, messages, activeMembers, isOwner, emitPlay, emitPause, emitSeek, sendMessage, sendEmoji } =
    useWatchParty(params.roomId);

  const videoRef = useRef<Video>(null);
  const isSyncing = useRef(false);
  const lastSyncId = useRef('');

  const [showChat, setShowChat] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Apply incoming sync from server
  useEffect(() => {
    if (!syncState) return;
    const syncId = `${syncState.serverTimestamp}`;
    if (lastSyncId.current === syncId) return;
    lastSyncId.current = syncId;

    isSyncing.current = true;
    videoRef.current?.setPositionAsync(syncState.currentTime * 1000)
      .then(() => {
        if (syncState.isPlaying) {
          videoRef.current?.playAsync();
        } else {
          videoRef.current?.pauseAsync();
        }
      })
      .catch(() => {})
      .finally(() => {
        isSyncing.current = false;
      });
  }, [syncState]);

  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded || isSyncing.current || !isOwner) return;
      setIsPlaying(status.isPlaying);
    },
    [isOwner],
  );

  const handlePlayPause = useCallback(async () => {
    if (!isOwner) return;
    const status = await videoRef.current?.getStatusAsync();
    if (!status?.isLoaded) return;
    const currentSecs = (status.positionMillis ?? 0) / 1000;
    if (status.isPlaying) {
      await videoRef.current?.pauseAsync();
      emitPause(currentSecs);
    } else {
      await videoRef.current?.playAsync();
      emitPlay(currentSecs);
    }
  }, [isOwner, emitPlay, emitPause]);

  const handleSeek = useCallback(
    async (direction: 'forward' | 'back') => {
      if (!isOwner) return;
      const status = await videoRef.current?.getStatusAsync();
      if (!status?.isLoaded) return;
      const delta = direction === 'forward' ? 10 : -10;
      const newMs = Math.max(0, (status.positionMillis ?? 0) + delta * 1000);
      await videoRef.current?.setPositionAsync(newMs);
      emitSeek(newMs / 1000);
    },
    [isOwner, emitSeek],
  );

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      sendEmoji(emoji);
      setFloatingEmojis(prev => [
        ...prev,
        { id: `${Date.now()}`, emoji, x: Math.random() * (SCREEN_W - 60) + 10 },
      ]);
    },
    [sendEmoji],
  );

  const removeEmoji = useCallback((id: string) => {
    setFloatingEmojis(prev => prev.filter(e => e.id !== id));
  }, []);

  const handleLeave = () => {
    Alert.alert('Chiqish', 'Watch Party dan chiqmoqchimisiz?', [
      { text: 'Bekor', style: 'cancel' },
      {
        text: isOwner ? 'Xonani yopish' : 'Chiqish',
        style: 'destructive',
        onPress: async () => {
          if (isOwner) await watchPartyApi.closeRoom(params.roomId);
          else await watchPartyApi.leaveRoom(params.roomId);
          navigation.goBack();
        },
      },
    ]);
  };

  const videoUrl = room?.videoUrl ?? '';

  return (
    <View style={styles.root}>
      {/* Video */}
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={videoUrl ? { uri: videoUrl } : undefined}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        />

        {/* Floating emojis */}
        {floatingEmojis.map(e => (
          <EmojiFloatItem key={e.id} emoji={e.emoji} x={e.x} onDone={() => removeEmoji(e.id)} />
        ))}

        {/* Video controls overlay (owner only) */}
        {isOwner && (
          <View style={styles.controls}>
            <TouchableOpacity onPress={() => handleSeek('back')} style={styles.controlBtn}>
              <Ionicons name="play-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePlayPause} style={styles.playBtn}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={26} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSeek('forward')} style={styles.controlBtn}>
              <Ionicons name="play-forward" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        )}
        {!isOwner && (
          <View style={styles.memberBadge}>
            <Ionicons name="eye-outline" size={14} color={colors.textMuted} />
            <Text style={styles.memberBadgeText}>Tomoshabin</Text>
          </View>
        )}
      </View>

      {/* Room info bar */}
      <View style={styles.infoBar}>
        <View style={styles.infoLeft}>
          <Text style={styles.roomName} numberOfLines={1}>
            {room?.name ?? 'Watch Party'}
          </Text>
          <View style={styles.memberCount}>
            <Ionicons name="people-outline" size={14} color={colors.textMuted} />
            <Text style={styles.memberCountText}>{activeMembers.length}</Text>
          </View>
        </View>

        <View style={styles.infoActions}>
          {isOwner && (
            <TouchableOpacity onPress={() => setShowInvite(v => !v)} style={styles.iconBtn}>
              <Ionicons name="link-outline" size={20} color={colors.secondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowChat(v => !v)} style={styles.iconBtn}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
            {messages.length > 0 && <View style={styles.chatDot} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLeave} style={styles.iconBtn}>
            <Ionicons name="exit-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Invite code */}
      {showInvite && room && (
        <View style={styles.inviteCard}>
          <Text style={styles.inviteLabel}>INVITE KOD</Text>
          <Text style={styles.inviteCode}>{room.inviteCode}</Text>
        </View>
      )}

      {/* Emoji bar */}
      <View style={styles.emojiBar}>
        <EmojiPickerBar onSelect={handleEmojiSelect} />
      </View>

      {/* Chat panel */}
      {showChat && (
        <View style={styles.chatPanel}>
          <ChatPanel messages={messages} currentUserId={userId} onSend={sendMessage} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgVoid },
  videoContainer: {
    width: SCREEN_W,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: { width: SCREEN_W, height: VIDEO_HEIGHT },
  controls: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  controlBtn: {
    padding: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: borderRadius.full,
  },
  playBtn: {
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  memberBadge: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  memberBadgeText: { ...typography.caption, color: colors.textMuted },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLeft: { flex: 1, gap: 2 },
  roomName: { ...typography.h3, color: colors.textPrimary },
  memberCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  memberCountText: { ...typography.caption, color: colors.textMuted },
  infoActions: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: { padding: spacing.sm, position: 'relative' },
  chatDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  inviteCard: {
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    gap: spacing.xs,
  },
  inviteLabel: { ...typography.label, color: colors.textMuted },
  inviteCode: { ...typography.h2, color: colors.primary, letterSpacing: 4 },
  emojiBar: {
    padding: spacing.md,
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 0 : spacing.sm,
  },
  chatPanel: { flex: 1 },
});
