// CineSync Mobile — Video Controls Overlay
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@theme/index';

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
  const progressRatio = duration > 0 ? position / duration : 0;

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Top bar */}
      <View style={[s.topBar, { paddingTop }]}>
        <TouchableOpacity onPress={onBack} style={s.iconBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.titleText} numberOfLines={1}>{title}</Text>
        <TouchableOpacity onPress={onToggleFullscreen} style={s.iconBtn}>
          <Ionicons
            name={isFullscreen ? 'contract-outline' : 'expand-outline'}
            size={22}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Center controls */}
      <View style={s.centerControls}>
        {isBuffering ? (
          <ActivityIndicator color={colors.textPrimary} size="large" />
        ) : (
          <>
            <TouchableOpacity onPress={onSkipBack} style={s.skipBtn}>
              <Ionicons name="play-back" size={28} color={colors.textPrimary} />
              <Text style={s.skipLabel}>10</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onTogglePlay} style={s.playBtn}>
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={44}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={onSkipForward} style={s.skipBtn}>
              <Ionicons name="play-forward" size={28} color={colors.textPrimary} />
              <Text style={s.skipLabel}>10</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Bottom bar */}
      <View style={[s.bottomBar, { paddingBottom }]}>
        <View style={s.timeRow}>
          <Text style={s.timeText}>{formatTime(position)}</Text>
          <Text style={s.timeText}>{formatTime(duration)}</Text>
        </View>
        <TouchableOpacity
          activeOpacity={1}
          onPress={onSeek}
          onLayout={(e) => onSeekBarLayout(e.nativeEvent.layout.width)}
          style={s.seekBarTrack}
        >
          <View style={[s.seekBarFill, { width: `${progressRatio * 100}%` }]} />
          <View style={[s.seekThumb, { left: progressRatio * seekBarWidth - 6 }]} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const s = StyleSheet.create({
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
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { ...typography.caption, color: colors.textPrimary },
  seekBarTrack: { height: 20, justifyContent: 'center' },
  seekBarFill: { height: 3, backgroundColor: colors.primary, borderRadius: 2 },
  seekThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    top: 4,
    marginLeft: -6,
  },
});
