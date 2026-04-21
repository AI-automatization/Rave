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

  const showProgress = !videoIsLive && duration > 0;
  const showControls = isOwner && !isWebView;
  const showMember = !isOwner && !isWebView;
  const showPlayerBar = showProgress || showControls || showMember;

  return (
    <View style={isFullscreen ? [styles.videoContainer, styles.videoContainerFullscreen] : styles.videoContainer}>
      {/* ── Video player ── */}
      {!isReady ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <UniversalPlayer
            ref={playerRef}
            url={videoUrl}
            extractedUrl={extractedUrl}
            referer={videoReferer}
            isOwner={isOwner}
            onPlay={onPlay}
            onPause={onPause}
            onSeek={onSeek}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            onStreamResolved={onStreamResolved}
            onProgress={onProgress}
            onBuffering={onBuffering}
          />
          {!isOwner && <View style={StyleSheet.absoluteFill} pointerEvents="box-only" />}
        </>
      )}

      {/* ── Top-right: fullscreen toggle ── */}
      <TouchableOpacity style={styles.fullscreenBtn} onPress={onToggleFullscreen}>
        <Ionicons
          name={isFullscreen ? 'contract-outline' : 'expand-outline'}
          size={18}
          color="rgba(255,255,255,0.85)"
        />
      </TouchableOpacity>

      {/* ── Top-left: live badge ── */}
      {videoIsLive && (
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>JONLI EFIR</Text>
        </View>
      )}

      {/* ── Floating emojis ── */}
      {floatingEmojis.map(e => (
        <EmojiFloatItem key={e.id} emoji={e.emoji} x={e.x} onDone={() => onRemoveEmoji(e.id)} />
      ))}

      {/* ── Unified player bar (bottom) ── */}
      {showPlayerBar && (
        <View style={styles.playerBar}>

          {/* Progress bar */}
          {showProgress && (
            <VideoProgressBar
              currentTime={currentTime}
              duration={duration}
              isOwner={isOwner}
              isLive={videoIsLive}
              onSeek={secs => onProgressSeek?.(secs)}
            />
          )}

          {/* Divider between progress and controls */}
          {showProgress && (showControls || showMember) && (
            <View style={styles.playerBarDivider} />
          )}

          {/* Owner controls */}
          {showControls && (
            <View style={styles.playerControls}>
              {!videoIsLive && (
                <TouchableOpacity style={styles.controlBtn} onPress={() => onSeekDirection('back')}>
                  <Ionicons name="play-back-outline" size={19} color="rgba(255,255,255,0.80)" />
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.controlBtn} onPress={onStop}>
                <Ionicons name="stop-outline" size={19} color="rgba(255,255,255,0.80)" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.playPauseBtn} onPress={onPlayPause}>
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={26}
                  color="#fff"
                  style={isPlaying ? undefined : { marginLeft: 3 }}
                />
              </TouchableOpacity>

              {!videoIsLive && (
                <TouchableOpacity style={styles.controlBtn} onPress={() => onSeekDirection('forward')}>
                  <Ionicons name="play-forward-outline" size={19} color="rgba(255,255,255,0.80)" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Member (viewer) badge */}
          {showMember && (
            <View style={styles.memberRow}>
              <Ionicons name="eye-outline" size={13} color="rgba(255,255,255,0.38)" />
              <Text style={styles.memberText}>Tomoshabin</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
});
