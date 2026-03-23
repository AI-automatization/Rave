// CineSync Mobile — VideoProgressBar
// Draggable progress bar for WatchParty owner seek
import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import { colors, typography } from '@theme/index';

interface Props {
  currentTime: number;  // seconds
  duration: number;     // seconds
  isOwner: boolean;
  isLive: boolean;
  onSeek: (secs: number) => void;
}

function formatTime(secs: number): string {
  if (!secs || isNaN(secs) || secs < 0) return '0:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VideoProgressBar({ currentTime, duration, isOwner, isLive, onSeek }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);

  const calcTime = useCallback((x: number): number => {
    if (trackWidth <= 0 || duration <= 0) return 0;
    return Math.max(0, Math.min(duration, (x / trackWidth) * duration));
  }, [trackWidth, duration]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isOwner && duration > 0 && !isLive,
      onMoveShouldSetPanResponder: () => isOwner && duration > 0 && !isLive,
      onPanResponderGrant: (e) => {
        setDragging(true);
        setDragTime(calcTime(e.nativeEvent.locationX));
      },
      onPanResponderMove: (e) => {
        setDragTime(calcTime(e.nativeEvent.locationX));
      },
      onPanResponderRelease: (e) => {
        const secs = calcTime(e.nativeEvent.locationX);
        setDragging(false);
        onSeek(secs);
      },
      onPanResponderTerminate: () => setDragging(false),
    }),
  ).current;

  // During drag show dragTime, otherwise show currentTime
  const displayTime = dragging ? dragTime : currentTime;
  const progress = duration > 0 ? Math.min(displayTime / duration, 1) : 0;
  // Pixel-based widths — TypeScript safe, no % string issues
  const fillPx = trackWidth * progress;
  const thumbLeft = fillPx - THUMB_SIZE / 2;

  if (isLive) {
    return (
      <View style={styles.container}>
        <View style={styles.liveTrack}>
          <View style={styles.liveFill} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.time}>{formatTime(displayTime)}</Text>

      <View
        style={styles.trackWrapper}
        onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        {/* Background track */}
        <View style={styles.track} />
        {/* Filled portion */}
        <View style={[styles.fill, { width: fillPx }]} />
        {/* Thumb — only visible for owner */}
        {isOwner && duration > 0 && trackWidth > 0 && (
          <View style={[styles.thumb, { left: thumbLeft }]} />
        )}
      </View>

      <Text style={styles.time}>{formatTime(duration)}</Text>
    </View>
  );
}

const THUMB_SIZE = 14;
const TRACK_H = 3;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    height: 28,
  },
  time: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    minWidth: 40,
    textAlign: 'center',
  },
  trackWrapper: {
    flex: 1,
    height: 28,        // large tap area
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TRACK_H,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: TRACK_H / 2,
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: TRACK_H,
    backgroundColor: colors.primary,
    borderRadius: TRACK_H / 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#fff',
    top: (28 - THUMB_SIZE) / 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  // Live stream — just a solid full bar
  liveTrack: {
    flex: 1,
    height: TRACK_H,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: TRACK_H / 2,
  },
  liveFill: {
    width: '100%',
    height: TRACK_H,
    backgroundColor: colors.error,
    borderRadius: TRACK_H / 2,
  },
});
