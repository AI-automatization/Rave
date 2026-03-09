// CineSync Mobile — Home Screen
import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@theme/index';
import { ModalStackParamList } from '@app-types/index';
import { useHomeData } from '@hooks/useHomeData';
import { HeroBanner } from '@components/movie/HeroBanner';
import { MovieRow } from '@components/movie/MovieRow';
import { HomeSkeleton } from '@components/movie/HomeSkeleton';
import { useNotificationStore } from '@store/notification.store';

type Nav = NativeStackNavigationProp<ModalStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { trending, topRated, continueWatching, isLoading, refetch } = useHomeData();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (isLoading) return <HomeSkeleton />;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgBase} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>
          CINE<Text style={styles.logoAccent}>SYNC</Text>
        </Text>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : String(unreadCount)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <HeroBanner movies={trending.slice(0, 5)} />

        {continueWatching.length > 0 && (
          <MovieRow title="Davom ettirish" movies={continueWatching} />
        )}

        <MovieRow title="Trending" movies={trending} />
        <MovieRow title="Top Rated" movies={topRated} />

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    paddingTop: spacing.xl + spacing.sm,
  },
  logo: { ...typography.h2, fontSize: 22, letterSpacing: 1 },
  logoAccent: { color: colors.primary },
  notifBtn: { padding: spacing.xs, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: colors.textPrimary, fontSize: 10, fontWeight: '700' },
});
