// WeWatch Mobile — UniversalPlayer
// URL ga qarab to'g'ri player tanlaydi: expo-video (direct) yoki WebView (youtube/boshqalar)
import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { VideoView, useVideoPlayer as createExpoPlayer } from 'expo-video';
import { useEvent, useEventListener } from 'expo';
import { Ionicons } from '@expo/vector-icons';
import WebView from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { WebViewPlayer, WebViewPlayerRef } from './WebViewPlayer';
import {
  extractTwitchId, extractVKVideoIds, extractRutubeId, extractVimeoId, extractDailymotionId,
  buildTwitchHtml, buildVKVideoHtml, buildRutubeHtml, buildVimeoHtml, buildDailymotionHtml,
} from './WebViewAdapters';
import { colors, typography, spacing } from '@theme/index';
import { useT } from '@i18n/index';
import { detectVideoPlatform, extractYouTubeVideoId, getYouTubeMobileUrl, MOBILE_UA } from '@utils/videoPlayer';
import { CDN_SNIFF_JS } from '@utils/webViewScripts';
import type { PlaybackStatus } from '@app-types/index';

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
  onPlaybackStatusUpdate?: (status: PlaybackStatus) => void;
  onProgress?: (currentTimeSecs: number, durationSecs: number) => void;
  onBuffering?: (isBuffering: boolean) => void;
  onStreamResolved?: (info: { isLive: boolean; title: string }) => void;
  onReady?: () => void;
  extractedUrl?: string;
  extractedType?: 'mp4' | 'hls';
  isExtracting?: boolean;
  referer?: string;
  httpHeaders?: Record<string, string>;
  proxyUrl?: string;
  mode?: 'extracted' | 'webview-session';
  onCdnUrlSniffed?: (url: string) => void;
}

export type EmbedPlatform = 'twitch' | 'vk' | 'rutube' | 'vimeo' | 'dailymotion' | null;

export function detectEmbedPlatform(url: string): EmbedPlatform {
  if (!url) return null;
  try {
    const { hostname, pathname } = new URL(url);
    // strip www. and m. (handles m.vk.com, m.vkvideo.ru)
    const host = hostname.replace(/^(www\.|m\.)/, '');
    if (host === 'twitch.tv' || host === 'clips.twitch.tv') return 'twitch';
    // vk.com/video..., vkvideo.ru (new VK video domain), m.vk.com, m.vkvideo.ru
    if ((host === 'vk.com' && /^\/video/.test(pathname)) || host === 'vkvideo.ru') return 'vk';
    if (host === 'rutube.ru') return 'rutube';
    if (host === 'vimeo.com' || host === 'player.vimeo.com') return 'vimeo';
    if (host.includes('dailymotion.com') || host === 'dai.ly') return 'dailymotion';
  } catch { /* invalid URL */ }
  return null;
}

function buildEmbedHtml(url: string, embed: EmbedPlatform): { html: string; baseUrl: string } | null {
  switch (embed) {
    case 'twitch': { const i = extractTwitchId(url); return i ? { html: buildTwitchHtml(i.id, i.type), baseUrl: 'https://twitch.tv' } : null; }
    case 'vk': {
      const i = extractVKVideoIds(url); return i ? { html: buildVKVideoHtml(i.ownerId, i.videoId), baseUrl: 'https://vk.com' } : null;
    }
    case 'rutube': {
      const i = extractRutubeId(url); return i ? { html: buildRutubeHtml(i), baseUrl: 'https://rutube.ru' } : null;
    }
    case 'vimeo': { const i = extractVimeoId(url); return i ? { html: buildVimeoHtml(i), baseUrl: 'https://player.vimeo.com' } : null; }
    case 'dailymotion': { const i = extractDailymotionId(url); return i ? { html: buildDailymotionHtml(i), baseUrl: 'https://geo.dailymotion.com' } : null; }
    default: return null;
  }
}

export const UniversalPlayer = forwardRef<UniversalPlayerRef, Props>(
  ({ url, isOwner, onPlay, onPause, onSeek, onPlaybackStatusUpdate, onProgress, onBuffering, onReady,
     extractedUrl, isExtracting, referer, httpHeaders, proxyUrl, mode, onCdnUrlSniffed }, ref) => {
    const { t } = useT();
    const webviewRef = useRef<WebViewPlayerRef>(null);
    const platform = detectVideoPlatform(url);
    const embedPlatform = platform === 'webview' ? detectEmbedPlatform(url) : null;

    // Android VK/Rutube sniffing: load embed URL directly in a hidden WebView (source.uri,
    // not source.html) so our injected JS runs in vk.com/rutube.ru origin — same origin as
    // the player's XHR calls — allowing us to intercept the CDN video URL before it's fetched.
    // Once sniffed, switch to expo-video (ExoPlayer) with the CDN URL (token tied to phone IP).
    const isVkRutubeAndroid = Platform.OS === 'android' &&
      (embedPlatform === 'vk' || embedPlatform === 'rutube');
    const [sniffedUrl, setSniffedUrl] = useState<string | null>(null);
    const [innertubeUrl, setInnertubeUrl] = useState<string | null>(null);

    // Reset sniffed/innertube URLs when the video URL changes (new media in the room).
    const prevUrlForSniffRef = useRef(url);
    if (prevUrlForSniffRef.current !== url) {
      prevUrlForSniffRef.current = url;
      setSniffedUrl(null);
      setInnertubeUrl(null);
    }

    // forceAndroidWebView: use embed WebView only when we have no CDN URL at all.
    const forceAndroidWebView = isVkRutubeAndroid && !sniffedUrl && !extractedUrl;

    // Build the hidden sniffing WebView URI
    let sniffUrl: string | null = null;
    if (isVkRutubeAndroid && !sniffedUrl && !extractedUrl) {
      if (embedPlatform === 'vk') {
        const ids = extractVKVideoIds(url);
        sniffUrl = ids
          ? `https://vk.com/video_ext.php?oid=${ids.ownerId}&id=${ids.videoId}&hd=1&autoplay=1`
          : null;
      } else {
        const id = extractRutubeId(url);
        sniffUrl = id ? `https://rutube.ru/play/embed/${id}?autoplay=1` : null;
      }
    }

    const onCdnUrlSniffedRef = useRef(onCdnUrlSniffed);
    onCdnUrlSniffedRef.current = onCdnUrlSniffed;

    const handleSniffMessage = useCallback((event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'CDN_URL_SNIFFED' && data.url) {
          setSniffedUrl(data.url);
          onCdnUrlSniffedRef.current?.(data.url);
        }
      } catch {}
    }, []);

    const [videoError, setVideoError] = useState(false);
    const [avLoaded, setAvLoaded] = useState(false);
    const [usingProxy, setUsingProxy] = useState(false);
    // Fires onReady exactly once per video load cycle
    const readyFiredRef = useRef(false);
    const onReadyRef = useRef(onReady);
    onReadyRef.current = onReady;

    const prevExtractedUrlRef = useRef(extractedUrl);
    if (prevExtractedUrlRef.current !== extractedUrl) {
      prevExtractedUrlRef.current = extractedUrl;
      setVideoError(false);
      setAvLoaded(false);
      setUsingProxy(false);
      readyFiredRef.current = false;
    }

    const fireReady = () => {
      if (readyFiredRef.current) return;
      readyFiredRef.current = true;
      onReadyRef.current?.();
    };

    // Priority: Innertube direct MP4 > sniffed CDN URL > server-extracted URL.
    const effectiveExtractedUrl = innertubeUrl ?? sniffedUrl ?? extractedUrl;
    const hasExtracted = !!effectiveExtractedUrl;
    const youtubeId = platform === 'youtube' ? extractYouTubeVideoId(url) : null;
    const proxyFailed = hasExtracted && videoError && platform === 'youtube' && !!youtubeId;
    const webviewEmbedFailed = videoError && platform === 'webview' && !!detectEmbedPlatform(url);
    const useWebview = forceAndroidWebView ||
      mode === 'webview-session' ||
      proxyFailed ||
      webviewEmbedFailed ||
      (!hasExtracted && videoError) ||
      (!hasExtracted && (platform === 'youtube' || platform === 'webview'));
    const directSource = hasExtracted ? effectiveExtractedUrl : url;

    // avUri/avHeaders — computed before early returns so hooks can reference them
    const avUri = (usingProxy && !!proxyUrl) ? proxyUrl! : (directSource ?? url);
    const avHeaders: Record<string, string> = {
      'User-Agent': MOBILE_UA,
      ...httpHeaders,
      ...(referer ? { Referer: referer } : {}),
    };

    // expo-video player (hooks must be unconditional — no early returns before this)
    const expoPlayer = createExpoPlayer(null);
    const { status: evStatus } = useEvent(expoPlayer, 'statusChange', { status: expoPlayer.status });
    const { isPlaying: evIsPlaying } = useEvent(expoPlayer, 'playingChange', { isPlaying: expoPlayer.playing, oldIsPlaying: expoPlayer.playing });
    const { currentTime: evCurrentTime } = useEvent(expoPlayer, 'timeUpdate', { currentTime: 0, currentLiveTimestamp: null, currentOffsetFromLive: null, bufferedPosition: 0 });

    const onPlaybackStatusUpdateRef = useRef(onPlaybackStatusUpdate);
    onPlaybackStatusUpdateRef.current = onPlaybackStatusUpdate;

    // Detect video end — synthesize didJustFinish for watch party owner pause
    useEventListener(expoPlayer, 'playToEnd', () => {
      onPlaybackStatusUpdateRef.current?.({
        isLoaded: true,
        isPlaying: false,
        positionMillis: (expoPlayer.duration ?? 0) * 1000,
        durationMillis: expoPlayer.duration ? expoPlayer.duration * 1000 : undefined,
        isBuffering: false,
        didJustFinish: true,
      });
    });

    // Stable serialized headers key to detect real header changes without object identity churn
    const avHeadersKey = JSON.stringify(avHeaders);

    // Update player source when avUri/headers/mode changes
    useEffect(() => {
      if (useWebview || !avUri) return;
      expoPlayer.replace({ uri: avUri, headers: avHeaders });
    }, [avUri, avHeadersKey, useWebview]); // eslint-disable-line react-hooks/exhaustive-deps

    // Handle player ready — fire onReady exactly once, mark avLoaded
    useEffect(() => {
      if (useWebview || evStatus !== 'readyToPlay') return;
      if (!avLoaded) { setAvLoaded(true); fireReady(); }
    }, [evStatus, useWebview]); // eslint-disable-line react-hooks/exhaustive-deps

    // Handle player error — try proxy fallback, then show error state
    useEffect(() => {
      if (useWebview || evStatus !== 'error') return;
      if (!usingProxy && proxyUrl) {
        setUsingProxy(true);
        setAvLoaded(false);
        readyFiredRef.current = false;
      } else {
        setVideoError(true);
      }
    }, [evStatus, useWebview, usingProxy, proxyUrl]);

    // Synthesize PlaybackStatus for watch party sync (~4x/sec via timeUpdate + on state changes)
    useEffect(() => {
      if (useWebview) return;
      if (evStatus !== 'readyToPlay' && evStatus !== 'loading') return;
      onPlaybackStatusUpdateRef.current?.({
        isLoaded: true,
        isPlaying: evIsPlaying,
        positionMillis: evCurrentTime * 1000,
        durationMillis: expoPlayer.duration ? expoPlayer.duration * 1000 : undefined,
        isBuffering: evStatus === 'loading',
        didJustFinish: false,
      });
    }, [evCurrentTime, evIsPlaying, evStatus, useWebview]); // eslint-disable-line react-hooks/exhaustive-deps

    useImperativeHandle(ref, () => ({
      play: async () => { if (useWebview) webviewRef.current?.play(); else expoPlayer.play(); },
      pause: async () => { if (useWebview) webviewRef.current?.pause(); else expoPlayer.pause(); },
      seekTo: async (ms: number) => { if (useWebview) webviewRef.current?.seekTo(ms); else expoPlayer.currentTime = ms / 1000; },
      getPositionMs: async () => {
        if (useWebview) return webviewRef.current?.getPositionMs() ?? 0;
        return expoPlayer.currentTime * 1000;
      },
      setRate: async (rate: number) => {
        if (useWebview) webviewRef.current?.setRate(rate);
        else expoPlayer.playbackRate = rate;
      },
    }), [useWebview]); // eslint-disable-line react-hooks/exhaustive-deps

    if (isExtracting) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.extractingText}>{t('browser', 'videoDetecting')}...</Text>
        </View>
      );
    }
    if (!url) {
      return (
        <View style={styles.center}>
          <Ionicons name="videocam-off-outline" size={48} color={colors.textMuted} />
          <Text style={styles.errorText}>{t('watchParty', 'noVideoUrlMsg')}</Text>
          <Text style={styles.errorHint}>{t('watchParty', 'noVideoUrlHint')}</Text>
        </View>
      );
    }

    if (useWebview) {
      const ytId = platform === 'youtube' ? extractYouTubeVideoId(url) : null;
      const embedHtml = embedPlatform ? buildEmbedHtml(url, embedPlatform) : null;
      const displayUrl = (!ytId && platform === 'youtube') ? getYouTubeMobileUrl(url) : url;
      // Signal ready on first play event from the WebView
      const wrappedOnPlay = (secs: number) => { fireReady(); onPlay(secs); };
      return (
        <View style={styles.video}>
          <WebViewPlayer ref={webviewRef} url={displayUrl} youtubeVideoId={ytId ?? undefined}
            htmlContent={embedHtml?.html} htmlBaseUrl={embedHtml?.baseUrl}
            isOwner={isOwner} onPlay={wrappedOnPlay} onPause={onPause} onSeek={onSeek} onProgress={onProgress} onBuffering={onBuffering}
            userAgent={MOBILE_UA} referer={platform !== 'youtube' && !embedHtml ? referer : undefined}
            onYtInnertubeUrl={setInnertubeUrl} />
          {sniffUrl !== null && (
            <WebView
              source={{ uri: sniffUrl }}
              style={styles.sniffHidden}
              injectedJavaScriptBeforeContentLoaded={CDN_SNIFF_JS}
              javaScriptEnabled
              onMessage={handleSniffMessage}
              userAgent={MOBILE_UA}
              mediaPlaybackRequiresUserAction={false}
              allowsInlineMediaPlayback
            />
          )}
        </View>
      );
    }

    if (hasExtracted && videoError && !proxyFailed) {
      return (
        <View style={styles.center}>
          <Ionicons name="warning-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>{t('watchParty', 'videoLoadFailed')}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => { setVideoError(false); setAvLoaded(false); readyFiredRef.current = false; }}
          >
            <Text style={styles.retryText}>{t('common', 'retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.video}>
        <VideoView
          player={expoPlayer}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          nativeControls={false}
          fullscreenOptions={{ enable: false }}
        />
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
  sniffHidden: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  bufferingOverlay: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgVoid, gap: spacing.sm },
  errorText: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  errorHint: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  extractingText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  retryBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, backgroundColor: colors.primary, borderRadius: 10, marginTop: spacing.xs },
  retryText: { ...typography.body, color: '#fff', fontWeight: '600' },
});
