import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Video, { OnProgressData, OnLoadData } from 'react-native-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '@theme/index';
import { contentApi } from '@api/content.api';
import { useMoviesStore } from '@store/movies.store';
import type { HomeStackParams } from '@navigation/types';

type Props = NativeStackScreenProps<HomeStackParams, 'VideoPlayer'>;

const PROGRESS_SAVE_INTERVAL = 30 * 1000; // 30 sec
const COMPLETE_THRESHOLD = 90; // 90%

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VideoPlayerScreen({ navigation, route }: Props) {
  const { movieId, title, videoUrl, startTime = 0 } = route.params;

  const videoRef = useRef<Video>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isCompletedRef = useRef(false);
  // BUG-M011: stale closure oldini olish — doim joriy qiymatlar saqlanadi
  const latestTimeRef = useRef(startTime);
  const latestDurationRef = useRef(0);

  const [paused, setPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [buffering, setBuffering] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimer = useRef<NodeJS.Timeout | null>(null);
  const updateWatchProgress = useMoviesStore((s) => s.updateWatchProgress);

  // Cleanup timers on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };
  }, []);

  const saveProgress = useCallback(
    async (time: number, dur: number) => {
      if (!dur) return;
      const progress = Math.floor((time / dur) * 100);
      try {
        await contentApi.saveProgress(movieId, time, progress);
        updateWatchProgress(movieId, time, progress);
      } catch {
        // silent — progress save is non-critical
      }
    },
    [movieId, updateWatchProgress],
  );

  const handleProgress = useCallback(
    ({ currentTime: ct, seekableDuration }: OnProgressData) => {
      setCurrentTime(ct);
      // BUG-M011: ref ni yangilaymiz — timer callback har doim joriy qiymatni oladi
      latestTimeRef.current = ct;
      latestDurationRef.current = seekableDuration;

      // Debounced save every 30s
      if (!saveTimerRef.current) {
        saveTimerRef.current = setTimeout(() => {
          // Ref dan o'qiymiz — stale closure emas
          saveProgress(latestTimeRef.current, latestDurationRef.current);
          saveTimerRef.current = null;
        }, PROGRESS_SAVE_INTERVAL);
      }

      // 90% completion trigger
      if (!isCompletedRef.current && seekableDuration > 0) {
        const percent = (ct / seekableDuration) * 100;
        if (percent >= COMPLETE_THRESHOLD) {
          isCompletedRef.current = true;
          saveProgress(ct, seekableDuration);
        }
      }
    },
    [saveProgress],
  );

  const handleLoad = ({ duration: d, currentTime: ct }: OnLoadData) => {
    setDuration(d);
    // BUG-M019: startTime mavjud bo'lsa uni ishlatamiz — ikki marta o'rnatishdan saqlanish
    setCurrentTime(startTime > 0 ? startTime : ct);
    setBuffering(false);
    if (startTime > 0) {
      videoRef.current?.seek(startTime);
    }
  };

  const handleEnd = () => {
    saveProgress(duration, duration);
    navigation.goBack();
  };

  const showControls = () => {
    setControlsVisible(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  };

  const togglePlay = () => {
    setPaused((p) => !p);
    showControls();
  };

  const seek = (seconds: number) => {
    videoRef.current?.seek(Math.max(0, currentTime + seconds));
    showControls();
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <Video
        ref={videoRef}
        source={{ uri: videoUrl, type: 'm3u8' }}
        style={styles.video}
        controls={false}
        resizeMode="contain"
        paused={paused}
        onProgress={handleProgress}
        onLoad={handleLoad}
        onEnd={handleEnd}
        onBuffer={({ isBuffering }) => setBuffering(isBuffering)}
        progressUpdateInterval={250}
        repeat={false}
      />

      {/* Buffering indicator */}
      {buffering && (
        <View style={styles.bufferOverlay}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}

      {/* Controls overlay */}
      <TouchableOpacity
        style={styles.controlsOverlay}
        onPress={showControls}
        activeOpacity={1}
      >
        {controlsVisible && (
          <SafeAreaView style={styles.controls} edges={['top', 'bottom']}>
            {/* Top bar */}
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
              <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
              <View style={{ width: 32 }} />
            </View>

            {/* Center controls */}
            <View style={styles.centerControls}>
              <TouchableOpacity onPress={() => seek(-10)} style={styles.seekBtn}>
                <Text style={styles.seekText}>⏪ 10s</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={togglePlay} style={styles.playPauseBtn}>
                <Text style={styles.playPauseIcon}>{paused ? '▶' : '⏸'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => seek(10)} style={styles.seekBtn}>
                <Text style={styles.seekText}>10s ⏩</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom bar: progress */}
            <View style={styles.bottomBar}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </SafeAreaView>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  bufferOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  controls: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backIcon: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: typography.weights.bold,
    padding: spacing.sm,
  },
  titleText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxxl,
  },
  seekBtn: {
    padding: spacing.lg,
  },
  seekText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  playPauseBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(229,9,20,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseIcon: {
    color: colors.textPrimary,
    fontSize: 24,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  timeText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    minWidth: 40,
    textAlign: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
});
