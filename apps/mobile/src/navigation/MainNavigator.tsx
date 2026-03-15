// CineSync Mobile — Main Tab Navigator
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@theme/index';
import {
  MainTabParamList,
  HomeStackParamList,
  SearchStackParamList,
  FriendsStackParamList,
  ProfileStackParamList,
  RootStackParamList,
} from '@app-types/index';
import { PlaceholderScreen } from './PlaceholderScreen';
import { HomeScreen } from '@screens/home/HomeScreen';
import { FriendsScreen } from '@screens/friends/FriendsScreen';
import { FriendProfileScreen } from '@screens/friends/FriendProfileScreen';
import { FriendSearchScreen } from '@screens/friends/FriendSearchScreen';
import { ProfileScreen } from '@screens/profile/ProfileScreen';
import { StatsScreen } from '@screens/profile/StatsScreen';
import { AchievementsScreen } from '@screens/profile/AchievementsScreen';
import { SettingsScreen } from '@screens/profile/SettingsScreen';
import { MovieDetailScreen } from '@screens/home/MovieDetailScreen';
import { VideoPlayerScreen } from '@screens/home/VideoPlayerScreen';
import { SearchScreen } from '@screens/search/SearchScreen';
import { SearchResultsScreen } from '@screens/search/SearchResultsScreen';
import { useT } from '@i18n/index';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const FriendsStack = createNativeStackNavigator<FriendsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="MovieDetail" component={MovieDetailScreen} />
      <HomeStack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
    </HomeStack.Navigator>
  );
}

function SearchStackNavigator() {
  return (
    <SearchStack.Navigator screenOptions={{ headerShown: false }}>
      <SearchStack.Screen name="Search" component={SearchScreen} />
      <SearchStack.Screen name="SearchResults" component={SearchResultsScreen} />
    </SearchStack.Navigator>
  );
}

function FriendsStackNavigator() {
  return (
    <FriendsStack.Navigator screenOptions={{ headerShown: false }}>
      <FriendsStack.Screen name="Friends" component={FriendsScreen} />
      <FriendsStack.Screen name="FriendProfile" component={FriendProfileScreen} />
      <FriendsStack.Screen name="FriendSearch" component={FriendSearchScreen} />
    </FriendsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="Stats" component={StatsScreen} />
      <ProfileStack.Screen name="Achievements" component={AchievementsScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    </ProfileStack.Navigator>
  );
}

// ─── Tab config ───────────────────────────────────────────────────────────────
type TabEntry = {
  name: keyof MainTabParamList;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  labelKey: string;
};

const TABS: TabEntry[] = [
  { name: 'HomeTab',    icon: 'home-outline',   iconActive: 'home',   labelKey: 'home' },
  { name: 'SearchTab',  icon: 'search-outline', iconActive: 'search', labelKey: 'search' },
  { name: 'FriendsTab', icon: 'people-outline', iconActive: 'people', labelKey: 'friends' },
  { name: 'ProfileTab', icon: 'person-outline', iconActive: 'person', labelKey: 'profile' },
];

// ─── Custom Tab Bar ───────────────────────────────────────────────────────────
function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useT();

  const renderTab = (tab: TabEntry) => {
    const route = state.routes.find(r => r.name === tab.name);
    const focused = route ? state.index === state.routes.indexOf(route) : false;
    const color = focused ? colors.primary : colors.textMuted;
    return (
      <TouchableOpacity
        key={tab.name}
        style={styles.tabItem}
        onPress={() => navigation.navigate(tab.name)}
        activeOpacity={0.7}
      >
        <Ionicons name={focused ? tab.iconActive : tab.icon} size={24} color={color} />
        <Text style={[styles.label, { color }]}>{t('tabs', tab.labelKey)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Bar */}
      <View style={styles.bar}>
        {/* Left 2 tabs */}
        {TABS.slice(0, 2).map(renderTab)}

        {/* FAB placeholder */}
        <View style={styles.fabPlaceholder} />

        {/* Right 2 tabs */}
        {TABS.slice(2).map(renderTab)}
      </View>

      {/* Floating "+" button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => rootNav.navigate('Modal', { screen: 'WatchPartyCreate' })}
        activeOpacity={0.85}
      >
        <View style={styles.fabInner}>
          <Ionicons name="add" size={28} color="#fff" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Navigator ───────────────────────────────────────────────────────────
export function MainNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab"    component={HomeStackNavigator} />
      <Tab.Screen name="SearchTab"  component={SearchStackNavigator} />
      <Tab.Screen name="CreateTab"  component={PlaceholderScreen} />
      <Tab.Screen name="FriendsTab" component={FriendsStackNavigator} />
      <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const BAR_HEIGHT = 60;
const FAB_SIZE   = 54;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bar: {
    height: BAR_HEIGHT,
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
  fabPlaceholder: {
    width: FAB_SIZE + 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    top: -(FAB_SIZE / 2) + 10,
    alignSelf: 'center',
    zIndex: 10,
  },
  fabInner: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bgBase,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
});
