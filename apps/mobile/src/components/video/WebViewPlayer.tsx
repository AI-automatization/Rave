// CineSync Mobile — WebViewPlayer
// react-native-webview asosida har qanday saytdan video o'ynatish
import React, { forwardRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import WebView from 'react-native-webview';
import { colors, spacing, typography, borderRadius } from '@theme/index';
import { getHostname } from './webviewAdBlocker';
import { useWebViewPlayer } from '@hooks/useWebViewPlayer';

export interface WebViewPlayerRef {
  play: () => void;
  pause: () => void;
  seekTo: (ms: number) => void;
  getPositionMs: () => number;
  setRate: (rate: number) => void;
}

interface Props {
  url: string;
  youtubeVideoId?: string;
  htmlContent?: string;
  htmlBaseUrl?: string;
  isOwner: boolean;
  onPlay: (currentTimeSecs: number) => void;
  onPause: (currentTimeSecs: number) => void;
  onSeek: (currentTimeSecs: number) => void;
  onProgress?: (currentTimeSecs: number, durationSecs: number) => void;
  onBuffering?: (isBuffering: boolean) => void;
  userAgent?: string;
  referer?: string;
}

export const WebViewPlayer = forwardRef<WebViewPlayerRef, Props>((props, ref) => {
  const { url, userAgent } = props;
  const {
    webviewRef, injectJs, webViewSource,
    loading, error, redirectWarning, ytEmbedBlocked, youtubeVideoId,
    setLoading, setError,
    handleMessage, handleShouldStartLoad, handleNavigationStateChange, handleRetry,
    setRedirectWarning,
  } = useWebViewPlayer(ref, props);

  return (
    <View style={s.container}>
      {loading && !error && (
        <View style={s.overlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingHost}>{getHostname(url)}</Text>
          <Text style={s.loadingText}>Yuklanmoqda...</Text>
        </View>
      )}

      {redirectWarning !== null && (
        <TouchableOpacity style={s.warningBanner} onPress={() => setRedirectWarning(null)} activeOpacity={0.8}>
          <Text style={s.warningText}>Redirect: {redirectWarning} (yopish uchun bosing)</Text>
        </TouchableOpacity>
      )}

      {ytEmbedBlocked ? (
        <View style={s.errorContainer}>
          <Text style={s.errorTitle}>Встроенный плеер недоступен</Text>
          <Text style={s.errorHost}>Автор этого видео запретил встраивание</Text>
          <TouchableOpacity
            style={s.retryButton}
            onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${youtubeVideoId}`)}
          >
            <Text style={s.retryText}>Открыть в YouTube</Text>
          </TouchableOpacity>
        </View>
      ) : error ? (
        <View style={s.errorContainer}>
          <Text style={s.errorTitle}>Sayt yuklanmadi</Text>
          <Text style={s.errorHost}>{getHostname(url)}</Text>
          <TouchableOpacity style={s.retryButton} onPress={handleRetry}>
            <Text style={s.retryText}>Qayta urinish</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.webviewWrapper}>
          <WebView
            ref={webviewRef}
            source={webViewSource}
            style={s.webview}
            javaScriptEnabled domStorageEnabled allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            injectedJavaScript={injectJs}
            onMessage={handleMessage}
            onLoadEnd={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
            onHttpError={({ nativeEvent }) => { if (nativeEvent.statusCode >= 400) { setLoading(false); setError(true); } }}
            allowsFullscreenVideo
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            onNavigationStateChange={handleNavigationStateChange}
            userAgent={userAgent}
          />
          {!props.isOwner && (
            <View style={[StyleSheet.absoluteFill, s.memberLockOverlay]} pointerEvents="box-only" />
          )}
        </View>
      )}
    </View>
  );
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webviewWrapper: { flex: 1 },
  webview: { flex: 1 },
  memberLockOverlay: { backgroundColor: 'rgba(0,0,0,0.01)' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: colors.bgVoid, justifyContent: 'center', alignItems: 'center',
    gap: spacing.sm, zIndex: 10,
  },
  loadingHost: { ...typography.h3, color: colors.textPrimary },
  loadingText: { ...typography.body, color: colors.textSecondary },
  warningBanner: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    backgroundColor: 'rgba(251,191,36,0.15)', paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
  },
  warningText: { ...typography.caption, color: colors.warning, textAlign: 'center' },
  errorContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.bgVoid, gap: spacing.sm, padding: spacing.xxxl,
  },
  errorTitle: { ...typography.h2, color: colors.textPrimary },
  errorHost: { ...typography.body, color: colors.textMuted },
  retryButton: {
    marginTop: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    backgroundColor: colors.primary, borderRadius: borderRadius.lg,
  },
  retryText: { ...typography.body, color: colors.primaryContent, fontWeight: '600' as const },
});
