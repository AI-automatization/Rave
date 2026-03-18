// CineSync Mobile — WatchParty InviteCard
// Invite code + copy + share + friend list with invite buttons
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { userApi } from '@api/user.api';
import { watchPartyApi } from '@api/watchParty.api';
import { useAuthStore } from '@store/auth.store';
import { useT } from '@i18n/index';
import type { IUserPublic } from '@app-types/index';

interface InviteCardProps {
  inviteCode: string;
  roomId: string;
  roomName: string;
}

export const InviteCard = React.memo(function InviteCard({
  inviteCode,
  roomId,
  roomName,
}: InviteCardProps) {
  const { t } = useT();
  const username = useAuthStore(s => s.user?.username) ?? '';
  const [friends, setFriends] = useState<IUserPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    userApi.getFriends()
      .then(setFriends)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [inviteCode]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `${t('watchParty', 'shareText')}\n\nXona: ${roomName}\nKod: ${inviteCode}`,
      });
    } catch {
      // User cancelled
    }
  }, [inviteCode, roomName, t]);

  const handleInvite = useCallback(async (friendId: string) => {
    setInvitingId(friendId);
    try {
      await watchPartyApi.inviteFriend(roomId, friendId, username);
      setInvitedIds(prev => new Set(prev).add(friendId));
    } catch {
      Alert.alert(t('watchParty', 'inviteFailed'));
    } finally {
      setInvitingId(null);
    }
  }, [roomId, username, t]);

  const renderFriend = useCallback(({ item }: { item: IUserPublic }) => {
    const invited = invitedIds.has(item._id);
    const inviting = invitingId === item._id;

    return (
      <View style={s.friendRow}>
        <View style={s.friendAvatar}>
          <Text style={s.friendAvatarText}>
            {item.username[0]?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text style={s.friendName} numberOfLines={1}>@{item.username}</Text>
        {invited ? (
          <View style={s.invitedBadge}>
            <Ionicons name="checkmark" size={14} color={colors.success} />
          </View>
        ) : (
          <TouchableOpacity
            style={s.inviteBtn}
            onPress={() => handleInvite(item._id)}
            disabled={inviting}
            activeOpacity={0.7}
          >
            {inviting ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <Ionicons name="person-add-outline" size={14} color={colors.textPrimary} />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }, [invitedIds, invitingId, handleInvite]);

  return (
    <View style={s.card}>
      {/* Invite code */}
      <View style={s.codeSection}>
        <Text style={s.label}>{t('watchParty', 'inviteCode')}</Text>
        <View style={s.codeRow}>
          <Text style={s.code}>{inviteCode}</Text>
          <TouchableOpacity style={s.copyBtn} onPress={handleCopy}>
            <Ionicons
              name={copied ? 'checkmark' : 'copy-outline'}
              size={18}
              color={copied ? colors.success : colors.textPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        {copied && <Text style={s.copiedText}>{t('watchParty', 'codeCopied')}</Text>}
      </View>

      {/* Friend list */}
      <View style={s.friendsSection}>
        <Text style={s.label}>{t('watchParty', 'inviteFriends')}</Text>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={s.loader} />
        ) : friends.length === 0 ? (
          <Text style={s.emptyText}>{t('watchParty', 'noFriendsYet')}</Text>
        ) : (
          <FlatList
            data={friends}
            keyExtractor={item => item._id}
            renderItem={renderFriend}
            scrollEnabled={false}
          />
        )}
      </View>
    </View>
  );
});

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    overflow: 'hidden',
  },
  codeSection: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  label: { ...typography.label, color: colors.textMuted },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  code: {
    ...typography.h2,
    color: colors.primary,
    letterSpacing: 4,
    flex: 1,
  },
  copyBtn: {
    padding: spacing.sm,
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.sm,
  },
  shareBtn: {
    padding: spacing.sm,
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.sm,
  },
  copiedText: { ...typography.caption, color: colors.success },

  friendsSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  loader: { paddingVertical: spacing.md },
  emptyText: { ...typography.caption, color: colors.textMuted, paddingVertical: spacing.sm },

  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  friendAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  friendName: { ...typography.body, color: colors.textPrimary, flex: 1 },
  inviteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invitedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.success}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
