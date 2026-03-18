// CineSync Mobile — WatchPartyScreen
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert, Platform } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { AVPlaybackStatus } from 'expo-av';
import { useWatchParty } from '@hooks/useWatchParty';
import { useAuthStore } from '@store/auth.store';
import { watchPartyApi } from '@api/watchParty.api';
import { disconnectSocket } from '@socket/client';
import { ChatPanel } from '@components/watchParty/ChatPanel';
import { EmojiPickerBar } from '@components/watchParty/EmojiFloat';
import { UniversalPlayerRef } from '@components/video/UniversalPlayer';
import { VideoSection, FloatingEmoji } from '@components/watchParty/VideoSection';
import { RoomInfoBar } from '@components/watchParty/RoomInfoBar';
import { InviteCard } from '@components/watchParty/InviteCard';
import { colors, spacing } from '@theme/index';
import { ModalStackParamList } from '@app-types/index';

type RouteType = RouteProp<ModalStackParamList, 'WatchParty'>;

const { width: SCREEN_W } = Dimensions.get('window');

export function WatchPartyScreen() {
  const { params } = useRoute<RouteType>();
  const navigation = useNavigation();
  const userId = useAuthStore(s => s.user?._id) ?? '';

  const { room, syncState, messages, activeMembers, isOwner, emitPlay, emitPause, emitSeek, sendMessage, sendEmoji } =
    useWatchParty(params.roomId);

  const playerRef = useRef<UniversalPlayerRef>(null);
  const isSyncing = useRef(false);
  const lastSyncId = useRef('');

  const [showChat, setShowChat] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoIsLive, setVideoIsLive] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [connectTimeout, setConnectTimeout] = useState(false);

  // 15 soniya ichida room kelmasa — xabar ko'rsatish
  useEffect(() => {
    if (room) return;
    const timer = setTimeout(() => setConnectTimeout(true), 15000);
    return () => clearTimeout(timer);
  }, [room]);

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

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded || isSyncing.current) return;
    setIsPlaying(status.isPlaying);
  }, []);

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
        isReady={!!room}
        isOwner={isOwner}
        isPlaying={isPlaying}
        videoIsLive={videoIsLive}
        floatingEmojis={floatingEmojis}
        onPlay={handleWebViewPlay}
        onPause={handleWebViewPause}
        onSeek={handleWebViewSeek}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        onStreamResolved={({ isLive }) => setVideoIsLive(isLive)}
        onPlayPause={handlePlayPause}
        onSeekDirection={handleSeekDirection}
        onRemoveEmoji={handleRemoveEmoji}
      />

      <RoomInfoBar
        roomName={room?.name ?? 'Watch Party'}
        memberCount={activeMembers.length}
        isOwner={isOwner}
        hasMessages={messages.length > 0}
        onToggleInvite={() => setShowInvite(v => !v)}
        onToggleChat={() => setShowChat(v => !v)}
        onLeave={handleLeave}
      />

      {showInvite && room?.inviteCode && (
        <InviteCard inviteCode={room.inviteCode} />
      )}

      <View style={[s.emojiBar, Platform.OS === 'ios' ? null : s.emojiBarAndroid]}>
        <EmojiPickerBar onSelect={handleEmojiSelect} />
      </View>

      {showChat && (
        <View style={s.chatPanel}>
          <ChatPanel messages={messages} currentUserId={userId} onSend={sendMessage} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgVoid },
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
});
