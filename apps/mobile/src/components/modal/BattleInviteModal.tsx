// CineSync Mobile — Battle Invite Modal
// Owner battle ekranida do'stlarini battle ga taklif qilishi uchun
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ListRenderItemInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { battleApi } from '@api/battle.api';
import { useFriends } from '@hooks/useFriends';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { IUserPublic } from '@app-types/index';

interface Props {
  battleId: string;
  visible: boolean;
  onClose: () => void;
}

export function BattleInviteModal({ battleId, visible, onClose }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { friends, friendsLoading } = useFriends();
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());

  const handleInvite = async (friend: IUserPublic) => {
    setSending(friend._id);
    try {
      await battleApi.inviteParticipant(battleId, friend._id);
      setSent((prev) => new Set(prev).add(friend._id));
    } catch {
      Alert.alert('Xato', `${friend.username} ga taklif yuborib bo'lmadi`);
    } finally {
      setSending(null);
    }
  };

  const renderFriend = ({ item }: ListRenderItemInfo<IUserPublic>) => {
    const isSent = sent.has(item._id);
    const isSending = sending === item._id;

    return (
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{item.username.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.username} numberOfLines={1}>{item.username}</Text>
        <TouchableOpacity
          style={[styles.inviteBtn, isSent && styles.inviteBtnSent]}
          onPress={() => handleInvite(item)}
          disabled={isSent || isSending}
          activeOpacity={0.7}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <>
              <Ionicons
                name={isSent ? 'checkmark' : 'flash'}
                size={14}
                color={colors.textPrimary}
              />
              <Text style={styles.inviteBtnText}>{isSent ? "Yuborildi" : "Taklif"}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>Do'stlarni taklif qilish</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {friendsLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : friends.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="people-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>Do'stlar yo'q</Text>
          </View>
        ) : (
          <FlatList
            data={friends}
            keyExtractor={(item) => item._id}
            renderItem={renderFriend}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
}

const useStyles = createThemedStyles((colors) => ({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '60%',
    paddingBottom: spacing.xxxl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { ...typography.h3, color: colors.textPrimary },
  closeBtn: { padding: spacing.xs },
  center: { padding: spacing.xxxl, alignItems: 'center', gap: spacing.md },
  emptyText: { ...typography.body, color: colors.textMuted },
  list: { padding: spacing.md, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  username: { ...typography.body, color: colors.textPrimary, flex: 1 },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    minWidth: 80,
    justifyContent: 'center',
  },
  inviteBtnSent: { backgroundColor: colors.success },
  inviteBtnText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
}));
