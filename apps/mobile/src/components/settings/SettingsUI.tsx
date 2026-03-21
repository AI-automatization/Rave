// CineSync Mobile — Shared settings UI primitives
import React from 'react';
import { View, Text, Switch } from 'react-native';
import { useTheme, createThemedStyles, spacing, typography } from '@theme/index';

export function SectionHeader({ title }: { title: string }) {
  const styles = useStyles();
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

interface ToggleRowProps {
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

export function ToggleRow({ label, sub, value, onChange }: ToggleRowProps) {
  const { colors } = useTheme();
  const styles = useStyles();
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

const useStyles = createThemedStyles((colors) => ({
  sectionHeader: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.sm,
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
}));
