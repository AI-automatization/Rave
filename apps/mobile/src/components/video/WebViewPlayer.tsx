// CineSync Mobile — WebViewPlayer
// react-native-webview asosida har qanday saytdan video o'ynatish
// M6: Loading overlay, ad blocker, redirect warning, fullscreen, error+retry
// M7: Site-specific adapters (uzmovi.tv, kinogo.cc, filmix.net, hdrezka.ag, generic)
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
import type { WebViewMessageEvent, ShouldStartLoadRequest, WebViewNavigation } from 'react-native-webview';
import { colors, spacing, typography, borderRadius } from '@theme/index';
import { getAdapter, buildInjectJs } from './WebViewAdapters';

// Reklama domenlarini bloklash
const AD_HOSTNAMES = [
  'doubleclick.net',
  'googlesyndication.com',
  'adservice.google.com',
  'connect.facebook.net',
  'scorecardresearch.com',
  'outbrain.com',
  'taboola.com',
  'popads.net',
  'exoclick.com',
  'trafficjunky.net',
  'juicyads.com',
];

function isAdRequest(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return AD_HOSTNAMES.some(ad => hostname.includes(ad));
  } catch {
    return false;
  }
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export interface WebViewPlayerRef {
  play: () => void;
  pause: () => void;
  seekTo: (ms: number) => void;
  getPositionMs: () => number;
}

interface Props {
  url: string;
  isOwner: boolean;
  onPlay: (currentTimeSecs: number) => void;
  onPause: (currentTimeSecs: number) => void;
  onSeek: (currentTimeSecs: number) => void;
  onProgress?: (currentTimeSecs: number, durationSecs: number) => void;
  /** Custom User-Agent — YouTube kabi saytlar uchun WebView detektsiyasini o'tkazib yuborish */
  userAgent?: string;
}

type WebViewMessage =
  | { type: 'VIDEO_FOUND' }
  | { type: 'PLAY'; currentTime: number }
  | { type: 'PAUSE'; currentTime: number }
  | { type: 'SEEK'; currentTime: number }
  | { type: 'PROGRESS'; currentTime: number; duration: number }
  | { type: 'IFRAME_FOUND'; urls: string[] };


export const WebViewPlayer = forwardRef<WebViewPlayerRef, Props>(
  ({ url, isOwner, onPlay, onPause, onSeek, onProgress, userAgent }, ref) => {
    const webviewRef = useRef<WebView>(null);
    const currentTimeMsRef = useRef(0);
    const originalHostRef = useRef(getHostname(url));

    // M7: URL ga qarab saytga xos adapter tanlanadi
    const injectJs = useMemo(() => buildInjectJs(getAdapter(url)), [url]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [redirectWarning, setRedirectWarning] = useState<string | null>(null);

    // Fullscreen: StatusBar yashirish
    useEffect(() => {
      StatusBar.setHidden(true, 'slide');
      return () => StatusBar.setHidden(false, 'slide');
    }, []);

    useImperativeHandle(ref, () => ({
      play: () => {
        webviewRef.current?.injectJavaScript('if(window._csVideo){window._csVideo.play();} true;');
      },
      pause: () => {
        webviewRef.current?.injectJavaScript('if(window._csVideo){window._csVideo.pause();} true;');
      },
      seekTo: (ms: number) => {
        const secs = ms / 1000;
        webviewRef.current?.injectJavaScript(
          `if(window._csVideo){window._csVideo.currentTime=${secs};} true;`,
        );
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
            // Nested iframe: birinchi iframe URL ni to'g'ridan ochamiz
            if (data.urls[0]) {
              webviewRef.current?.injectJavaScript(
                `window.location.href = ${JSON.stringify(data.urls[0])}; true;`,
              );
            }
            break;
        }
      } catch {
        // JSON parse xato — ignore
      }
    }, [isOwner, onPlay, onPause, onSeek, onProgress]);

    // Reklama bloklash
    const handleShouldStartLoad = useCallback((request: ShouldStartLoadRequest): boolean => {
      return !isAdRequest(request.url);
    }, []);

    // Redirect aniqlash: domen o'zgarsa ogohlantirish
    const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
      if (!navState.url) return;
      const newHost = getHostname(navState.url);
      if (newHost && newHost !== originalHostRef.current) {
        setRedirectWarning(newHost);
      }
    }, []);

    const handleRetry = useCallback(() => {
      setError(false);
      setLoading(true);
      setRedirectWarning(null);
      webviewRef.current?.reload();
    }, []);

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
          <WebView
            ref={webviewRef}
            source={{ uri: url }}
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
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1 },

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
