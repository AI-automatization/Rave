// CineSync Mobile — WatchParty RoomInfoBar
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';

interface RoomInfoBarProps {
  roomName: string;
  memberCount: number;
  isOwner: boolean;
  hasMessages: boolean;
  onToggleInvite: () => void;
  onToggleChat: () => void;
  onToggleVoice: () => void;
  onLeave: () => void;
}

export const RoomInfoBar = React.memo(function RoomInfoBar({
  roomName,
  memberCount,
  isOwner,
  hasMessages,
  onToggleInvite,
  onToggleChat,
  onToggleVoice,
  onLeave,
}: RoomInfoBarProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.infoBar}>
      <View style={styles.infoLeft}>
        <Text style={styles.roomName} numberOfLines={1}>{roomName}</Text>
        <View style={styles.memberCount}>
          <Ionicons name="people-outline" size={14} color={colors.textMuted} />
          <Text style={styles.memberCountText}>{memberCount}</Text>
        </View>
      </View>

      <View style={styles.infoActions}>
        <TouchableOpacity onPress={onToggleInvite} style={styles.iconBtn}>
          <Ionicons name="person-add-outline" size={20} color={colors.secondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onToggleChat} style={styles.iconBtn}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
          {hasMessages && <View style={styles.chatDot} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={onToggleVoice} style={styles.iconBtn}>
          <Ionicons name="mic-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onLeave} style={styles.iconBtn}>
          <Ionicons name="exit-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const useStyles = createThemedStyles((colors) => ({
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLeft: { flex: 1, gap: 2 },
  roomName: { ...typography.h3, color: colors.textPrimary },
  memberCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  memberCountText: { ...typography.caption, color: colors.textMuted },
  infoActions: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: { padding: spacing.sm },
  chatDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error,
  },
}));
