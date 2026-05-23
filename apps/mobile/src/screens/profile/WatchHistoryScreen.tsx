// WeWatch Mobile — Watch History Screen (stub — history tracking removed)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { useT } from '@i18n/index';

export function WatchHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useT();

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.bgBase }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{t('profile', 'watchHistory')}</Text>
      <Text style={[styles.empty, { color: colors.textSecondary }]}>{t('common', 'noData')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  empty: { fontSize: 15, textAlign: 'center' },
});
