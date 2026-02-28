import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FastImage from 'react-native-fast-image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import { colors, spacing, borderRadius, typography } from '@theme/index';
import { userApi } from '@api/user.api';
import type { FriendsStackParams } from '@navigation/types';
import type { IUserPublic } from '@types/index';

type Props = NativeStackScreenProps<FriendsStackParams, 'FriendSearch'>;

export default function FriendSearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const qc = useQueryClient();
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  // Reuse content search with user search stub — using friend list filter locally
  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const res = await userApi.getFriends();
      return res.data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const friendIds = new Set(friends.map((f) => f._id));

  const handleSend = async (userId: string) => {
    try {
      await userApi.sendFriendRequest(userId);
      setSentIds((prev) => new Set([...prev, userId]));
      qc.invalidateQueries({ queryKey: ['friends'] });
      Toast.show({ type: 'success', text1: "Do'stlik so'rovi yuborildi!" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Xatolik';
      Toast.show({ type: 'error', text1: msg });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Orqaga</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Do'st qidirish</Text>
        <View style={{ width: 60 }} />
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
      </View>

      <View style={styles.center}>
        <Text style={styles.hint}>Username bo'yicha qidirish imkoniyati tez orada!</Text>
        <Text style={styles.hintSub}>Do'stlarga havolani ulashib taklif qiling</Text>
      </View>
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
  },
  searchIcon: { fontSize: 16, marginRight: spacing.sm },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    paddingVertical: spacing.md,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  hint: { color: colors.textSecondary, fontSize: typography.sizes.md, textAlign: 'center' },
  hintSub: { color: colors.textMuted, fontSize: typography.sizes.sm, textAlign: 'center' },
});
