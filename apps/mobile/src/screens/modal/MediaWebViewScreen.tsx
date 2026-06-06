// WeWatch Mobile — MediaWebViewScreen
// In-app browser: Chrome/Safari-style layout — compact top bar + bottom nav toolbar
import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@theme/index';
import { useMediaDetection, WEBVIEW_INJECT_JS, WEBVIEW_EARLY_JS } from '@hooks/useMediaDetection';
import { MediaBottomBar } from '@components/watchParty/MediaBottomBar';
import { BROWSER_MOBILE_UA } from '@utils/webViewScripts';
import { isDomainBlocked } from '@constants/blockedDomains';
import { useDynamicBlockedDomains } from '@hooks/useDynamicBlockedDomains';
import { contentApi } from '@api/content.api';
import { useT } from '@i18n/index';

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

export function MediaWebViewScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const [blockedDomain, setBlockedDomain] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const loadingProgress = useRef(new Animated.Value(0)).current;

  useDynamicBlockedDomains();
  const {
    webViewRef, params,
    canGoBack, canGoForward, isLoading, pageTitle, isImporting,
    detectedMedia, isBackendExtracting, isBotProtected,
    barTranslateY, importMediaRef,
    setIsLoading,
    onNavigationStateChange, onMessage,
  } = useMediaDetection();

  const startUrl = params.defaultUrl || 'https://www.google.com';
  const domain = extractDomain(currentUrl || startUrl);
  const hasVideo = !!detectedMedia;

  // Animate loading progress bar
  const handleLoadStart = () => {
    setIsLoading(true);
    loadingProgress.setValue(0);
    Animated.timing(loadingProgress, {
      toValue: 0.8, duration: 2000, useNativeDriver: false,
    }).start();
  };
  const handleLoadEnd = () => {
    Animated.timing(loadingProgress, {
      toValue: 1, duration: 200, useNativeDriver: false,
    }).start(() => {
      setIsLoading(false);
      loadingProgress.setValue(0);
    });
  };

  const progressWidth = loadingProgress.interpolate({
    inputRange: [0, 1], outputRange: ['0%', '100%'],
  });

  return (
    <View style={[s.root, { paddingTop: insets.top || 0 }]}>

      {/* ── TOP ADDRESS BAR ─────────────────────────────────── */}
      <View style={s.addressBar}>
        {/* Close */}
        <TouchableOpacity
          onPress={() => webViewRef.current?.stopLoading()}
          style={s.iconBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Domain pill */}
        <View style={s.domainPill}>
          <Ionicons
            name={isLoading ? 'globe-outline' : 'lock-closed'}
            size={11}
            color={isLoading ? colors.textDim : colors.success}
          />
          <Text style={s.domainText} numberOfLines={1}>{domain}</Text>
        </View>

        {/* Video detected badge */}
        <View style={[s.detectionBadge, hasVideo && s.detectionBadgeActive]}>
          {isBackendExtracting
            ? <ActivityIndicator size="small" color={colors.primary} style={{ transform: [{ scale: 0.65 }] }} />
            : <Ionicons
                name={hasVideo ? 'film' : 'search'}
                size={13}
                color={hasVideo ? colors.primary : colors.textDim}
              />
          }
          <Text style={[s.detectionText, hasVideo && s.detectionTextActive]}>
            {hasVideo ? t('browser', 'videoFound') : t('browser', 'videoDetecting')}
          </Text>
        </View>
      </View>

      {/* Loading progress bar */}
      {isLoading && (
        <Animated.View style={[s.progressBar, { width: progressWidth }]} />
      )}

      {/* ── WEBVIEW ─────────────────────────────────────────── */}
      <WebView
        ref={webViewRef}
        source={{ uri: startUrl }}
        userAgent={BROWSER_MOBILE_UA}
        injectedJavaScriptBeforeContentLoaded={WEBVIEW_EARLY_JS}
        injectedJavaScript={WEBVIEW_INJECT_JS}
        onShouldStartLoadWithRequest={(req) => {
          if (!req.url.startsWith('http')) return false;
          if (isDomainBlocked(req.url)) {
            try { setBlockedDomain(new URL(req.url).hostname.replace(/^www\./, '')); }
            catch { setBlockedDomain(req.url); }
            return false;
          }
          setBlockedDomain(null);
          void contentApi.trackDomainVisit(new URL(req.url).hostname.replace(/^www\./, '')).catch(() => {});
          return true;
        }}
        onNavigationStateChange={(state) => {
          setCurrentUrl(state.url);
          onNavigationStateChange(state);
        }}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onMessage={onMessage}
        javaScriptEnabled domStorageEnabled allowsBackForwardNavigationGestures
        style={s.webview}
        renderError={() => (
          <View style={s.errorView}>
            <View style={s.errorIconWrap}>
              <Ionicons name="wifi-outline" size={36} color={colors.textDim} />
            </View>
            <Text style={s.errorTitle}>{t('browser', 'pageUnavailable')}</Text>
            <Text style={s.errorSub}>{t('browser', 'siteBlockedBrowser')}</Text>
            <TouchableOpacity style={s.reloadBtn} onPress={() => webViewRef.current?.reload()}>
              <Ionicons name="refresh" size={16} color={colors.white} />
              <Text style={s.reloadText}>{t('browser', 'reload')}</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* ── BOTTOM NAV TOOLBAR ──────────────────────────────── */}
      <View style={[s.toolbar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        <NavBtn
          icon="chevron-back" size={24}
          onPress={() => webViewRef.current?.goBack()}
          disabled={!canGoBack}
        />
        <NavBtn
          icon="chevron-forward" size={24}
          onPress={() => webViewRef.current?.goForward()}
          disabled={!canGoForward}
        />
        <NavBtn
          icon="refresh" size={20}
          onPress={() => webViewRef.current?.reload()}
        />
        <NavBtn
          icon="logo-google" size={20}
          onPress={() => webViewRef.current?.injectJavaScript(
            `window.location.href='https://www.google.com'; true;`
          )}
        />
      </View>

      {/* Blocked domain overlay */}
      {blockedDomain && (
        <View style={s.blockedOverlay}>
          <View style={s.blockedIconWrap}>
            <Ionicons name="shield-checkmark" size={40} color={colors.primary} />
          </View>
          <Text style={s.blockedTitle}>{t('browser', 'domainBlocked')}</Text>
          <Text style={s.blockedDomain}>{blockedDomain}</Text>
          <Text style={s.blockedSub}>{t('browser', 'domainBlockedMsg')}</Text>
          <TouchableOpacity
            style={s.blockedBtn}
            onPress={() => { setBlockedDomain(null); webViewRef.current?.goBack(); }}
          >
            <Ionicons name="arrow-back" size={16} color={colors.white} />
            <Text style={s.blockedBtnText}>{t('browser', 'back')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Watch Party bottom bar */}
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

// ── NavBtn helper ───────────────────────────────────────────────
const NavBtn = React.memo(function NavBtn({
  icon, size, onPress, disabled = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  size: number; onPress: () => void; disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress} disabled={disabled}
      style={[s.navBtn, disabled && s.navBtnDisabled]}
      hitSlop={{ top: 8, bottom: 8, left: 10, right: 10 }}
    >
      <Ionicons
        name={icon} size={size}
        color={disabled ? colors.textDim : colors.textSecondary}
      />
    </TouchableOpacity>
  );
});

// ── Styles ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },

  // Address bar
  addressBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.sm, paddingVertical: 7,
    backgroundColor: colors.bgElevated,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderStrong,
    gap: spacing.sm,
  },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.bgOverlay,
    alignItems: 'center', justifyContent: 'center',
  },
  domainPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgMuted, borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md, paddingVertical: 7,
    gap: spacing.xs,
  },
  domainText: {
    flex: 1, fontSize: 13, fontWeight: '500',
    color: colors.textSecondary, letterSpacing: 0.1,
  },
  detectionBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgMuted, borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.sm, paddingVertical: 6,
    gap: 4, borderWidth: 1, borderColor: 'transparent',
  },
  detectionBadgeActive: {
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderColor: 'rgba(124,58,237,0.3)',
  },
  detectionText: { fontSize: 11, color: colors.textDim, fontWeight: '500' },
  detectionTextActive: { color: colors.primary },

  // Progress
  progressBar: {
    height: 2, backgroundColor: colors.primary,
    position: 'absolute', top: 48, left: 0, zIndex: 10,
  },

  // WebView
  webview: { flex: 1, backgroundColor: colors.bgBase },

  // Bottom toolbar
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingTop: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderStrong,
  },
  navBtn: {
    width: 52, height: 44,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: borderRadius.lg,
  },
  navBtnDisabled: { opacity: 0.25 },

  // Error state
  errorView: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bgBase, gap: spacing.md, padding: spacing.xxl,
  },
  errorIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.bgElevated,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  errorTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  errorSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  reloadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginTop: spacing.sm, backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl, paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
  },
  reloadText: { color: colors.white, fontWeight: '700', fontSize: 15 },

  // Blocked domain
  blockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bgBase,
    alignItems: 'center', justifyContent: 'center',
    padding: spacing.xxl, gap: spacing.md, zIndex: 10,
  },
  blockedIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(124,58,237,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  blockedTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  blockedDomain: {
    fontSize: 13, color: colors.primary, fontWeight: '600',
    backgroundColor: 'rgba(124,58,237,0.1)',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
  },
  blockedSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  blockedBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginTop: spacing.sm, backgroundColor: colors.bgSurface,
    paddingHorizontal: spacing.xxl, paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
  },
  blockedBtnText: { color: colors.textPrimary, fontWeight: '600', fontSize: 15 },
});
