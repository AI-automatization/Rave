// CineSync Mobile — FriendPicker component (themed + animated)
import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import type { IUserPublic } from '@app-types/index';

interface FriendPickerProps {
  friends: IUserPublic[];
  selectedFriendIds: string[];
  selectedFriends: IUserPublic[];
  onToggleFriend: (id: string) => void;
}

// ─── Animated friend row ───────────────────────────────────────
function FriendRow({
  friend,
  selected,
  onToggle,
  index,
}: {
  friend: IUserPublic;
  selected: boolean;
  onToggle: () => void;
  index: number;
}) {
  const { colors } = useTheme();
  const s = useStyles();
  const scale = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(checkScale, {
      toValue: selected ? 1 : 0,
      useNativeDriver: true,
      friction: 5,
      tension: 200,
    }).start();
  }, [selected, checkScale]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[s.friendRow, selected && s.friendRowSelected]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={[s.friendAvatar, selected && { borderColor: colors.primary, borderWidth: 2 }]}>
          <Text style={[s.friendAvatarText, selected && { color: colors.primary }]}>
            {friend.username[0].toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.friendName} numberOfLines={1}>
            {friend.username}
          </Text>
          {friend.isOnline && (
            <Text style={s.onlineText}>Online</Text>
          )}
        </View>
        <Animated.View
          style={[
            s.checkbox,
            selected && s.checkboxActive,
            { transform: [{ scale: checkScale.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            }) }] },
          ]}
        >
          {selected && (
            <Ionicons name="checkmark" size={14} color={colors.white} />
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function FriendPicker({
  friends,
  selectedFriendIds,
  selectedFriends,
  onToggleFriend,
}: FriendPickerProps) {
  const { colors } = useTheme();
  const s = useStyles();

  if (friends.length === 0) return null;

  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <Ionicons name="people-outline" size={16} color={colors.primary} />
        <Text style={s.label}>DO'STLARNI TAKLIF QILISH</Text>
        {selectedFriendIds.length > 0 && (
          <View style={s.countBadge}>
            <Text style={s.countText}>{selectedFriendIds.length}</Text>
          </View>
        )}
      </View>

      {/* Selected friends chips */}
      {selectedFriends.length > 0 && (
        <View style={s.selectedFriendsRow}>
          {selectedFriends.map(f => (
            <TouchableOpacity
              key={f._id}
              style={s.friendChip}
              onPress={() => onToggleFriend(f._id)}
              activeOpacity={0.7}
            >
              <Text style={s.friendChipText}>@{f.username}</Text>
              <Ionicons name="close" size={12} color={colors.white} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Friends list */}
      <View style={s.friendsList}>
        {friends.map((friend, index) => (
          <FriendRow
            key={friend._id}
            friend={friend}
            selected={selectedFriendIds.includes(friend._id)}
            onToggle={() => onToggleFriend(friend._id)}
            index={index}
          />
        ))}
      </View>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  section: { gap: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: { ...typography.label, color: colors.textMuted },
  countBadge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: spacing.xs,
  },
  countText: { ...typography.caption, color: colors.white, fontWeight: '700' },

  selectedFriendsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  friendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  friendChipText: { ...typography.caption, color: colors.white, fontWeight: '600' },

  friendsList: { gap: spacing.xs },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  friendRowSelected: {
    borderColor: colors.primary + '40',
    backgroundColor: colors.primary + '08',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: { ...typography.body, color: colors.textSecondary, fontWeight: '700' },
  friendName: { ...typography.body, color: colors.textPrimary, fontWeight: '500' },
  onlineText: { ...typography.caption, color: colors.success, fontSize: 11 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
}));
