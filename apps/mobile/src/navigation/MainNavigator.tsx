// CineSync Mobile — Main Tab Navigator
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  MainTabParamList,
  HomeStackParamList,
  SearchStackParamList,
  FriendsStackParamList,
  ProfileStackParamList,
} from '@app-types/index';
import { PlaceholderScreen } from './PlaceholderScreen';
import { CustomTabBar } from './CustomTabBar';
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
import { VideoExtractScreen } from '@screens/home/VideoExtractScreen';
import { SearchScreen } from '@screens/search/SearchScreen';
import { SearchResultsScreen } from '@screens/search/SearchResultsScreen';
import { LanguageTransition } from '@components/common/LanguageTransition';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const FriendsStack = createNativeStackNavigator<FriendsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

// ─── Stack Navigators with screen transitions ────────────────────────────────

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: 250 }}
    >
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="MovieDetail" component={MovieDetailScreen} options={{ animation: 'slide_from_bottom' }} />
      <HomeStack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ animation: 'fade' }} />
      <HomeStack.Screen name="VideoExtract" component={VideoExtractScreen} options={{ animation: 'fade' }} />
    </HomeStack.Navigator>
  );
}

function SearchStackNavigator() {
  return (
    <SearchStack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: 250 }}
    >
      <SearchStack.Screen name="Search" component={SearchScreen} />
      <SearchStack.Screen name="SearchResults" component={SearchResultsScreen} />
    </SearchStack.Navigator>
  );
}

function FriendsStackNavigator() {
  return (
    <FriendsStack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: 250 }}
    >
      <FriendsStack.Screen name="Friends" component={FriendsScreen} />
      <FriendsStack.Screen name="FriendProfile" component={FriendProfileScreen} />
      <FriendsStack.Screen name="FriendSearch" component={FriendSearchScreen} />
    </FriendsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: 250 }}
    >
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="Stats" component={StatsScreen} />
      <ProfileStack.Screen name="Achievements" component={AchievementsScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    </ProfileStack.Navigator>
  );
}

// ─── Main Navigator ───────────────────────────────────────────────────────────
export function MainNavigator() {
  return (
    <LanguageTransition>
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
    </LanguageTransition>
  );
}
