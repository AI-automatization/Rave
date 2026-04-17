// CineSync — useWebViewPlayer: WebView state, callbacks, ref imperative handle
import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { StatusBar } from 'react-native';
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
}

type WebViewMessage =
  | { type: 'VIDEO_FOUND' }
  | { type: 'PLAY'; currentTime: number }
  | { type: 'PAUSE'; currentTime: number }
  | { type: 'SEEK'; currentTime: number }
  | { type: 'PROGRESS'; currentTime: number; duration: number }
  | { type: 'POSITION_POLL'; currentTime: number }
  | { type: 'IFRAME_FOUND'; urls: string[] }
  | { type: 'YT_EMBED_ERROR'; code: number };

const POSITION_POLL_INTERVAL_MS = 2000;
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
  { url, youtubeVideoId, htmlContent, htmlBaseUrl, isOwner, referer, onPlay, onPause, onSeek, onProgress }: Props,
) {
  const webviewRef = useRef<WebView>(null);
  const currentTimeMsRef = useRef(0);
  const originalHostRef = useRef(getHostname(url));
  const isPlayingRef = useRef(false);

  const isHtmlMode = !!youtubeVideoId || !!htmlContent;
  const isYouTubeMode = !!youtubeVideoId;

  const injectJs = useMemo(
    () => (isHtmlMode ? 'true;' : buildInjectJs(getAdapter(url))),
    [url, isHtmlMode],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [redirectWarning, setRedirectWarning] = useState<string | null>(null);
  const [ytFallback, setYtFallback] = useState(false);

  const fallbackYtUrl = isYouTubeMode && youtubeVideoId
    ? `https://m.youtube.com/watch?v=${youtubeVideoId}`
    : url;

  useEffect(() => {
    StatusBar.setHidden(true, 'slide');
    return () => StatusBar.setHidden(false, 'slide');
  }, []);

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
  }));

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as WebViewMessage;
      switch (data.type) {
        case 'PLAY':
          currentTimeMsRef.current = data.currentTime * 1000;
          isPlayingRef.current = true;
          if (isOwner) onPlay(data.currentTime);
          break;
        case 'PAUSE':
          currentTimeMsRef.current = data.currentTime * 1000;
          isPlayingRef.current = false;
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
        case 'POSITION_POLL':
          currentTimeMsRef.current = data.currentTime * 1000;
          break;
        case 'IFRAME_FOUND':
          if (!isHtmlMode && data.urls[0]) {
            webviewRef.current?.injectJavaScript(`window.location.href = ${JSON.stringify(data.urls[0])}; true;`);
          }
          break;
        case 'YT_EMBED_ERROR':
          if (data.code === 150 || data.code === 152 || data.code === 101) {
            setYtFallback(true);
            setLoading(true);
          }
          break;
      }
    } catch { /* ignore */ }
  }, [isOwner, isHtmlMode, onPlay, onPause, onSeek, onProgress]);

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
    : isYouTubeMode && !ytFallback
    ? { html: buildYouTubeHtml(youtubeVideoId!), baseUrl: 'https://www.youtube.com' }
    : isYouTubeMode && ytFallback
    ? { uri: fallbackYtUrl }
    : { uri: url, headers: referer ? { Referer: referer } : {} };

  return {
    webviewRef, injectJs, webViewSource,
    loading, error, redirectWarning,
    setLoading, setError,
    handleMessage, handleShouldStartLoad, handleNavigationStateChange, handleRetry,
    setRedirectWarning,
  };
}
