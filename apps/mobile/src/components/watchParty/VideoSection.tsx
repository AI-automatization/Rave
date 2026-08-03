// WeWatch Mobile — WatchParty VideoSection
import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  View, Text, Animated,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PlaybackStatus } from '@app-types/index';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
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
  /** True only when isWebView is specifically the YouTube IFrame embed (reliable official
   * player API) — gates whether we block direct iframe touches and show our own controls.
   * Other webview embeds (VK/Rutube/Twitch/Vimeo/Dailymotion) keep the owner tapping the
   * embed's own UI directly (see VideoSection.tsx tap-catcher comment, T-S125). */
  isYouTubeEmbed?: boolean;
  onCdnUrlSniffed?: (url: string) => void;
  /** Running accumulated total while a skip-10s burst is batching (see useWatchPartyRoom);
   * null when idle. Shown on the skip buttons in place of the static "10s" label. */
  pendingSkipSecs?: number | null;
  /** Which loading message to show while !isReady — 'extracting' (still trying to find a
   * direct stream) or 'vb' (gave up, waiting for the server to hand off to Virtual Browser). */
  loadingStage?: 'extracting' | 'vb';
}

const SHOW_MS = 3500; // controls visible duration after tap / mount

export const VideoSection = React.memo(function VideoSection({
  playerRef, videoUrl, extractedUrl, videoReferer, videoHeaders, videoProxyUrl, isReady, isOwner, isPlaying,
  isFullscreen, videoIsLive, floatingEmojis, onPlay, onPause, onSeek,
  onPlaybackStatusUpdate, onStreamResolved, onProgress, onBuffering, onReady, onPlayPause, onStop,
  onSeekDirection, onToggleFullscreen, onRemoveEmoji,
  currentTime = 0, duration = 0, onProgressSeek, isWebView = false, isYouTubeEmbed = false, onCdnUrlSniffed,
  pendingSkipSecs = null, loadingStage = 'extracting',
}: VideoSectionProps) {
  const { colors } = useTheme();
  const { t } = useT();

  // Loading badge pulse — plain ActivityIndicator read as "frozen/broken" more than "working"
  // in real-user feedback; a slow breathing glow behind the icon reads as active progress.
  const pulseAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);
  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.15] });

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

  // Non-webview (native player) always gets our controls. Webview embeds only get them for
  // YouTube (reliable IFrame Player API) — other embeds (VK/Rutube/Twitch/Vimeo/Dailymotion)
  // still rely on the owner tapping the embed's own UI directly (T-S125).
  const isOwnerMode = isOwner && (!isWebView || isYouTubeEmbed);
  const blockEmbedTouch = !isWebView || isYouTubeEmbed;
  const showProgress = !videoIsLive && duration > 0;
  const ctrlPointerEvents = ctrlVisible ? 'box-none' : 'none';

  return (
    <View style={isFullscreen ? [s.container, s.containerFullscreen] : s.container}>

      {/* Video player */}
      {!isReady ? (
        <View style={s.loadingBox}>
          <View style={s.loadingIconWrap}>
            <Animated.View style={[s.loadingGlow, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
            <Ionicons
              name={loadingStage === 'vb' ? 'globe-outline' : 'search-outline'}
              size={26}
              color={colors.primary}
            />
          </View>
          <Text style={s.loadingTitle}>
            {loadingStage === 'vb' ? t('watchParty', 'loadingFallbackVB') : t('watchParty', 'loadingExtracting')}
          </Text>
          <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" />
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

      {/* Tap area — toggles controls + blocks touches from reaching the player underneath.
          For the YouTube webview embed this is deliberate: the owner must not be able to reach
          YouTube's own native UI (play/seek bar) — every control action goes through our own
          play/pause/seek buttons below, which drive the embed via the reliable IFrame Player
          API bridge (_csVideo in webviewYouTube.ts / useWebViewPlayer). Skipped for OTHER webview
          embeds (VK/Rutube/Twitch/Vimeo/Dailymotion): those use a raw DOM <video> or postMessage
          bridge with no clean player API (WebViewAdapters.ts) — a bare _csVideo.play()/pause()
          call there doesn't reliably start/stop the real page's stream, so the owner still needs
          to tap the embed's own UI directly (T-S125 — regressed briefly when T-S124 made this
          unconditional for every webview). Non-owner taps are still independently blocked by
          WebViewPlayer's memberLockOverlay regardless of platform. */}
      {blockEmbedTouch && (
        <TrackedTouchable
          trackId="watchparty:video_tap"
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleVideoTap}
        />
      )}

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
            <TrackedTouchable trackId="watchparty:stop" style={s.topIconBtn} onPress={onStop}>
              <Ionicons name="stop" size={14} color="rgba(255,255,255,0.82)" />
            </TrackedTouchable>
          )}
          <TrackedTouchable trackId="watchparty:fullscreen_toggle" style={s.topIconBtn} onPress={onToggleFullscreen}>
            <Ionicons
              name={isFullscreen ? 'contract-outline' : 'expand-outline'}
              size={16}
              color="rgba(255,255,255,0.82)"
            />
          </TrackedTouchable>
        </View>
      </Animated.View>

      {/* Center controls — owner only */}
      {isOwnerMode && (
        <Animated.View
          style={[s.centerControls, { opacity: ctrlOpacity }]}
          pointerEvents={ctrlPointerEvents}
        >
          {!videoIsLive && (
            <TrackedTouchable trackId="watchparty:seek_back" style={s.seekBtn} onPress={() => onSeekDirection('back')}>
              <Ionicons name="play-back" size={22} color="#fff" />
              <Text style={s.seekLabel}>{pendingSkipSecs != null ? `${pendingSkipSecs > 0 ? '+' : ''}${pendingSkipSecs}s` : '10s'}</Text>
            </TrackedTouchable>
          )}

          <TrackedTouchable trackId="watchparty:play_pause" style={s.playPauseBtn} onPress={onPlayPause} trackMeta={{ willPlay: !isPlaying }}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={30}
              color="#fff"
              style={isPlaying ? undefined : { marginLeft: 4 }}
            />
          </TrackedTouchable>

          {!videoIsLive && (
            <TrackedTouchable trackId="watchparty:seek_forward" style={s.seekBtn} onPress={() => onSeekDirection('forward')}>
              <Ionicons name="play-forward" size={22} color="#fff" />
              <Text style={s.seekLabel}>{pendingSkipSecs != null ? `${pendingSkipSecs > 0 ? '+' : ''}${pendingSkipSecs}s` : '10s'}</Text>
            </TrackedTouchable>
          )}
        </Animated.View>
      )}

      {/* Viewer badge */}
      {!isOwner && blockEmbedTouch && isReady && (
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

