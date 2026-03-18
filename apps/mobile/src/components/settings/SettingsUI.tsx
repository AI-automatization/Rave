// CineSync Mobile — Shared settings UI primitives
import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@theme/index';

export function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

interface ToggleRowProps {
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

export function ToggleRow({ label, sub, value, onChange }: ToggleRowProps) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleLeft}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {sub && <Text style={styles.toggleSub}>{sub}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.bgElevated, true: colors.primary }}
        thumbColor={colors.textPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  toggleLeft: { flex: 1, gap: 2 },
  toggleLabel: { ...typography.body, color: colors.textPrimary },
  toggleSub: { ...typography.caption, color: colors.textMuted },
});
