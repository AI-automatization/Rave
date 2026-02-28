import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography } from '@theme/index';
import type { ProfileStackParams } from '@navigation/types';

type Props = NativeStackScreenProps<ProfileStackParams, 'Achievements'>;

export default function AchievementsScreen(_props: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>AchievementsScreen — Sprint 4</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.textSecondary, fontSize: typography.sizes.md },
});
