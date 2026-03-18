// CineSync Mobile — Home Loading Skeleton
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, borderRadius } from '@theme/index';

const { width } = Dimensions.get('window');

function SkeletonBox({ style }: { style: object }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return <Animated.View style={[{ backgroundColor: colors.bgSurface, opacity }, style]} />;
}

export function HomeSkeleton() {
  return (
    <View style={styles.container}>
      {/* Hero */}
      <SkeletonBox style={styles.hero} />

      {/* Row label */}
      <SkeletonBox style={styles.rowLabel} />

      {/* Movie cards row */}
      <View style={styles.cardRow}>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonBox key={i} style={styles.card} />
        ))}
      </View> 

      {/* Row label 2 */}
      <SkeletonBox style={styles.rowLabel} />

      {/* Movie cards row 2 */}
      <View style={styles.cardRow}>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonBox key={i} style={styles.card} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  hero: {
    width,
    height: 280,
    borderRadius: 0,
    marginBottom: spacing.xl,
  },
  rowLabel: {
    height: 18,
    width: 120,
    borderRadius: borderRadius.md,
    marginLeft: spacing.xl,
    marginBottom: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  card: {
    width: 130,
    height: 195,
    borderRadius: borderRadius.lg,
  },
});
