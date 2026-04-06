// CineSync Mobile — FriendPicker component (themed + animated)
import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { useFriendPickerStyles } from './FriendPicker.styles';
import type { IUserPublic } from '@app-types/index';

interface FriendPickerProps {
  friends: IUserPublic[];
  selectedFriendIds: string[];
  selectedFriends: IUserPublic[];
  onToggleFriend: (id: string) => void;
}

function FriendRow({ friend, selected, onToggle, index: _index }: {
  friend: IUserPublic; selected: boolean; onToggle: () => void; index: number;
}) {
  const { colors } = useTheme();
  const s = useFriendPickerStyles();
  const scale = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(checkScale, { toValue: selected ? 1 : 0, useNativeDriver: true, friction: 5, tension: 200 }).start();
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
      <TouchableOpacity style={[s.friendRow, selected && s.friendRowSelected]} onPress={handlePress} activeOpacity={0.7}>
        <View style={[s.friendAvatar, selected && { borderColor: colors.primary, borderWidth: 2 }]}>
          <Text style={[s.friendAvatarText, selected && { color: colors.primary }]}>
            {friend.username[0].toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.friendName} numberOfLines={1}>{friend.username}</Text>
          {friend.isOnline && <Text style={s.onlineText}>Online</Text>}
        </View>
        <Animated.View style={[s.checkbox, selected && s.checkboxActive, {
          transform: [{ scale: checkScale.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
        }]}>
          {selected && <Ionicons name="checkmark" size={14} color={colors.white} />}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function FriendPicker({ friends, selectedFriendIds, selectedFriends, onToggleFriend }: FriendPickerProps) {
  const { colors } = useTheme();
  const s = useFriendPickerStyles();
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

      {selectedFriends.length > 0 && (
        <View style={s.selectedFriendsRow}>
          {selectedFriends.map(f => (
            <TouchableOpacity key={f._id} style={s.friendChip} onPress={() => onToggleFriend(f._id)} activeOpacity={0.7}>
              <Text style={s.friendChipText}>@{f.username}</Text>
              <Ionicons name="close" size={12} color={colors.white} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={s.friendsList}>
        {friends.map((friend, index) => (
          <FriendRow key={friend._id} friend={friend} selected={selectedFriendIds.includes(friend._id)}
            onToggle={() => onToggleFriend(friend._id)} index={index} />
        ))}
      </View>
    </View>
  );
}
