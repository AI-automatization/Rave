// WeWatch Mobile — FriendSearchScreen
import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, ListRenderItemInfo } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useFriendSearch } from '@hooks/useFriends';
import { useFriendsStore } from '@store/friends.store';
import { userApi } from '@api/user.api';
import { useTheme, spacing } from '@theme/index';
import { RANK_COLORS } from '@theme/index';
import { IUserPublic, FriendsStackParamList } from '@app-types/index';
import { useT } from '@i18n/index';
import { DEFAULT_AVATAR } from '@utils/assets';
import { useStyles } from './FriendSearchScreen.styles';
import { appAlert } from '@components/common/AppAlert';

type Nav = NativeStackNavigationProp<FriendsStackParamList>;

export function FriendSearchScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useStyles();
  const { t } = useT();
  const [query, setQuery] = useState('');
  const queryClient = useQueryClient();
  const friends = useFriendsStore(s => s.friends);
  const sentRequestIds = useFriendsStore(s => s.sentRequestIds);
  const addSentRequest = useFriendsStore(s => s.addSentRequest);
  const { data: results = [], isFetching } = useFriendSearch(query);

  const sendRequest = useMutation({
    mutationFn: (userId: string) => userApi.sendFriendRequest(userId),
    onMutate: (userId) => { addSentRequest(userId); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['friend-requests'] }); },
    onError: () => { appAlert(t('common', 'error'), t('friends', 'requestError')); },
  });

  const friendIds = new Set(friends.map(f => f._id));

  const getActionState = (userId: string) => {
    if (friendIds.has(userId)) return 'friend';
    if (sentRequestIds.has(userId)) return 'sent';
    return 'none';
  };

  const renderItem = ({ item }: ListRenderItemInfo<IUserPublic>) => {
    const state = getActionState(item._id);
    const rankColor = RANK_COLORS[item.rank];

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('FriendProfile', { userId: item._id })}
        activeOpacity={0.85}
      >
        {/* Avatar with rank ring */}
        <View style={styles.avatarWrap}>
          <View style={[styles.avatarRing, { borderColor: rankColor + '80' }]}>
            <Image
              source={item.avatar ? { uri: item.avatar } : DEFAULT_AVATAR}
              style={styles.avatar}
              contentFit="cover"
            />
          </View>
          {item.isOnline && (
            <View style={[styles.onlineDot, { borderColor: colors.bgElevated }]} />
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.username}>{item.username}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.rankPill, { borderColor: rankColor + '50' }]}>
              <View style={[styles.rankDot, { backgroundColor: rankColor }]} />
              <Text style={[styles.rankLabel, { color: rankColor }]}>{item.rank}</Text>
            </View>
            <Text style={styles.points}>⭐ {item.totalPoints}</Text>
          </View>
          {item.bio ? (
            <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>
          ) : null}
        </View>

        {/* Action */}
        <View style={styles.actionWrap}>
          {state === 'friend' ? (
            <View style={styles.friendPill}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.friendPillText}>{t('friends', 'friendPill')}</Text>
            </View>
          ) : state === 'sent' ? (
            <View style={styles.sentPill}>
              <Ionicons name="time-outline" size={13} color={colors.textMuted} />
              <Text style={styles.sentPillText}>{t('friends', 'sentPill')}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => sendRequest.mutate(item._id)}
              disabled={sendRequest.isPending}
              activeOpacity={0.85}
            >
              <Ionicons name="person-add-outline" size={14} color={colors.white} />
              <Text style={styles.addBtnText}>{t('friends', 'addBtn')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={isFetching ? colors.primary : colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={t('friends', 'searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            autoFocus
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {isFetching && query.length >= 1 ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          ListEmptyComponent={
            query.length >= 1 && !isFetching ? (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="person-outline" size={32} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>{t('watchParty', 'noSearchResults')}</Text>
                <Text style={styles.emptySubtext}>«{query}» не совпадает ни с одним пользователем</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="search-outline" size={32} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>{t('friends', 'searchUsers')}</Text>
                <Text style={styles.emptySubtext}>{t('friends', 'searchUsersHint')}</Text>
              </View>
            )
          }
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

