// WeWatch Mobile — UserActionSheet: tap a member → see options
import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback,
  StyleSheet, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { spacing, borderRadius } from '@theme/index';
import { useT } from '@i18n/index';

interface Props {
  visible: boolean;
  userId: string;
  username: string;
  avatar?: string | null;
  isSelf: boolean;
  onClose: () => void;
  onViewProfile: () => void;
  onSendMessage: () => void;
  onReport: () => void;
  onBlock: () => void;
}

function avatarColor(id: string): string {
  const palette = ['#7B72F8', '#F87171', '#34D399', '#FBBF24', '#60A5FA', '#F472B6', '#A78BFA'];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

interface RowProps {
  icon: string;
  label: string;
  destructive?: boolean;
  onPress: () => void;
}

function ActionRow({ icon, label, destructive, onPress }: RowProps) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.75}>
      <Ionicons name={icon as never} size={20} color={destructive ? '#F87171' : 'rgba(255,255,255,0.72)'} />
      <Text style={[s.rowLabel, destructive && s.rowLabelDestructive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function UserActionSheet({
  visible, userId, username, avatar, isSelf,
  onClose, onViewProfile, onSendMessage, onReport, onBlock,
}: Props) {
  const { t } = useT();
  const bg = avatarColor(userId);
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.backdrop} />
      </TouchableWithoutFeedback>

      <View style={s.sheet}>
        {/* Handle */}
        <View style={s.handle} />

        {/* User info header */}
        <View style={s.userRow}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={[s.avatar, { borderColor: bg }]} contentFit="cover" />
          ) : (
            <View style={[s.avatarFallback, { backgroundColor: bg }]}>
              <Text style={s.avatarInitials}>{initials}</Text>
            </View>
          )}
          <Text style={s.username}>{username}</Text>
        </View>

        <View style={s.divider} />

        {/* Actions */}
        <ActionRow
          icon="person-outline"
          label={t('dm', 'viewProfile')}
          onPress={onViewProfile}
        />
        {!isSelf && (
          <ActionRow
            icon="chatbubble-outline"
            label={t('dm', 'sendMessage')}
            onPress={onSendMessage}
          />
        )}
        {!isSelf && (
          <>
            <View style={s.divider} />
            <ActionRow
              icon="flag-outline"
              label={t('friends', 'reportBtn')}
              onPress={onReport}
            />
            <ActionRow
              icon="ban-outline"
              label={t('friends', 'blockUser')}
              destructive
              onPress={onBlock}
            />
          </>
        )}

        <View style={s.divider} />
        <TouchableOpacity style={s.cancelRow} onPress={onClose} activeOpacity={0.75}>
          <Text style={s.cancelLabel}>{t('common', 'cancel')}</Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && <View style={{ height: 20 }} />}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111120',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: 12,
    paddingHorizontal: spacing.md,
    paddingBottom: Platform.OS === 'android' ? spacing.lg : 0,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 20,
    elevation: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: 18,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: 4,
    paddingBottom: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  rowLabel: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  rowLabelDestructive: {
    color: '#F87171',
  },
  cancelRow: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelLabel: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.40)',
    fontWeight: '500',
  },
});
