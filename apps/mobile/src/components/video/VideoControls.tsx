// CineSync Mobile — Video Controls Overlay (themed + animated)
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, spacing, typography, borderRadius } from '@theme/index';

interface VideoControlsProps {
  title: string;
  isPlaying: boolean;
  isBuffering: boolean;
  isFullscreen: boolean;
  position: number; // ms
  duration: number; // ms
  paddingTop: number;
  paddingBottom: number;
  onBack: () => void;
  onTogglePlay: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onSeek: (e: GestureResponderEvent) => void;
  onSeekBarLayout: (width: number) => void;
  onToggleFullscreen: () => void;
  seekBarWidth: number;
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, '0')}`;
}

export const VideoControls = React.memo(function VideoControls({
  title,
  isPlaying,
  isBuffering,
  isFullscreen,
  position,
  duration,
  paddingTop,
  paddingBottom,
  onBack,
  onTogglePlay,
  onSkipBack,
  onSkipForward,
  onSeek,
  onSeekBarLayout,
  onToggleFullscreen,
  seekBarWidth,
}: VideoControlsProps) {
  const { colors } = useTheme();
  const progressRatio = duration > 0 ? position / duration : 0;

  // Fade in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [fadeAnim]);

  // Play button scale
  const playScale = useRef(new Animated.Value(1)).current;
  const handlePlayPress = () => {
    Animated.sequence([
      Animated.timing(playScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(playScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onTogglePlay();
  };

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim }]}>
      {/* Top gradient + bar */}
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'transparent']}
        style={[s.topBar, { paddingTop }]}
      >
        <TouchableOpacity onPress={onBack} style={s.iconBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={s.titleText} numberOfLines={1}>{title}</Text>
        <TouchableOpacity onPress={onToggleFullscreen} style={s.iconBtn} activeOpacity={0.7}>
          <Ionicons
            name={isFullscreen ? 'contract-outline' : 'expand-outline'}
            size={22}
            color="#fff"
          />
        </TouchableOpacity>
      </LinearGradient>

      {/* Center controls */}
      <View style={s.centerControls}>
        {isBuffering ? (
          <ActivityIndicator color="#fff" size="large" />
        ) : (
          <>
            <TouchableOpacity onPress={onSkipBack} style={s.skipBtn} activeOpacity={0.7}>
              <Ionicons name="play-back" size={28} color="#fff" />
              <Text style={s.skipLabel}>10</Text>
            </TouchableOpacity>
            <Animated.View style={{ transform: [{ scale: playScale }] }}>
              <TouchableOpacity onPress={handlePlayPress} style={s.playBtn} activeOpacity={0.8}>
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={40}
                  color="#fff"
                />
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity onPress={onSkipForward} style={s.skipBtn} activeOpacity={0.7}>
              <Ionicons name="play-forward" size={28} color="#fff" />
              <Text style={s.skipLabel}>10</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Bottom gradient + seek bar */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={[s.bottomBar, { paddingBottom }]}
      >
        <View style={s.timeRow}>
          <Text style={s.timeText}>{formatTime(position)}</Text>
          <Text style={s.timeDuration}>{formatTime(duration)}</Text>
        </View>
        <TouchableOpacity
          activeOpacity={1}
          onPress={onSeek}
          onLayout={(e) => onSeekBarLayout(e.nativeEvent.layout.width)}
          style={s.seekBarTrack}
        >
          <View style={s.seekBarBg} />
          <View style={[s.seekBarFill, { width: `${progressRatio * 100}%`, backgroundColor: colors.primary }]} />
          <View style={[s.seekThumb, { left: progressRatio * seekBarWidth - 7, backgroundColor: colors.primary }]} />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
});

const s = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    flex: 1,
    ...typography.h3,
    textAlign: 'center',
    color: '#fff',
  },
  centerControls: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
  },
  skipBtn: { alignItems: 'center', gap: 2 },
  skipLabel: { ...typography.caption, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  playBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 40,
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    gap: spacing.sm,
  },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { ...typography.caption, color: '#fff', fontWeight: '600' },
  timeDuration: { ...typography.caption, color: 'rgba(255,255,255,0.6)' },
  seekBarTrack: { height: 24, justifyContent: 'center' },
  seekBarBg: {
    position: 'absolute',
    left: 0, right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  seekBarFill: { height: 4, borderRadius: 2 },
  seekThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    top: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
});
