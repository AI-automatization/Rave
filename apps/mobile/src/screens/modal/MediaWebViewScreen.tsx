// CineSync Mobile — MediaWebViewScreen
// Встроенный браузер для просмотра и импорта медиа в комнату
import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import type { WebViewNavigation, WebViewMessageEvent } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { watchPartyApi } from '@api/watchParty.api';
import { getSocket, CLIENT_EVENTS } from '@socket/client';
import { MEDIA_DETECTION_JS, normalizeDetectedMedia, type MediaDetectedPayload, type RoomMedia } from '@utils/mediaDetector';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import type { ModalStackParamList } from '@app-types/index';

type Nav = NativeStackNavigationProp<ModalStackParamList>;
type RouteType = RouteProp<ModalStackParamList, 'MediaWebView'>;

const MOBILE_UA =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36';

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
  // importMedia ref — stable reference in onMessage to avoid stale closures
  const importMediaRef = useRef<(media: RoomMedia) => Promise<void>>(async () => {});

  const onNavigationStateChange = useCallback((state: WebViewNavigation) => {
    setCanGoBack(state.canGoBack);
    setCanGoForward(state.canGoForward);
    if (state.title) setPageTitle(state.title);
  }, []);

  // ─── Media import flow ──────────────────────────────────────────────────────

  // Keep ref in sync so onMessage (stable) always calls latest importMedia
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => { importMediaRef.current = importMedia; });

  async function importMedia(media: RoomMedia) {
    if (isImporting) return;

    if (params.context === 'change_media') {
      // Already in a room — emit socket event
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

    // New room — create + navigate
    setIsImporting(true);
    try {
      const room = await watchPartyApi.createRoom({
        name: media.videoTitle.slice(0, 60),
        videoUrl: media.videoUrl,
        videoTitle: media.videoTitle,
        videoPlatform: media.videoPlatform,
      });
      navigation.navigate('WatchParty', { roomId: room._id });
    } catch {
      Alert.alert('Ошибка', 'Не удалось создать комнату. Проверьте подключение к сети.');
    } finally {
      setIsImporting(false);
    }
  }

  // ─── WebView message handler ────────────────────────────────────────────────

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as MediaDetectedPayload;
      if (data.type !== 'MEDIA_DETECTED') return;

      const media = normalizeDetectedMedia(data);

      Alert.alert(
        '▶ Открыть в комнате?',
        `"${media.videoTitle.slice(0, 80)}"`,
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Открыть в комнате',
            onPress: () => importMediaRef.current(media),
          },
        ],
        { cancelable: true },
      );
    } catch {
      // Ignore non-JSON messages from page scripts
    }
    // importMedia is stable enough; including it would create infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────────

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

      {/* Loading bar */}
      {isLoading && <View style={styles.loadingBar} />}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: params.defaultUrl }}
        userAgent={MOBILE_UA}
        injectedJavaScript={MEDIA_DETECTION_JS}
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

      {/* Import overlay when creating room */}
      {isImporting && (
        <View style={styles.importOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.importText}>Создаём комнату...</Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

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
  importOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,15,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  importText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
