// CineSync Mobile — Auth screen grid background
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const GRID_ROWS = 8;
const GRID_COLS = 6;

interface AuthGridBackgroundProps {
  /** Vertical position multiplier for the accent line (0..1). Default 0.12 */
  accentLinePosition?: number;
  /** Accent line opacity. Default 0.12 */
  accentOpacity?: number;
}

export function AuthGridBackground({
  accentLinePosition = 0.12,
  accentOpacity = 0.12,
}: AuthGridBackgroundProps) {
  return (
    <View style={s.bgGrid}>
      {Array.from({ length: GRID_ROWS }).map((_, i) => (
        <View key={`h${i}`} style={[s.gridLineH, { top: (SCREEN_H / GRID_ROWS) * i }]} />
      ))}
      {Array.from({ length: GRID_COLS }).map((_, i) => (
        <View key={`v${i}`} style={[s.gridLineV, { left: (SCREEN_W / GRID_COLS) * i }]} />
      ))}
      <LinearGradient
        colors={['transparent', `rgba(124,58,237,${accentOpacity})`, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[s.accentLine, { top: SCREEN_H * accentLinePosition }]}
      />
    </View>
  );
}

const LINE_COLOR = 'rgba(255,255,255,0.03)';

const s = StyleSheet.create({
  bgGrid: { ...StyleSheet.absoluteFillObject },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE_COLOR,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: LINE_COLOR,
  },
  accentLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
});
