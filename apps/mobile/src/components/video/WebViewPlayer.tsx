// CineSync Mobile — WebViewPlayer
// react-native-webview asosida har qanday saytdan video o'ynatish
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { colors, spacing, typography } from '@theme/index';

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
}

type WebViewMessage =
  | { type: 'VIDEO_FOUND' }
  | { type: 'PLAY'; currentTime: number }
  | { type: 'PAUSE'; currentTime: number }
  | { type: 'SEEK'; currentTime: number }
  | { type: 'PROGRESS'; currentTime: number; duration: number }
  | { type: 'IFRAME_FOUND'; urls: string[] };

// Sahifaga inject qilinadigan JS:
// 1. <video> element paydo bo'lishini MutationObserver bilan kutadi
// 2. play/pause/seeked eventlarini postMessage orqali RN ga yuboradi
// 3. Har 2 sekundda progress yuboradi
// 4. window._csVideo orqali RN dan boshqarish mumkin bo'ladi
const INJECT_JS = `
(function() {
  if (window._csVideoSetup) return;
  window._csVideoSetup = true;

  function rn(obj) {
    window.ReactNativeWebView.postMessage(JSON.stringify(obj));
  }

  function attachVideo(v) {
    if (window._csVideo === v) return;
    window._csVideo = v;

    v.addEventListener('play', function() {
      rn({ type: 'PLAY', currentTime: v.currentTime });
    });
    v.addEventListener('pause', function() {
      rn({ type: 'PAUSE', currentTime: v.currentTime });
    });
    v.addEventListener('seeked', function() {
      rn({ type: 'SEEK', currentTime: v.currentTime });
    });

    if (window._csProgressInterval) clearInterval(window._csProgressInterval);
    window._csProgressInterval = setInterval(function() {
      if (window._csVideo && !window._csVideo.paused) {
        rn({ type: 'PROGRESS', currentTime: window._csVideo.currentTime, duration: window._csVideo.duration || 0 });
      }
    }, 2000);

    rn({ type: 'VIDEO_FOUND' });
  }

  function scan() {
    var v = document.querySelector('video');
    if (v) { attachVideo(v); return; }

    var iframes = document.querySelectorAll('iframe');
    var urls = [];
    for (var i = 0; i < iframes.length; i++) {
      if (iframes[i].src && iframes[i].src.indexOf('http') === 0) {
        urls.push(iframes[i].src);
      }
    }
    if (urls.length) rn({ type: 'IFRAME_FOUND', urls: urls });
  }

  var obs = new MutationObserver(scan);
  obs.observe(document.documentElement, { childList: true, subtree: true });
  scan();
  setTimeout(scan, 1500);
  setTimeout(scan, 4000);
})();
true;
`;

export const WebViewPlayer = forwardRef<WebViewPlayerRef, Props>(
  ({ url, isOwner, onPlay, onPause, onSeek, onProgress }, ref) => {
    const webviewRef = useRef<WebView>(null);
    const currentTimeMsRef = useRef(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

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

    const handleMessage = (event: WebViewMessageEvent) => {
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
    };

    return (
      <View style={styles.container}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Yuklanmoqda...</Text>
          </View>
        )}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Sayt yuklanmadi</Text>
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
            injectedJavaScript={INJECT_JS}
            onMessage={handleMessage}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
            allowsFullscreenVideo
          />
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1 },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    zIndex: 10,
  },
  loadingText: { ...typography.body, color: colors.textSecondary },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: { ...typography.body, color: colors.error },
});
