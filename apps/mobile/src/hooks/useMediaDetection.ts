// WeWatch — useMediaDetection: JS injection, video detection, backend extraction, import flow
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Animated } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import WebView from 'react-native-webview';
import type { WebViewNavigation, WebViewMessageEvent } from 'react-native-webview';
import { watchPartyApi } from '@api/watchParty.api';
import { contentApi } from '@api/content.api';
import { getSocket, CLIENT_EVENTS } from '@socket/client';
import {
  MEDIA_DETECTION_JS,
  MEDIA_INTERCEPT_EARLY_JS,
  normalizeDetectedMedia,
  normalizeBlobMedia,
  type MediaDetectedPayload,
  type BlobVideoFoundPayload,
  type RoomMedia,
} from '@utils/mediaDetector';
import {
  IFRAME_SCAN_JS, BOT_PROTECTION_JS,
  isPlaceholderVideoUrl,
} from '@utils/webViewScripts';
import type { ModalStackParamList } from '@app-types/index';
import { appAlert } from '@components/common/AppAlert';

type Nav = NativeStackNavigationProp<ModalStackParamList>;
type RouteType = RouteProp<ModalStackParamList, 'MediaWebView'>;

export const WEBVIEW_INJECT_JS = MEDIA_DETECTION_JS + BOT_PROTECTION_JS + IFRAME_SCAN_JS;
// Injected before page JS (injectedJavaScriptBeforeContentLoaded) — sets up XHR/fetch
// intercepts early on Android so player library manifest requests are caught.
export const WEBVIEW_EARLY_JS = MEDIA_INTERCEPT_EARLY_JS;

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
  const importMediaRef = useRef<(media: RoomMedia) => Promise<void>>(async () => {});
  const detectedUrlRef = useRef('');
  const backendFoundVideoRef = useRef(false);
  // Set to true when a direct media URL (m3u8/mp4) is confirmed via XHR intercept.
  // Unlike detectedUrlRef, this is NOT reset by tryBackendExtract — only by navigation.
  // Prevents IFRAME_FOUND and BLOB_VIDEO_FOUND from overriding a clean URL.
  const cleanUrlFoundRef = useRef(false);
  // Sync ref — always holds the latest detected media even before React re-renders.
  // importMedia reads this so a direct URL found by XHR intercept is used even if
  // the state setter hasn't flushed yet when the user taps the import button.
  const detectedMediaRef = useRef<RoomMedia | null>(null);
  // Timer ref for delayed backend extraction — lets XHR intercept win the race on Android.
  // On Android, injectedJavaScriptBeforeContentLoaded is async (evaluateJavascript from
  // onPageStarted). HLS.js can init and fetch m3u8 in 1-3s. By delaying backend extraction
  // 1.5s, the XHR intercept / performance scan has time to find the direct URL first.
  // If XHR fires in that window, backend extraction is cancelled entirely.
  const backendExtractTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    detectedMediaRef.current = media;
    setDetectedMedia(media);
  }, []);

  const tryBackendExtract = useCallback(async (url: string): Promise<boolean> => {
    if (!url || !url.startsWith('http')) return false;
    backendFoundVideoRef.current = false;
    detectedUrlRef.current = '';
    setIsBackendExtracting(true);
    try {
      const result = await contentApi.extractVideo(url);
      // If XHR intercept already found a direct m3u8/mp4 while backend was extracting,
      // don't override it with the page URL — the direct URL is better for playback.
      // Still mark backendFoundVideoRef to prevent blob from overriding the clean URL.
      if (cleanUrlFoundRef.current) {
        backendFoundVideoRef.current = true;
        return true;
      }
      // If backend extracted a direct CDN stream URL (m3u8/mp4), store it directly.
      // This eliminates the WatchParty re-extraction dependency — if the Redis cache
      // expired or the backend restarted between import and room join, re-extraction
      // would fail for JS-rendered sites and fall back to WebView (no clean video).
      // For iframe/embed results (not a direct stream), keep PAGE_URL so WatchParty
      // can re-extract a fresh CDN URL on join (embed URLs have shorter TTLs).
      // videoReferer always stores the page URL for CDN hotlink protection headers.
      const extractedUrl = result.videoUrl ?? '';
      // VK / Rutube CDN URLs are IP-locked to the extraction server (Railway datacenter IP
      // → 403 from the user's phone, and the HLS proxy fetches from that same blocked IP).
      // For these we must keep the PAGE_URL so WatchParty detects the embed platform and
      // sniffs the CDN URL client-side (phone's residential IP), bypassing the IP lock.
      const isIpLockedPlatform = /(^|\.)rutube\.ru|(^|\.)vk\.com|(^|\.)vkvideo\.ru/i.test(url);
      const isDirectCdnUrl = !isIpLockedPlatform && !!(extractedUrl
        && !extractedUrl.includes('videoplayback')
        && !extractedUrl.includes('googlevideo')
        && (
          /\.(mp4|m3u8|webm|ogg|mov|ts|mkv|mpd)(\?|#|$)/i.test(extractedUrl)
          || /\/(stream|playlist\.m3u8|manifest\.m3u8|master\.m3u8|manifest|hls|dash|chunklist)/i.test(extractedUrl)
          || /\/(video|vod|cdn|media)\/[^/]+\/(index|master|720p|480p|360p|1080p|hls)/i.test(extractedUrl)
        )
      );
      const media: RoomMedia = {
        videoUrl: isDirectCdnUrl ? extractedUrl : url,
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

  const scheduledBackendExtract = useCallback((url: string) => {
    if (backendExtractTimerRef.current) clearTimeout(backendExtractTimerRef.current);
    // Delay 1.5s so the XHR intercept / performance scan can fire first (Android race).
    // If cleanUrlFoundRef becomes true in that window, the backend call is skipped.
    backendExtractTimerRef.current = setTimeout(() => {
      backendExtractTimerRef.current = null;
      if (!cleanUrlFoundRef.current) void tryBackendExtract(url);
    }, 1500);
  }, [tryBackendExtract]);

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
      cleanUrlFoundRef.current = false;
      detectedMediaRef.current = null;
      setDetectedMedia(null);
      if (backendExtractTimerRef.current) { clearTimeout(backendExtractTimerRef.current); backendExtractTimerRef.current = null; }
      if (/\.(mp4|m3u8|webm|mkv|ts|mov|mpd)(\?|#|$)/i.test(state.url) && !isPlaceholderVideoUrl(state.url)) {
        const fileName = state.url.split('/').pop()?.split('?')[0] ?? 'Video';
        setDetectedMediaOnce({ videoUrl: state.url, videoTitle: state.title || fileName, videoPlatform: 'direct', mode: 'extracted' });
        return;
      }
      scheduledBackendExtract(state.url);
    }
  }, [scheduledBackendExtract, setDetectedMediaOnce]);

  useEffect(() => {
    scheduledBackendExtract(params.defaultUrl);
    return () => { if (backendExtractTimerRef.current) clearTimeout(backendExtractTimerRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep importMedia ref always up-to-date (avoids stale closure in WebView callbacks)
  React.useEffect(() => { importMediaRef.current = importMedia; });

  async function importMedia(media: RoomMedia) {
    if (isImportingRef.current) return;
    // Lock immediately — prevents double-tap creating duplicate rooms and shows loading at once
    isImportingRef.current = true;
    setIsImporting(true);
    try {
      // On Android, the XHR/performance scan may find the CDN URL 1-3s AFTER the backend
      // extraction shows the import bar (backend fires at 1.5s, scan at 1s/3s/5s).
      // If the user taps Import before the scan fires, we'd use the page URL instead of the
      // CDN URL. Wait up to 3s for CDN confirmation — resolves immediately if already found.
      // Skip the wait entirely when Fix #22 already stored a direct CDN URL in media (videoUrl
      // matches a stream pattern) — no need to poll since the URL is already the right one.
      const mediaAlreadyHasCdnUrl = media.videoPlatform === 'direct' && !!(
        /\.(mp4|m3u8|webm|ogg|mov|ts|mkv|mpd)(\?|#|$)/i.test(media.videoUrl)
        || /\/(stream|hls|manifest|playlist\.m3u8|master\.m3u8|chunklist)/i.test(media.videoUrl)
      );
      if (backendFoundVideoRef.current && !cleanUrlFoundRef.current && !mediaAlreadyHasCdnUrl) {
        await new Promise<void>(resolve => {
          if (cleanUrlFoundRef.current) { resolve(); return; }
          const timer = setTimeout(resolve, 3000);
          const poll = setInterval(() => {
            if (cleanUrlFoundRef.current) { clearTimeout(timer); clearInterval(poll); resolve(); }
          }, 100);
        });
      }
      // If XHR intercept found a direct URL (or scan confirmed it above), prefer it.
      // cleanUrlFoundRef is set synchronously; detectedMediaRef mirrors setDetectedMediaOnce
      // synchronously — both may be ahead of the React state that was passed as `media`.
      const effective =
        cleanUrlFoundRef.current && detectedMediaRef.current?.videoPlatform === 'direct'
          ? detectedMediaRef.current
          : media;
      if (params.mode === 'change') {
        if (!params.roomId) return;
        getSocket()?.emit(CLIENT_EVENTS.CHANGE_MEDIA, {
          roomId: params.roomId, videoUrl: effective.videoUrl,
          videoTitle: effective.videoTitle, videoPlatform: effective.videoPlatform,
        });
        navigation.navigate('WatchParty', { roomId: params.roomId });
        return;
      }
      if (params.mode === 'queue') {
        if (!params.roomId) return;
        try {
          await watchPartyApi.addToPlaylist(params.roomId, {
            videoUrl: effective.videoUrl,
            videoTitle: effective.videoTitle,
            videoPlatform: effective.videoPlatform,
          });
        } catch {}
        navigation.navigate('WatchParty', { roomId: params.roomId });
        return;
      }
      const room = await watchPartyApi.createRoom({
        name: effective.videoTitle.slice(0, 60), videoUrl: effective.videoUrl,
        videoTitle: effective.videoTitle, videoPlatform: effective.videoPlatform,
        videoReferer: effective.videoReferer,
      });
      navigation.navigate('WatchParty', { roomId: room._id, videoReferer: effective.videoReferer });
    } catch (err: unknown) {
      if (__DEV__) console.log('[MediaWebView] createRoom error:', err);
      const axiosErr = err as { response?: { data?: { message?: string } }; code?: string; message?: string };
      const isTimeout = axiosErr.code === 'ECONNABORTED' || (axiosErr.message ?? '').includes('timeout');
      const msg = isTimeout || axiosErr.message === 'Network Error'
        ? 'Internet aloqasini tekshiring va qayta urinib ko\'ring.'
        : axiosErr.response?.data?.message ?? 'Xona yaratib bo\'lmadi.';
      appAlert('Xato', msg);
    } finally {
      isImportingRef.current = false;
      setIsImporting(false);
    }
  }

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as
        | MediaDetectedPayload | BlobVideoFoundPayload
        | { type: 'BOT_PROTECTION_DETECTED' }
        | { type: 'IFRAME_FOUND'; urls: string[] }
        | { type: 'COOKIE_PROBE'; cookie: string; url: string }
        | { type: 'MANIFEST_PROBE'; status: number; ok?: boolean; error?: string; url: string };

      if (data.type === 'COOKIE_PROBE') {
        if (__DEV__) console.log('[VK-SNIFF] COOKIE_PROBE cookie=' + JSON.stringify(data.cookie) + ' url=' + data.url.slice(0, 80));
        return;
      }
      if (data.type === 'MANIFEST_PROBE') {
        if (__DEV__) console.log('[VK-SNIFF] MANIFEST_PROBE status=' + data.status + ' ok=' + data.ok + (data.error ? ' err=' + data.error : '') + ' url=' + data.url.slice(0, 80));
        return;
      }
      if (data.type === 'BOT_PROTECTION_DETECTED') { setIsBotProtected(true); return; }
      if (data.type === 'IFRAME_FOUND') {
        // A direct URL was already found via XHR intercept — iframe extraction would reset
        // detectedUrlRef (inside tryBackendExtract) and lose the clean URL.
        if (cleanUrlFoundRef.current) return;
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
      if (data.type === 'BLOB_VIDEO_FOUND') {
        // Blob is always a fallback (HLS.js internal) — skip if anything real already found.
        if (cleanUrlFoundRef.current || backendFoundVideoRef.current) return;
        setDetectedMediaOnce(normalizeBlobMedia(data));
        return;
      }
      if (data.type !== 'MEDIA_DETECTED') return;
      const normalized = normalizeDetectedMedia(data);
      if (isPlaceholderVideoUrl(normalized.videoUrl)) return;
      if (normalized.videoPlatform === 'direct') {
        if (cleanUrlFoundRef.current) {
          // A direct URL is already locked — ignore subsequent ones (e.g. .ts segments after m3u8).
          // HLS.js fetches the m3u8 manifest first, then hundreds of .ts segments.
          // Without this guard each segment URL would override the manifest, and
          // the room would be created with a single 5-second clip instead of the stream.
          return;
        }
        // First direct URL found: cancel pending backend extraction (no longer needed),
        // override any backend-stored pageUrl, and lock in the clean CDN URL.
        if (backendExtractTimerRef.current) { clearTimeout(backendExtractTimerRef.current); backendExtractTimerRef.current = null; }
        cleanUrlFoundRef.current = true;
        backendFoundVideoRef.current = true;
        detectedUrlRef.current = '';
        setDetectedMediaOnce(normalized);
      } else if (!backendFoundVideoRef.current) {
        setDetectedMediaOnce(normalized);
      }
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
