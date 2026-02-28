import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography } from '@theme/index';
import type { RootStackParams } from '@navigation/types';

type Props = NativeStackScreenProps<RootStackParams, 'Notifications'>;

// T-E010 — Sprint 4 da to'liq implement qilinadi
export default function NotificationsScreen(_props: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>NotificationsScreen — Sprint 4</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.textSecondary, fontSize: typography.sizes.md },
});
