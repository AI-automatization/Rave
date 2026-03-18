// CineSync Mobile — Register form fields with password strength
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@theme/index';
import { useT } from '@i18n/index';

/* ── Password strength helper ───────────────────── */

interface StrengthLevel {
  pct: number;
  label: string;
  color: string;
}

function getStrength(pass: string, t: ReturnType<typeof useT>['t']): StrengthLevel {
  if (!pass) return { pct: 0, label: '', color: colors.bgElevated };
  let score = 0;
  if (pass.length >= 8) score++;
  if (pass.length >= 12) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  const levels: StrengthLevel[] = [
    { pct: 0, label: '', color: colors.bgElevated },
    { pct: 20, label: t('register', 'strengthWeak'), color: colors.passwordWeak },
    { pct: 40, label: t('register', 'strengthFair'), color: colors.passwordFair },
    { pct: 60, label: t('register', 'strengthGood'), color: colors.warning },
    { pct: 80, label: t('register', 'strengthStrong'), color: colors.success },
    { pct: 100, label: t('register', 'strengthVeryStrong'), color: colors.passwordVeryStrong },
  ];
  return levels[score];
}

/* ── Types ──────────────────────────────────────── */

interface RegisterFormFieldsProps {
  username: string;
  email: string;
  password: string;
  confirm: string;
  showPass: boolean;
  focusedField: string | null;
  onUsernameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onConfirmChange: (v: string) => void;
  onToggleShowPass: () => void;
  onFocus: (field: string) => void;
  onBlur: () => void;
}

/* ── Single input row ───────────────────────────── */

interface InputRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  fieldId: string;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  secure?: boolean;
  showPass?: boolean;
  onToggleShowPass?: () => void;
  keyboard?: 'default' | 'email-address';
}

function InputRow({
  icon,
  placeholder,
  value,
  onChange,
  isFocused,
  onFocus,
  onBlur,
  secure,
  showPass,
  onToggleShowPass,
  keyboard = 'default',
}: InputRowProps) {
  return (
    <View style={[s.inputOuter, isFocused && s.inputOuterFocused]}>
      <Ionicons name={icon} size={17} color={isFocused ? colors.primary : colors.textDim} />
      <TextInput
        style={s.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
        value={value}
        onChangeText={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        keyboardType={keyboard}
        secureTextEntry={secure && !showPass}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {onToggleShowPass && (
        <TouchableOpacity
          onPress={onToggleShowPass}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={showPass ? 'eye-off-outline' : 'eye-outline'}
            size={17}
            color={colors.textDim}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ── Main component ─────────────────────────────── */

export function RegisterFormFields({
  username,
  email,
  password,
  confirm,
  showPass,
  focusedField,
  onUsernameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmChange,
  onToggleShowPass,
  onFocus,
  onBlur,
}: RegisterFormFieldsProps) {
  const { t } = useT();
  const strengthAnim = useRef(new Animated.Value(0)).current;

  const strength = getStrength(password, t);
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const passwordsMismatch = confirm.length > 0 && password !== confirm;

  useEffect(() => {
    Animated.spring(strengthAnim, {
      toValue: strength.pct,
      tension: 60,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [password]);

  return (
    <>
      <InputRow
        icon="person-outline"
        placeholder={t('register', 'usernamePlaceholder')}
        value={username}
        onChange={onUsernameChange}
        fieldId="username"
        isFocused={focusedField === 'username'}
        onFocus={() => onFocus('username')}
        onBlur={onBlur}
      />
      <InputRow
        icon="mail-outline"
        placeholder={t('register', 'emailPlaceholder')}
        value={email}
        onChange={onEmailChange}
        fieldId="email"
        isFocused={focusedField === 'email'}
        onFocus={() => onFocus('email')}
        onBlur={onBlur}
        keyboard="email-address"
      />
      <InputRow
        icon="lock-closed-outline"
        placeholder={t('register', 'passwordPlaceholder')}
        value={password}
        onChange={onPasswordChange}
        fieldId="password"
        isFocused={focusedField === 'password'}
        onFocus={() => onFocus('password')}
        onBlur={onBlur}
        secure
        showPass={showPass}
        onToggleShowPass={onToggleShowPass}
      />
      <InputRow
        icon="shield-checkmark-outline"
        placeholder={t('register', 'confirmPlaceholder')}
        value={confirm}
        onChange={onConfirmChange}
        fieldId="confirm"
        isFocused={focusedField === 'confirm'}
        onFocus={() => onFocus('confirm')}
        onBlur={onBlur}
        secure
        showPass={false}
      />

      {/* Password strength bar */}
      {password.length > 0 && (
        <View style={s.strengthRow}>
          <View style={s.strengthTrack}>
            <Animated.View
              style={[
                s.strengthFill,
                {
                  width: strengthAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: strength.color,
                },
              ]}
            />
          </View>
          <Text style={[s.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
        </View>
      )}

      {/* Password match indicator */}
      {(passwordsMatch || passwordsMismatch) && (
        <View style={s.matchRow}>
          <Ionicons
            name={passwordsMatch ? 'checkmark-circle' : 'close-circle'}
            size={14}
            color={passwordsMatch ? colors.success : colors.error}
          />
          <Text style={[s.matchText, { color: passwordsMatch ? colors.success : colors.error }]}>
            {passwordsMatch ? t('register', 'passwordsMatch') : t('register', 'errPasswordMatch')}
          </Text>
        </View>
      )}
    </>
  );
}

const s = StyleSheet.create({
  inputOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 18,
    gap: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  inputOuterFocused: {
    borderColor: 'rgba(124,58,237,0.45)',
    backgroundColor: 'rgba(124,58,237,0.05)',
  },
  input: { flex: 1, color: colors.textPrimary, fontSize: 15 },

  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: -4,
    marginBottom: 4,
  },
  strengthTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: { height: '100%', borderRadius: 2 },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 70,
    textAlign: 'right',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -4,
    marginBottom: 4,
  },
  matchText: { fontSize: 12, fontWeight: '600' },
});
