// CineSync Mobile — FriendPicker component
// Friend selection UI with chips and checkbox list
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import type { IUserPublic } from '@app-types/index';

interface FriendPickerProps {
  friends: IUserPublic[];
  selectedFriendIds: string[];
  selectedFriends: IUserPublic[];
  onToggleFriend: (id: string) => void;
}

export function FriendPicker({
  friends,
  selectedFriendIds,
  selectedFriends,
  onToggleFriend,
}: FriendPickerProps) {
  if (friends.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.label}>DO'STLARNI TAKLIF QILISH</Text>

      {/* Selected friends chips */}
      {selectedFriends.length > 0 && (
        <View style={styles.selectedFriendsRow}>
          {selectedFriends.map(f => (
            <TouchableOpacity
              key={f._id}
              style={styles.friendChip}
              onPress={() => onToggleFriend(f._id)}
            >
              <Text style={styles.friendChipText}>@{f.username}</Text>
              <Ionicons name="close" size={12} color={colors.textPrimary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Friends list */}
      {friends.map(friend => {
        const selected = selectedFriendIds.includes(friend._id);
        return (
          <TouchableOpacity
            key={friend._id}
            style={styles.friendRow}
            onPress={() => onToggleFriend(friend._id)}
            activeOpacity={0.7}
          >
            <View style={styles.friendAvatar}>
              <Text style={styles.friendAvatarText}>
                {friend.username[0].toUpperCase()}
              </Text>
            </View>
            <Text style={styles.friendName} numberOfLines={1}>
              @{friend.username}
            </Text>
            <View style={[styles.checkbox, selected && styles.checkboxActive]}>
              {selected && (
                <Ionicons name="checkmark" size={12} color={colors.textPrimary} />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  label: { ...typography.label, color: colors.textMuted },
  selectedFriendsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  friendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  friendChipText: { ...typography.caption, color: colors.textPrimary },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: { ...typography.body, color: colors.textSecondary, fontWeight: '600' },
  friendName: { ...typography.body, color: colors.textPrimary, flex: 1 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
});
