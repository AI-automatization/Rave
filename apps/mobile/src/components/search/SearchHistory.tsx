// WeWatch Mobile — SearchHistory component
import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { useTheme, createThemedStyles, spacing, typography } from '@theme/index';

interface SearchHistoryProps {
  history: string[];
  onItemPress: (item: string) => void;
  onItemRemove: (item: string) => void;
  onClear: () => void;
}

export const SearchHistory = React.memo(function SearchHistory({
  history,
  onItemPress,
  onItemRemove,
  onClear,
}: SearchHistoryProps) {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.historySection}>
      <View style={styles.historyHeader}>
        <Text style={styles.sectionLabel}>Oxirgi qidiruvlar</Text>
        <TrackedTouchable trackId="search:clear_history" onPress={onClear}>
          <Text style={styles.clearText}>Tozalash</Text>
        </TrackedTouchable>
      </View>
      <FlatList
        data={history}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TrackedTouchable
            trackId="search:history_item"
            style={styles.historyItem}
            onPress={() => onItemPress(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
            <Text style={styles.historyText}>{item}</Text>
            <TrackedTouchable
              trackId="search:remove_history_item"
              onPress={() => onItemRemove(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={14} color={colors.textMuted} />
            </TrackedTouchable>
          </TrackedTouchable>
        )}
        scrollEnabled={false}
      />
    </View>
  );
});

const useStyles = createThemedStyles((colors) => ({
  historySection: { paddingHorizontal: spacing.xl, marginTop: spacing.lg },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  clearText: { ...typography.caption, color: colors.primary },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyText: { ...typography.body, color: colors.textSecondary, flex: 1 },
}));
