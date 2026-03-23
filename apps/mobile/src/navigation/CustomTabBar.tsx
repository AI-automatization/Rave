// CineSync Mobile — Glassmorphism Tab Bar
import React, { useEffect, useRef, useCallback } from 'react';
import { View, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, createThemedStyles } from '@theme/index';
import { MainTabParamList, RootStackParamList } from '@app-types/index';
import { useT } from '@i18n/index';

// ─── Tab config ───────────────────────────────────────────────────────────────
type TabEntry = {
  name: keyof MainTabParamList;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  labelKey: string;
};

export const TABS: TabEntry[] = [
  { name: 'HomeTab',    icon: 'home-outline',   iconActive: 'home',   labelKey: 'home' },
  { name: 'RoomsTab',   icon: 'tv-outline',     iconActive: 'tv',     labelKey: 'rooms' },
  { name: 'FriendsTab', icon: 'people-outline', iconActive: 'people', labelKey: 'friends' },
  { name: 'ProfileTab', icon: 'person-outline', iconActive: 'person', labelKey: 'profile' },
];

const BAR_HEIGHT = 60;
const FAB_SIZE = 54;
const INDICATOR_WIDTH = 24;
const INDICATOR_HEIGHT = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;
const SLOT_WIDTH = SCREEN_WIDTH / 5;

/** Map tab array index (0-3) to navigation state index (0,1 skip FAB=2, then 3,4) */
function getVisibleTabIndex(arrayIndex: number): number {
  return arrayIndex < 2 ? arrayIndex : arrayIndex + 1;
}

/** Calculate indicator X from navigation state index (5 slots including FAB) */
function getIndicatorX(stateIndex: number): number {
  return stateIndex * SLOT_WIDTH + (SLOT_WIDTH - INDICATOR_WIDTH) / 2;
}

// ─── Custom Tab Bar ───────────────────────────────────────────────────────────
export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useT();
  const { colors } = useTheme();
  const styles = useStyles();

  const indicatorX = useRef(new Animated.Value(getIndicatorX(state.index))).current;
  const bounceAnims = useRef(TABS.map(() => new Animated.Value(1))).current;
  const labelAnims = useRef(
    TABS.map((_, i) => new Animated.Value(state.index === getVisibleTabIndex(i) ? 1 : 0))
  ).current;
  const fabPulse = useRef(new Animated.Value(1)).current;

  // FAB pulsing glow loop
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fabPulse, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
        Animated.timing(fabPulse, { toValue: 1.0, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [fabPulse]);

  // Animate indicator + labels on tab change
  useEffect(() => {
    Animated.spring(indicatorX, {
      toValue: getIndicatorX(state.index),
      useNativeDriver: true,
      friction: 7,
      tension: 80,
    }).start();

    TABS.forEach((_, i) => {
      Animated.timing(labelAnims[i], {
        toValue: state.index === getVisibleTabIndex(i) ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [state.index, indicatorX, labelAnims]);

  const handleTabPress = useCallback(
    (tabName: keyof MainTabParamList, arrayIdx: number) => {
      const anim = bounceAnims[arrayIdx];
      Animated.sequence([
        Animated.spring(anim, { toValue: 0.85, useNativeDriver: true, friction: 5, tension: 200 }),
        Animated.spring(anim, { toValue: 1.05, useNativeDriver: true, friction: 5, tension: 200 }),
        Animated.spring(anim, { toValue: 1.0, useNativeDriver: true, friction: 5, tension: 200 }),
      ]).start();
      navigation.navigate(tabName);
    },
    [bounceAnims, navigation],
  );

  const renderTab = (tab: TabEntry, arrayIndex: number) => {
    const focused = state.index === getVisibleTabIndex(arrayIndex);
    const iconColor = focused ? colors.primary : colors.textMuted;

    return (
      <TouchableOpacity
        key={tab.name}
        style={styles.tabItem}
        onPress={() => handleTabPress(tab.name, arrayIndex)}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[
            focused ? styles.activeIconGlow : undefined,
            { transform: [{ scale: bounceAnims[arrayIndex] }] },
          ]}
        >
          <Ionicons name={focused ? tab.iconActive : tab.icon} size={24} color={iconColor} />
        </Animated.View>
        <Animated.Text
          style={[styles.label, { color: iconColor, opacity: labelAnims[arrayIndex] }]}
          numberOfLines={1}
        >
          {t('tabs', tab.labelKey)}
        </Animated.Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Glassmorphism background */}
      <BlurView intensity={40} tint="dark" style={styles.blurFill}>
        <View style={styles.barOverlay}>
          {/* Active tab indicator line */}
          <Animated.View
            style={[styles.indicator, { transform: [{ translateX: indicatorX }] }]}
          />
          {/* Tab row */}
          <View style={styles.bar}>
            {TABS.slice(0, 2).map((tab, i) => renderTab(tab, i))}
            <View style={styles.fabPlaceholder} />
            {TABS.slice(2).map((tab, i) => renderTab(tab, i + 2))}
          </View>
        </View>
      </BlurView>

      {/* Floating "+" button with gradient + pulse */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => rootNav.navigate('Modal', { screen: 'SourcePicker', params: { context: 'new_room' } })}
        activeOpacity={0.85}
      >
        <Animated.View style={[styles.fabShadowWrap, { transform: [{ scale: fabPulse }] }]}>
          <LinearGradient
            colors={[colors.primary, '#9333EA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabInner}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const useStyles = createThemedStyles((colors) => ({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bgElevated,
  },
  blurFill: {
    overflow: 'hidden',
  },
  barOverlay: {
    backgroundColor: 'rgba(17,17,24,0.65)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(124,58,237,0.3)',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: INDICATOR_WIDTH,
    height: INDICATOR_HEIGHT,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  bar: {
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 4,
    gap: 3,
  },
  activeIconGlow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    shadowOpacity: 0.4,
    elevation: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
  fabPlaceholder: {
    width: FAB_SIZE + 16,
  },
  fab: {
    position: 'absolute',
    top: -(FAB_SIZE / 2) + 10,
    alignSelf: 'center',
    zIndex: 10,
  },
  fabShadowWrap: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    shadowOpacity: 0.5,
    elevation: 12,
  },
  fabInner: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bgBase,
  },
}));
