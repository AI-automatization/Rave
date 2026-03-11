// CineSync Mobile — WatchPartyCreateScreen
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { watchPartyApi } from '@api/watchParty.api';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { ModalStackParamList } from '@app-types/index';

type Nav = NativeStackNavigationProp<ModalStackParamList, 'WatchPartyCreate'>;

const MAX_MEMBERS_OPTIONS = [2, 4, 6, 8, 10];

export function WatchPartyCreateScreen() {
  const navigation = useNavigation<Nav>();
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxMembers, setMaxMembers] = useState(4);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!roomName.trim()) {
      Alert.alert('Xato', 'Xona nomi kiriting');
      return;
    }

    setLoading(true);
    try {
      const room = await watchPartyApi.createRoom({
        name: roomName.trim(),
        isPrivate,
        maxMembers,
      });
      navigation.replace('WatchParty', { roomId: room._id });
    } catch {
      Alert.alert('Xato', 'Xona yaratib bo\'lmadi. Qayta urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Watch Party yaratish</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Room name */}
        <View style={styles.field}>
          <Text style={styles.label}>XONA NOMI</Text>
          <TextInput
            style={styles.input}
            value={roomName}
            onChangeText={setRoomName}
            placeholder="Masalan: Kecha filmlar kechasi 🎬"
            placeholderTextColor={colors.textMuted}
            maxLength={50}
          />
          <Text style={styles.charCount}>{roomName.length}/50</Text>
        </View>

        {/* Private toggle */}
        <View style={styles.field}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons
                name={isPrivate ? 'lock-closed' : 'globe-outline'}
                size={20}
                color={colors.secondary}
              />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{isPrivate ? 'Shaxsiy' : 'Ommaviy'}</Text>
                <Text style={styles.rowSub}>
                  {isPrivate ? 'Faqat invite kod orqali kirish' : 'Barcha qo\'shila oladi'}
                </Text>
              </View>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: colors.bgElevated, true: colors.primary }}
              thumbColor={colors.textPrimary}
            />
          </View>
        </View>

        {/* Max members */}
        <View style={styles.field}>
          <Text style={styles.label}>MAKSIMAL A'ZOLAR</Text>
          <View style={styles.membersRow}>
            {MAX_MEMBERS_OPTIONS.map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.memberChip, maxMembers === n && styles.memberChipActive]}
                onPress={() => setMaxMembers(n)}
              >
                <Text style={[styles.memberChipText, maxMembers === n && styles.memberChipTextActive]}>
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={16} color={colors.secondary} />
          <Text style={styles.infoText}>
            Xona yaratilgach invite kod hosil bo'ladi. Do'stlaringizga yuboring!
          </Text>
        </View>
      </ScrollView>

      {/* Create button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createBtn, loading && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <>
              <Ionicons name="play-circle" size={20} color={colors.textPrimary} />
              <Text style={styles.createBtnText}>Xona yaratish</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  title: { ...typography.h2, color: colors.textPrimary },
  content: { padding: spacing.lg, gap: spacing.xl },
  field: { gap: spacing.sm },
  label: { ...typography.label, color: colors.textMuted },
  input: {
    backgroundColor: colors.bgElevated,
    color: colors.textPrimary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  charCount: { ...typography.caption, color: colors.textMuted, textAlign: 'right' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  rowText: { gap: 2 },
  rowTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  rowSub: { ...typography.caption, color: colors.textMuted },
  membersRow: { flexDirection: 'row', gap: spacing.sm },
  memberChip: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  memberChipText: { ...typography.body, color: colors.textMuted, fontWeight: '600' },
  memberChipTextActive: { color: colors.textPrimary },
  infoCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  infoText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { ...typography.h3, color: colors.textPrimary },
});
