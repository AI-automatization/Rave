// CineSync Mobile — BattleCreateScreen
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ListRenderItemInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFriendsStore } from '@store/friends.store';
import { useCreateBattle } from '@hooks/useBattle';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { RANK_COLORS } from '@theme/index';
import { BattleDuration, IUserPublic, ModalStackParamList } from '@app-types/index';

type Nav = NativeStackNavigationProp<ModalStackParamList, 'BattleCreate'>;

const DURATIONS: { value: BattleDuration; label: string }[] = [
  { value: 3, label: '3 kun' },
  { value: 5, label: '5 kun' },
  { value: 7, label: '7 kun' },
];

function FriendPickerRow({
  item,
  selected,
  onPress,
}: {
  item: IUserPublic;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.friendRow, selected && styles.friendRowSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={item.avatar ? { uri: item.avatar } : require('../../../assets/icon.png')}
        style={styles.avatar}
        contentFit="cover"
      />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.username}</Text>
        <View style={styles.rankRow}>
          <View style={[styles.rankDot, { backgroundColor: RANK_COLORS[item.rank] }]} />
          <Text style={styles.rankText}>{item.rank}</Text>
        </View>
      </View>
      {selected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
    </TouchableOpacity>
  );
}

export function BattleCreateScreen() {
  const navigation = useNavigation<Nav>();
  const friends = useFriendsStore(s => s.friends);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [duration, setDuration] = useState<BattleDuration>(5);
  const [title, setTitle] = useState('');

  const createBattle = useCreateBattle();

  const handleCreate = () => {
    if (!selectedFriendId) {
      Alert.alert('Xato', 'Raqib tanlang');
      return;
    }
    createBattle.mutate(
      { opponentId: selectedFriendId, duration, title: title.trim() || undefined },
      {
        onSuccess: battle => navigation.replace('Battle', { battleId: battle._id }),
        onError: () => Alert.alert('Xato', 'Battle yaratib bo\'lmadi'),
      },
    );
  };

  const renderFriend = ({ item }: ListRenderItemInfo<IUserPublic>) => (
    <FriendPickerRow
      item={item}
      selected={selectedFriendId === item._id}
      onPress={() => setSelectedFriendId(prev => (prev === item._id ? null : item._id))}
    />
  );

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Battle yaratish</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Title (optional) */}
        <View style={styles.section}>
          <Text style={styles.label}>BATTLE NOMI (IXTIYORIY)</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Masalan: Kim ko'proq ko'radi? 🎬"
            placeholderTextColor={colors.textMuted}
            maxLength={50}
          />
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.label}>DAVOMIYLIGI</Text>
          <View style={styles.durationRow}>
            {DURATIONS.map(d => (
              <TouchableOpacity
                key={d.value}
                style={[styles.durationChip, duration === d.value && styles.durationChipActive]}
                onPress={() => setDuration(d.value)}
              >
                <Text style={[styles.durationText, duration === d.value && styles.durationTextActive]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Friend picker */}
        <View style={[styles.section, styles.friendSection]}>
          <Text style={styles.label}>RAQIB TANLASH</Text>
          {friends.length === 0 ? (
            <View style={styles.noFriends}>
              <Ionicons name="people-outline" size={36} color={colors.textMuted} />
              <Text style={styles.noFriendsText}>Do'stlar yo'q. Avval do'st qo'shing.</Text>
            </View>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={item => item._id}
              renderItem={renderFriend}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.friendList}
            />
          )}
        </View>
      </View>

      {/* Create button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createBtn, (!selectedFriendId || createBattle.isPending) && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={!selectedFriendId || createBattle.isPending}
          activeOpacity={0.8}
        >
          {createBattle.isPending ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <>
              <Ionicons name="flash" size={20} color={colors.textPrimary} />
              <Text style={styles.createBtnText}>Battle boshlash</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  title: { ...typography.h2, color: colors.textPrimary },
  content: { flex: 1, padding: spacing.lg, gap: spacing.xl },
  section: { gap: spacing.sm },
  friendSection: { flex: 1 },
  label: { ...typography.label, color: colors.textMuted },
  input: {
    backgroundColor: colors.bgElevated,
    color: colors.textPrimary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  durationRow: { flexDirection: 'row', gap: spacing.sm },
  durationChip: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  durationChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  durationText: { ...typography.body, color: colors.textMuted, fontWeight: '600' },
  durationTextActive: { color: colors.textPrimary },
  friendList: { gap: spacing.sm },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  friendRowSelected: { borderColor: colors.primary },
  avatar: { width: 40, height: 40, borderRadius: borderRadius.full },
  friendInfo: { flex: 1, gap: 3 },
  friendName: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rankDot: { width: 8, height: 8, borderRadius: 4 },
  rankText: { ...typography.caption, color: colors.textMuted },
  noFriends: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxxl },
  noFriendsText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  createBtnDisabled: { opacity: 0.5 },
  createBtnText: { ...typography.h3, color: colors.textPrimary },
});
