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

    useImperativeHandle(ref, () => ({
      play: async () => {
        if (platform === 'webview') {
          webviewRef.current?.play();
        } else {
          await videoRef.current?.playAsync();
        }
      },
      pause: async () => {
        if (platform === 'webview') {
          webviewRef.current?.pause();
        } else {
          await videoRef.current?.pauseAsync();
        }
      },
      seekTo: async (ms: number) => {
        if (platform === 'webview') {
          webviewRef.current?.seekTo(ms);
        } else {
          await videoRef.current?.setPositionAsync(ms);
        }
      },
      getPositionMs: async () => {
        if (platform === 'webview') {
          return webviewRef.current?.getPositionMs() ?? 0;
        }
        const status = await videoRef.current?.getStatusAsync();
        if (status?.isLoaded) return status.positionMillis;
        return 0;
      },
    }));

    if (platform === 'webview') {
      return (
        <WebViewPlayer
          ref={webviewRef}
          url={url}
          isOwner={isOwner}
          onPlay={onPlay}
          onPause={onPause}
          onSeek={onSeek}
          onProgress={onProgress}
        />
      );
    }

    if (platform === 'youtube') {
      if (resolving) {
        return (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Video yuklanmoqda...</Text>
          </View>
        );
      }
      if (resolveError || !streamUrl) {
        return (
          <View style={styles.center}>
            <Text style={styles.errorText}>Video yuklashda xato</Text>
          </View>
        );
      }
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
