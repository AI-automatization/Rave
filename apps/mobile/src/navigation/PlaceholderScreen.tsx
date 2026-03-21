// Vaqtinchalik placeholder — har bir ekran T-E002+ da yoziladi
import React from 'react';
import { View, Text } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { createThemedStyles } from '@theme/index';

export function PlaceholderScreen() {
  const route = useRoute();
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{route.name}</Text>
      <Text style={styles.sub}>Tez orada...</Text>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: colors.primary, fontSize: 20, fontWeight: '700' },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: 6 },
}));
