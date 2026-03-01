import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, spacing } from '@theme/index';
import { useNotificationStore } from '@store/notification.store';
import type { MainTabsParams, HomeStackParams, SearchStackParams, FriendsStackParams, ProfileStackParams } from './types';

import HomeScreen from '@screens/home/HomeScreen';
import MovieDetailScreen from '@screens/home/MovieDetailScreen';
import VideoPlayerScreen from '@screens/home/VideoPlayerScreen';
import SearchScreen from '@screens/search/SearchScreen';
import SearchResultsScreen from '@screens/search/SearchResultsScreen';
import FriendsScreen from '@screens/friends/FriendsScreen';
import FriendProfileScreen from '@screens/friends/FriendProfileScreen';
import FriendSearchScreen from '@screens/friends/FriendSearchScreen';
import ProfileScreen from '@screens/profile/ProfileScreen';
import StatsScreen from '@screens/profile/StatsScreen';
import AchievementsScreen from '@screens/profile/AchievementsScreen';
import SettingsScreen from '@screens/profile/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabsParams>();
const HomeStack = createNativeStackNavigator<HomeStackParams>();
const SearchStack = createNativeStackNavigator<SearchStackParams>();
const FriendsStack = createNativeStackNavigator<FriendsStackParams>();
const ProfileStack = createNativeStackNavigator<ProfileStackParams>();

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="MovieDetail" component={MovieDetailScreen} />
      <HomeStack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
    </HomeStack.Navigator>
  );
}

function SearchNavigator() {
  return (
    <SearchStack.Navigator screenOptions={{ headerShown: false }}>
      <SearchStack.Screen name="Search" component={SearchScreen} />
      <SearchStack.Screen name="SearchResults" component={SearchResultsScreen} />
      <SearchStack.Screen name="MovieDetail" component={MovieDetailScreen} />
    </SearchStack.Navigator>
  );
}

function FriendsNavigator() {
  return (
    <FriendsStack.Navigator screenOptions={{ headerShown: false }}>
      <FriendsStack.Screen name="Friends" component={FriendsScreen} />
      <FriendsStack.Screen name="FriendProfile" component={FriendProfileScreen} />
      <FriendsStack.Screen name="FriendSearch" component={FriendSearchScreen} />
    </FriendsStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="Stats" component={StatsScreen} />
      <ProfileStack.Screen name="Achievements" component={AchievementsScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    </ProfileStack.Navigator>
  );
}

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    HomeTab: '🏠',
    SearchTab: '🔍',
    FriendsTab: '👥',
    ProfileTab: '👤',
  };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{icons[name]}</Text>
  );
}

export default function MainTabs() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      {/* BUG-M014: unreadCount notification badge HomeTab da — FriendsTab da emas */}
      <Tab.Screen
        name="HomeTab"
        component={HomeNavigator}
        options={{
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen name="SearchTab" component={SearchNavigator} />
      <Tab.Screen name="FriendsTab" component={FriendsNavigator} />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bgElevated,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingVertical: spacing.sm,
    height: 60,
  },
});
