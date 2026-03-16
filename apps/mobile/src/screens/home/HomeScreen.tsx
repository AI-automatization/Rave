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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@theme/index';
import { RootStackParamList } from '@app-types/index';
import { useHomeData } from '@hooks/useHomeData';
import { HeroBanner } from '@components/movie/HeroBanner';
import { MovieRow } from '@components/movie/MovieRow';
import { HomeSkeleton } from '@components/movie/HomeSkeleton';
import { useNotificationStore } from '@store/notification.store';
import { useT } from '@i18n/index';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TAB_BAR_HEIGHT = 60;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { trending, topRated, continueWatching, isLoading, refetch } = useHomeData();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { t } = useT();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) return <HomeSkeleton />;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgBase} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.logo}>
          CINE<Text style={styles.logoAccent}>SYNC</Text>
        </Text>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => navigation.navigate('Modal', { screen: 'Notifications' })}
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
          <MovieRow title={t('home', 'continueWatching')} movies={continueWatching} />
        )}

        <MovieRow title={t('home', 'trending')} movies={trending} />
        <MovieRow title={t('home', 'topRated')} movies={topRated} />

        <View style={{ height: TAB_BAR_HEIGHT + insets.bottom + spacing.lg }} />
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
    paddingBottom: spacing.md,
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
