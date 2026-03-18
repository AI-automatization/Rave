// CineSync Mobile — Movie Detail: Header Action Buttons
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@theme/index';

interface MovieDetailActionsProps {
  top: number;
  isFavorite: boolean;
  movieTitle: string;
  shareLabel: string;
  shareMovieLabel: string;
  onBack: () => void;
  onToggleFavorite: () => void;
}

export const MovieDetailActions = React.memo<MovieDetailActionsProps>(
  ({ top, isFavorite, movieTitle, shareLabel, shareMovieLabel, onBack, onToggleFavorite }) => (
    <View style={[styles.headerActions, { top }]}>
      <TouchableOpacity style={styles.headerBtn} onPress={onBack}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.headerBtn} onPress={onToggleFavorite}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorite ? colors.error : colors.textPrimary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => Alert.alert(shareLabel, `"${movieTitle}" ${shareMovieLabel}`)}
        >
          <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  ),
);

MovieDetailActions.displayName = 'MovieDetailActions';

const styles = StyleSheet.create({
  headerActions: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRight: { flexDirection: 'row', gap: spacing.sm },
  headerBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: borderRadius.full,
    padding: spacing.xs,
  },
});
