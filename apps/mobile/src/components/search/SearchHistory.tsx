// CineSync Mobile — SearchHistory component
import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@theme/index';

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
  return (
    <View style={styles.historySection}>
      <View style={styles.historyHeader}>
        <Text style={styles.sectionLabel}>Oxirgi qidiruvlar</Text>
        <TouchableOpacity onPress={onClear}>
          <Text style={styles.clearText}>Tozalash</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={history}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.historyItem}
            onPress={() => onItemPress(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
            <Text style={styles.historyText}>{item}</Text>
            <TouchableOpacity
              onPress={() => onItemRemove(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        scrollEnabled={false}
      />
    </View>
  );
});

const styles = StyleSheet.create({
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
});
