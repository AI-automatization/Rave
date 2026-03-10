// CineSync Mobile — Video Player Screen (expo-av)
import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  GestureResponderEvent,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '@theme/index';
import { HomeStackParamList } from '@app-types/index';
import { contentApi } from '@api/content.api';

type Props = NativeStackScreenProps<HomeStackParamList, 'VideoPlayer'>;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const VIDEO_HEIGHT = SCREEN_W * (9 / 16); // 16:9

export function VideoPlayerScreen({ route, navigation }: Props) {
  const { movieId, videoUrl, title } = route.params;
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0); // ms
  const [duration, setDuration] = useState(0); // ms
  const [showControls, setShowControls] = useState(true);
  const [seekBarWidth, setSeekBarWidth] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef(0);
  const completedTriggered = useRef(false);

  // Auto-hide controls
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

      // Throttle: save progress every 30 seconds
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

      // 90% complete → markComplete
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

  const togglePlay = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    showControlsTemporarily();
  };

  const handleSeek = (e: GestureResponderEvent) => {
    if (!duration || !videoRef.current || seekBarWidth <= 1) return;
    const ratio = Math.min(1, Math.max(0, e.nativeEvent.locationX / seekBarWidth));
    videoRef.current.setPositionAsync(ratio * duration);
    showControlsTemporarily();
  };

  const skipSeconds = async (sec: number) => {
    if (!videoRef.current) return;
    const newPos = Math.max(0, Math.min(duration, position + sec * 1000));
    await videoRef.current.setPositionAsync(newPos);
    showControlsTemporarily();
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem.toString().padStart(2, '0')}`;
  };

  const progressRatio = duration > 0 ? position / duration : 0;

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      {/* Video */}
      <TouchableOpacity
        style={styles.videoContainer}
        activeOpacity={1}
        onPress={showControlsTemporarily}
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

        {/* Controls Overlay */}
        {showControls && (
          <View style={StyleSheet.absoluteFillObject}>
            {/* Top bar */}
            <View style={[styles.topBar, { paddingTop: insets.top || spacing.lg }]}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.titleText} numberOfLines={1}>
                {title}
              </Text>
              <View style={styles.iconBtn} />
            </View>

            {/* Center controls */}
            <View style={styles.centerControls}>
              <TouchableOpacity onPress={() => skipSeconds(-10)} style={styles.skipBtn}>
                <Ionicons name="play-back" size={28} color={colors.textPrimary} />
                <Text style={styles.skipLabel}>10</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={togglePlay} style={styles.playBtn}>
                <Ionicons
                  name={isBuffering ? 'hourglass' : isPlaying ? 'pause' : 'play'}
                  size={44}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => skipSeconds(10)} style={styles.skipBtn}>
                <Ionicons name="play-forward" size={28} color={colors.textPrimary} />
                <Text style={styles.skipLabel}>10</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom bar */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom || spacing.lg }]}>
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>

              {/* Seek bar */}
              <TouchableOpacity
                activeOpacity={1}
                onPress={handleSeek}
                onLayout={(e) => setSeekBarWidth(e.nativeEvent.layout.width)}
                style={styles.seekBarTrack}
              >
                <View style={[styles.seekBarFill, { width: `${progressRatio * 100}%` }]} />
                <View
                  style={[
                    styles.seekThumb,
                    { left: `${progressRatio * 100}%` as unknown as number },
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Below video — dark area */}
      <View style={styles.belowVideo}>
        <Text style={styles.belowTitle}>{title}</Text>
      </View>
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
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  iconBtn: { width: 40, alignItems: 'center' },
  titleText: {
    flex: 1,
    ...typography.h3,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  centerControls: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxxl,
  },
  skipBtn: { alignItems: 'center', gap: 2 },
  skipLabel: { ...typography.caption, color: colors.textPrimary },
  playBtn: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: borderRadius.full,
    padding: spacing.lg,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    gap: spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: { ...typography.caption, color: colors.textPrimary },
  seekBarTrack: {
    height: 20,
    justifyContent: 'center',
  },
  seekBarFill: {
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  seekThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    top: 4,
    marginLeft: -6,
  },
  belowVideo: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  belowTitle: { ...typography.h3, color: colors.textPrimary },
});
