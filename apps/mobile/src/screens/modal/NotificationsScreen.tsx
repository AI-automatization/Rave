// CineSync Mobile — NotificationsScreen
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ListRenderItemInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { INotification, NotificationType } from '@app-types/index';
import { useNotifications } from '@hooks/useNotifications';

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}k`;
}

export function NotificationsScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useStyles();
  const {
    notifications,
    isLoading,
    unreadCount,
    refetch,
    handlePress,
    handleDelete,
    markAllMutation,
    acceptFriendMutation,
    rejectFriendMutation,
  } = useNotifications();

  const TYPE_ICONS: Record<NotificationType, { icon: string; color: string }> = {
    friend_request:       { icon: 'person-add-outline',      color: colors.secondary },
    friend_accepted:      { icon: 'people-outline',           color: colors.success },
    watch_party_invite:   { icon: 'tv-outline',               color: colors.primary },
    battle_invite:        { icon: 'flash-outline',            color: colors.warning },
    battle_result:        { icon: 'trophy-outline',           color: colors.gold },
    achievement_unlocked: { icon: 'ribbon-outline',           color: colors.primary },
    friend_online:        { icon: 'radio-button-on-outline',  color: colors.success },
    friend_watching:      { icon: 'eye-outline',              color: colors.secondary },
  };

  const renderItem = ({ item }: ListRenderItemInfo<INotification>) => {
    const { icon, color } = TYPE_ICONS[item.type] ?? { icon: 'notifications-outline', color: colors.textMuted };
    const data = item.data as Record<string, string>;
    const hasActions = item.type === 'friend_request' || item.type === 'watch_party_invite';

    return (
      <TouchableOpacity
        style={[styles.item, !item.isRead && styles.itemUnread]}
        onPress={() => handlePress(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
          <Ionicons name={icon as never} size={20} color={color} />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.itemTime}>{timeAgo(item.createdAt)}</Text>
          {hasActions && (
            <View style={styles.actionRow}>
              {item.type === 'friend_request' && (
                <>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptFriendMutation.mutate(data.friendshipId)}>
                    <Text style={styles.acceptBtnText}>Qabul</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectFriendMutation.mutate(data.friendshipId)}>
                    <Text style={styles.rejectBtnText}>Rad</Text>
                  </TouchableOpacity>
                </>
              )}
              {item.type === 'watch_party_invite' && (
                <TouchableOpacity style={styles.acceptBtn} onPress={() => handlePress(item)}>
                  <Text style={styles.acceptBtnText}>Qo'shilish</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
        <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Bildirishnomalar</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={() => markAllMutation.mutate()} disabled={markAllMutation.isPending} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Hammasini o'qi</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>Bildirishnomalar yo'q</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
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
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, justifyContent: 'center' },
  title: { ...typography.h2, color: colors.textPrimary },
  badge: { backgroundColor: colors.error, borderRadius: borderRadius.full, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: colors.textPrimary, fontSize: 11, fontWeight: '700' },
  markAllBtn: { paddingHorizontal: spacing.xs },
  markAllText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  loader: { marginTop: 40 },
  list: { padding: spacing.md, gap: spacing.xs, flexGrow: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  itemUnread: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  iconWrap: { width: 40, height: 40, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center' },
  itemContent: { flex: 1, gap: 2 },
  itemTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  itemBody: { ...typography.caption, color: colors.textSecondary },
  itemTime: { ...typography.caption, color: colors.textMuted },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  deleteBtn: { padding: spacing.xs },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  acceptBtn: { backgroundColor: colors.success, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  acceptBtnText: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },
  rejectBtn: { borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: colors.error },
  rejectBtnText: { ...typography.caption, color: colors.error, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', gap: spacing.md, paddingTop: 80 },
  emptyText: { ...typography.body, color: colors.textMuted },
}));
