// CineSync — useMediaDetection: JS injection, video detection, backend extraction, import flow
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Animated, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import WebView from 'react-native-webview';
import type { WebViewNavigation, WebViewMessageEvent } from 'react-native-webview';
import { watchPartyApi } from '@api/watchParty.api';
import { contentApi } from '@api/content.api';
import { getSocket, CLIENT_EVENTS } from '@socket/client';
import {
  MEDIA_DETECTION_JS,
  normalizeDetectedMedia,
  normalizeBlobMedia,
  type MediaDetectedPayload,
  type BlobVideoFoundPayload,
  type RoomMedia,
} from '@utils/mediaDetector';
import {
  IFRAME_SCAN_JS, BOT_PROTECTION_JS, COOKIE_COLLECTION_JS,
  isPlaceholderVideoUrl,
} from '@utils/webViewScripts';
import type { ModalStackParamList } from '@app-types/index';

type Nav = NativeStackNavigationProp<ModalStackParamList>;
type RouteType = RouteProp<ModalStackParamList, 'MediaWebView'>;

export const WEBVIEW_INJECT_JS = MEDIA_DETECTION_JS + COOKIE_COLLECTION_JS + BOT_PROTECTION_JS + IFRAME_SCAN_JS;

export function useMediaDetection() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<RouteType>();

  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState(params.sourceName);
  const [isImporting, setIsImporting] = useState(false);
  const [detectedMedia, setDetectedMedia] = useState<RoomMedia | null>(null);
  const [isBackendExtracting, setIsBackendExtracting] = useState(false);
  const [isBotProtected, setIsBotProtected] = useState(false);

  const barAnim = useRef(new Animated.Value(0)).current;
  const lastKnownUrlRef = useRef(params.defaultUrl);
  const isImportingRef = useRef(false);
  const cookiesRef = useRef<string>('');
  const importMediaRef = useRef<(media: RoomMedia) => Promise<void>>(async () => {});
  const detectedUrlRef = useRef('');
  const backendFoundVideoRef = useRef(false);

  // Animate bottom bar in/out
  useEffect(() => {
    Animated.spring(barAnim, {
      toValue: detectedMedia ? 1 : 0,
      useNativeDriver: true, tension: 80, friction: 12,
    }).start();
  }, [detectedMedia, barAnim]);

  const barTranslateY = barAnim.interpolate({ inputRange: [0, 1], outputRange: [120, 0] });

  const setDetectedMediaOnce = useCallback((media: RoomMedia) => {
    if (detectedUrlRef.current === media.videoUrl) return;
    detectedUrlRef.current = media.videoUrl;
    setDetectedMedia(media);
  }, []);

  const tryBackendExtract = useCallback(async (url: string): Promise<boolean> => {
    if (!url || !url.startsWith('http')) return false;
    backendFoundVideoRef.current = false;
    detectedUrlRef.current = '';
    setIsBackendExtracting(true);
    try {
      const result = await contentApi.extractVideo(url, cookiesRef.current || undefined);
      const media: RoomMedia = {
        videoUrl: result.videoUrl,
        videoTitle: result.title || 'Video',
        videoPlatform: result.platform === 'youtube' ? 'youtube' : 'direct',
        videoThumbnail: result.poster || undefined,
        videoReferer: url,
        mode: 'extracted',
      };
      backendFoundVideoRef.current = true;
      setDetectedMediaOnce(media);
      return true;
    } catch {
      return false;
    } finally {
      setIsBackendExtracting(false);
    }
  }, [setDetectedMediaOnce]);

  const onNavigationStateChange = useCallback((state: WebViewNavigation) => {
    setCanGoBack(state.canGoBack);
    setCanGoForward(state.canGoForward);
    if (state.title) setPageTitle(state.title);
    if (!state.url || !state.url.startsWith('http')) return;
    if (state.url !== lastKnownUrlRef.current) {
      setIsBotProtected(false);
      lastKnownUrlRef.current = state.url;
      detectedUrlRef.current = '';
      backendFoundVideoRef.current = false;
      setDetectedMedia(null);
      if (/\.(mp4|m3u8|webm|mkv|ts|mov|mpd)(\?|#|$)/i.test(state.url) && !isPlaceholderVideoUrl(state.url)) {
        const fileName = state.url.split('/').pop()?.split('?')[0] ?? 'Video';
        setDetectedMediaOnce({ videoUrl: state.url, videoTitle: state.title || fileName, videoPlatform: 'direct', mode: 'extracted' });
        return;
      }
      void tryBackendExtract(state.url);
    }
  }, [tryBackendExtract, setDetectedMediaOnce]);

  useEffect(() => { void tryBackendExtract(params.defaultUrl); }, []);

  // Keep importMedia ref always up-to-date (avoids stale closure in WebView callbacks)
  React.useEffect(() => { importMediaRef.current = importMedia; });

  async function importMedia(media: RoomMedia) {
    if (isImportingRef.current) return;
    if (params.mode === 'change') {
      if (!params.roomId) return;
      getSocket()?.emit(CLIENT_EVENTS.CHANGE_MEDIA, {
        roomId: params.roomId, videoUrl: media.videoUrl,
        videoTitle: media.videoTitle, videoPlatform: media.videoPlatform,
      });
      navigation.navigate('WatchParty', { roomId: params.roomId });
      return;
    }
    isImportingRef.current = true;
    setIsImporting(true);
    try {
      const sessionCookies = media.mode === 'webview-session' ? cookiesRef.current : undefined;
      const room = await watchPartyApi.createRoom({
        name: media.videoTitle.slice(0, 60), videoUrl: media.videoUrl,
        videoTitle: media.videoTitle, videoPlatform: media.videoPlatform, cookies: sessionCookies,
      });
      navigation.navigate('WatchParty', { roomId: room._id, videoReferer: media.videoReferer });
    } catch (err: unknown) {
      if (__DEV__) console.log('[MediaWebView] createRoom error:', err);
      const axiosErr = err as { response?: { data?: { message?: string } }; code?: string; message?: string };
      const isTimeout = axiosErr.code === 'ECONNABORTED' || (axiosErr.message ?? '').includes('timeout');
      const msg = isTimeout || axiosErr.message === 'Network Error'
        ? 'Internet aloqasini tekshiring va qayta urinib ko\'ring.'
        : axiosErr.response?.data?.message ?? 'Xona yaratib bo\'lmadi.';
      Alert.alert('Xato', msg);
    } finally {
      isImportingRef.current = false;
      setIsImporting(false);
    }
  }

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as
        | MediaDetectedPayload | BlobVideoFoundPayload
        | { type: 'COOKIE_UPDATE'; cookies: string; domain: string }
        | { type: 'BOT_PROTECTION_DETECTED' }
        | { type: 'IFRAME_FOUND'; urls: string[] };

      if (data.type === 'COOKIE_UPDATE') { if (data.cookies) cookiesRef.current = data.cookies; return; }
      if (data.type === 'BOT_PROTECTION_DETECTED') { setIsBotProtected(true); return; }
      if (data.type === 'IFRAME_FOUND') {
        if (Array.isArray(data.urls) && data.urls[0] && !backendFoundVideoRef.current) {
          const iframeUrl = data.urls[0];
          void tryBackendExtract(iframeUrl).then((success) => {
            if (!success && !backendFoundVideoRef.current && webViewRef.current) {
              webViewRef.current.injectJavaScript(`window.location.href = ${JSON.stringify(iframeUrl)};true;`);
            }
          });
        }
        return;
      }
      if (backendFoundVideoRef.current) return;
      if (data.type === 'BLOB_VIDEO_FOUND') { setDetectedMediaOnce(normalizeBlobMedia(data)); return; }
      if (data.type !== 'MEDIA_DETECTED') return;
      const normalized = normalizeDetectedMedia(data);
      if (!isPlaceholderVideoUrl(normalized.videoUrl)) setDetectedMediaOnce(normalized);
    } catch { /* Non-JSON messages ignored */ }
  }, [setDetectedMediaOnce, tryBackendExtract]);

  return {
    webViewRef, params,
    canGoBack, canGoForward, isLoading, pageTitle, isImporting,
    detectedMedia, isBackendExtracting, isBotProtected,
    barTranslateY, importMediaRef,
    setIsLoading, setCanGoBack, setCanGoForward,
    onNavigationStateChange, onMessage,
  };
}
