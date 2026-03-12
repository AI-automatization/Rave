// CineSync Mobile — UniversalPlayer
// URL ga qarab to'g'ri player tanlaydi: expo-av (direct) yoki WebView (boshqalar)
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { WebViewPlayer, WebViewPlayerRef } from './WebViewPlayer';

export type VideoPlatform = 'direct' | 'webview';

export interface UniversalPlayerRef {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  seekTo: (ms: number) => Promise<void>;
  getPositionMs: () => Promise<number>;
}

interface Props {
  url: string;
  isOwner: boolean;
  onPlay: (currentTimeSecs: number) => void;
  onPause: (currentTimeSecs: number) => void;
  onSeek: (currentTimeSecs: number) => void;
  onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
  onProgress?: (currentTimeSecs: number, durationSecs: number) => void;
}

export function detectVideoPlatform(url: string): VideoPlatform {
  if (!url) return 'direct';
  if (/\.(mp4|m3u8|webm|ogg|mov)(\?.*)?$/i.test(url)) return 'direct';
  return 'webview';
}

export const UniversalPlayer = forwardRef<UniversalPlayerRef, Props>(
  ({ url, isOwner, onPlay, onPause, onSeek, onPlaybackStatusUpdate, onProgress }, ref) => {
    const videoRef = useRef<Video>(null);
    const webviewRef = useRef<WebViewPlayerRef>(null);
    const platform = detectVideoPlatform(url);

    useImperativeHandle(ref, () => ({
      play: async () => {
        if (platform === 'webview') {
          webviewRef.current?.play();
        } else {
          await videoRef.current?.playAsync();
        }
      },
      pause: async () => {
        if (platform === 'webview') {
          webviewRef.current?.pause();
        } else {
          await videoRef.current?.pauseAsync();
        }
      },
      seekTo: async (ms: number) => {
        if (platform === 'webview') {
          webviewRef.current?.seekTo(ms);
        } else {
          await videoRef.current?.setPositionAsync(ms);
        }
      },
      getPositionMs: async () => {
        if (platform === 'webview') {
          return webviewRef.current?.getPositionMs() ?? 0;
        }
        const status = await videoRef.current?.getStatusAsync();
        if (status?.isLoaded) return status.positionMillis;
        return 0;
      },
    }));

    if (platform === 'webview') {
      return (
        <WebViewPlayer
          ref={webviewRef}
          url={url}
          isOwner={isOwner}
          onPlay={onPlay}
          onPause={onPause}
          onSeek={onSeek}
          onProgress={onProgress}
        />
      );
    }

    return (
      <Video
        ref={videoRef}
        source={url ? { uri: url } : undefined}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        useNativeControls={false}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
      />
    );
  },
);

const styles = StyleSheet.create({
  video: { flex: 1 },
});
