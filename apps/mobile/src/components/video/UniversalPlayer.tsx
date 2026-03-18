// CineSync Mobile — UniversalPlayer
// URL ga qarab to'g'ri player tanlaydi: expo-av (direct) yoki WebView (youtube/boshqalar)
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { WebViewPlayer, WebViewPlayerRef } from './WebViewPlayer';
import { colors, typography, spacing } from '@theme/index';

export type VideoPlatform = 'direct' | 'youtube' | 'webview';

export interface UniversalPlayerRef {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  seekTo: (ms: number) => Promise<void>;
  getPositionMs: () => Promise<number>;
}

interface Props {
  url: string;
  isOwner: boolean;
  onPlay: (currentTimeSecs: number) => void;
  onPause: (currentTimeSecs: number) => void;
  onSeek: (currentTimeSecs: number) => void;
  onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
  onProgress?: (currentTimeSecs: number, durationSecs: number) => void;
  onStreamResolved?: (info: { isLive: boolean; title: string }) => void;
}

const YOUTUBE_REGEX = /(?:youtube\.com|youtu\.be)/i;

export function detectVideoPlatform(url: string): VideoPlatform {
  if (!url) return 'direct';
  if (/\.(mp4|m3u8|webm|ogg|mov)(\?.*)?$/i.test(url)) return 'direct';
  if (YOUTUBE_REGEX.test(url)) return 'youtube';
  return 'webview';
}

/**
 * YouTube URL dan video ID ajratib olish.
 * WebViewPlayer ga youtubeVideoId prop sifatida uzatiladi —
 * u IFrame API HTML rejimini faollashtiradi (URI rejim emas).
 */
function extractYouTubeVideoId(url: string): string | null {
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];

  const shortMatch = url.match(/youtu\.be\/([^?&/]+)/);
  if (shortMatch) return shortMatch[1];

  const shortsMatch = url.match(/\/shorts\/([^?&/]+)/);
  if (shortsMatch) return shortsMatch[1];

  return null;
}

/**
 * WebView user-agent: "wv" markeri olib tashlangan Chrome Mobile UA.
 * YouTube va boshqa saytlar WebView ni browser deb qabul qiladi → bloklash yo'q.
 */
const MOBILE_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36';

export const UniversalPlayer = forwardRef<UniversalPlayerRef, Props>(
  ({ url, isOwner, onPlay, onPause, onSeek, onPlaybackStatusUpdate, onProgress }, ref) => {
    const videoRef = useRef<Video>(null);
    const webviewRef = useRef<WebViewPlayerRef>(null);
    const platform = detectVideoPlatform(url);

    // YouTube va boshqa saytlar → WebView
    // Direct (.mp4/.m3u8 va h.k.) → expo-av
    const useWebview = platform === 'youtube' || platform === 'webview';

    useImperativeHandle(ref, () => ({
      play: async () => {
        if (useWebview) webviewRef.current?.play();
        else await videoRef.current?.playAsync();
      },
      pause: async () => {
        if (useWebview) webviewRef.current?.pause();
        else await videoRef.current?.pauseAsync();
      },
      seekTo: async (ms: number) => {
        if (useWebview) webviewRef.current?.seekTo(ms);
        else await videoRef.current?.setPositionAsync(ms);
      },
      getPositionMs: async () => {
        if (useWebview) return webviewRef.current?.getPositionMs() ?? 0;
        const status = await videoRef.current?.getStatusAsync();
        if (status?.isLoaded) return status.positionMillis;
        return 0;
      },
    }), [useWebview]); // eslint-disable-line react-hooks/exhaustive-deps

    // URL yo'q → placeholder
    if (!url) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>Video mavjud emas</Text>
        </View>
      );
    }

    // YouTube → IFrame API HTML rejimi (youtubeVideoId prop orqali)
    // Boshqa saytlar → URI rejimi
    if (useWebview) {
      const youtubeVideoId = platform === 'youtube' ? (extractYouTubeVideoId(url) ?? undefined) : undefined;
      const userAgent = platform === 'youtube' ? MOBILE_USER_AGENT : undefined;
      return (
        <WebViewPlayer
          ref={webviewRef}
          url={url}
          youtubeVideoId={youtubeVideoId}
          isOwner={isOwner}
          onPlay={onPlay}
          onPause={onPause}
          onSeek={onSeek}
          onProgress={onProgress}
          userAgent={userAgent}
        />
      );
    }

    // Direct: expo-av (mp4, m3u8, webm va h.k.)
    return (
      <Video
        ref={videoRef}
        source={{ uri: url }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        useNativeControls={false}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
      />
    );
  },
);

const styles = StyleSheet.create({
  video: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgVoid,
    gap: spacing.md,
  },
  errorText: { ...typography.body, color: colors.error },
});
