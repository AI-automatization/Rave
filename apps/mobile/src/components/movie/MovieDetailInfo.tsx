// CineSync Mobile — Movie detail info block (poster + meta + genres + desc + buttons)
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import type { IMovie, IWatchProgress } from '@app-types/index';

interface MovieDetailInfoProps {
  movie: IMovie;
  watchProgress?: IWatchProgress | null;
  onWatch: () => void;
  onWatchParty: () => void;
  playLabel: string;
  continueLabel: string;
  watchPartyLabel: string;
  showMoreLabel: string;
  showLessLabel: string;
}

export const MovieDetailInfo = React.memo(function MovieDetailInfo({
  movie,
  watchProgress,
  onWatch,
  onWatchParty,
  playLabel,
  continueLabel,
  watchPartyLabel,
  showMoreLabel,
  showLessLabel,
}: MovieDetailInfoProps) {
  const [descExpanded, setDescExpanded] = useState(false);
  const durationText = `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m`;

  return (
    <View>
      {/* Info Row */}
      <View style={s.infoRow}>
        <Image source={{ uri: movie.posterUrl }} style={s.poster} contentFit="cover" />
        <View style={s.infoText}>
          <Text style={s.title}>{movie.title}</Text>
          <Text style={s.meta}>{movie.year} · {durationText}</Text>
          <View style={s.ratingRow}>
            <Ionicons name="star" size={13} color={colors.gold} />
            <Text style={s.ratingNum}>{movie.rating.toFixed(1)}</Text>
            <Text style={s.metaSmall}>/ 10</Text>
          </View>
          <View style={s.typeChip}>
            <Text style={s.typeText}>{movie.type.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Genres */}
      <View style={s.genres}>
        {movie.genre.map((g) => (
          <View key={g} style={s.chip}>
            <Text style={s.chipText}>{g}</Text>
          </View>
        ))}
      </View>

      {/* Description */}
      <View style={s.descWrap}>
        <Text style={s.desc} numberOfLines={descExpanded ? undefined : 3}>
          {movie.description}
        </Text>
        {movie.description && movie.description.length > 120 && (
          <TouchableOpacity onPress={() => setDescExpanded(e => !e)}>
            <Text style={s.descToggle}>
              {descExpanded ? showLessLabel : showMoreLabel}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Watch Button */}
      <TouchableOpacity style={s.watchBtn} onPress={onWatch} activeOpacity={0.85}>
        <Ionicons name="play-circle" size={22} color={colors.primaryContent} />
        <Text style={s.watchText}>
          {watchProgress?.progress ? continueLabel : playLabel}
        </Text>
      </TouchableOpacity>

      {/* Watch Party Button */}
      <TouchableOpacity style={s.watchPartyBtn} onPress={onWatchParty} activeOpacity={0.85}>
        <Ionicons name="people-outline" size={20} color={colors.primary} />
        <Text style={s.watchPartyText}>{watchPartyLabel}</Text>
      </TouchableOpacity>
    </View>
  );
});

const s = StyleSheet.create({
  infoRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg },
  poster: { width: 100, height: 148, borderRadius: borderRadius.md },
  infoText: { flex: 1, gap: spacing.sm },
  title: { ...typography.h2, flexWrap: 'wrap' },
  meta: { ...typography.body },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  ratingNum: { ...typography.body, color: colors.gold, fontWeight: '700' },
  metaSmall: { ...typography.caption },
  typeChip: {
    backgroundColor: colors.secondary + '22',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  typeText: { ...typography.label, color: colors.secondary },
  genres: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { ...typography.caption, color: colors.textSecondary },
  descWrap: { marginBottom: spacing.xl, gap: spacing.xs },
  desc: { ...typography.body, lineHeight: 22 },
  descToggle: { ...typography.caption, color: colors.primary, fontWeight: '600', marginTop: spacing.xs },
  watchBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
  },
  watchText: { ...typography.h3, color: colors.primaryContent },
  watchPartyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  watchPartyText: { ...typography.h3, color: colors.primary },
});
