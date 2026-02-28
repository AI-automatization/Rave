import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatDistanceToNow } from 'date-fns';

import { colors, spacing, borderRadius, typography } from '@theme/index';
import { notificationApi } from '@api/notification.api';
import { useNotificationStore } from '@store/notification.store';
import type { RootStackParams } from '@navigation/types';
import type { INotification, NotificationType } from '@types/index';

type Props = NativeStackScreenProps<RootStackParams, 'Notifications'>;

const NOTIF_ICONS: Record<NotificationType, string> = {
  friend_request: '👥',
  friend_accepted: '✅',
  watch_party_invite: '🎬',
  battle_invite: '⚔️',
  battle_result: '🏆',
  achievement_unlocked: '🏅',
  friend_online: '🟢',
  friend_watching: '👁️',
};

// Faqat RootStackParams da to'g'ridan route mavjud bo'lganlar
const MODAL_ROUTES: Partial<Record<NotificationType, 'WatchParty' | 'Battle'>> = {
  watch_party_invite: 'WatchParty',
  battle_invite: 'Battle',
  battle_result: 'Battle',
};

interface NotifItemProps {
  item: INotification;
  onPress: (item: INotification) => void;
  onDelete: (id: string) => void;
}

const NotifItem = memo(({ item, onPress, onDelete }: NotifItemProps) => {
  const icon = NOTIF_ICONS[item.type] ?? '🔔';
  const timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });

  return (
    <TouchableOpacity
      style={[styles.item, !item.isRead && styles.itemUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      {!item.isRead && <View style={styles.unreadDot} />}
      <View style={styles.iconBox}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.itemTime}>{timeAgo}</Text>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item._id)} hitSlop={12}>
        <Text style={styles.deleteIcon}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

export default function NotificationsScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const storeMarkRead = useNotificationStore((s) => s.markRead);
  const storeMarkAllRead = useNotificationStore((s) => s.markAllRead);
  const storeRemove = useNotificationStore((s) => s.remove);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await notificationApi.getNotifications(1, 50);
      return res.data ?? [];
    },
    staleTime: 60 * 1000,
  });

  const { mutate: markRead } = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: (_data, id) => {
      storeMarkRead(id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const { mutate: markAllRead, isPending: isMarkingAll } = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      storeMarkAllRead();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const { mutate: deleteNotif } = useMutation({
    mutationFn: (id: string) => notificationApi.deleteNotification(id),
    onSuccess: (_data, id) => {
      storeRemove(id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handlePress = useCallback(
    (item: INotification) => {
      if (!item.isRead) markRead(item._id);
      const route = MODAL_ROUTES[item.type];
      if (!route) return;
      navigation.goBack();
      if (route === 'WatchParty') {
        const roomId = item.data?.roomId as string | undefined;
        if (roomId) navigation.navigate('WatchParty', { roomId });
      } else if (route === 'Battle') {
        const battleId = item.data?.battleId as string | undefined;
        if (battleId) navigation.navigate('Battle', { battleId });
      }
    },
    [markRead, navigation],
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Orqaga</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bildirishnomalar</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={() => markAllRead()} disabled={isMarkingAll}>
            {isMarkingAll ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text style={styles.markAll}>Hammasini o'qi</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <NotifItem
              item={item}
              onPress={handlePress}
              onDelete={(id) => deleteNotif(id)}
            />
          )}
          contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyText}>Bildirishnomalar yo'q</Text>
              <Text style={styles.emptySub}>Yangi bildirishnomalar bu yerda ko'rinadi</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { color: colors.textSecondary, fontSize: typography.sizes.md, width: 60 },
  title: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary },
  markAll: { color: colors.primary, fontSize: typography.sizes.sm, width: 80, textAlign: 'right' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingVertical: spacing.sm },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 120 },

  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    position: 'relative',
  },
  itemUnread: { backgroundColor: colors.bgSurface },
  unreadDot: {
    position: 'absolute',
    left: spacing.sm,
    top: spacing.lg + 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 20 },
  itemContent: { flex: 1, gap: 3 },
  itemTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.textPrimary },
  itemBody: { fontSize: typography.sizes.sm, color: colors.textSecondary, lineHeight: 18 },
  itemTime: { fontSize: typography.sizes.xs, color: colors.textMuted },
  deleteBtn: { padding: spacing.xs },
  deleteIcon: { color: colors.textMuted, fontSize: 14 },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: spacing.lg + 42 + spacing.md },

  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontSize: typography.sizes.lg, color: colors.textSecondary, fontWeight: typography.weights.semibold },
  emptySub: { fontSize: typography.sizes.sm, color: colors.textMuted, marginTop: spacing.xs },
});
