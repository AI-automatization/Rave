// CineSync Mobile — Home Hero CTA (Watch Together button)
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, typography, borderRadius } from '@theme/index';

interface HomeCTAProps {
  onPress: () => void;
}

export function HomeCTA({ onPress }: HomeCTAProps) {
  const { colors } = useTheme();
  const s = useStyles();

  return (
    <View style={s.card}>
      <View style={s.iconRow}>
        <View style={s.iconWrap}>
          <Ionicons name="people" size={28} color={colors.primary} />
        </View>
        <View style={s.textWrap}>
          <Text style={s.title}>Do'stlar bilan birga ko'rish</Text>
          <Text style={s.sub} numberOfLines={2}>
            YouTube, VK, Rutube va boshqa manbalardan video tanlang
          </Text>
        </View>
      </View>
      <TouchableOpacity style={s.btn} onPress={onPress} activeOpacity={0.8}>
        <Ionicons name="play-circle" size={18} color={colors.white} />
        <Text style={s.btnText}>Video tanlash</Text>
      </TouchableOpacity>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  card: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    padding: spacing.lg,
    gap: spacing.md,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  sub: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 16,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm + 4,
  },
  btnText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
  },
}));
