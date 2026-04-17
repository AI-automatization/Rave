// CineSync Mobile — WatchParty VideoSection
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AVPlaybackStatus } from 'expo-av';
import { UniversalPlayer, UniversalPlayerRef } from '@components/video/UniversalPlayer';
import { EmojiFloatItem } from '@components/watchParty/EmojiFloat';
import { VideoProgressBar } from '@components/watchParty/VideoProgressBar';
import { useTheme } from '@theme/index';
import { useVideoSectionStyles, VIDEO_HEIGHT } from './VideoSection.styles';

export { VIDEO_HEIGHT };

export interface FloatingEmoji { id: string; emoji: string; x: number; }

interface VideoSectionProps {
  playerRef: React.RefObject<UniversalPlayerRef | null>;
  videoUrl: string;
  extractedUrl?: string;
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
  onBuffering?: (isBuffering: boolean) => void;
  onPlayPause: () => void;
  onStop: () => void;
  onSeekDirection: (direction: 'forward' | 'back') => void;
  onToggleFullscreen: () => void;
  onRemoveEmoji: (id: string) => void;
  currentTime?: number;
  duration?: number;
  onProgressSeek?: (secs: number) => void;
  isWebView?: boolean;
}

export const VideoSection = React.memo(function VideoSection({
  playerRef, videoUrl, extractedUrl, videoReferer, isReady, isOwner, isPlaying,
  isFullscreen, videoIsLive, floatingEmojis, onPlay, onPause, onSeek,
  onPlaybackStatusUpdate, onStreamResolved, onProgress, onBuffering, onPlayPause, onStop,
  onSeekDirection, onToggleFullscreen, onRemoveEmoji,
  currentTime = 0, duration = 0, onProgressSeek, isWebView = false,
}: VideoSectionProps) {
  const { colors } = useTheme();
  const styles = useVideoSectionStyles();

  return (
    <View style={isFullscreen ? [styles.videoContainer, styles.videoContainerFullscreen] : styles.videoContainer}>
      {!isReady ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <UniversalPlayer ref={playerRef} url={videoUrl} extractedUrl={extractedUrl}
            referer={videoReferer} isOwner={isOwner} onPlay={onPlay} onPause={onPause} onSeek={onSeek}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate} onStreamResolved={onStreamResolved} onProgress={onProgress} onBuffering={onBuffering} />
          {!isOwner && <View style={StyleSheet.absoluteFill} pointerEvents="box-only" />}
        </>
      )}

      <TouchableOpacity style={styles.fullscreenBtn} onPress={onToggleFullscreen}>
        <Ionicons name={isFullscreen ? 'contract-outline' : 'expand-outline'} size={20} color={colors.textPrimary} />
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

      {!isWebView && !videoIsLive && duration > 0 && (
        <View style={styles.progressBarWrap}>
          <VideoProgressBar currentTime={currentTime} duration={duration} isOwner={isOwner}
            isLive={videoIsLive} onSeek={secs => onProgressSeek?.(secs)} />
        </View>
      )}

      {isOwner && !isWebView && (
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

      {!isOwner && !isWebView && (
        <View style={styles.memberBadge}>
          <Ionicons name="eye-outline" size={14} color={colors.textMuted} />
          <Text style={styles.memberBadgeText}>Tomoshabin</Text>
        </View>
      )}
    </View>
  );
});
