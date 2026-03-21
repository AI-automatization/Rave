// CineSync Mobile — WatchParty Join by Invite Code
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { ModalStackParamList } from '@app-types/index';
import { watchPartyApi } from '@api/watchParty.api';

type Nav = NativeStackNavigationProp<ModalStackParamList, 'WatchPartyJoin'>;

const CODE_LENGTH = 6;

export function WatchPartyJoinScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useStyles();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleChangeCode = (text: string) => {
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH);
    setCode(cleaned);
  };

  const handleJoin = async () => {
    if (code.length < CODE_LENGTH) {
      Alert.alert('Xato', `${CODE_LENGTH} belgili kod kiriting`);
      return;
    }
    setLoading(true);
    try {
      const room = await watchPartyApi.joinByInviteCode(code);
      navigation.replace('WatchParty', { roomId: room._id });
    } catch {
      Alert.alert('Xato', 'Noto\'g\'ri kod yoki xona topilmadi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Qo'shilish</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="key-outline" size={56} color={colors.secondary} />
        </View>

        <Text style={styles.heading}>Invite kod kiriting</Text>
        <Text style={styles.sub}>
          Do'stingiz yuborgan {CODE_LENGTH} belgili kodni kiriting
        </Text>

        {/* Code display */}
        <TouchableOpacity onPress={() => inputRef.current?.focus()} activeOpacity={0.9}>
          <View style={styles.codeRow}>
            {Array.from({ length: CODE_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.codeBox,
                  code.length === i && styles.codeBoxActive,
                  i < code.length && styles.codeBoxFilled,
                ]}
              >
                <Text style={styles.codeChar}>{code[i] ?? ''}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        {/* Hidden input */}
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={handleChangeCode}
          autoCapitalize="characters"
          autoCorrect={false}
          keyboardType="default"
          maxLength={CODE_LENGTH}
          style={styles.hiddenInput}
          autoFocus
        />

        <TouchableOpacity
          style={[styles.joinBtn, (loading || code.length < CODE_LENGTH) && styles.joinBtnDisabled]}
          onPress={handleJoin}
          disabled={loading || code.length < CODE_LENGTH}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <>
              <Ionicons name="enter-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.joinBtnText}>Qo'shilish</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const useStyles = createThemedStyles((colors) => ({
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    gap: spacing.lg,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heading: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  sub: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  codeRow: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.lg },
  codeBox: {
    width: 44,
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBoxActive: { borderColor: colors.secondary },
  codeBoxFilled: { borderColor: colors.primary, backgroundColor: colors.bgSurface },
  codeChar: { ...typography.h2, color: colors.textPrimary, letterSpacing: 2 },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.secondary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxxl,
    borderRadius: borderRadius.lg,
    width: '100%',
  },
  joinBtnDisabled: { opacity: 0.45 },
  joinBtnText: { ...typography.h3, color: colors.textPrimary },
}));
