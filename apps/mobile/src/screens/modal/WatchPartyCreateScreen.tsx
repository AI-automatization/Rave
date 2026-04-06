// CineSync Mobile — WatchPartyCreateScreen (3-tab: Rooms / Create / Join)
import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing } from '@theme/index';
import { useT } from '@i18n/index';
import type { ModalStackParamList } from '@app-types/index';
import { RoomsTab } from '@components/watchParty/RoomsTab';
import { CreateTab } from '@components/watchParty/CreateTab';
import { JoinTab } from '@components/watchParty/JoinTab';
import { useWatchPartyCreateStyles } from '@components/watchParty/watchPartyCreate.styles';

type Nav = NativeStackNavigationProp<ModalStackParamList, 'WatchPartyCreate'>;
type TabKey = 'rooms' | 'create' | 'join';

const TAB_KEYS: { key: TabKey; icon: string; labelKey: string }[] = [
  { key: 'rooms', icon: 'globe-outline', labelKey: 'tabRooms' },
  { key: 'create', icon: 'add-circle-outline', labelKey: 'tabCreate' },
  { key: 'join', icon: 'key-outline', labelKey: 'tabCode' },
];

export function WatchPartyCreateScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const s = useWatchPartyCreateStyles();
  const { t } = useT();
  const [activeTab, setActiveTab] = useState<TabKey>('rooms');

  const indicatorX = useRef(new Animated.Value(0)).current;
  const tabWidth = useRef(0);

  const handleTabPress = (tab: TabKey, index: number) => {
    setActiveTab(tab);
    Animated.spring(indicatorX, {
      toValue: index * (tabWidth.current || 100),
      useNativeDriver: true,
      tension: 300,
      friction: 25,
    }).start();
  };

  return (
    <View style={s.root}>
      <LinearGradient
        colors={[colors.primary + '15', colors.bgBase]}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={[s.header, { paddingTop: insets.top + spacing.sm }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Ionicons name="tv-outline" size={20} color={colors.primary} />
          <Text style={s.title}>Watch Party</Text>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <View
        style={s.tabBar}
        onLayout={(e) => {
          tabWidth.current = (e.nativeEvent.layout.width - spacing.lg * 2 - 8) / TAB_KEYS.length;
        }}
      >
        <View style={s.tabBarInner}>
          <Animated.View
            style={[s.tabIndicator, {
              width: `${100 / TAB_KEYS.length}%` as unknown as number,
              transform: [{ translateX: indicatorX }],
            }]}
          >
            <LinearGradient
              colors={[colors.primary + '30', colors.primary + '15']}
              style={s.tabIndicatorGradient}
            />
          </Animated.View>

          {TAB_KEYS.map((tab, index) => (
            <TouchableOpacity
              key={tab.key} style={s.tab}
              onPress={() => handleTabPress(tab.key, index)} activeOpacity={0.8}
            >
              <Ionicons
                name={tab.icon as keyof typeof Ionicons.glyphMap} size={16}
                color={activeTab === tab.key ? colors.primary : colors.textMuted}
              />
              <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
                {t('watchParty', tab.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {activeTab === 'rooms' && <RoomsTab navigation={navigation} t={t} />}
      {activeTab === 'create' && <CreateTab navigation={navigation} t={t} />}
      {activeTab === 'join' && <JoinTab navigation={navigation} t={t} />}
    </View>
  );
}
