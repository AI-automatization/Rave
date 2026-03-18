// CineSync Mobile — WatchParty VideoSection
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AVPlaybackStatus } from 'expo-av';
import { UniversalPlayer, UniversalPlayerRef } from '@components/video/UniversalPlayer';
import { EmojiFloatItem } from '@components/watchParty/EmojiFloat';
import { colors, spacing, borderRadius, typography } from '@theme/index';

const { width: SCREEN_W } = Dimensions.get('window');
export const VIDEO_HEIGHT = (SCREEN_W * 9) / 16;

export interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number;
}

interface VideoSectionProps {
  playerRef: React.RefObject<UniversalPlayerRef>;
  videoUrl: string;
  isReady: boolean;
  isOwner: boolean;
  isPlaying: boolean;
  videoIsLive: boolean;
  floatingEmojis: FloatingEmoji[];
  onPlay: (secs: number) => void;
  onPause: (secs: number) => void;
  onSeek: (secs: number) => void;
  onPlaybackStatusUpdate: (status: AVPlaybackStatus) => void;
  onStreamResolved: (info: { isLive: boolean }) => void;
  onProgress?: (currentTimeSecs: number, durationSecs: number) => void;
  onPlayPause: () => void;
  onSeekDirection: (direction: 'forward' | 'back') => void;
  onRemoveEmoji: (id: string) => void;
}

export const VideoSection = React.memo(function VideoSection({
  playerRef,
  videoUrl,
  isReady,
  isOwner,
  isPlaying,
  videoIsLive,
  floatingEmojis,
  onPlay,
  onPause,
  onSeek,
  onPlaybackStatusUpdate,
  onStreamResolved,
  onProgress,
  onPlayPause,
  onSeekDirection,
  onRemoveEmoji,
}: VideoSectionProps) {
  return (
    <View style={styles.videoContainer}>
      {!isReady ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <UniversalPlayer
          ref={playerRef}
          url={videoUrl}
          isOwner={isOwner}
          onPlay={onPlay}
          onPause={onPause}
          onSeek={onSeek}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          onStreamResolved={onStreamResolved}
          onProgress={onProgress}
        />
      )}

      {videoIsLive && (
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>JONLI EFIR</Text>
        </View>
      )}

      {floatingEmojis.map(e => (
        <EmojiFloatItem key={e.id} emoji={e.emoji} x={e.x} onDone={() => onRemoveEmoji(e.id)} />
      ))}

      {isOwner && (
        <View style={styles.controls}>
          {!videoIsLive && (
            <TouchableOpacity onPress={() => onSeekDirection('back')} style={styles.controlBtn}>
              <Ionicons name="play-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onPlayPause} style={styles.playBtn}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          {!videoIsLive && (
            <TouchableOpacity onPress={() => onSeekDirection('forward')} style={styles.controlBtn}>
              <Ionicons name="play-forward" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {!isOwner && (
        <View style={styles.memberBadge}>
          <Ionicons name="eye-outline" size={14} color={colors.textMuted} />
          <Text style={styles.memberBadgeText}>Tomoshabin</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  videoContainer: {
    width: SCREEN_W,
    height: VIDEO_HEIGHT,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textPrimary,
  },
  liveText: { ...typography.label, color: colors.textPrimary, fontWeight: '700' },
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
});
