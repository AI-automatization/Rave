// CineSync Mobile — MediaWebViewScreen
// In-app browser: video topilganda pastda "Watch Party" bar chiqadi — popup yo'q
import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { useMediaDetection, WEBVIEW_INJECT_JS } from '@hooks/useMediaDetection';
import { MediaBottomBar } from '@components/watchParty/MediaBottomBar';
import { MOBILE_UA } from '@utils/webViewScripts';

export function MediaWebViewScreen() {
  const insets = useSafeAreaInsets();
  const {
    webViewRef, params,
    canGoBack, canGoForward, isLoading, pageTitle, isImporting,
    detectedMedia, isBackendExtracting, isBotProtected,
    barTranslateY, importMediaRef,
    setIsLoading,
    onNavigationStateChange, onMessage,
  } = useMediaDetection();

  return (
    <View style={[s.root, { paddingTop: insets.top || 0 }]}>
      {/* Browser header */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => webViewRef.current?.stopLoading()}
          style={s.headerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={s.titleWrap}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="lock-closed-outline" size={12} color="#6B7280" style={s.lockIcon} />
          )}
          <Text style={s.headerTitle} numberOfLines={1}>{pageTitle}</Text>
        </View>

        <View style={s.navBtns}>
          <TouchableOpacity
            onPress={() => webViewRef.current?.goBack()} disabled={!canGoBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={22} color={canGoBack ? '#fff' : '#4B5563'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => webViewRef.current?.goForward()} disabled={!canGoForward}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-forward" size={22} color={canGoForward ? '#fff' : '#4B5563'} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && <View style={s.loadingBar} />}

      <WebView
        ref={webViewRef}
        source={{ uri: params.defaultUrl }}
        userAgent={MOBILE_UA}
        injectedJavaScript={WEBVIEW_INJECT_JS}
        onShouldStartLoadWithRequest={(req) => req.url.startsWith('http')}
        onNavigationStateChange={onNavigationStateChange}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onMessage={onMessage}
        javaScriptEnabled domStorageEnabled allowsBackForwardNavigationGestures
        style={s.webview}
        renderError={() => (
          <View style={s.errorView}>
            <Ionicons name="wifi-outline" size={48} color="#4B5563" />
            <Text style={s.errorTitle}>Страница недоступна</Text>
            <Text style={s.errorSub}>Сайт заблокировал встроенный браузер или недоступен.</Text>
            <TouchableOpacity style={s.reloadBtn} onPress={() => webViewRef.current?.reload()}>
              <Text style={s.reloadText}>Обновить</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <MediaBottomBar
        detectedMedia={detectedMedia}
        isBackendExtracting={isBackendExtracting}
        isBotProtected={isBotProtected}
        isLoading={isLoading}
        isImporting={isImporting}
        sourceId={params.sourceId ?? ''}
        paddingBottom={insets.bottom}
        barTranslateY={barTranslateY}
        onImport={(media) => importMediaRef.current(media)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0F' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: '#111118', borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)', gap: spacing.sm,
  },
  headerBtn: { padding: spacing.xs },
  titleWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    gap: spacing.xs, minHeight: 34,
  },
  lockIcon: { marginRight: 2 },
  headerTitle: { flex: 1, ...typography.caption, color: '#9CA3AF', fontSize: 12 },
  navBtns: { flexDirection: 'row', gap: spacing.xs },
  loadingBar: { height: 2, backgroundColor: colors.primary, width: '60%' },
  webview: { flex: 1, backgroundColor: '#0A0A0F' },
  errorView: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0A0A0F', gap: spacing.md, padding: spacing.xl,
  },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  errorSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  reloadBtn: {
    marginTop: spacing.sm, backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderRadius: borderRadius.lg,
  },
  reloadText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
