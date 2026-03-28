// CineSync Mobile — MediaWebViewScreen
// In-app browser: video topilganda pastda "Watch Party" bar chiqadi — popup yo'q
import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Animated,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import type { WebViewNavigation, WebViewMessageEvent } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { watchPartyApi } from '@api/watchParty.api';
import { getSocket, CLIENT_EVENTS } from '@socket/client';
import {
  MEDIA_DETECTION_JS,
  normalizeDetectedMedia,
  normalizeBlobMedia,
  type MediaDetectedPayload,
  type BlobVideoFoundPayload,
  type RoomMedia,
} from '@utils/mediaDetector';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import type { ModalStackParamList } from '@app-types/index';

type Nav = NativeStackNavigationProp<ModalStackParamList>;
type RouteType = RouteProp<ModalStackParamList, 'MediaWebView'>;

const MOBILE_UA =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36';

// E67-1: document.cookie → postMessage
const COOKIE_COLLECTION_JS = `
(function() {
  function sendCookies() {
    try {
      var raw = document.cookie;
      if (!raw) return;
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'COOKIE_UPDATE',
        cookies: raw,
        domain: window.location.hostname,
      }));
    } catch(e) {}
  }
  sendCookies();
  setTimeout(sendCookies, 2000);
  setTimeout(sendCookies, 5000);
  true;
})();
`;

// ─── Platform hint ────────────────────────────────────────────────────────────

function getHint(sourceId: string): string {
  switch (sourceId) {
    case 'youtube':
    case 'youtube-live':
      return 'YouTube da video toping va oching — avtomatik aniqlanadi';
    case 'twitch':
      return 'Twitch da kanal yoki VOD ni oching';
    case 'vk':
      return 'VK da videoni bosing — pleer ochilsin';
    case 'rutube':
      return 'Rutube da videoni oching';
    case 'x':
      return 'X (Twitter) da video postni oching';
    case 'facebook':
      return 'Facebook da video post yoki Reelni oching';
    case 'instagram':
      return 'Instagram da Reel yoki videoni oching';
    case 'reddit':
      return 'Reddit da video postni oching';
    case 'streamable':
      return 'Streamable da videoni oching';
    case 'drive':
      return 'Google Drive da video faylni oching';
    default:
      return 'Film yoki videoni toping va bosing — avtomatik aniqlanadi';
  }
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function MediaWebViewScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<RouteType>();
  const insets = useSafeAreaInsets();

  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState(params.sourceName);
  const [isImporting, setIsImporting] = useState(false);
  // Track last URL to avoid clearing detectedMedia on non-navigation events
  const lastKnownUrlRef = useRef(params.defaultUrl);

  // Video topilganda bar uchun state
  const [detectedMedia, setDetectedMedia] = useState<RoomMedia | null>(null);

  // Animated bar (pastdan chiqadi)
  const barAnim = useRef(new Animated.Value(0)).current;

  // Ref guards — no stale closures
  const isImportingRef = useRef(false);
  const cookiesRef = useRef<string>('');
  const importMediaRef = useRef<(media: RoomMedia) => Promise<void>>(async () => {});

  // Bar animation
  useEffect(() => {
    Animated.spring(barAnim, {
      toValue: detectedMedia ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [detectedMedia, barAnim]);

  const onNavigationStateChange = useCallback((state: WebViewNavigation) => {
    setCanGoBack(state.canGoBack);
    setCanGoForward(state.canGoForward);
    if (state.title) setPageTitle(state.title);
    // Only clear detected media when URL actually changes to a different page.
    // Previously cleared on every nav event which removed the bar during Playerjs/iframe loads.
    if (state.url && state.url !== lastKnownUrlRef.current) {
      lastKnownUrlRef.current = state.url;
      setDetectedMedia(null);
    }
  }, []);

  // ─── Media import flow ──────────────────────────────────────────────────────

  React.useEffect(() => { importMediaRef.current = importMedia; });

  async function importMedia(media: RoomMedia) {
    if (isImportingRef.current) return;

    if (params.context === 'change_media') {
      if (!params.roomId) return;
      getSocket()?.emit(CLIENT_EVENTS.CHANGE_MEDIA, {
        roomId: params.roomId,
        videoUrl: media.videoUrl,
        videoTitle: media.videoTitle,
        videoPlatform: media.videoPlatform,
      });
      navigation.navigate('WatchParty', { roomId: params.roomId });
      return;
    }

    isImportingRef.current = true;
    setIsImporting(true);
    try {
      const sessionCookies = media.mode === 'webview-session' ? cookiesRef.current : undefined;
      const room = await watchPartyApi.createRoom({
        name: media.videoTitle.slice(0, 60),
        videoUrl: media.videoUrl,
        videoTitle: media.videoTitle,
        videoPlatform: media.videoPlatform,
        cookies: sessionCookies,
      });
      navigation.navigate('WatchParty', { roomId: room._id, videoReferer: media.videoReferer });
    } catch (err: unknown) {
      if (__DEV__) console.log('[MediaWebView] createRoom error:', err);
      const axiosErr = err as { response?: { data?: { message?: string } }; code?: string; message?: string };
      const msg = axiosErr.response?.data?.message
        ?? (axiosErr.message === 'Network Error' ? 'Сервер недоступен. Попробуйте позже.' : axiosErr.message)
        ?? 'Ошибка сети.';
      Alert.alert('Ошибка', msg);
    } finally {
      isImportingRef.current = false;
      setIsImporting(false);
    }
  }

  // ─── WebView message handler ─────────────────────────────────────────────────

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as
        | MediaDetectedPayload
        | BlobVideoFoundPayload
        | { type: 'COOKIE_UPDATE'; cookies: string; domain: string };

      if (data.type === 'COOKIE_UPDATE') {
        if (data.cookies) cookiesRef.current = data.cookies;
        return;
      }

      if (data.type === 'BLOB_VIDEO_FOUND') {
        const media = normalizeBlobMedia(data);
        setDetectedMedia(media);
        return;
      }

      if (data.type !== 'MEDIA_DETECTED') return;

      const media = normalizeDetectedMedia(data);
      setDetectedMedia(media);
    } catch {
      // Non-JSON messages ignored
    }
  }, []);

  // ─── Bar translate ───────────────────────────────────────────────────────────

  const barTranslateY = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [120, 0],
  });

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { paddingTop: insets.top || 0 }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="lock-closed-outline" size={12} color="#6B7280" style={styles.lockIcon} />
          )}
          <Text style={styles.headerTitle} numberOfLines={1}>{pageTitle}</Text>
        </View>

        <View style={styles.navBtns}>
          <TouchableOpacity
            onPress={() => webViewRef.current?.goBack()}
            disabled={!canGoBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={22} color={canGoBack ? '#fff' : '#4B5563'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => webViewRef.current?.goForward()}
            disabled={!canGoForward}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-forward" size={22} color={canGoForward ? '#fff' : '#4B5563'} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && <View style={styles.loadingBar} />}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: params.defaultUrl }}
        userAgent={MOBILE_UA}
        injectedJavaScript={MEDIA_DETECTION_JS + COOKIE_COLLECTION_JS}
        onNavigationStateChange={onNavigationStateChange}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        allowsBackForwardNavigationGestures
        style={styles.webview}
        renderError={() => (
          <View style={styles.errorView}>
            <Ionicons name="wifi-outline" size={48} color="#4B5563" />
            <Text style={styles.errorTitle}>Страница недоступна</Text>
            <Text style={styles.errorSub}>Сайт заблокировал встроенный браузер или недоступен.</Text>
            <TouchableOpacity
              style={styles.reloadBtn}
              onPress={() => webViewRef.current?.reload()}
            >
              <Text style={styles.reloadText}>Обновить</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Video topilmagan — hint bar */}
      {!detectedMedia && !isLoading && (
        <View style={[styles.hintBar, { paddingBottom: insets.bottom || spacing.sm }]}>
          <Ionicons name="search-outline" size={15} color="#6B7280" />
          <Text style={styles.hintText} numberOfLines={2}>
            {getHint(params.sourceId ?? '')}
          </Text>
        </View>
      )}

      {/* Video topilganda — Watch Party bar (pastdan chiqadi) */}
      {detectedMedia && (
        <Animated.View
          style={[
            styles.videoBar,
            { transform: [{ translateY: barTranslateY }], paddingBottom: insets.bottom || spacing.md },
          ]}
        >
          <View style={styles.videoBarLeft}>
            <Ionicons name="play-circle" size={22} color={colors.primary} />
            <Text style={styles.videoBarTitle} numberOfLines={1}>
              {detectedMedia.videoTitle || 'Видео найдено'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.videoBarBtn, isImporting && styles.videoBarBtnDisabled]}
            onPress={() => importMediaRef.current(detectedMedia)}
            disabled={isImporting}
            activeOpacity={0.8}
          >
            {isImporting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="tv-outline" size={16} color="#fff" />
                <Text style={styles.videoBarBtnText}>Watch Party</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#111118',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    gap: spacing.sm,
  },
  headerBtn: {
    padding: spacing.xs,
  },
  titleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    gap: spacing.xs,
    minHeight: 34,
  },
  lockIcon: {
    marginRight: 2,
  },
  headerTitle: {
    flex: 1,
    ...typography.caption,
    color: '#9CA3AF',
    fontSize: 12,
  },
  navBtns: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  loadingBar: {
    height: 2,
    backgroundColor: colors.primary,
    width: '60%',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  errorView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0F',
    gap: spacing.md,
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  errorSub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  reloadBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  reloadText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  // ─── Hint bar ─────────────────────────────────────────────────────────────
  hintBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: 'rgba(17,17,24,0.92)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
  },
  // ─── Video bar ─────────────────────────────────────────────────────────────
  videoBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111118',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
  },
  videoBarLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  videoBarTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  videoBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 110,
    justifyContent: 'center',
  },
  videoBarBtnDisabled: {
    opacity: 0.6,
  },
  videoBarBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
