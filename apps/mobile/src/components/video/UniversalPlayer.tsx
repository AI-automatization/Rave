// CineSync Mobile — UniversalPlayer
// URL ga qarab to'g'ri player tanlaydi: expo-av (direct) yoki WebView (youtube/boshqalar)
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
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
  /** Direct stream URL from video extraction (useVideoExtraction hook) */
  extractedUrl?: string;
  /** Type hint from extraction — mp4 or hls */
  extractedType?: 'mp4' | 'hls';
  /** Show loading overlay while extraction is in progress */
  isExtracting?: boolean;
}

const YOUTUBE_REGEX = /(?:youtube\.com|youtu\.be)/i;

export function detectVideoPlatform(url: string): VideoPlatform {
  if (!url) return 'direct';
  if (/\.(mp4|m3u8|webm|ogg|mov)(\?.*)?$/i.test(url)) return 'direct';
  if (YOUTUBE_REGEX.test(url)) return 'youtube';
  return 'webview';
}

/** YouTube video ID ni ajratib oladi */
function extractYouTubeVideoId(url: string): string | null {
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([^?&/]+)/);
  if (shortMatch) return shortMatch[1];
  const shortsMatch = url.match(/\/shorts\/([^?&/]+)/);
  if (shortsMatch) return shortsMatch[1];
  const embedMatch = url.match(/\/embed\/([^?&/]+)/);
  if (embedMatch) return embedMatch[1];
  return null;
}

/** YouTube video ID ni ajratib olib, mobile watch URL qaytaradi */
function getMobileYouTubeUrl(url: string): string {
  const id = extractYouTubeVideoId(url);
  if (id) return `https://m.youtube.com/watch?v=${id}`;
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
  (
    {
      url, isOwner, onPlay, onPause, onSeek,
      onPlaybackStatusUpdate, onProgress,
      extractedUrl, extractedType, isExtracting,
    },
    ref,
  ) => {
    const videoRef = useRef<Video>(null);
    const webviewRef = useRef<WebViewPlayerRef>(null);
    const platform = detectVideoPlatform(url);
    const [videoError, setVideoError] = useState(false);

    // extractedUrl mavjud bo'lsa → expo-av (direct) rejimida ishlatish
    // Aks holda: YouTube/boshqa saytlar → WebView, direct → expo-av
    const hasExtracted = !!extractedUrl;
    const useWebview =
      !hasExtracted && (platform === 'youtube' || platform === 'webview' || videoError);
    const directSource = hasExtracted ? extractedUrl : url;

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

    // Extraction jarayonida → loading overlay
    if (isExtracting) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.extractingText}>Video aniqlanmoqda...</Text>
        </View>
      );
    }

    // URL yo'q → placeholder
    if (!url) {
      return (
        <View style={styles.center}>
          <Ionicons name="videocam-off-outline" size={48} color={colors.textMuted} />
          <Text style={styles.errorText}>Video URL ko'rsatilmagan</Text>
          <Text style={styles.errorHint}>Xona yaratishda video tanlang yoki URL kiriting</Text>
        </View>
      );
    }

    // YouTube: IFrame API EMAS — Error 152 beradi.
    // m.youtube.com ni oddiy brauzer sifatida ochish + MOBILE_USER_AGENT.
    // Boshqa saytlar: URI rejimi + MOBILE_USER_AGENT.
    if (useWebview) {
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
          userAgent={MOBILE_USER_AGENT}
        />
      );
    }

    // Direct: expo-av (mp4, m3u8, webm va h.k.)
    return (
      <Video
        ref={videoRef}
        source={{ uri: directSource }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
        useNativeControls={false}
        onPlaybackStatusUpdate={(status) => {
          onPlaybackStatusUpdate?.(status);
          if (!status.isLoaded && status.error) {
            setVideoError(true);
          }
        }}
        onError={() => setVideoError(true)}
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
  errorText: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  errorHint: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  extractingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
