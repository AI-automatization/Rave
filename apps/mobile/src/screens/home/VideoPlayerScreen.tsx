// CineSync Mobile — Video Player Screen (expo-av)
import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Dimensions,
  GestureResponderEvent,
  TouchableOpacity,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeStackParamList } from '@app-types/index';
import { contentApi } from '@api/content.api';
import { VideoControls } from '@components/video/VideoControls';

type Props = NativeStackScreenProps<HomeStackParamList, 'VideoPlayer'>;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const DOUBLE_TAP_DELAY = 300; // ms
const SEEK_SECONDS = 10;

export function VideoPlayerScreen({ route, navigation }: Props) {
  const { movieId, videoUrl, title } = route.params;
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [seekBarWidth, setSeekBarWidth] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef(0);
  const completedTriggered = useRef(false);
  const lastTapTime = useRef(0);
  const tapSide = useRef<'left' | 'right' | null>(null);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3500);
  }, []);

  useEffect(() => {
    showControlsTemporarily();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [showControlsTemporarily]);

  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;

      setPosition(status.positionMillis);
      setIsPlaying(status.isPlaying);
      setIsBuffering(status.isBuffering);

      if (status.durationMillis) {
        setDuration(status.durationMillis);
      }

      const now = Date.now();
      if (now - lastSaved.current >= 30_000 && status.durationMillis) {
        lastSaved.current = now;
        contentApi
          .updateProgress(
            movieId,
            Math.floor(status.positionMillis / 1000),
            Math.floor(status.durationMillis / 1000),
          )
          .catch(() => {});
      }

      if (!completedTriggered.current && status.durationMillis) {
        const pct = status.positionMillis / status.durationMillis;
        if (pct >= 0.9) {
          completedTriggered.current = true;
          contentApi.markComplete(movieId).catch(() => {});
        }
      }
    },
    [movieId],
  );

  const togglePlay = useCallback(async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    showControlsTemporarily();
  }, [isPlaying, showControlsTemporarily]);

  const handleSeek = useCallback(
    (e: GestureResponderEvent) => {
      if (!duration || !videoRef.current || seekBarWidth <= 1) return;
      const ratio = Math.min(1, Math.max(0, e.nativeEvent.locationX / seekBarWidth));
      videoRef.current.setPositionAsync(ratio * duration);
      showControlsTemporarily();
    },
    [duration, seekBarWidth, showControlsTemporarily],
  );

  const skipSeconds = useCallback(
    async (sec: number) => {
      if (!videoRef.current) return;
      const newPos = Math.max(0, Math.min(duration, position + sec * 1000));
      await videoRef.current.setPositionAsync(newPos);
      showControlsTemporarily();
    },
    [duration, position, showControlsTemporarily],
  );

  const handleVideoTap = useCallback(
    (e: GestureResponderEvent) => {
      const now = Date.now();
      const x = e.nativeEvent.locationX;
      const screenWidth = Dimensions.get('window').width;
      const side: 'left' | 'right' = x < screenWidth / 2 ? 'left' : 'right';

      if (now - lastTapTime.current < DOUBLE_TAP_DELAY && tapSide.current === side) {
        // Double tap
        skipSeconds(side === 'left' ? -SEEK_SECONDS : SEEK_SECONDS);
        lastTapTime.current = 0;
        tapSide.current = null;
      } else {
        // Single tap
        lastTapTime.current = now;
        tapSide.current = side;
        showControlsTemporarily();
      }
    },
    [skipSeconds, showControlsTemporarily],
  );

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((f) => !f);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      <TouchableOpacity
        style={styles.videoContainer}
        activeOpacity={1}
        onPress={handleVideoTap}
      >
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          shouldPlay
          useNativeControls={false}
        />

        {showControls && (
          <VideoControls
            title={title}
            isPlaying={isPlaying}
            isBuffering={isBuffering}
            isFullscreen={isFullscreen}
            position={position}
            duration={duration}
            paddingTop={insets.top || 16}
            paddingBottom={insets.bottom || 16}
            onBack={() => navigation.goBack()}
            onTogglePlay={togglePlay}
            onSkipBack={() => skipSeconds(-SEEK_SECONDS)}
            onSkipForward={() => skipSeconds(SEEK_SECONDS)}
            onSeek={handleSeek}
            onSeekBarLayout={setSeekBarWidth}
            onToggleFullscreen={toggleFullscreen}
            seekBarWidth={seekBarWidth}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  videoContainer: {
    width: SCREEN_W,
    height: SCREEN_H,
    justifyContent: 'center',
  },
  video: { width: SCREEN_W, height: SCREEN_H },
});
