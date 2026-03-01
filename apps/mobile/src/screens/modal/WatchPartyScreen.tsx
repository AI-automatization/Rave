import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video, { OnProgressData } from 'react-native-video';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import { colors, spacing, borderRadius, typography } from '@theme/index';
import { useWatchPartyStore } from '@store/watchParty.store';
import { useAuthStore } from '@store/auth.store';
import { connectSocket, watchPartySocket, SERVER_EVENTS } from '@socket/client';
import { watchPartyApi } from '@api/watchParty.api';
import type { RootStackParams } from '@navigation/types';
import type { ChatMessage } from '@types/index';

type Props = NativeStackScreenProps<RootStackParams, 'WatchParty'>;

const { width } = Dimensions.get('window');
const VIDEO_HEIGHT = (width * 9) / 16;

const EMOJIS = ['❤️', '😂', '😮', '👏', '🔥', '💯'];

export default function WatchPartyScreen({ navigation, route }: Props) {
  const { roomId } = route.params;
  const { room, syncState, messages, emojis, setRoom } = useWatchPartyStore();
  const userId = useAuthStore((s) => s.user?._id);
  const isOwner = room?.ownerId === userId;

  const videoRef = useRef<Video>(null);
  const [chatInput, setChatInput] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const chatListRef = useRef<FlatList>(null);

  // Load room on mount + join socket room
  useEffect(() => {
    const load = async () => {
      try {
        const res = await watchPartyApi.getRoom(roomId);
        if (res.success && res.data) setRoom(res.data);
      } catch {
        Toast.show({ type: 'error', text1: 'Xona topilmadi' });
        navigation.goBack();
      }
    };
    load();
    connectSocket();
    watchPartySocket.joinRoom(roomId);

    return () => {
      watchPartySocket.leaveRoom();
      watchPartyApi.leaveRoom(roomId).catch(() => {});
    };
  }, [roomId]);

  // Sync video with server state
  useEffect(() => {
    if (!syncState || !videoRef.current) return;
    const now = Date.now();
    const elapsed = (now - syncState.serverTimestamp) / 1000;
    const targetTime = syncState.currentTime + elapsed;
    videoRef.current.seek(targetTime);
  }, [syncState?.serverTimestamp]);

  const handleProgress = ({ currentTime }: OnProgressData) => {
    // Only owner controls sync
  };

  const handlePlayPause = () => {
    if (!isOwner) return;
    if (syncState?.isPlaying) {
      watchPartySocket.pause(syncState.currentTime);
    } else {
      watchPartySocket.play(syncState?.currentTime ?? 0);
    }
  };

  const sendMessage = () => {
    const text = chatInput.trim();
    if (!text || text.length > 500) return;
    watchPartySocket.sendMessage(text);
    setChatInput('');
  };

  const sendEmoji = (emoji: string) => {
    watchPartySocket.sendEmoji(emoji);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.msg, item.userId === userId && styles.myMsg]}>
      {item.userId !== userId && (
        <Text style={styles.msgUser}>{item.username}</Text>
      )}
      <Text style={styles.msgText}>{item.message}</Text>
    </View>
  );

  const videoUrl = room?.movie?.videoUrl ?? '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.close}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Watch Party</Text>
        <TouchableOpacity onPress={() => setShowInvite(!showInvite)}>
          <Text style={styles.inviteBtn}>Taklif 👥</Text>
        </TouchableOpacity>
      </View>

      {/* Invite code banner */}
      {showInvite && room && (
        <View style={styles.inviteBanner}>
          <Text style={styles.inviteLabel}>Taklif kodi:</Text>
          <Text style={styles.inviteCode}>{room.inviteCode}</Text>
        </View>
      )}

      {/* Video */}
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{ uri: videoUrl, type: 'm3u8' }}
          style={styles.video}
          controls={false}
          resizeMode="contain"
          paused={!syncState?.isPlaying}
          onProgress={handleProgress}
          onBuffer={({ isBuffering }) => {
            isBuffering ? watchPartySocket.bufferStart() : watchPartySocket.bufferEnd();
          }}
        />
        {/* Play/Pause overlay (owner only) */}
        {isOwner && (
          <TouchableOpacity style={styles.videoOverlay} onPress={handlePlayPause}>
            {!syncState?.isPlaying && (
              <Text style={styles.overlayPlay}>▶</Text>
            )}
          </TouchableOpacity>
        )}
        {/* Emoji float overlay */}
        <View style={styles.emojiOverlay} pointerEvents="none">
          {emojis.slice(-5).map((e, i) => (
            <Text key={`${e.timestamp}-${i}`} style={[styles.floatingEmoji, { right: 16 + i * 20 }]}>
              {e.emoji}
            </Text>
          ))}
        </View>
      </View>

      {/* Emoji bar */}
      <View style={styles.emojiBar}>
        {EMOJIS.map((e) => (
          <TouchableOpacity key={e} onPress={() => sendEmoji(e)} style={styles.emojiBtn}>
            <Text style={styles.emojiText}>{e}</Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.memberCount}>👥 {room?.members.length ?? 0}</Text>
      </View>

      {/* Chat */}
      <KeyboardAvoidingView
        style={styles.chat}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={chatListRef}
          data={messages}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderMessage}
          onContentSizeChange={() => chatListRef.current?.scrollToEnd()}
          style={styles.chatList}
          contentContainerStyle={{ padding: spacing.sm }}
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.chatInput}
            placeholder="Xabar yozing..."
            placeholderTextColor={colors.textMuted}
            value={chatInput}
            onChangeText={setChatInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            maxLength={500}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Text style={styles.sendText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  close: { color: colors.textSecondary, fontSize: 18, padding: spacing.sm },
  headerTitle: { color: colors.textPrimary, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  inviteBtn: { color: colors.primary, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  inviteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgSurface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  inviteLabel: { color: colors.textSecondary, fontSize: typography.sizes.sm },
  inviteCode: {
    color: colors.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    letterSpacing: 3,
  },
  videoContainer: {
    width,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: { width: '100%', height: '100%' },
  videoOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  overlayPlay: { fontSize: 48, color: 'rgba(255,255,255,0.8)' },
  emojiOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  floatingEmoji: { fontSize: 24, position: 'absolute', bottom: 0 },
  emojiBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  emojiBtn: { padding: spacing.xs },
  emojiText: { fontSize: 22 },
  memberCount: { marginLeft: 'auto', color: colors.textSecondary, fontSize: typography.sizes.sm },
  chat: { flex: 1 },
  chatList: { flex: 1 },
  msg: {
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginVertical: 2,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  myMsg: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  msgUser: { color: colors.textMuted, fontSize: typography.sizes.xs, marginBottom: 2 },
  msgText: { color: colors.textPrimary, fontSize: typography.sizes.sm },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: colors.textPrimary, fontSize: 18, fontWeight: typography.weights.bold },
});
