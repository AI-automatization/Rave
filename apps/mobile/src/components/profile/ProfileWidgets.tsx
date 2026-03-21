// CineSync Mobile — Profile small reusable widgets
import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { FadeInView } from './ProfileAnimations';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── StatCard ──────────────────────────────────────────────────

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  delay?: number;
  iconColor?: string;
}

export const StatCard = React.memo(function StatCard({
  icon,
  value,
  label,
  delay = 0,
  iconColor,
}: StatCardProps) {
  const { colors } = useTheme();
  const s = useStyles();

  return (
    <FadeInView delay={delay} style={s.statCard}>
      <Ionicons name={icon} size={24} color={iconColor ?? colors.primary} />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </FadeInView>
  );
});

// ─── InfoRow ───────────────────────────────────────────────────

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

export const InfoRow = React.memo(function InfoRow({ icon, label, value }: InfoRowProps) {
  const { colors } = useTheme();
  const s = useStyles();

  return (
    <View style={s.infoRow}>
      <View style={s.infoIconWrap}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
});

// ─── NavItem ───────────────────────────────────────────────────

interface NavItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  delay?: number;
}

export const NavItem = React.memo(function NavItem({
  icon,
  label,
  onPress,
  delay = 0,
}: NavItemProps) {
  const { colors } = useTheme();
  const s = useStyles();

  return (
    <FadeInView delay={delay}>
      <TouchableOpacity style={s.navLink} onPress={onPress} activeOpacity={0.7}>
        <View style={s.navIconWrap}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <Text style={s.navLinkText}>{label}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
      </TouchableOpacity>
    </FadeInView>
  );
});

const useStyles = createThemedStyles((colors) => ({
  statCard: {
    flex: 1,
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textMuted },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { ...typography.caption, color: colors.textMuted, flex: 1 },
  infoValue: {
    ...typography.body,
    color: colors.textPrimary,
    maxWidth: SCREEN_W * 0.45,
    textAlign: 'right',
  },

  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgSurface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLinkText: { ...typography.body, color: colors.textPrimary, flex: 1, fontWeight: '500' },
}));
