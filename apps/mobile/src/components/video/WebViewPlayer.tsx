// CineSync Mobile — WebViewPlayer
// react-native-webview asosida har qanday saytdan video o'ynatish
// M6: Loading overlay, ad blocker, redirect warning, fullscreen, error+retry
// M7: Site-specific adapters (uzmovi.tv, kinogo.cc, filmix.net, hdrezka.ag, generic)
// M8: YouTube IFrame API mode (source={{ html }}) — direct URI emas, cross-origin problem yo'q
import React, { forwardRef, useImperativeHandle, useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import WebView from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import type { ShouldStartLoadRequest, WebViewNavigation } from 'react-native-webview/lib/WebViewTypes';
import { colors, spacing, typography, borderRadius } from '@theme/index';
import { getAdapter, buildInjectJs } from './WebViewAdapters';
import { isAdRequest, getHostname } from './webviewAdBlocker';
import { buildYouTubeHtml } from './webviewYouTube';

export interface WebViewPlayerRef {
  play: () => void;
  pause: () => void;
  seekTo: (ms: number) => void;
  getPositionMs: () => number;
}

interface Props {
  url: string;
  /** YouTube video ID — set qilinsa IFrame API HTML rejimi faollashadi */
  youtubeVideoId?: string;
  /** Pre-built HTML for embed platforms (Twitch, VK, Rutube, Vimeo, Dailymotion) */
  htmlContent?: string;
  /** baseUrl for htmlContent (e.g. 'https://twitch.tv') */
  htmlBaseUrl?: string;
  isOwner: boolean;
  onPlay: (currentTimeSecs: number) => void;
  onPause: (currentTimeSecs: number) => void;
  onSeek: (currentTimeSecs: number) => void;
  onProgress?: (currentTimeSecs: number, durationSecs: number) => void;
  /** Custom User-Agent — saytlar uchun WebView detektsiyasini o'tkazib yuborish */
  userAgent?: string;
  /** Referer header для CDN hotlink-защиты */
  referer?: string;
}

type WebViewMessage =
  | { type: 'VIDEO_FOUND' }
  | { type: 'PLAY'; currentTime: number }
  | { type: 'PAUSE'; currentTime: number }
  | { type: 'SEEK'; currentTime: number }
  | { type: 'PROGRESS'; currentTime: number; duration: number }
  | { type: 'IFRAME_FOUND'; urls: string[] }
  | { type: 'YT_EMBED_ERROR'; code: number };


export const WebViewPlayer = forwardRef<WebViewPlayerRef, Props>(
  ({ url, youtubeVideoId, htmlContent, htmlBaseUrl, isOwner, onPlay, onPause, onSeek, onProgress, userAgent, referer }, ref) => {
    const webviewRef = useRef<WebView>(null);
    const currentTimeMsRef = useRef(0);
    const originalHostRef = useRef(getHostname(url));

    // HTML mode: YouTube IFrame or pre-built embed HTML — adapter injection kerak emas
    const isHtmlMode = !!youtubeVideoId || !!htmlContent;
    const isYouTubeMode = !!youtubeVideoId;
    const injectJs = useMemo(
      () => (isHtmlMode ? 'true;' : buildInjectJs(getAdapter(url))),
      [url, isHtmlMode],
    );

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [redirectWarning, setRedirectWarning] = useState<string | null>(null);
    // YouTube IFrame embed error 150/152 → fallback to m.youtube.com
    const [ytFallback, setYtFallback] = useState(false);
    const fallbackYtUrl = isYouTubeMode && youtubeVideoId
      ? `https://m.youtube.com/watch?v=${youtubeVideoId}`
      : url;

    // Fullscreen: StatusBar yashirish
    useEffect(() => {
      StatusBar.setHidden(true, 'slide');
      return () => StatusBar.setHidden(false, 'slide');
    }, []);

    // Video element hali topilmagan bo'lsa, 500ms kutib qayta urinish
    const injectWithRetry = useCallback((js: string) => {
      const wrapped = `if(window._csVideo){${js}}else{setTimeout(function(){if(window._csVideo){${js}}},500);} true;`;
      webviewRef.current?.injectJavaScript(wrapped);
    }, []);

    useImperativeHandle(ref, () => ({
      play: () => {
        injectWithRetry('window._csVideo.play();');
      },
      pause: () => {
        injectWithRetry('window._csVideo.pause();');
      },
      seekTo: (ms: number) => {
        const secs = ms / 1000;
        injectWithRetry(`window._csVideo.currentTime=${secs};`);
        currentTimeMsRef.current = ms;
      },
      getPositionMs: () => currentTimeMsRef.current,
    }));

    const handleMessage = useCallback((event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data) as WebViewMessage;
        switch (data.type) {
          case 'PLAY':
            currentTimeMsRef.current = data.currentTime * 1000;
            if (isOwner) onPlay(data.currentTime);
            break;
          case 'PAUSE':
            currentTimeMsRef.current = data.currentTime * 1000;
            if (isOwner) onPause(data.currentTime);
            break;
          case 'SEEK':
            currentTimeMsRef.current = data.currentTime * 1000;
            if (isOwner) onSeek(data.currentTime);
            break;
          case 'PROGRESS':
            currentTimeMsRef.current = data.currentTime * 1000;
            onProgress?.(data.currentTime, data.duration);
            break;
          case 'IFRAME_FOUND':
            // Nested iframe: birinchi iframe URL ni to'g'ridan ochamiz (faqat generic rejimda)
            if (!isHtmlMode && data.urls[0]) {
              webviewRef.current?.injectJavaScript(
                `window.location.href = ${JSON.stringify(data.urls[0])}; true;`,
              );
            }
            break;
          case 'YT_EMBED_ERROR':
            // 150/152: embedding disabled — fallback to m.youtube.com full site
            if (data.code === 150 || data.code === 152 || data.code === 101) {
              setYtFallback(true);
              setLoading(true);
            }
            break;
        }
      } catch {
        // JSON parse xato — ignore
      }
    }, [isOwner, isYouTubeMode, onPlay, onPause, onSeek, onProgress]);

    // Reklama va native-app redirect bloklash
    const handleShouldStartLoad = useCallback((request: ShouldStartLoadRequest): boolean => {
      const { url: reqUrl } = request;
      // intent://, youtube://, market:// — native app ochishga urinadi → black screen
      try {
        const scheme = reqUrl.split(':')[0].toLowerCase();
        if (scheme !== 'http' && scheme !== 'https' && scheme !== 'blob' && scheme !== 'data') {
          return false;
        }
      } catch {
        return false;
      }
      return !isAdRequest(reqUrl);
    }, []);

    // Redirect aniqlash: domen o'zgarsa ogohlantirish (HTML embed rejimida o'chirish)
    const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
      if (isHtmlMode || !navState.url || !isOwner) return;
      const newHost = getHostname(navState.url);
      if (newHost && newHost !== originalHostRef.current) {
        setRedirectWarning(newHost);
      }
    }, [isYouTubeMode, isOwner]);

    const handleRetry = useCallback(() => {
      setError(false);
      setLoading(true);
      setRedirectWarning(null);
      webviewRef.current?.reload();
    }, []);

    // WebView source:
    //  Pre-built embed HTML (Twitch, VK, Rutube, Vimeo, Dailymotion) → htmlContent
    //  YouTube IFrame embed (normal) → buildYouTubeHtml
    //  YouTube fallback (error 150/152) → m.youtube.com URI
    //  Others → URI
    const webViewSource = htmlContent
      ? { html: htmlContent, baseUrl: htmlBaseUrl ?? 'about:blank' }
      : isYouTubeMode && !ytFallback
      ? { html: buildYouTubeHtml(youtubeVideoId!), baseUrl: 'https://www.youtube.com' }
      : isYouTubeMode && ytFallback
      ? { uri: fallbackYtUrl }
      : { uri: url, headers: referer ? { Referer: referer } : {} };

    return (
      <View style={styles.container}>
        {/* Loading overlay */}
        {loading && !error && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingHost}>{getHostname(url)}</Text>
            <Text style={styles.loadingText}>Yuklanmoqda...</Text>
          </View>
        )}

        {/* Redirect ogohlantirish banneri */}
        {redirectWarning !== null && (
          <TouchableOpacity
            style={styles.warningBanner}
            onPress={() => setRedirectWarning(null)}
            activeOpacity={0.8}
          >
            <Text style={styles.warningText}>
              Redirect: {redirectWarning} (yopish uchun bosing)
            </Text>
          </TouchableOpacity>
        )}

        {/* Xato holati */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Sayt yuklanmadi</Text>
            <Text style={styles.errorHost}>{getHostname(url)}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryText}>Qayta urinish</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.webviewWrapper}>
            <WebView
              ref={webviewRef}
              source={webViewSource}
              style={styles.webview}
              javaScriptEnabled
              domStorageEnabled
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              injectedJavaScript={injectJs}
              onMessage={handleMessage}
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
              onHttpError={({ nativeEvent }) => {
                if (nativeEvent.statusCode >= 400) {
                  setLoading(false);
                  setError(true);
                }
              }}
              allowsFullscreenVideo
              onShouldStartLoadWithRequest={handleShouldStartLoad}
              onNavigationStateChange={handleNavigationStateChange}
              userAgent={userAgent}
            />
            {/* Member lock: semi-transparent overlay blocks all touch events.
                pointerEvents="box-only" + backgroundColor forces Android SurfaceView
                to go through React Native touch system instead of bypassing it. */}
            {!isOwner && (
              <View
                style={[StyleSheet.absoluteFill, styles.memberLockOverlay]}
                pointerEvents="box-only"
              />
            )}
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webviewWrapper: { flex: 1 },
  webview: { flex: 1 },
  memberLockOverlay: {
    // rgba background forces Android SurfaceView WebView to process touches
    // through React Native instead of the native SurfaceView layer
    backgroundColor: 'rgba(0,0,0,0.01)',
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bgVoid,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 10,
  },
  loadingHost: { ...typography.h3, color: colors.textPrimary },
  loadingText: { ...typography.body, color: colors.textSecondary },

  warningBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(251,191,36,0.15)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    zIndex: 20,
  },
  warningText: {
    ...typography.caption,
    color: colors.warning,
    textAlign: 'center',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgVoid,
    gap: spacing.sm,
    padding: spacing.xxxl,
  },
  errorTitle: { ...typography.h2, color: colors.textPrimary },
  errorHost: { ...typography.body, color: colors.textMuted },
  retryButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  retryText: {
    ...typography.body,
    color: colors.primaryContent,
    fontWeight: '600' as const,
  },
});
