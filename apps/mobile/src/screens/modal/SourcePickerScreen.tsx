// CineSync Mobile — SourcePickerScreen
// Выбор источника медиа (аналог Rave source picker)
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MEDIA_SOURCES, MediaSource } from '@constants/mediaSources';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import type { ModalStackParamList } from '@app-types/index';

type Nav = NativeStackNavigationProp<ModalStackParamList>;
type RouteType = RouteProp<ModalStackParamList, 'SourcePicker'>;

const NUM_COLUMNS = 2;

// ─── Source Card ──────────────────────────────────────────────────────────────

function SourceCard({ source, onPress }: { source: MediaSource; onPress: (s: MediaSource) => void }) {
  const isDrm = source.support === 'drm';
  const isInternal = source.support === 'internal';
  const opacity = isInternal ? 0.45 : 1;

  return (
    <TouchableOpacity
      style={[styles.card, { opacity }]}
      onPress={() => onPress(source)}
      activeOpacity={0.75}
    >
      <Ionicons name={source.iconName as 'globe'} size={22} color={source.brandColor} />
      <Text style={[styles.cardLabel, { color: isDrm ? '#888' : '#fff' }]} numberOfLines={1}>
        {source.label}
      </Text>
      {source.sublabel ? (
        <Text style={styles.cardSublabel}>{source.sublabel}</Text>
      ) : null}
      {isDrm && (
        <View style={styles.drmBadge}>
          <Ionicons name="lock-closed" size={9} color="#888" />
        </View>
      )}
      {isInternal && (
        <View style={styles.soonBadge}>
          <Text style={styles.soonText}>SOON</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function SourcePickerScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<RouteType>();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return MEDIA_SOURCES;
    const q = query.toLowerCase();
    return MEDIA_SOURCES.filter(
      s => s.label.toLowerCase().includes(q) || (s.sublabel ?? '').toLowerCase().includes(q),
    );
  }, [query]);

  function handleSourcePress(source: MediaSource) {
    if (source.support === 'internal') {
      Alert.alert(source.label, 'Эта функция скоро появится в CineSync!', [{ text: 'OK' }]);
      return;
    }

    if (source.support === 'drm') {
      Alert.alert(
        `🔒 ${source.label}`,
        source.drmMessage ?? 'Этот контент защищён DRM и не может быть воспроизведён внутри приложения.',
        [{ text: 'Понятно' }],
      );
      return;
    }

    // Full support → открываем встроенный браузер
    navigation.navigate('MediaWebView', {
      sourceId: source.id,
      sourceName: source.label,
      defaultUrl: source.defaultUrl,
      context: params.context,
      roomId: params.roomId,
    });
  }

  function handleCreateRoom() {
    navigation.navigate('WatchPartyCreate');
  }

  return (
    <LinearGradient
      colors={['#0A0A0F', '#0F0A1A', '#0A0A0F']}
      style={[styles.root, { paddingTop: insets.top || 16 }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Выберите источник</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Искать видео, сериал или фильм..."
          placeholderTextColor="#6B7280"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Grid */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SourceCard source={item} onPress={handleSourcePress} />
        )}
        ListFooterComponent={
          params.context === 'new_room' ? (
            <TouchableOpacity style={styles.createRoomBtn} onPress={handleCreateRoom}>
              <Ionicons name="people-outline" size={18} color={colors.primary} />
              <Text style={styles.createRoomText}>Создать комнату без медиа</Text>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={40} color="#4B5563" />
            <Text style={styles.emptyText}>Ничего не найдено</Text>
          </View>
        }
      />
    </LinearGradient>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const CARD_GAP = spacing.sm;
const CARD_WIDTH = '50%';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    alignItems: 'flex-start',
  },
  title: {
    ...typography.h3,
    color: '#fff',
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  grid: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  card: {
    width: CARD_WIDTH,
    minHeight: 90,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.xl,
    margin: CARD_GAP / 2,
    padding: spacing.lg,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  cardSublabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: -spacing.xs,
  },
  drmBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  soonBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  soonText: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  createRoomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginHorizontal: CARD_GAP / 2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(229,9,20,0.3)',
    backgroundColor: 'rgba(229,9,20,0.06)',
  },
  createRoomText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxl * 2,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: '#4B5563',
  },
});
