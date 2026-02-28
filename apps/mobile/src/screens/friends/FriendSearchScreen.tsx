import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography } from '@theme/index';
import type { FriendsStackParams } from '@navigation/types';

type Props = NativeStackScreenProps<FriendsStackParams, 'FriendSearch'>;

export default function FriendSearchScreen(_props: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>FriendSearchScreen — Sprint 3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.textSecondary, fontSize: typography.sizes.md },
});
