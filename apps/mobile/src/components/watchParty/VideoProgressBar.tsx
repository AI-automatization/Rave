// CineSync Mobile — VideoProgressBar
import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import { colors, typography } from '@theme/index';

interface Props {
  currentTime: number;
  duration: number;
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

  const trackWidthRef = useRef(0);
  const durationRef = useRef(duration);
  const isOwnerRef = useRef(isOwner);
  const isLiveRef = useRef(isLive);
  const onSeekRef = useRef(onSeek);
  durationRef.current = duration;
  isOwnerRef.current = isOwner;
  isLiveRef.current = isLive;
  onSeekRef.current = onSeek;

  const calcTime = useCallback((x: number): number => {
    if (trackWidthRef.current <= 0 || durationRef.current <= 0) return 0;
    return Math.max(0, Math.min(durationRef.current, (x / trackWidthRef.current) * durationRef.current));
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isOwnerRef.current && durationRef.current > 0 && !isLiveRef.current,
      onMoveShouldSetPanResponder: () => isOwnerRef.current && durationRef.current > 0 && !isLiveRef.current,
      onPanResponderGrant: (e) => {
        setDragging(true);
        setDragTime(calcTime(e.nativeEvent.locationX));
      },
      onPanResponderMove: (e) => setDragTime(calcTime(e.nativeEvent.locationX)),
      onPanResponderRelease: (e) => {
        const secs = calcTime(e.nativeEvent.locationX);
        setDragging(false);
        onSeekRef.current(secs);
      },
      onPanResponderTerminate: () => setDragging(false),
    }),
  ).current;

  const displayTime = dragging ? dragTime : currentTime;
  const progress = duration > 0 ? Math.min(displayTime / duration, 1) : 0;
  const fillPx = trackWidth * progress;
  const thumbSize = dragging ? THUMB_SIZE_DRAG : THUMB_SIZE;
  const thumbLeft = fillPx - thumbSize / 2;

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
        onLayout={e => { const w = e.nativeEvent.layout.width; trackWidthRef.current = w; setTrackWidth(w); }}
        {...panResponder.panHandlers}
      >
        <View style={styles.track} />
        <View style={[styles.fill, { width: fillPx }]} />
        {isOwner && duration > 0 && trackWidth > 0 && (
          <View style={[
            styles.thumb,
            { left: thumbLeft, width: thumbSize, height: thumbSize, borderRadius: thumbSize / 2, top: (TOUCH_H - thumbSize) / 2 },
            dragging && styles.thumbDragging,
          ]} />
        )}
      </View>

      <Text style={styles.time}>{formatTime(duration)}</Text>
    </View>
  );
}

const THUMB_SIZE = 14;
const THUMB_SIZE_DRAG = 20;
const TRACK_H = 4;
const TOUCH_H = 32;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    height: TOUCH_H,
  },
  time: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    minWidth: 42,
    textAlign: 'center',
  },
  trackWrapper: {
    flex: 1,
    height: TOUCH_H,
    justifyContent: 'center',
  },
  track: {
    position: 'absolute', left: 0, right: 0,
    height: TRACK_H,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: TRACK_H / 2,
  },
  fill: {
    position: 'absolute', left: 0,
    height: TRACK_H,
    backgroundColor: colors.primary,
    borderRadius: TRACK_H / 2,
  },
  thumb: {
    position: 'absolute',
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  thumbDragging: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  liveTrack: {
    flex: 1, height: TRACK_H,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: TRACK_H / 2,
  },
  liveFill: {
    width: '100%', height: TRACK_H,
    backgroundColor: colors.error,
    borderRadius: TRACK_H / 2,
  },
});
