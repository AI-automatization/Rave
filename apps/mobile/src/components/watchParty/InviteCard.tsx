// CineSync Mobile — WatchParty InviteCard
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@theme/index';

interface InviteCardProps {
  inviteCode: string;
}

export const InviteCard = React.memo(function InviteCard({ inviteCode }: InviteCardProps) {
  return (
    <View style={styles.inviteCard}>
      <Text style={styles.inviteLabel}>INVITE KOD</Text>
      <Text style={styles.inviteCode}>{inviteCode}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  inviteCard: {
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    gap: spacing.xs,
  },
  inviteLabel: { ...typography.label, color: colors.textMuted },
  inviteCode: { ...typography.h2, color: colors.primary, letterSpacing: 4 },
});
