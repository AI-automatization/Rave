import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography } from '@theme/index';
import type { HomeStackParams } from '@navigation/types';

type Props = NativeStackScreenProps<HomeStackParams, 'MovieDetail'>;

// T-E005 — Sprint 2 da to'liq implement qilinadi
export default function MovieDetailScreen(_props: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>MovieDetailScreen — Sprint 2</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.textSecondary, fontSize: typography.sizes.md },
});
