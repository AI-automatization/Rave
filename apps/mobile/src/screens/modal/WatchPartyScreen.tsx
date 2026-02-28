import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography } from '@theme/index';
import type { RootStackParams } from '@navigation/types';

type Props = NativeStackScreenProps<RootStackParams, 'WatchParty'>;

// T-E006 — Sprint 3 da to'liq implement qilinadi
export default function WatchPartyScreen(_props: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>WatchPartyScreen — Sprint 3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.textSecondary, fontSize: typography.sizes.md },
});
