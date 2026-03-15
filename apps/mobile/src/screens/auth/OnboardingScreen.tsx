// CineSync Mobile — Onboarding Screen (modern, visually rich)
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ListRenderItem,
  Animated,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { AuthStackParamList } from '@app-types/index';
import { useT } from '@i18n/index';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

const { width, height } = Dimensions.get('window');

interface Slide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  subtitleKey: string;
  accentColor: string;
  gradientColors: [string, string, string];
  floatingIcons: Array<{
    name: keyof typeof Ionicons.glyphMap;
    size: number;
    top: number;
    left: number;
    opacity: number;
  }>;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'film',
    titleKey: 'slide1Title',
    subtitleKey: 'slide1Sub',
    accentColor: '#7C3AED',
    gradientColors: ['#1a0533', '#0A0A0F', '#0A0A0F'],
    floatingIcons: [
      { name: 'play-circle', size: 28, top: 80, left: 40, opacity: 0.12 },
      { name: 'videocam', size: 22, top: 120, left: width - 70, opacity: 0.1 },
      { name: 'tv', size: 20, top: 200, left: 60, opacity: 0.08 },
      { name: 'film-outline', size: 32, top: 160, left: width - 100, opacity: 0.06 },
      { name: 'star', size: 16, top: 100, left: width / 2 + 50, opacity: 0.1 },
    ],
  },
  {
    id: '2',
    icon: 'people',
    titleKey: 'slide2Title',
    subtitleKey: 'slide2Sub',
    accentColor: '#3B82F6',
    gradientColors: ['#0c1a33', '#0A0A0F', '#0A0A0F'],
    floatingIcons: [
      { name: 'chatbubbles', size: 26, top: 90, left: 50, opacity: 0.12 },
      { name: 'heart', size: 20, top: 140, left: width - 80, opacity: 0.1 },
      { name: 'happy', size: 24, top: 180, left: 70, opacity: 0.08 },
      { name: 'person-add', size: 22, top: 110, left: width - 60, opacity: 0.1 },
      { name: 'notifications', size: 18, top: 210, left: width / 2 - 30, opacity: 0.06 },
    ],
  },
  {
    id: '3',
    icon: 'trophy',
    titleKey: 'slide3Title',
    subtitleKey: 'slide3Sub',
    accentColor: '#FBBF24',
    gradientColors: ['#1a1500', '#0A0A0F', '#0A0A0F'],
    floatingIcons: [
      { name: 'medal', size: 28, top: 85, left: 45, opacity: 0.12 },
      { name: 'flame', size: 22, top: 150, left: width - 65, opacity: 0.1 },
      { name: 'ribbon', size: 20, top: 200, left: 55, opacity: 0.08 },
      { name: 'shield-checkmark', size: 24, top: 120, left: width - 90, opacity: 0.1 },
      { name: 'star-half', size: 18, top: 170, left: width / 2 + 40, opacity: 0.06 },
    ],
  },
  {
    id: '4',
    icon: 'globe',
    titleKey: 'slide4Title',
    subtitleKey: 'slide4Sub',
    accentColor: '#34D399',
    gradientColors: ['#0a1a15', '#0A0A0F', '#0A0A0F'],
    floatingIcons: [
      { name: 'logo-youtube', size: 26, top: 95, left: 55, opacity: 0.12 },
      { name: 'link', size: 20, top: 140, left: width - 75, opacity: 0.1 },
      { name: 'browsers', size: 24, top: 190, left: 65, opacity: 0.08 },
      { name: 'wifi', size: 20, top: 115, left: width - 55, opacity: 0.1 },
      { name: 'cloud-download', size: 18, top: 220, left: width / 2, opacity: 0.06 },
    ],
  },
  {
    id: '5',
    icon: 'diamond',
    titleKey: 'slide5Title',
    subtitleKey: 'slide5Sub',
    accentColor: '#88CCFF',
    gradientColors: ['#0c1520', '#0A0A0F', '#0A0A0F'],
    floatingIcons: [
      { name: 'trending-up', size: 28, top: 88, left: 48, opacity: 0.12 },
      { name: 'podium', size: 22, top: 155, left: width - 70, opacity: 0.1 },
      { name: 'sparkles', size: 20, top: 195, left: 60, opacity: 0.08 },
      { name: 'analytics', size: 24, top: 125, left: width - 85, opacity: 0.1 },
      { name: 'rocket', size: 18, top: 210, left: width / 2 + 30, opacity: 0.06 },
    ],
  },
];

const ICON_RING_SIZE = 160;
const ICON_SIZE = 72;

export function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useT();
  const flatListRef = useRef<FlatList<Slide>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Animated values for floating icons
  const floatAnim = useRef(new Animated.Value(0)).current;
  // Animated value for icon scale on slide change
  const iconScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [floatAnim]);

  const animateIconPop = useCallback(() => {
    iconScale.setValue(0.7);
    Animated.spring(iconScale, {
      toValue: 1,
      friction: 4,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [iconScale]);

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIdx = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIdx });
      setCurrentIndex(nextIdx);
      animateIconPop();
    } else {
      navigation.replace('Login');
    }
  };

  const handleScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    if (index !== currentIndex && index >= 0 && index < SLIDES.length) {
      setCurrentIndex(index);
      animateIconPop();
    }
  };

  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });

  const renderSlide: ListRenderItem<Slide> = ({ item }) => (
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

  const slide = SLIDES[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled
        onMomentumScrollEnd={handleScroll}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {/* Bottom section */}
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
                  { backgroundColor: slide.accentColor },
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
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => navigation.replace('Login')}
          >
            <Text style={styles.skipText}>{t('onboarding', 'skip')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: slide.accentColor }]}
            onPress={goNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextText}>
              {currentIndex === SLIDES.length - 1
                ? t('onboarding', 'start')
                : t('onboarding', 'next')}
            </Text>
            <Ionicons
              name={
                currentIndex === SLIDES.length - 1
                  ? 'checkmark'
                  : 'arrow-forward'
              }
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  slide: {
    width,
    flex: 1,
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingBottom: 180,
  },
  floatingIcon: {
    position: 'absolute',
  },
  // Triple ring icon container
  iconRingOuter: {
    width: ICON_RING_SIZE + 48,
    height: ICON_RING_SIZE + 48,
    borderRadius: (ICON_RING_SIZE + 48) / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  iconRingMiddle: {
    width: ICON_RING_SIZE + 20,
    height: ICON_RING_SIZE + 20,
    borderRadius: (ICON_RING_SIZE + 20) / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: ICON_RING_SIZE,
    height: ICON_RING_SIZE,
    borderRadius: ICON_RING_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  pill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: 0.5,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
    color: colors.textSecondary,
  },
  // Bottom section
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
});
