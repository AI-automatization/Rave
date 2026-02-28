import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography } from '@theme/index';
import type { RootStackParams } from '@navigation/types';

type Props = NativeStackScreenProps<RootStackParams, 'BattleCreate'>;

export default function BattleCreateScreen(_props: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>BattleCreateScreen — Sprint 3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.textSecondary, fontSize: typography.sizes.md },
});
