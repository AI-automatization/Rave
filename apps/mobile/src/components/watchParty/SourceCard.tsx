// CineSync — SourceCard: media source grid card
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '@theme/index';
import type { MediaSource } from '@constants/mediaSources';

interface Props {
  source: MediaSource;
  onPress: (s: MediaSource) => void;
}

export function SourceCard({ source, onPress }: Props) {
  const isDrm = source.support === 'drm';
  const isInternal = source.support === 'internal';
  const opacity = isInternal ? 0.45 : 1;

  return (
    <TouchableOpacity
      style={[s.card, { opacity }]}
      onPress={() => onPress(source)}
      activeOpacity={0.75}
    >
      <Ionicons name={source.iconName as 'globe'} size={22} color={source.brandColor} />
      <Text style={[s.cardLabel, { color: isDrm ? '#888' : '#fff' }]} numberOfLines={1}>
        {source.label}
      </Text>
      {source.sublabel ? <Text style={s.cardSublabel}>{source.sublabel}</Text> : null}
      {isDrm && (
        <View style={s.drmBadge}>
          <Ionicons name="lock-closed" size={9} color="#888" />
        </View>
      )}
      {isInternal && (
        <View style={s.soonBadge}>
          <Text style={s.soonText}>SOON</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    width: '50%',
    minHeight: 90,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.xl,
    margin: spacing.sm / 2,
    padding: spacing.lg,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardLabel: { fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  cardSublabel: { fontSize: 11, color: '#6B7280', marginTop: -spacing.xs },
  drmBadge: { position: 'absolute', top: spacing.sm, right: spacing.sm },
  soonBadge: {
    position: 'absolute', top: spacing.sm, right: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: borderRadius.sm,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  soonText: { fontSize: 9, color: '#6B7280', fontWeight: '700', letterSpacing: 0.5 },
});
