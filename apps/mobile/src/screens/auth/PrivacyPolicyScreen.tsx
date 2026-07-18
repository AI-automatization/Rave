// WeWatch — Privacy Policy Screen
// Shows full legal text; Accept button unlocks only after user scrolls to the bottom.
// "Skip to end" fast-path: scrolls to bottom and immediately enables Accept.
// Rendered as a full-screen overlay by AppNavigator after successful auth.
import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { useT } from '@i18n/index';
import { useTheme } from '@theme/index';
import { privacyPolicyStorage } from '@utils/storage';
import { PRIVACY_POLICY } from '@constants/privacyPolicy';
import { useAuthStore } from '@store/auth.store';

interface Props {
  onAccepted: () => void;
}

const BOTTOM_THRESHOLD = 60; // px from bottom to consider "read"

export function PrivacyPolicyScreen({ onAccepted }: Props) {
  const { t, lang } = useT();
  const { colors } = useTheme();
  const userId = useAuthStore((s) => s.user?._id ?? '');

  const scrollRef = useRef<ScrollView>(null);
  const [hasReadToBottom, setHasReadToBottom] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const buttonAnim = useRef(new Animated.Value(0)).current;

  const activateButton = useCallback(() => {
    if (hasReadToBottom) return;
    setHasReadToBottom(true);
    Animated.spring(buttonAnim, {
      toValue: 1,
      tension: 60,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [hasReadToBottom, buttonAnim]);

  const handleScroll = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (hasReadToBottom) return;
      const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);
      if (distanceFromBottom < BOTTOM_THRESHOLD) activateButton();
    },
    [hasReadToBottom, activateButton],
  );

  const handleSkipToEnd = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
    // Give the scroll animation time, then unlock
    setTimeout(activateButton, 600);
  }, [activateButton]);

  const handleAccept = useCallback(async () => {
    if (!hasReadToBottom || isAccepting) return;
    setIsAccepting(true);
    await privacyPolicyStorage.markAccepted(userId);
    onAccepted();
  }, [hasReadToBottom, isAccepting, userId, onAccepted]);

  const policyText = PRIVACY_POLICY[lang as 'uz' | 'ru' | 'en'] ?? PRIVACY_POLICY.ru;

  const acceptScale = buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] });
  const acceptOpacity = buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgBase} />

      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.title}>{t('privacyPolicy', 'title')}</Text>
        <Text style={s.subtitle}>{t('privacyPolicy', 'subtitle')}</Text>
      </View>

      {/* ── Scroll indicator chip ── */}
      <View style={s.chipRow}>
        <View style={[s.chip, hasReadToBottom && s.chipDone]}>
          <Text style={[s.chipText, hasReadToBottom && s.chipTextDone]}>
            {hasReadToBottom
              ? t('privacyPolicy', 'scrolledHint')
              : t('privacyPolicy', 'scrollHint')}
          </Text>
        </View>
      </View>

      {/* ── Policy text ── */}
      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator
        indicatorStyle="white"
      >
        <Text style={s.policyText}>{policyText}</Text>
        <Text style={s.versionText}>{t('privacyPolicy', 'version')}</Text>
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Bottom actions ── */}
      <View style={s.actions}>
        {!hasReadToBottom && (
          <TrackedTouchable trackId="privacy_policy:skip_to_end" style={s.skipBtn} onPress={handleSkipToEnd} activeOpacity={0.7}>
            <Text style={s.skipText}>{t('privacyPolicy', 'skipToEnd')}</Text>
          </TrackedTouchable>
        )}

        <Animated.View
          style={[
            s.acceptBtnWrap,
            { opacity: acceptOpacity, transform: [{ scale: acceptScale }] },
          ]}
        >
          <TrackedTouchable
            trackId="privacy_policy:accept"
            style={[s.acceptBtn, !hasReadToBottom && s.acceptBtnDisabled]}
            onPress={handleAccept}
            disabled={!hasReadToBottom || isAccepting}
            activeOpacity={0.85}
          >
            <Text style={s.acceptText}>{t('privacyPolicy', 'accept')}</Text>
          </TrackedTouchable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bgBase,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: Platform.OS === 'android' ? 16 : 8,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: 0.3,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textTertiary,
      marginTop: 4,
    },
    chipRow: {
      paddingHorizontal: 24,
      paddingVertical: 10,
    },
    chip: {
      alignSelf: 'flex-start',
      backgroundColor: colors.bgElevated,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipDone: {
      borderColor: colors.success,
      backgroundColor: 'rgba(52,211,153,0.08)',
    },
    chipText: {
      fontSize: 12,
      color: colors.textMuted,
    },
    chipTextDone: {
      color: colors.success,
      fontWeight: '600',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 16,
    },
    policyText: {
      fontSize: 14,
      lineHeight: 24,
      color: colors.textSecondary,
    },
    versionText: {
      fontSize: 11,
      color: colors.textDim,
      marginTop: 24,
      textAlign: 'center',
    },
    actions: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 8 : 20,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.bgBase,
      gap: 10,
    },
    skipBtn: {
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.bgElevated,
    },
    skipText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    acceptBtnWrap: {
      borderRadius: 14,
      overflow: 'hidden',
    },
    acceptBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
    },
    acceptBtnDisabled: {
      backgroundColor: colors.primary,
    },
    acceptText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryContent,
      letterSpacing: 0.3,
    },
  });
}
