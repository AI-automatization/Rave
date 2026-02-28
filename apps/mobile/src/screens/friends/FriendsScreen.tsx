import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography } from '@theme/index';
import type { FriendsStackParams } from '@navigation/types';

type Props = NativeStackScreenProps<FriendsStackParams, 'Friends'>;

// T-E007 — Sprint 3 da to'liq implement qilinadi
export default function FriendsScreen(_props: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>FriendsScreen — Sprint 3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.textSecondary, fontSize: typography.sizes.md },
});
