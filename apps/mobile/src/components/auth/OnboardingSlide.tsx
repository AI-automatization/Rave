// CineSync Mobile — Single onboarding slide component
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@theme/index';
import { useT } from '@i18n/index';
import type { Slide } from './onboardingSlides';
import { ICON_SIZE } from './onboardingSlides';
import { styles } from './OnboardingSlide.styles';

interface OnboardingSlideProps {
  item: Slide;
  floatAnim: Animated.Value;
  iconScale: Animated.Value;
  floatTranslate: Animated.AnimatedInterpolation<number>;
}

export function OnboardingSlide({
  item,
  floatAnim,
  iconScale,
  floatTranslate,
}: OnboardingSlideProps) {
  const { t } = useT();

  return (
    <View style={styles.slide}>
      <LinearGradient
        colors={item.gradientColors}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />

      {/* Floating background icons */}
      {item.floatingIcons.map((fi, idx) => (
        <Animated.View
          key={idx}
          style={[
            styles.floatingIcon,
            {
              top: fi.top,
              left: fi.left,
              opacity: fi.opacity,
              transform: [
                {
                  translateY: floatAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, idx % 2 === 0 ? 10 : -10],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons name={fi.name} size={fi.size} color={item.accentColor} />
        </Animated.View>
      ))}

      {/* Main content */}
      <View style={styles.slideContent}>
        {/* Glowing icon ring */}
        <Animated.View
          style={[
            styles.iconRingOuter,
            {
              borderColor: item.accentColor + '15',
              transform: [
                { scale: iconScale },
                { translateY: floatTranslate },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.iconRingMiddle,
              { borderColor: item.accentColor + '25' },
            ]}
          >
            <LinearGradient
              colors={[item.accentColor + '20', item.accentColor + '08']}
              style={styles.iconCircle}
            >
              <Ionicons name={item.icon} size={ICON_SIZE} color={item.accentColor} />
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Feature pills */}
        <View style={styles.pillRow}>
          {item.floatingIcons.slice(0, 3).map((fi, idx) => (
            <View
              key={idx}
              style={[styles.pill, { borderColor: item.accentColor + '30' }]}
            >
              <Ionicons name={fi.name} size={14} color={item.accentColor} />
            </View>
          ))}
        </View>

        {/* Text */}
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t('onboarding', item.titleKey)}
        </Text>
        <Text style={styles.subtitle}>
          {t('onboarding', item.subtitleKey)}
        </Text>
      </View>
    </View>
  );
}
