// CineSync Mobile — UniversalPlayer
// URL ga qarab to'g'ri player tanlaydi: expo-av (direct) yoki WebView (youtube/boshqalar)
import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
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

/** YouTube video ID ni ajratib olib, mobile watch URL qaytaradi */
function getMobileYouTubeUrl(url: string): string {
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return `https://m.youtube.com/watch?v=${watchMatch[1]}`;
  const shortMatch = url.match(/youtu\.be\/([^?&/]+)/);
  if (shortMatch) return `https://m.youtube.com/watch?v=${shortMatch[1]}`;
  const shortsMatch = url.match(/\/shorts\/([^?&/]+)/);
  if (shortsMatch) return `https://m.youtube.com/watch?v=${shortsMatch[1]}`;
  const embedMatch = url.match(/\/embed\/([^?&/]+)/);
  if (embedMatch) return `https://m.youtube.com/watch?v=${embedMatch[1]}`;
  return url;
}

/**
 * WebView user-agent: "wv" markeri olib tashlangan Chrome Mobile UA.
 * YouTube va boshqa saytlar WebView ni browser deb qabul qiladi → bloklash yo'q.
 */
const MOBILE_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36';

export const UniversalPlayer = forwardRef<UniversalPlayerRef, Props>(
  ({ url, isOwner, onPlay, onPause, onSeek, onPlaybackStatusUpdate, onProgress, onStreamResolved }, ref) => {
    const videoRef = useRef<Video>(null);
    const webviewRef = useRef<WebViewPlayerRef>(null);
    const platform = detectVideoPlatform(url);

    // YouTube: backend proxy URL resolve
    const [streamUrl, setStreamUrl] = useState<string | null>(null);
    const [resolving, setResolving] = useState(false);
    const [resolveError, setResolveError] = useState(false);
    const [videoError, setVideoError] = useState(false);

    useEffect(() => {
      if (platform !== 'youtube' || !url) return;

      setResolving(true);
      setResolveError(false);
      setStreamUrl(null);

      const resolve = async () => {
        const contentApi = await import('../../api/content');
        const tokenStorage = await import('../../storage/token');
        const info = await contentApi.default.getYouTubeStreamInfo(url);
        const token = await tokenStorage.default.getAccessToken();
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

    // URL yo'q yoki bo'sh — aniq xabar ko'rsatish
    if (!url) {
      return (
        <View style={styles.center}>
          <Ionicons name="videocam-off-outline" size={48} color={colors.textMuted} />
          <Text style={styles.errorText}>Video URL ko'rsatilmagan</Text>
          <Text style={styles.errorHint}>Xona yaratishda video tanlang yoki URL kiriting</Text>
        </View>
      );
    }

    // WebView: native webview URL yoki YouTube proxy xato (watch page fallback)
    if (useWebview) {
      // YouTube: embed emas, oddiy watch page — embed Error 153 beradi mobile WebView da
      const displayUrl = platform === 'youtube' ? getMobileYouTubeUrl(url) : url;
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

    // YouTube: streamUrl hali resolve bo'lmagan — spinner ko'rsatish
    if (platform === 'youtube' && !streamUrl) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>YouTube stream tayyorlanmoqda...</Text>
        </View>
      );
    }

    // expo-av da xato — WebView ga fallback
    if (videoError) {
      const fallbackUrl = platform === 'youtube' ? getMobileYouTubeUrl(url) : url;
      return (
        <WebViewPlayer
          ref={webviewRef}
          url={fallbackUrl}
          isOwner={isOwner}
          onPlay={onPlay}
          onPause={onPause}
          onSeek={onSeek}
          onProgress={onProgress}
        />
      );
    }

    // 'direct' yoki 'youtube' (streamUrl resolved) — expo-av
    const sourceUri = platform === 'youtube' ? streamUrl : url;

    return (
      <Video
        ref={videoRef}
        source={{ uri: sourceUri ?? url }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
        useNativeControls={false}
        onPlaybackStatusUpdate={(status) => {
          onPlaybackStatusUpdate?.(status);
          // Agar video xato bilan yuklansa — WebView ga o'tish
          if (!status.isLoaded && status.error) {
            if (__DEV__) console.log('[UniversalPlayer] expo-av error:', status.error);
            setVideoError(true);
          }
        }}
        onError={(error) => {
          if (__DEV__) console.log('[UniversalPlayer] Video onError:', error);
          // YouTube proxy xato → embed fallback
          if (platform === 'youtube') setResolveError(true);
          else setVideoError(true);
        }}
      />
    );
  },
);

const styles = StyleSheet.create({
  video: { width: '100%', height: '100%' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgVoid,
    gap: spacing.sm,
  },
  loadingText: { ...typography.body, color: colors.textSecondary },
  errorText: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  errorHint: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
});
