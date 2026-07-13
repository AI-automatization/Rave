// WeWatch Mobile — WatchParty VideoSection
import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Animated,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PlaybackStatus } from '@app-types/index';
import { UniversalPlayer, UniversalPlayerRef } from '@components/video/UniversalPlayer';
import { EmojiFloatItem } from '@components/watchParty/EmojiFloat';
import { VideoProgressBar } from '@components/watchParty/VideoProgressBar';
import { useTheme } from '@theme/index';
import { useT } from '@i18n/index';
import { VIDEO_HEIGHT, videoStyles as s } from './VideoSection.styles';

export { VIDEO_HEIGHT };

export interface FloatingEmoji { id: string; emoji: string; x: number; }

interface VideoSectionProps {
  playerRef: React.RefObject<UniversalPlayerRef | null>;
  videoUrl: string;
  extractedUrl?: string;
  videoReferer?: string;
  videoHeaders?: Record<string, string>;
  videoProxyUrl?: string;
  isReady: boolean;
  isOwner: boolean;
  isPlaying: boolean;
  isFullscreen: boolean;
  videoIsLive: boolean;
  floatingEmojis: FloatingEmoji[];
  onPlay: (secs: number) => void;
  onPause: (secs: number) => void;
  onSeek: (secs: number) => void;
  onPlaybackStatusUpdate: (status: PlaybackStatus) => void;
  onStreamResolved: (info: { isLive: boolean }) => void;
  onProgress?: (currentTimeSecs: number, durationSecs: number) => void;
  onBuffering?: (isBuffering: boolean) => void;
  onReady?: () => void;
  onPlayPause: () => void;
  onStop: () => void;
  onSeekDirection: (direction: 'forward' | 'back') => void;
  onToggleFullscreen: () => void;
  onRemoveEmoji: (id: string) => void;
  currentTime?: number;
  duration?: number;
  onProgressSeek?: (secs: number) => void;
  isWebView?: boolean;
  onCdnUrlSniffed?: (url: string) => void;
  /** Running accumulated total while a skip-10s burst is batching (see useWatchPartyRoom);
   * null when idle. Shown on the skip buttons in place of the static "10s" label. */
  pendingSkipSecs?: number | null;
}

const SHOW_MS = 3500; // controls visible duration after tap / mount

export const VideoSection = React.memo(function VideoSection({
  playerRef, videoUrl, extractedUrl, videoReferer, videoHeaders, videoProxyUrl, isReady, isOwner, isPlaying,
  isFullscreen, videoIsLive, floatingEmojis, onPlay, onPause, onSeek,
  onPlaybackStatusUpdate, onStreamResolved, onProgress, onBuffering, onReady, onPlayPause, onStop,
  onSeekDirection, onToggleFullscreen, onRemoveEmoji,
  currentTime = 0, duration = 0, onProgressSeek, isWebView = false, onCdnUrlSniffed,
  pendingSkipSecs = null,
}: VideoSectionProps) {
  const { colors } = useTheme();
  const { t } = useT();

  const ctrlOpacity = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ctrlVisibleRef = useRef(true);
  const [ctrlVisible, setCtrlVisible] = useState(true);

  const doHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = null;
    ctrlVisibleRef.current = false;
    setCtrlVisible(false);
    Animated.timing(ctrlOpacity, { toValue: 0, duration: 260, useNativeDriver: true }).start();
  }, [ctrlOpacity]);

  const doShow = useCallback((autoHideMs = SHOW_MS) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    ctrlVisibleRef.current = true;
    setCtrlVisible(true);
    Animated.timing(ctrlOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    hideTimer.current = setTimeout(doHide, autoHideMs);
  }, [ctrlOpacity, doHide]);

  // Show briefly on mount, then auto-hide
  useEffect(() => {
    doShow(SHOW_MS);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show controls whenever play/pause state changes (user action feedback)
  const prevIsPlaying = useRef(isPlaying);
  useEffect(() => {
    if (prevIsPlaying.current !== isPlaying) {
      prevIsPlaying.current = isPlaying;
      doShow(SHOW_MS);
    }
  }, [isPlaying, doShow]);

  const handleVideoTap = useCallback(() => {
    if (ctrlVisibleRef.current) {
      doHide();
    } else {
      doShow(SHOW_MS);
    }
  }, [doHide, doShow]);

  const isOwnerMode = isOwner && !isWebView;
  const showProgress = !videoIsLive && duration > 0;
  const ctrlPointerEvents = ctrlVisible ? 'box-none' : 'none';

  return (
    <View style={isFullscreen ? [s.container, s.containerFullscreen] : s.container}>

      {/* Video player */}
      {!isReady ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingText}>{t('common', 'loading')}</Text>
        </View>
      ) : (
        <UniversalPlayer
          ref={playerRef}
          url={videoUrl}
          extractedUrl={extractedUrl}
          referer={videoReferer}
          httpHeaders={videoHeaders}
          proxyUrl={videoProxyUrl}
          isOwner={isOwner}
          onPlay={onPlay}
          onPause={onPause}
          onSeek={onSeek}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          onStreamResolved={onStreamResolved}
          onProgress={onProgress}
          onBuffering={onBuffering}
          onReady={onReady}
          onCdnUrlSniffed={onCdnUrlSniffed}
        />
      )}

      {/* Tap area — toggles controls + blocks viewer from touching player */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={handleVideoTap}
      />

      {/* Gradient overlays — visual only */}
      <Animated.View style={[s.gradientTop, { opacity: ctrlOpacity }]} pointerEvents="none" />
      <Animated.View style={[s.gradientBottom, { opacity: ctrlOpacity }]} pointerEvents="none" />

      {/* Top bar: badge + secondary actions */}
      <Animated.View
        style={[s.topBar, { opacity: ctrlOpacity }]}
        pointerEvents={ctrlPointerEvents}
      >
        {videoIsLive ? (
          <View style={s.liveBadge}>
            <View style={s.livePulse} />
            <View style={s.liveDot} />
            <Text style={s.liveTxt}>JONLI</Text>
          </View>
        ) : (
          <View style={s.syncBadge}>
            <View style={s.syncDot} />
            <Text style={s.syncTxt}>SYNC</Text>
          </View>
        )}

        <View style={s.topRight}>
          {isOwnerMode && (
            <TouchableOpacity style={s.topIconBtn} onPress={onStop}>
              <Ionicons name="stop" size={14} color="rgba(255,255,255,0.82)" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.topIconBtn} onPress={onToggleFullscreen}>
            <Ionicons
              name={isFullscreen ? 'contract-outline' : 'expand-outline'}
              size={16}
              color="rgba(255,255,255,0.82)"
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Center controls — owner only */}
      {isOwnerMode && (
        <Animated.View
          style={[s.centerControls, { opacity: ctrlOpacity }]}
          pointerEvents={ctrlPointerEvents}
        >
          {!videoIsLive && (
            <TouchableOpacity style={s.seekBtn} onPress={() => onSeekDirection('back')}>
              <Ionicons name="play-back" size={22} color="#fff" />
              <Text style={s.seekLabel}>{pendingSkipSecs != null ? `${pendingSkipSecs > 0 ? '+' : ''}${pendingSkipSecs}s` : '10s'}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={s.playPauseBtn} onPress={onPlayPause}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={30}
              color="#fff"
              style={isPlaying ? undefined : { marginLeft: 4 }}
            />
          </TouchableOpacity>

          {!videoIsLive && (
            <TouchableOpacity style={s.seekBtn} onPress={() => onSeekDirection('forward')}>
              <Ionicons name="play-forward" size={22} color="#fff" />
              <Text style={s.seekLabel}>{pendingSkipSecs != null ? `${pendingSkipSecs > 0 ? '+' : ''}${pendingSkipSecs}s` : '10s'}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* Viewer badge */}
      {!isOwner && !isWebView && isReady && (
        <Animated.View style={[s.viewerBadge, { opacity: ctrlOpacity }]} pointerEvents="none">
          <Ionicons name="eye-outline" size={12} color="rgba(255,255,255,0.40)" />
          <Text style={s.viewerTxt}>Tomoshabin</Text>
        </Animated.View>
      )}

      {/* Bottom bar: progress (hidden in fullscreen — rendered in WatchPartyScreen overlay) */}
      {showProgress && !isFullscreen && (
        <Animated.View
          style={[s.bottomBar, { opacity: ctrlOpacity }]}
          pointerEvents={ctrlPointerEvents}
        >
          <VideoProgressBar
            currentTime={currentTime}
            duration={duration}
            isOwner={isOwner}
            isLive={videoIsLive}
            onSeek={secs => onProgressSeek?.(secs)}
          />
        </Animated.View>
      )}

      {/* Floating emojis */}
      {floatingEmojis.map(e => (
        <EmojiFloatItem key={e.id} emoji={e.emoji} x={e.x} onDone={() => onRemoveEmoji(e.id)} />
      ))}
    </View>
  );
});

