// WeWatch Mobile — WatchParty InviteCard
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, Share, Linking, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
// `/legacy` — SDK 54+ moved the default `expo-file-system` export to a new File/Directory class
// API whose exact method signatures aren't reliably knowable without a device to verify against;
// the legacy path keeps the well-established `downloadAsync`/`cacheDirectory` API this needs.
import * as FileSystem from 'expo-file-system/legacy';
// Named `InstagramShare` (not `Share`) — the RN core `Share` API above is already used for the
// plain native share sheet; both default-export as "Share" and would otherwise collide.
// `Social` imported separately: the default export's own `.Social` property is typed as plain
// `string`, which `shareSingle`'s options type rejects — only the named enum satisfies it.
import InstagramShare, { Social } from 'react-native-share';
import { Ionicons } from '@expo/vector-icons';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { useTheme } from '@theme/index';
import { useInviteCardStyles } from './InviteCard.styles';
import { userApi } from '@api/user.api';
import { watchPartyApi } from '@api/watchParty.api';
import { notificationApi } from '@api/notification.api';
import { useAuthStore } from '@store/auth.store';
import { useT } from '@i18n/index';
import type { IUserPublic } from '@app-types/index';
import { appAlert } from '@components/common/AppAlert';

interface InviteCardProps { inviteCode: string; roomId: string; roomName: string; }

export const InviteCard = React.memo(function InviteCard({ inviteCode, roomId, roomName }: InviteCardProps) {
  const { t, lang } = useT();
  const { colors } = useTheme();
  const s = useInviteCardStyles();
  const username = useAuthStore(st => st.user?.username) ?? '';
  const accessToken = useAuthStore(st => st.accessToken);
  const [friends, setFriends] = useState<IUserPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharingStory, setSharingStory] = useState(false);

  useEffect(() => {
    userApi.getFriends().then(setFriends).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const shareUrl = `https://app.wewatch.uz/room/${roomId}?code=${inviteCode}`;

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  const handleShareTelegram = useCallback(async () => {
    try {
      const link = await notificationApi.getTelegramShareLink(inviteCode);
      if (link) {
        await Linking.openURL(link);
      }
    } catch {
      // Fallback: native share with invite code
      try {
        await Share.share({
          message: `${t('watchParty', 'shareRoomMessage')}\n\n${t('watchParty', 'inviteCode')}: ${inviteCode}`,
        });
      } catch { /* User cancelled */ }
    }
  }, [inviteCode, t]);

  const handleShareNative = useCallback(async () => {
    try {
      const shareMessage = `${t('watchParty', 'shareRoomMessage')}\n\n` +
        `${roomName}\n\n` +
        `${shareUrl}`;
      await Share.share({ message: shareMessage });
    } catch { /* User cancelled */ }
  }, [roomName, shareUrl, t]);

  // T-S179 — checked BEFORE attempting the share, not just in a catch, so "Instagram isn't
  // installed" gets its own clear message instead of looking identical to a real failure
  // (network error, expired token, etc.) that the user could otherwise just retry.
  // Android: isPackageInstalled queries com.instagram.android directly (needs the <queries>
  // manifest entry from plugins/withInstagramQueries.js on API 30+, or this always says false).
  // iOS: canOpenURL against the custom scheme (needs LSApplicationQueriesSchemes in app.json).
  const isInstagramInstalled = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const result = await InstagramShare.isPackageInstalled('com.instagram.android');
        return result.isInstalled;
      } catch {
        return false;
      }
    }
    try {
      return await Linking.canOpenURL('instagram-stories://share');
    } catch {
      return false;
    }
  }, []);

  // T-S178 — story-image is rendered server-side (apps/app-web/.../story-image/route.tsx) so web
  // and mobile stories look identical; this just downloads that PNG and hands it to Instagram.
  // Meta App ID 2239499546865583 (WeWatch Automation) is only for the attributionURL sticker on
  // iOS — no Graph API permission or App Review needed for this use case.
  const handleShareInstagramStory = useCallback(async () => {
    if (!accessToken) return;
    setSharingStory(true);
    try {
      if (!(await isInstagramInstalled())) {
        appAlert(
          t('watchParty', 'instagramNotInstalledTitle'),
          t('watchParty', 'instagramNotInstalledBody'),
          [
            { text: t('common', 'cancel'), style: 'cancel' },
            { text: t('watchParty', 'shareNative'), onPress: () => { void handleShareNative(); } },
          ],
        );
        return;
      }

      const storyImageUrl = `https://app.wewatch.uz/api/rooms/${roomId}/story-image?lang=${lang}`;
      const localPath = `${FileSystem.cacheDirectory}story-${roomId}.png`;
      const { uri } = await FileSystem.downloadAsync(storyImageUrl, localPath, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      await InstagramShare.shareSingle({
        social: Social.InstagramStories,
        backgroundImage: uri,
        attributionURL: shareUrl,
        appId: '2239499546865583',
      });
    } catch {
      // Instagram IS installed but the share itself failed (corrupt download, OS rejected the
      // intent, etc.) — a genuine error, distinct from the "not installed" branch above, still
      // worth a working fallback rather than a dead end.
      appAlert(t('watchParty', 'shareInstagramFailed'));
    } finally {
      setSharingStory(false);
    }
  }, [accessToken, roomId, lang, shareUrl, t, isInstagramInstalled, handleShareNative]);

  const handleInvite = useCallback(async (friendId: string) => {
    setInvitingId(friendId);
    try {
      await watchPartyApi.inviteFriend(roomId, friendId, username);
      setInvitedIds(prev => new Set(prev).add(friendId));
    } catch {
      appAlert(t('watchParty', 'inviteFailed'));
    } finally { setInvitingId(null); }
  }, [roomId, username, t]);

  const renderFriend = useCallback(({ item }: { item: IUserPublic }) => {
    const invited = invitedIds.has(item._id);
    const inviting = invitingId === item._id;
    return (
      <View style={s.friendRow}>
        <View style={s.friendAvatar}>
          <Text style={s.friendAvatarText}>{item.username[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={s.friendName} numberOfLines={1}>@{item.username}</Text>
        {invited ? (
          <View style={s.invitedBadge}><Ionicons name="checkmark" size={14} color={colors.success} /></View>
        ) : (
          <TrackedTouchable trackId="invite:invite_friend" style={s.inviteBtn} onPress={() => handleInvite(item._id)} disabled={inviting} activeOpacity={0.7}>
            {inviting ? <ActivityIndicator size="small" color={colors.textPrimary} />
              : <Ionicons name="person-add-outline" size={14} color={colors.textPrimary} />}
          </TrackedTouchable>
        )}
      </View>
    );
  }, [invitedIds, invitingId, handleInvite, s, colors]);

  return (
    <View style={s.card}>
      <View style={s.codeSection}>
        <Text style={s.label}>{t('watchParty', 'inviteCode')}</Text>
        <View style={s.codeRow}>
          <Text style={s.code}>{inviteCode}</Text>
          <TrackedTouchable trackId="invite:copy_code" style={s.copyBtn} onPress={handleCopy}>
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={copied ? colors.success : colors.textPrimary} />
          </TrackedTouchable>
        </View>
        {copied && <Text style={s.copiedText}>{t('watchParty', 'codeCopied')}</Text>}
      </View>

      <View style={s.shareSection}>
        <TrackedTouchable trackId="invite:share_telegram" style={s.telegramBtn} onPress={handleShareTelegram} activeOpacity={0.7}>
          <Ionicons name="paper-plane-outline" size={16} color="#fff" />
          <Text style={s.telegramBtnText}>{t('watchParty', 'shareViaTelegram')}</Text>
        </TrackedTouchable>
        <TrackedTouchable trackId="invite:share_native" style={s.nativeShareBtn} onPress={handleShareNative} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={16} color={colors.textPrimary} />
          <Text style={s.nativeShareBtnText}>{t('watchParty', 'shareNative')}</Text>
        </TrackedTouchable>
        <TrackedTouchable
          trackId="invite:share_instagram_story"
          style={s.instagramBtn}
          onPress={handleShareInstagramStory}
          disabled={sharingStory}
          activeOpacity={0.7}
          accessibilityLabel={t('watchParty', 'shareInstagramStory')}
        >
          {sharingStory
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="logo-instagram" size={18} color="#fff" />}
        </TrackedTouchable>
      </View>

      <View style={s.friendsSection}>
        <Text style={s.label}>{t('watchParty', 'inviteFriends')}</Text>
        {loading ? <ActivityIndicator size="small" color={colors.primary} style={s.loader} />
          : friends.length === 0 ? <Text style={s.emptyText}>{t('watchParty', 'noFriendsYet')}</Text>
          : <FlatList data={friends} keyExtractor={item => item._id} renderItem={renderFriend} scrollEnabled={false} />}
      </View>
    </View>
  );
});
