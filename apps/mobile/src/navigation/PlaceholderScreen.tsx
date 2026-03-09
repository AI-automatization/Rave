// Vaqtinchalik placeholder — har bir ekran T-E002+ da yoziladi
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { colors } from '@theme/index';

export function PlaceholderScreen() {
  const route = useRoute();
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{route.name}</Text>
      <Text style={styles.sub}>Tez orada...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: colors.primary, fontSize: 20, fontWeight: '700' },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: 6 },
});
