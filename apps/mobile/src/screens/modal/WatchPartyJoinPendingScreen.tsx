// WeWatch Mobile — "Waiting for owner approval" screen (Google Meet-style knock, 2026-08-26)
//
// Reached only via JoinRequestPendingError (watchParty.api.ts's joinByInviteCode) — the room the
// user tried to join has requireApproval on. Every authenticated socket already auto-joins
// `user:${userId}` on connect (watchParty.socket.ts, backend) regardless of room membership, so
// JOIN_REQUEST_APPROVED/DENIED reach this screen without ever joining the room's own channel —
// same reason connectSocket() here doesn't need a roomId.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { useT } from '@i18n/index';
import { useAuthStore } from '@store/auth.store';
import { ModalStackParamList } from '@app-types/index';
import { connectSocket, getSocket, SERVER_EVENTS, CLIENT_EVENTS } from '@socket/client';
import { appAlert } from '@components/common/AppAlert';

type Nav = NativeStackNavigationProp<ModalStackParamList, 'WatchPartyJoinPending'>;
type Route = RouteProp<ModalStackParamList, 'WatchPartyJoinPending'>;

export function WatchPartyJoinPendingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { roomId } = route.params;
  const { colors } = useTheme();
  const { t } = useT();
  const styles = useStyles();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [cancelling, setCancelling] = useState(false);
  const settled = useRef(false);

  useEffect(() => {
    if (!accessToken) return;
    const socket = connectSocket(accessToken);

    const onApproved = (data: { roomId: string }) => {
      if (data.roomId !== roomId || settled.current) return;
      settled.current = true;
      navigation.replace('WatchParty', { roomId });
    };
    const onDenied = (data: { roomId: string }) => {
      if (data.roomId !== roomId || settled.current) return;
      settled.current = true;
      appAlert(t('common', 'error'), t('watchParty', 'joinRequestDenied'));
      navigation.goBack();
    };

    socket.on(SERVER_EVENTS.JOIN_REQUEST_APPROVED, onApproved);
    socket.on(SERVER_EVENTS.JOIN_REQUEST_DENIED, onDenied);

    return () => {
      socket.off(SERVER_EVENTS.JOIN_REQUEST_APPROVED, onApproved);
      socket.off(SERVER_EVENTS.JOIN_REQUEST_DENIED, onDenied);
    };
  }, [accessToken, roomId, navigation, t]);

  const handleCancel = () => {
    if (settled.current) return;
    settled.current = true;
    setCancelling(true);
    getSocket()?.emit(CLIENT_EVENTS.CANCEL_JOIN_REQUEST, { roomId });
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
        <Text style={styles.heading}>{t('watchParty', 'joinPendingTitle')}</Text>
        <Text style={styles.sub}>{t('watchParty', 'joinPendingDesc')}</Text>

        <TrackedTouchable
          trackId="watchparty_join_pending:cancel"
          style={styles.cancelBtn}
          onPress={handleCancel}
          disabled={cancelling}
          activeOpacity={0.85}
        >
          <Ionicons name="close-outline" size={20} color={colors.textPrimary} />
          <Text style={styles.cancelBtnText}>{t('watchParty', 'joinRequestCancel')}</Text>
        </TrackedTouchable>
      </View>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgBase },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heading: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  sub: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgElevated,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxxl,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xl,
  },
  cancelBtnText: { ...typography.h3, color: colors.textPrimary },
}));
