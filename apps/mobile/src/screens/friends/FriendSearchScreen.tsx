import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FastImage from 'react-native-fast-image';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import { colors, spacing, borderRadius, typography } from '@theme/index';
import { userApi } from '@api/user.api';
import type { FriendsStackParams } from '@navigation/types';
import type { IUserPublic } from '@app-types/index';

const DEBOUNCE_MS = 400;

type Props = NativeStackScreenProps<FriendsStackParams, 'FriendSearch'>;

export default function FriendSearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<IUserPublic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  // Search on debouncedQuery change
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    userApi
      .searchUsers(debouncedQuery)
      .then((res) => {
        if (!cancelled) setResults(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) Toast.show({ type: 'error', text1: 'Qidiruvda xatolik' });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const handleAddFriend = useCallback(async (userId: string) => {
    setSending(userId);
    try {
      const res = await userApi.sendFriendRequest(userId);
      if (res.success) {
        Toast.show({ type: 'success', text1: 'Do\'stlik so\'rovi yuborildi' });
      } else {
        Toast.show({ type: 'error', text1: res.message || 'Xatolik yuz berdi' });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Tarmoq xatosi' });
    } finally {
      setSending(null);
    }
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: IUserPublic }) => (
      <View style={styles.resultItem}>
        {item.avatar ? (
          <FastImage
            style={styles.avatar}
            source={{ uri: item.avatar, priority: FastImage.priority.normal }}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>{item.username.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          {item.bio ? (
            <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={[styles.addBtn, sending === item._id && styles.addBtnDisabled]}
          onPress={() => handleAddFriend(item._id)}
          disabled={sending === item._id}
        >
          {sending === item._id ? (
            <ActivityIndicator color={colors.textPrimary} size="small" />
          ) : (
            <Text style={styles.addBtnText}>+ Qo'shish</Text>
          )}
        </TouchableOpacity>
      </View>
    ),
    [handleAddFriend, sending],
  );

  const showEmpty = debouncedQuery.length >= 2 && !isLoading && results.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Orqaga</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Do'st qidirish</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder="Username kiriting..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoFocus
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}

      {!isLoading && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
        />
      )}

      {showEmpty && (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyText}>Foydalanuvchi topilmadi</Text>
          <Text style={styles.emptyHint}>Boshqa username sinab ko'ring</Text>
        </View>
      )}

      {debouncedQuery.length < 2 && !isLoading && (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyText}>Username kiriting</Text>
          <Text style={styles.emptyHint}>Kamida 2 ta belgi kerak</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  back: { color: colors.textSecondary, fontSize: typography.sizes.md, width: 60 },
  title: { color: colors.textPrimary, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  searchIcon: { fontSize: 16, marginRight: spacing.sm },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    paddingVertical: spacing.md,
  },
  clearIcon: { color: colors.textMuted, fontSize: 16, padding: spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: colors.textPrimary, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold },
  emptyHint: { color: colors.textMuted, fontSize: typography.sizes.sm },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgSurface,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgOverlay,
  },
  avatarInitial: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  userInfo: { flex: 1 },
  username: { color: colors.textPrimary, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  bio: { color: colors.textMuted, fontSize: typography.sizes.sm, marginTop: 2 },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  addBtnDisabled: { opacity: 0.6 },
  addBtnText: { color: colors.textPrimary, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  headerSpacer: { width: 60 },
  listContent: { paddingVertical: spacing.sm },
});
