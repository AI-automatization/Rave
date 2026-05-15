// CineSync Mobile — WatchParty VideoSection
import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Animated,
  ActivityIndicator, StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AVPlaybackStatus } from 'expo-av';
import { UniversalPlayer, UniversalPlayerRef } from '@components/video/UniversalPlayer';
import { EmojiFloatItem } from '@components/watchParty/EmojiFloat';
import { VideoProgressBar } from '@components/watchParty/VideoProgressBar';
import { useTheme } from '@theme/index';
import { VIDEO_HEIGHT } from './VideoSection.styles';

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

const SHOW_MS = 3500; // controls visible duration after tap / mount

export const VideoSection = React.memo(function VideoSection({
  playerRef, videoUrl, extractedUrl, videoReferer, isReady, isOwner, isPlaying,
  isFullscreen, videoIsLive, floatingEmojis, onPlay, onPause, onSeek,
  onPlaybackStatusUpdate, onStreamResolved, onProgress, onBuffering, onPlayPause, onStop,
  onSeekDirection, onToggleFullscreen, onRemoveEmoji,
  currentTime = 0, duration = 0, onProgressSeek, isWebView = false,
}: VideoSectionProps) {
  const { colors } = useTheme();

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
          <Text style={s.loadingText}>Yuklanmoqda...</Text>
        </View>
      ) : (
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
              <Text style={s.seekLabel}>10s</Text>
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
              <Text style={s.seekLabel}>10s</Text>
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

const s = StyleSheet.create({
  container: {
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  containerFullscreen: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    height: undefined,
    // render order handles stacking over other WatchPartyScreen elements
  },

  loadingBox: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.38)',
    letterSpacing: 0.5,
  },

  gradientTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 56,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 56,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 4 : 0,
  },
  topRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  topIconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.52)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.52)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.25)',
  },
  livePulse: {
    position: 'absolute',
    left: 7,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: 'rgba(74,222,128,0.25)',
  },
  liveDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#4ADE80',
  },
  liveTxt: {
    fontSize: 10, fontWeight: '800',
    color: '#4ADE80',
    letterSpacing: 1.2,
  },

  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.48)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(123,114,248,0.22)',
  },
  syncDot: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: '#7B72F8',
  },
  syncTxt: {
    fontSize: 10, fontWeight: '800',
    color: '#7B72F8',
    letterSpacing: 1.2,
  },

  centerControls: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 24,
  },

  playPauseBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#7B72F8',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7B72F8',
    shadowOpacity: 0.65,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  seekBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center', justifyContent: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  seekLabel: {
    fontSize: 9, fontWeight: '700',
    color: 'rgba(255,255,255,0.62)',
    letterSpacing: 0.3,
  },

  viewerBadge: {
    position: 'absolute',
    bottom: 18, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  viewerTxt: {
    fontSize: 11, fontWeight: '500',
    color: 'rgba(255,255,255,0.38)',
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingBottom: Platform.OS === 'ios' ? 6 : 4,
  },
});
