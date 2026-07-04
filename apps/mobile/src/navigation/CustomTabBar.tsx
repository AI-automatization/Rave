// WeWatch Mobile — Glassmorphism Tab Bar
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
  { name: 'FriendsTab', icon: 'people-outline', iconActive: 'people', labelKey: 'friends' },
  { name: 'ProfileTab', icon: 'person-outline', iconActive: 'person', labelKey: 'profile' },
];

const BAR_HEIGHT = 60;
const FAB_SIZE = 54;
const INDICATOR_WIDTH = 24;
const INDICATOR_HEIGHT = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;

/** Map tab array index (0-2) to navigation state index (0, skip FAB=1, then 2,3) */
function getVisibleTabIndex(arrayIndex: number): number {
  return arrayIndex < 1 ? arrayIndex : arrayIndex + 1;
}

/** Indicator X for the 3-tab / center-FAB layout: Home centered in the left third,
 * Friends + Profile split the right third. State indices: Home=0, FAB=1, Friends=2, Profile=3. */
function getIndicatorX(stateIndex: number): number {
  const W = SCREEN_WIDTH;
  let center: number;
  if (stateIndex === 0) center = W / 6;             // Home — centre of left third
  else if (stateIndex === 2) center = (3 * W) / 4;  // Friends — first of right third
  else center = (11 * W) / 12;                       // Profile — second of right third
  return center - INDICATOR_WIDTH / 2;
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
        Animated.spring(anim, { toValue: 0.88, useNativeDriver: true, friction: 15, tension: 300 }),
        Animated.spring(anim, { toValue: 1.0, useNativeDriver: true, friction: 10, tension: 200 }),
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
            <View style={styles.sideGroup}>{renderTab(TABS[0], 0)}</View>
            <View style={styles.fabPlaceholder} />
            <View style={styles.sideGroup}>
              {renderTab(TABS[1], 1)}
              {renderTab(TABS[2], 2)}
            </View>
          </View>
        </View>
      </BlurView>

      {/* Floating "+" button with gradient + pulse */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => rootNav.navigate('Modal', { screen: 'SourcePicker', params: { mode: 'create' } })}
        activeOpacity={0.85}
      >
        <View style={styles.fabShadowWrap}>
          <LinearGradient
            colors={[colors.primary, '#9333EA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabInner}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </LinearGradient>
        </View>
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
  sideGroup: {
    flex: 1,
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
    flex: 1,
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
