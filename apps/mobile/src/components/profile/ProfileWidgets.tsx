// WeWatch Mobile — Profile small reusable widgets (web-style cards)
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { FadeInView } from './ProfileAnimations';

// ─── StatCard (web-style: icon → value → label, centered) ───────

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
      <Ionicons name={icon} size={22} color={iconColor ?? colors.primary} />
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

// ─── ComingSoonItem ────────────────────────────────────────────

interface ComingSoonItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  delay?: number;
  iconColor?: string;
}

export const ComingSoonItem = React.memo(function ComingSoonItem({
  icon,
  label,
  subtitle,
  delay = 0,
  iconColor,
}: ComingSoonItemProps) {
  const { colors } = useTheme();
  const s = useStyles();

  return (
    <FadeInView delay={delay}>
      <View style={[s.navLink, s.comingSoonRow]}>
        <View style={[s.navIconWrap, { backgroundColor: (iconColor ?? colors.primary) + '15' }]}>
          <Ionicons name={icon} size={20} color={iconColor ?? colors.primary} />
        </View>
        <View style={s.comingSoonText}>
          <Text style={[s.navLinkText, s.comingSoonLabel]}>{label}</Text>
          {subtitle ? <Text style={s.comingSoonSub}>{subtitle}</Text> : null}
        </View>
        <View style={s.soonBadge}>
          <Text style={s.soonBadgeText}>SOON</Text>
        </View>
      </View>
    </FadeInView>
  );
});

// ─── SectionHeader ─────────────────────────────────────────────

interface SectionHeaderProps {
  label: string;
}

export const SectionHeader = React.memo(function SectionHeader({ label }: SectionHeaderProps) {
  const s = useStyles();
  return <Text style={s.sectionHeader}>{label}</Text>;
});

const useStyles = createThemedStyles((colors) => ({
  // StatCard — web style: card bg-base-200, centered content
  statCard: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },

  // InfoRow
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
    textAlign: 'right',
    flexShrink: 1,
    maxWidth: '45%',
  },

  // NavItem — web card style
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navIconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLinkText: { ...typography.body, color: colors.textPrimary, flex: 1, fontWeight: '500' },

  // ComingSoonItem
  comingSoonRow: { opacity: 0.65 },
  comingSoonText: { flex: 1, gap: 2 },
  comingSoonLabel: { flex: 0 },
  comingSoonSub: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  soonBadge: {
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  soonBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },

  // SectionHeader
  sectionHeader: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    paddingHorizontal: 2,
  },
}));
