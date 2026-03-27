// CineSync Mobile — UniversalPlayer
// URL ga qarab to'g'ri player tanlaydi: expo-av (direct) yoki WebView (youtube/boshqalar)
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { WebViewPlayer, WebViewPlayerRef } from './WebViewPlayer';
import {
  extractTwitchId, extractVKVideoIds, extractRutubeId, extractVimeoId, extractDailymotionId,
  buildTwitchHtml, buildVKVideoHtml, buildRutubeHtml, buildVimeoHtml, buildDailymotionHtml,
} from './WebViewAdapters';
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
  /** Referer для CDN hotlink-защиты (страница где найдено видео) */
  referer?: string;
  /** E65-4: webview-session mode — DRM/auth page IS the player, skip expo-av */
  mode?: 'extracted' | 'webview-session';
}

const YOUTUBE_REGEX = /(?:youtube\.com|youtu\.be)/i;

/** E66-6: Webview platformasi uchun aniq embed turini aniqlaydi */
export type EmbedPlatform = 'twitch' | 'vk' | 'rutube' | 'vimeo' | 'dailymotion' | null;

export function detectEmbedPlatform(url: string): EmbedPlatform {
  if (!url) return null;
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.replace(/^www\./, '');
    if (host === 'twitch.tv' || host === 'clips.twitch.tv') return 'twitch';
    if (host === 'vk.com' && /^\/video/.test(pathname)) return 'vk';
    if (host === 'rutube.ru') return 'rutube';
    if (host === 'vimeo.com' || host === 'player.vimeo.com') return 'vimeo';
    if (host.includes('dailymotion.com') || host === 'dai.ly') return 'dailymotion';
  } catch { /* invalid URL */ }
  return null;
}

/** Embed HTML + baseUrl qaytaradi, yoki null (ID ajratib bo'lmasa) */
function buildEmbedHtml(url: string, embed: EmbedPlatform): { html: string; baseUrl: string } | null {
  switch (embed) {
    case 'twitch': {
      const info = extractTwitchId(url);
      if (!info) return null;
      return { html: buildTwitchHtml(info.id, info.type), baseUrl: 'https://twitch.tv' };
    }
    case 'vk': {
      const ids = extractVKVideoIds(url);
      if (!ids) return null;
      return { html: buildVKVideoHtml(ids.ownerId, ids.videoId), baseUrl: 'https://vk.com' };
    }
    case 'rutube': {
      const id = extractRutubeId(url);
      if (!id) return null;
      return { html: buildRutubeHtml(id), baseUrl: 'https://rutube.ru' };
    }
    case 'vimeo': {
      const id = extractVimeoId(url);
      if (!id) return null;
      return { html: buildVimeoHtml(id), baseUrl: 'https://player.vimeo.com' };
    }
    case 'dailymotion': {
      const id = extractDailymotionId(url);
      if (!id) return null;
      return { html: buildDailymotionHtml(id), baseUrl: 'https://geo.dailymotion.com' };
    }
    default: return null;
  }
}

export function detectVideoPlatform(url: string): VideoPlatform {
  if (!url) return 'direct';
  if (/\.(mp4|m3u8|webm|ogg|mov)(\?.*)?$/i.test(url)) return 'direct';
  if (YOUTUBE_REGEX.test(url)) return 'youtube';
  // Content service YouTube proxy stream — expo-av plays it directly
  if (/\/youtube\/stream(\?|$)/i.test(url)) return 'direct';
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
      referer, mode,
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
      mode === 'webview-session' ||
      (!hasExtracted && (platform === 'youtube' || platform === 'webview' || videoError));
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

    // YouTube: IFrame API rejimi — toza embed player, YouTube site UI yo'q.
    // Boshqa embed platformalar (Twitch, VK, Rutube, Vimeo, Dailymotion): buildEmbedHtml.
    // Generic saytlar: URI rejimi + MOBILE_USER_AGENT.
    if (useWebview) {
      const ytId = platform === 'youtube' ? extractYouTubeVideoId(url) : null;
      const embedPlatform = platform === 'webview' ? detectEmbedPlatform(url) : null;
      const embedHtml = embedPlatform ? buildEmbedHtml(url, embedPlatform) : null;
      const displayUrl = (!ytId && platform === 'youtube') ? getMobileYouTubeUrl(url) : url;
      return (
        <WebViewPlayer
          ref={webviewRef}
          url={displayUrl}
          youtubeVideoId={ytId ?? undefined}
          htmlContent={embedHtml?.html}
          htmlBaseUrl={embedHtml?.baseUrl}
          isOwner={isOwner}
          onPlay={onPlay}
          onPause={onPause}
          onSeek={onSeek}
          onProgress={onProgress}
          userAgent={MOBILE_USER_AGENT}
          referer={platform !== 'youtube' && !embedHtml ? referer : undefined}
        />
      );
    }

    // Direct: expo-av (mp4, m3u8, webm va h.k.)
    const avSource = referer
      ? { uri: directSource, headers: { Referer: referer } }
      : { uri: directSource };
    return (
      <Video
        ref={videoRef}
        source={avSource}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={false}
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
