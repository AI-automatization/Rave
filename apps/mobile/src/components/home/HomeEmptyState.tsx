// CineSync Mobile — Home empty state (film database is empty in MVP)
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, typography, borderRadius } from '@theme/index';

interface HomeEmptyStateProps {
  onPickVideo: () => void;
}

export function HomeEmptyState({ onPickVideo }: HomeEmptyStateProps) {
  const { colors } = useTheme();
  const s = useStyles();

  return (
    <View style={s.wrap}>
      <View style={s.iconWrap}>
        <Ionicons name="people-outline" size={52} color={colors.primary} />
      </View>
      <Text style={s.title}>Film bazasi hozircha bo'sh</Text>
      <Text style={s.sub}>
        Video tanlang va do'stlaringiz bilan birga ko'ring!
      </Text>
      <TouchableOpacity style={s.btn} onPress={onPickVideo} activeOpacity={0.8}>
        <Ionicons name="play-circle-outline" size={18} color={colors.primary} />
        <Text style={s.btnText}>Video tanlash va ko'rish</Text>
      </TouchableOpacity>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  sub: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    marginTop: spacing.sm,
  },
  btnText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
}));
