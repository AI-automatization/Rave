// CineSync Mobile — Main Tab Navigator
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@theme/index';
import {
  MainTabParamList,
  HomeStackParamList,
  SearchStackParamList,
  FriendsStackParamList,
  ProfileStackParamList,
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

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            HomeTab: 'home',
            SearchTab: 'search',
            FriendsTab: 'people',
            ProfileTab: 'person',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarLabel: () => null,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} />
      <Tab.Screen name="SearchTab" component={SearchStackNavigator} />
      <Tab.Screen name="FriendsTab" component={FriendsStackNavigator} />
      <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}
