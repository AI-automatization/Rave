// CineSync Mobile — WatchParty VideoSection
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AVPlaybackStatus } from 'expo-av';
import { UniversalPlayer, UniversalPlayerRef } from '@components/video/UniversalPlayer';
import { EmojiFloatItem } from '@components/watchParty/EmojiFloat';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
// 45% of screen height — gives comfortable video size on all iPhones
// Old formula (SCREEN_W * 9/16) gave only ~26% on tall phones, leaving huge black void
export const VIDEO_HEIGHT = Math.round(SCREEN_H * 0.45);

export interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number;
}

interface VideoSectionProps {
  playerRef: React.RefObject<UniversalPlayerRef | null>;
  videoUrl: string;
  videoReferer?: string;
  isReady: boolean;
  isOwner: boolean;
  isPlaying: boolean;
  isFullscreen: boolean;
  videoIsLive: boolean;
  floatingEmojis: FloatingEmoji[];
  onPlay: (secs: number) => void;
  onPause: (secs: number) => void;
  onSeek: (secs: number) => void;
  onPlaybackStatusUpdate: (status: AVPlaybackStatus) => void;
  onStreamResolved: (info: { isLive: boolean }) => void;
  onProgress?: (currentTimeSecs: number, durationSecs: number) => void;
  onPlayPause: () => void;
  onStop: () => void;
  onSeekDirection: (direction: 'forward' | 'back') => void;
  onToggleFullscreen: () => void;
  onRemoveEmoji: (id: string) => void;
}

export const VideoSection = React.memo(function VideoSection({
  playerRef,
  videoUrl,
  videoReferer,
  isReady,
  isOwner,
  isPlaying,
  isFullscreen,
  videoIsLive,
  floatingEmojis,
  onPlay,
  onPause,
  onSeek,
  onPlaybackStatusUpdate,
  onStreamResolved,
  onProgress,
  onPlayPause,
  onStop,
  onSeekDirection,
  onToggleFullscreen,
  onRemoveEmoji,
}: VideoSectionProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const containerStyle = isFullscreen
    ? [styles.videoContainer, styles.videoContainerFullscreen]
    : styles.videoContainer;

  return (
    <View style={containerStyle}>
      {!isReady ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <UniversalPlayer
            ref={playerRef}
            url={videoUrl}
            referer={videoReferer}
            isOwner={isOwner}
            onPlay={onPlay}
            onPause={onPause}
            onSeek={onSeek}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            onStreamResolved={onStreamResolved}
            onProgress={onProgress}
          />
          {/* Member lock: transparent overlay blocks all touch events */}
          {!isOwner && <View style={StyleSheet.absoluteFill} pointerEvents="box-only" />}
        </>
      )}

      {/* Fullscreen toggle — har doim ko'rinadi */}
      <TouchableOpacity style={styles.fullscreenBtn} onPress={onToggleFullscreen}>
        <Ionicons
          name={isFullscreen ? 'contract-outline' : 'expand-outline'}
          size={20}
          color={colors.textPrimary}
        />
      </TouchableOpacity>

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
          <TouchableOpacity onPress={onStop} style={styles.controlBtn}>
            <Ionicons name="stop" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
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

const useStyles = createThemedStyles((colors) => ({
  videoContainer: {
    width: SCREEN_W,
    height: VIDEO_HEIGHT,
    backgroundColor: colors.black,
  },
  videoContainerFullscreen: {
    height: SCREEN_H,
  },
  fullscreenBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: borderRadius.full,
    zIndex: 10,
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
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}));
