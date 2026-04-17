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
import { detectVideoPlatform, extractYouTubeVideoId, getYouTubeMobileUrl, MOBILE_UA } from '@utils/videoPlayer';

export type { VideoPlatform } from '@utils/videoPlayer';
export { detectVideoPlatform } from '@utils/videoPlayer';

export interface UniversalPlayerRef {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  seekTo: (ms: number) => Promise<void>;
  getPositionMs: () => Promise<number>;
  setRate: (rate: number) => Promise<void>;
}

interface Props {
  url: string;
  isOwner: boolean;
  onPlay: (currentTimeSecs: number) => void;
  onPause: (currentTimeSecs: number) => void;
  onSeek: (currentTimeSecs: number) => void;
  onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
  onProgress?: (currentTimeSecs: number, durationSecs: number) => void;
  onBuffering?: (isBuffering: boolean) => void;
  onStreamResolved?: (info: { isLive: boolean; title: string }) => void;
  extractedUrl?: string;
  extractedType?: 'mp4' | 'hls';
  isExtracting?: boolean;
  referer?: string;
  mode?: 'extracted' | 'webview-session';
}

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

function buildEmbedHtml(url: string, embed: EmbedPlatform): { html: string; baseUrl: string } | null {
  switch (embed) {
    case 'twitch': { const i = extractTwitchId(url); return i ? { html: buildTwitchHtml(i.id, i.type), baseUrl: 'https://twitch.tv' } : null; }
    case 'vk': { const i = extractVKVideoIds(url); return i ? { html: buildVKVideoHtml(i.ownerId, i.videoId), baseUrl: 'https://vk.com' } : null; }
    case 'rutube': { const i = extractRutubeId(url); return i ? { html: buildRutubeHtml(i), baseUrl: 'https://rutube.ru' } : null; }
    case 'vimeo': { const i = extractVimeoId(url); return i ? { html: buildVimeoHtml(i), baseUrl: 'https://player.vimeo.com' } : null; }
    case 'dailymotion': { const i = extractDailymotionId(url); return i ? { html: buildDailymotionHtml(i), baseUrl: 'https://geo.dailymotion.com' } : null; }
    default: return null;
  }
}

export const UniversalPlayer = forwardRef<UniversalPlayerRef, Props>(
  ({ url, isOwner, onPlay, onPause, onSeek, onPlaybackStatusUpdate, onProgress, onBuffering, extractedUrl, isExtracting, referer, mode }, ref) => {
    const videoRef = useRef<Video>(null);
    const webviewRef = useRef<WebViewPlayerRef>(null);
    const platform = detectVideoPlatform(url);
    const [videoError, setVideoError] = useState(false);
    const [avLoaded, setAvLoaded] = useState(false);

    const prevExtractedUrlRef = useRef(extractedUrl);
    if (prevExtractedUrlRef.current !== extractedUrl) {
      prevExtractedUrlRef.current = extractedUrl;
      setVideoError(false);
      setAvLoaded(false);
    }

    const hasExtracted = !!extractedUrl;
    const useWebview = mode === 'webview-session' || videoError || (!hasExtracted && (platform === 'youtube' || platform === 'webview'));
    const directSource = hasExtracted ? extractedUrl : url;

    useImperativeHandle(ref, () => ({
      play: async () => { if (useWebview) webviewRef.current?.play(); else await videoRef.current?.playAsync(); },
      pause: async () => { if (useWebview) webviewRef.current?.pause(); else await videoRef.current?.pauseAsync(); },
      seekTo: async (ms: number) => { if (useWebview) webviewRef.current?.seekTo(ms); else await videoRef.current?.setPositionAsync(ms); },
      getPositionMs: async () => {
        if (useWebview) return webviewRef.current?.getPositionMs() ?? 0;
        const status = await videoRef.current?.getStatusAsync();
        if (status?.isLoaded) return status.positionMillis;
        return 0;
      },
      setRate: async (rate: number) => {
        if (useWebview) webviewRef.current?.setRate(rate);
        else await videoRef.current?.setRateAsync(rate, true);
      },
    }), [useWebview]); // eslint-disable-line react-hooks/exhaustive-deps

    if (isExtracting) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.extractingText}>Video aniqlanmoqda...</Text>
        </View>
      );
    }
    if (!url) {
      return (
        <View style={styles.center}>
          <Ionicons name="videocam-off-outline" size={48} color={colors.textMuted} />
          <Text style={styles.errorText}>Video URL ko'rsatilmagan</Text>
          <Text style={styles.errorHint}>Xona yaratishda video tanlang yoki URL kiriting</Text>
        </View>
      );
    }

    if (useWebview) {
      const ytId = platform === 'youtube' ? extractYouTubeVideoId(url) : null;
      const embedPlatform = platform === 'webview' ? detectEmbedPlatform(url) : null;
      const embedHtml = embedPlatform ? buildEmbedHtml(url, embedPlatform) : null;
      const displayUrl = (!ytId && platform === 'youtube') ? getYouTubeMobileUrl(url) : url;
      return (
        <WebViewPlayer ref={webviewRef} url={displayUrl} youtubeVideoId={ytId ?? undefined}
          htmlContent={embedHtml?.html} htmlBaseUrl={embedHtml?.baseUrl}
          isOwner={isOwner} onPlay={onPlay} onPause={onPause} onSeek={onSeek} onProgress={onProgress} onBuffering={onBuffering}
          userAgent={MOBILE_UA} referer={platform !== 'youtube' && !embedHtml ? referer : undefined} />
      );
    }

    const avSource = referer ? { uri: directSource, headers: { Referer: referer } } : { uri: directSource };
    return (
      <View style={styles.video}>
        <Video ref={videoRef} source={avSource} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false} useNativeControls={false}
          onPlaybackStatusUpdate={(status) => {
            onPlaybackStatusUpdate?.(status);
            if (status.isLoaded) setAvLoaded(true);
          }}
          onError={() => setVideoError(true)} />
        {!avLoaded && (
          <View style={styles.bufferingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  video: { width: '100%', height: '100%', backgroundColor: '#000' },
  bufferingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgVoid, gap: spacing.sm },
  errorText: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  errorHint: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  extractingText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
});
