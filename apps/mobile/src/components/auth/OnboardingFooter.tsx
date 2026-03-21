// CineSync Mobile — Onboarding bottom section (dots, counter, buttons)
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { useT } from '@i18n/index';
import { SLIDES } from './onboardingSlides';

interface OnboardingFooterProps {
  currentIndex: number;
  accentColor: string;
  onNext: () => void;
  onSkip: () => void;
}

export function OnboardingFooter({
  currentIndex,
  accentColor,
  onNext,
  onSkip,
}: OnboardingFooterProps) {
  const { t } = useT();
  const { colors } = useTheme();
  const styles = useStyles();
  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.bottomSection}>
      {/* Progress dots */}
      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View
            key={s.id}
            style={[
              styles.dot,
              i === currentIndex && [
                styles.dotActive,
                { backgroundColor: accentColor },
              ],
            ]}
          />
        ))}
      </View>

      {/* Step counter */}
      <Text style={styles.stepCounter}>
        {currentIndex + 1}
        <Text style={styles.stepCounterDim}> / {SLIDES.length}</Text>
      </Text>

      {/* Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
          <Text style={styles.skipText}>{t('onboarding', 'skip')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: accentColor }]}
          onPress={onNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextText}>
            {isLast ? t('onboarding', 'start') : t('onboarding', 'next')}
          </Text>
          <Ionicons
            name={isLast ? 'checkmark' : 'arrow-forward'}
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing.xxxl + spacing.md,
    paddingHorizontal: spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.bgMuted,
  },
  dotActive: {
    width: 28,
  },
  stepCounter: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    marginBottom: spacing.xl,
  },
  stepCounterDim: {
    color: colors.textDim,
    fontWeight: '400',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipBtn: {
    padding: spacing.md,
  },
  skipText: {
    ...typography.body,
    color: colors.textMuted,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.full,
    gap: 8,
  },
  nextText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
}));
