// CineSync Mobile — UniversalPlayer
// URL ga qarab to'g'ri player tanlaydi: expo-av (direct/youtube) yoki WebView (boshqalar)
import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { WebViewPlayer, WebViewPlayerRef } from './WebViewPlayer';
import { contentApi } from '@api/content.api';
import { tokenStorage } from '@utils/storage';
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
  /** YouTube stream resolve bo'lganda chaqiriladi */
  onStreamResolved?: (info: { isLive: boolean; title: string }) => void;
}

const YOUTUBE_REGEX = /(?:youtube\.com|youtu\.be)/i;

export function detectVideoPlatform(url: string): VideoPlatform {
  if (!url) return 'direct';
  if (/\.(mp4|m3u8|webm|ogg|mov)(\?.*)?$/i.test(url)) return 'direct';
  if (YOUTUBE_REGEX.test(url)) return 'youtube';
  return 'webview';
}

function getYouTubeEmbedUrl(url: string): string {
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  const shortMatch = url.match(/youtu\.be\/([^?&/]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  const shortsMatch = url.match(/\/shorts\/([^?&/]+)/);
  if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
  return url;
}

export const UniversalPlayer = forwardRef<UniversalPlayerRef, Props>(
  ({ url, isOwner, onPlay, onPause, onSeek, onPlaybackStatusUpdate, onProgress, onStreamResolved }, ref) => {
    const videoRef = useRef<Video>(null);
    const webviewRef = useRef<WebViewPlayerRef>(null);
    const platform = detectVideoPlatform(url);

    // YouTube: backend proxy URL resolve
    const [streamUrl, setStreamUrl] = useState<string | null>(null);
    const [resolving, setResolving] = useState(false);
    const [resolveError, setResolveError] = useState(false);

    useEffect(() => {
      if (platform !== 'youtube' || !url) return;

      setResolving(true);
      setResolveError(false);
      setStreamUrl(null);

      const resolve = async () => {
        const info = await contentApi.getYouTubeStreamInfo(url);
        const token = await tokenStorage.getAccessToken();
        const contentBase = process.env.EXPO_PUBLIC_CONTENT_URL ?? '';
        const proxyUrl =
          `${contentBase}/youtube/stream` +
          `?url=${encodeURIComponent(url)}` +
          (token ? `&token=${encodeURIComponent(token)}` : '');

        onStreamResolved?.({ isLive: info.isLive, title: info.title });
        setStreamUrl(proxyUrl);
      };

      resolve()
        .catch(() => setResolveError(true))
        .finally(() => setResolving(false));
    }, [url, platform]); // eslint-disable-line react-hooks/exhaustive-deps

    const useWebview = platform === 'webview' || (platform === 'youtube' && resolveError);

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

    // Baг #1 fix: URL yo'q yoki bo'sh — placeholder ko'rsatish
    if (!url) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>Video mavjud emas</Text>
        </View>
      );
    }

    // WebView: native webview URL yoki YouTube proxy xato (embed fallback)
    if (useWebview) {
      const displayUrl = platform === 'youtube' ? getYouTubeEmbedUrl(url) : url;
      return (
        <WebViewPlayer
          ref={webviewRef}
          url={displayUrl}
          isOwner={isOwner}
          onPlay={onPlay}
          onPause={onPause}
          onSeek={onSeek}
          onProgress={onProgress}
        />
      );
    }

    // YouTube: stream resolve kutish
    if (platform === 'youtube' && resolving) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Video yuklanmoqda...</Text>
        </View>
      );
    }

    // 'direct' yoki 'youtube' (streamUrl resolved) — expo-av
    const sourceUri = platform === 'youtube' ? streamUrl! : url;

    return (
      <Video
        ref={videoRef}
        source={sourceUri ? { uri: sourceUri } : undefined}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        useNativeControls={false}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        onError={() => {
          // Баг #2 fix: YouTube proxy stream xato → WebView embed ga fallback
          if (platform === 'youtube') setResolveError(true);
        }}
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
  loadingText: { ...typography.body, color: colors.textSecondary },
  errorText: { ...typography.body, color: colors.error },
});
