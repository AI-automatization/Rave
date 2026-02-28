import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography } from '@theme/index';
import type { SearchStackParams } from '@navigation/types';

type Props = NativeStackScreenProps<SearchStackParams, 'SearchResults'>;

// T-E004 — Sprint 2 da to'liq implement qilinadi
export default function SearchResultsScreen(_props: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>SearchResultsScreen — Sprint 2</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.textSecondary, fontSize: typography.sizes.md },
});
