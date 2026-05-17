import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { useT } from '@i18n/index';

const FEATURE_PREVIEWS = [
  { icon: 'home-outline', text: 'Yaqin atrofdagi xonalar' },
  { icon: 'people-outline', text: "Do'stlar joylashuvi" },
  { icon: 'add-circle-outline', text: 'Yangi xonalar xaritada' },
];

export function MapScreen() {
  const { t } = useT();
  const { colors } = useTheme();
  const styles = useStyles();

  // Breathing animation: scale 1 → 1.08 → 1 loop
  const breathAnim = useRef(new Animated.Value(1)).current;
  // Entrance animations
  const iconEntrance = useRef(new Animated.Value(0)).current;
  const textEntrance = useRef(new Animated.Value(0)).current;
  const featuresEntrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance stagger
    Animated.stagger(80, [
      Animated.spring(iconEntrance, { toValue: 1, useNativeDriver: true, tension: 260, friction: 20 }),
      Animated.spring(textEntrance, { toValue: 1, useNativeDriver: true, tension: 260, friction: 20 }),
      Animated.spring(featuresEntrance, { toValue: 1, useNativeDriver: true, tension: 260, friction: 20 }),
    ]).start();

    // Breathing loop
    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    breathLoop.start();
    return () => breathLoop.stop();
  }, []);

  return (
    <View style={styles.container}>
      {/* Glowing icon circle */}
      <Animated.View
        style={[
          styles.iconOuter,
          {
            opacity: iconEntrance,
            transform: [
              { scale: Animated.multiply(iconEntrance.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }), breathAnim) },
            ],
          },
        ]}
      >
        <View style={styles.iconGlow} />
        <View style={styles.iconCircle}>
          <Ionicons name="map-outline" size={48} color={colors.primary} />
        </View>
      </Animated.View>

      {/* Title & subtitle */}
      <Animated.View
        style={[
          styles.textBlock,
          {
            opacity: textEntrance,
            transform: [{ translateY: textEntrance.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          },
        ]}
      >
        <Text style={styles.title}>{t('tabs', 'map')}</Text>
        <Text style={styles.sub}>{t('common', 'comingSoon')}</Text>
      </Animated.View>

      {/* Feature preview list */}
      <Animated.View
        style={[
          styles.featureList,
          {
            opacity: featuresEntrance,
            transform: [{ translateY: featuresEntrance.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          },
        ]}
      >
        {FEATURE_PREVIEWS.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={styles.featureBullet}>
              <Ionicons name={f.icon as keyof typeof Ionicons.glyphMap} size={14} color={colors.primary} />
            </View>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.xxxl,
  },
  iconOuter: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    position: 'absolute' as const,
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '18',
    borderWidth: 1,
    borderColor: colors.primary + '35',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '25',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary + '60',
  },
  textBlock: { alignItems: 'center', gap: spacing.sm },
  title: { ...typography.h1, color: colors.textPrimary, textAlign: 'center' },
  sub: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  featureList: {
    width: '100%',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: spacing.md,
  },
  featureBullet: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '30',
    flexShrink: 0,
  },
  featureText: { ...typography.body, color: colors.textSecondary, flex: 1 },
}));
