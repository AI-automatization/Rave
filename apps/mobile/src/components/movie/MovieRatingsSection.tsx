// CineSync Mobile — Movie Ratings Section
// Shows all user ratings for a movie with delete option for own rating
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';

export type RatingItem = {
  userId: string;
  username: string;
  score: number;
  review?: string;
  createdAt: string;
};

interface Props {
  ratings: RatingItem[];
  currentUserId?: string;
  onDeleteOwn?: () => void;
}

function StarRow({ score }: { score: number }) {
  const { colors } = useTheme();
  const stars = Math.round(score / 2); // backend 1-10, display 1-5
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={s <= stars ? 'star' : 'star-outline'}
          size={12}
          color={colors.gold}
        />
      ))}
    </View>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
  } catch {
    return '';
  }
}

export function MovieRatingsSection({ ratings, currentUserId, onDeleteOwn }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();

  if (!ratings?.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Baholar ({ratings?.length ?? 0})</Text>
      {(ratings ?? []).slice(0, 6).map((r) => {
        const isOwn = r.userId === currentUserId;
        return (
          <View key={r.userId} style={[styles.row, isOwn && styles.ownRow]}>
            <View style={styles.rowHeader}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>
                    {r.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.username}>{r.username}</Text>
                  <Text style={styles.date}>{formatDate(r.createdAt)}</Text>
                </View>
              </View>
              <View style={styles.rightCol}>
                <StarRow score={r.score} />
                {isOwn && onDeleteOwn && (
                  <TouchableOpacity
                    onPress={onDeleteOwn}
                    style={styles.deleteBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={14} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            {r.review ? (
              <Text style={styles.review} numberOfLines={3}>{r.review}</Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  container: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  row: {
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  ownRow: {
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  metaCol: { gap: 2 },
  username: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  date: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  rightCol: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  deleteBtn: { padding: 2 },
  review: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
}));
