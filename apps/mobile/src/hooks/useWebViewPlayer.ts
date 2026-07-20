// WeWatch — useWebViewPlayer: WebView state, callbacks, ref imperative handle
import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import WebView from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import type { ShouldStartLoadRequest, WebViewNavigation } from 'react-native-webview/lib/WebViewTypes';
import { useImperativeHandle } from 'react';
import { getAdapter, buildInjectJs } from '@components/video/WebViewAdapters';
import { isAdRequest, getHostname } from '@components/video/webviewAdBlocker';
import { buildYouTubeHtml } from '@components/video/webviewYouTube';
import type { WebViewPlayerRef } from '@components/video/WebViewPlayer';

interface Props {
  url: string;
  youtubeVideoId?: string;
  htmlContent?: string;
  htmlBaseUrl?: string;
  isOwner: boolean;
  referer?: string;
  onPlay: (secs: number) => void;
  onPause: (secs: number) => void;
  onSeek: (secs: number) => void;
  onProgress?: (secs: number, dur: number) => void;
  onBuffering?: (isBuffering: boolean) => void;
  onVideoFound?: () => void;
}

type WebViewMessage =
  | { type: 'VIDEO_FOUND' }
  | { type: 'PLAY'; currentTime: number }
  | { type: 'PAUSE'; currentTime: number }
  | { type: 'SEEK'; currentTime: number }
  | { type: 'PROGRESS'; currentTime: number; duration: number }
  | { type: 'POSITION_POLL'; currentTime: number }
  | { type: 'BUFFERING'; isBuffering: boolean }
  | { type: 'IFRAME_FOUND'; urls: string[] }
  | { type: 'YT_EMBED_ERROR'; code: number };

// 500ms: heartbeat fires every 5s; with 2s polling the position sent by the owner
// could be ~2s stale → members see that as drift and seek unnecessarily.
const POSITION_POLL_INTERVAL_MS = 500;
// Android WebView is slower to bootstrap; give it extra time before showing error.
const LOAD_TIMEOUT_MS = Platform.OS === 'android' ? 12000 : 8000;
// URL-mode (Android VK/Rutube "full-site" — the real webpage loads directly, isHtmlMode=false)
// relies purely on native onLoadEnd/onError/onHttpError with no app-level timeout at all — a
// heavy SPA that keeps making background XHR/tracker requests can leave onLoadEnd unfired
// forever, stranding the user on the loading overlay with no way out. Longer than
// LOAD_TIMEOUT_MS since a full real webpage genuinely takes longer than a lightweight embed.
const URL_MODE_LOAD_TIMEOUT_MS = Platform.OS === 'android' ? 18000 : 12000;
const POSITION_POLL_JS = `
  if(window._csVideo && !window._csVideo.paused){
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type:'POSITION_POLL',
      currentTime:window._csVideo.currentTime
    }));
  }
  true;
`;

export function useWebViewPlayer(
  imperativeRef: React.Ref<WebViewPlayerRef>,
  { url, youtubeVideoId, htmlContent, htmlBaseUrl, isOwner, referer, onPlay, onPause, onSeek, onProgress, onBuffering, onVideoFound }: Props,
) {
  const webviewRef = useRef<WebView>(null);
  const currentTimeMsRef = useRef(0);
  const originalHostRef = useRef(getHostname(url));
  const isPlayingRef = useRef(false);

  const isHtmlMode = !!youtubeVideoId || !!htmlContent;
  const isYouTubeMode = !!youtubeVideoId;
  // true after first message from WebView — used to gate load timeout
  const receivedFirstMessageRef = useRef(false);

  const injectJs = useMemo(
    () => (isHtmlMode ? 'true;' : buildInjectJs(getAdapter(url))),
    [url, isHtmlMode],
  );

  // Inline HTML (YouTube embed, custom html) loads instantly — no loading overlay needed.
  // URL-based sources need the overlay until onLoadEnd fires.
  const [loading, setLoading] = useState(!isHtmlMode);
  const [error, setError] = useState(false);
  const [redirectWarning, setRedirectWarning] = useState<string | null>(null);
  const [ytEmbedBlocked, setYtEmbedBlocked] = useState(false);

  useEffect(() => {
    StatusBar.setHidden(true, 'slide');
    return () => StatusBar.setHidden(false, 'slide');
  }, []);

  // Load timeout: if WebView sends no message within LOAD_TIMEOUT_MS → show error.
  // Catches Android WebView silent failures where IFrame API loads but never fires onReady.
  useEffect(() => {
    if (!isHtmlMode) return; // URL-mode uses its own timeout below
    receivedFirstMessageRef.current = false;
    const timer = setTimeout(() => {
      if (!receivedFirstMessageRef.current) setError(true);
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isHtmlMode, youtubeVideoId, htmlContent]); // re-arm when video changes

  // URL-mode load timeout (Android VK/Rutube full-site): native onLoadEnd/onError/onHttpError
  // alone left this stuck on the loading overlay forever when a heavy real webpage never signals
  // "finished" (see URL_MODE_LOAD_TIMEOUT_MS comment). If our injected adapter already found and
  // attached to a <video> element (receivedFirstMessageRef set by ANY webview message, including
  // VIDEO_FOUND), the page is actually usable — just dismiss the overlay. Otherwise show the
  // existing error/retry UI instead of an unexplained infinite spinner.
  useEffect(() => {
    if (isHtmlMode) return;
    receivedFirstMessageRef.current = false;
    const timer = setTimeout(() => {
      setLoading((stillLoading) => {
        if (!stillLoading) return stillLoading;
        if (receivedFirstMessageRef.current) return false;
        setError(true);
        return stillLoading;
      });
    }, URL_MODE_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isHtmlMode, url]); // re-arm when video changes

  // T-E100: Periodic position polling — real currentTime from WebView every 2s
  useEffect(() => {
    const id = setInterval(() => {
      if (isPlayingRef.current) {
        webviewRef.current?.injectJavaScript(POSITION_POLL_JS);
      }
    }, POSITION_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const injectWithRetry = useCallback((js: string) => {
    const wrapped = `if(window._csVideo){${js}}else{setTimeout(function(){if(window._csVideo){${js}}},500);} true;`;
    webviewRef.current?.injectJavaScript(wrapped);
  }, []);

  useImperativeHandle(imperativeRef, () => ({
    play: () => injectWithRetry('window._csVideo.play();'),
    pause: () => injectWithRetry('window._csVideo.pause();'),
    seekTo: (ms: number) => {
      injectWithRetry(`window._csVideo.currentTime=${ms / 1000};`);
      currentTimeMsRef.current = ms;
    },
    getPositionMs: () => currentTimeMsRef.current,
    setRate: (rate: number) => injectWithRetry(`window._csVideo.playbackRate=${rate};`),
  }));

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    receivedFirstMessageRef.current = true;
    try {
      const data = JSON.parse(event.nativeEvent.data) as WebViewMessage;
      switch (data.type) {
        case 'VIDEO_FOUND':
          // Fires as soon as the underlying player object exists (e.g. YouTube IFrame API's own
          // onReady) — well before autoplay/PLAYING is confirmed. A viewer's readiness gate that
          // waited for the first PLAY message instead deadlocked whenever WebView autoplay
          // silently failed (common, no prior user gesture): playerReady never flipped true, so
          // every incoming owner play/pause/seek was swallowed forever (T-S136).
          onVideoFound?.();
          break;
        case 'PLAY':
          currentTimeMsRef.current = data.currentTime * 1000;
          isPlayingRef.current = true;
          onPlay(data.currentTime);
          break;
        case 'PAUSE':
          currentTimeMsRef.current = data.currentTime * 1000;
          isPlayingRef.current = false;
          onPause(data.currentTime);
          break;
        case 'SEEK':
          currentTimeMsRef.current = data.currentTime * 1000;
          if (isOwner) onSeek(data.currentTime);
          break;
        case 'PROGRESS':
          currentTimeMsRef.current = data.currentTime * 1000;
          onProgress?.(data.currentTime, data.duration);
          break;
        case 'POSITION_POLL':
          currentTimeMsRef.current = data.currentTime * 1000;
          break;
        case 'BUFFERING':
          onBuffering?.(data.isBuffering);
          break;
        case 'IFRAME_FOUND':
          if (!isHtmlMode && data.urls[0]) {
            webviewRef.current?.injectJavaScript(`window.location.href = ${JSON.stringify(data.urls[0])}; true;`);
          }
          break;
        case 'YT_EMBED_ERROR':
          // Any YouTube playback error now shows the "can't extract, try another" fallback —
          // previously only 101/150/152 (owner disabled embedding) did, silently leaving codes
          // 2 (invalid id) / 5 (html5 player error) / 100 (removed or private) as a permanent
          // black screen with no spinner and no way out (loading starts false for html mode,
          // see LOAD_TIMEOUT_MS comment above). Code -1 is our own synthetic code (webviewYouTube.ts)
          // for when the iframe_api script itself fails to load or never calls
          // onYouTubeIframeAPIReady within 8s — that case used to rely purely on the outer 12s
          // LOAD_TIMEOUT_MS with zero explanation; this makes it immediate and explicit.
          // We deliberately do NOT attempt any workaround (e.g. spoofing the official YouTube
          // app's API) here: that's a Play Store ToS-circumvention risk on Google's own
          // platform (see T-S123).
          setLoading(false);
          setYtEmbedBlocked(true);
          break;
      }
    } catch { /* ignore */ }
  }, [isOwner, isHtmlMode, onPlay, onPause, onSeek, onProgress, onBuffering, onVideoFound]);

  const handleShouldStartLoad = useCallback((request: ShouldStartLoadRequest): boolean => {
    try {
      const scheme = request.url.split(':')[0].toLowerCase();
      if (scheme !== 'http' && scheme !== 'https' && scheme !== 'blob' && scheme !== 'data') return false;
    } catch { return false; }
    return !isAdRequest(request.url);
  }, []);

  const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    if (isHtmlMode || !navState.url || !isOwner) return;
    const newHost = getHostname(navState.url);
    if (newHost && newHost !== originalHostRef.current) setRedirectWarning(newHost);
  }, [isHtmlMode, isOwner]);

  const handleRetry = useCallback(() => {
    setError(false);
    setLoading(true);
    setRedirectWarning(null);
    webviewRef.current?.reload();
  }, []);

  const webViewSource = htmlContent
    ? { html: htmlContent, baseUrl: htmlBaseUrl ?? 'about:blank' }
    : isYouTubeMode
    // baseUrl must NOT be youtube.com itself — the WebView's effective Referer becomes
    // this origin, and YouTube's embed endpoint now rejects that as an impossible/spoofed
    // embedder identity (PLAYABILITY_ERROR_CODE_EMBEDDER_IDENTITY_DENIED), failing EVERY
    // video regardless of its real per-video embedding setting. Our own domain works fine.
    ? { html: buildYouTubeHtml(youtubeVideoId!), baseUrl: 'https://wewatch.uz' }
    : { uri: url, headers: referer ? { Referer: referer } : {} };

  return {
    webviewRef, injectJs, webViewSource,
    loading, error, redirectWarning, ytEmbedBlocked,
    youtubeVideoId,
    setLoading, setError,
    handleMessage, handleShouldStartLoad, handleNavigationStateChange, handleRetry,
    setRedirectWarning,
  };
}
