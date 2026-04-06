// CineSync Mobile — Register form fields with password strength
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { useTheme, createThemedStyles } from '@theme/index';
import { useT } from '@i18n/index';
import { InputRow } from './InputRow';
import type { ThemeColors } from '@theme/index';

interface StrengthLevel { pct: number; label: string; color: string; }

function getStrength(pass: string, t: ReturnType<typeof useT>['t'], colors: ThemeColors): StrengthLevel {
  if (!pass) return { pct: 0, label: '', color: colors.bgElevated };
  let score = 0;
  if (pass.length >= 8) score++;
  if (pass.length >= 12) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  return [
    { pct: 0, label: '', color: colors.bgElevated },
    { pct: 20, label: t('register', 'strengthWeak'), color: colors.passwordWeak },
    { pct: 40, label: t('register', 'strengthFair'), color: colors.passwordFair },
    { pct: 60, label: t('register', 'strengthGood'), color: colors.warning },
    { pct: 80, label: t('register', 'strengthStrong'), color: colors.success },
    { pct: 100, label: t('register', 'strengthVeryStrong'), color: colors.passwordVeryStrong },
  ][score];
}

interface RegisterFormFieldsProps {
  username: string; email: string; password: string; confirm: string;
  showPass: boolean; focusedField: string | null;
  onUsernameChange: (v: string) => void; onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void; onConfirmChange: (v: string) => void;
  onToggleShowPass: () => void; onFocus: (field: string) => void; onBlur: () => void;
}

const useStyles = createThemedStyles((_colors) => ({
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -4, marginBottom: 4 },
  strengthTrack: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700', minWidth: 70, textAlign: 'right', textTransform: 'uppercase', letterSpacing: 0.5 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4, marginBottom: 4 },
  matchText: { fontSize: 12, fontWeight: '600' },
}));

export function RegisterFormFields({
  username, email, password, confirm, showPass, focusedField,
  onUsernameChange, onEmailChange, onPasswordChange, onConfirmChange,
  onToggleShowPass, onFocus, onBlur,
}: RegisterFormFieldsProps) {
  const { t } = useT();
  const { colors } = useTheme();
  const s = useStyles();
  const strengthAnim = useRef(new Animated.Value(0)).current;
  const strength = getStrength(password, t, colors);
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const passwordsMismatch = confirm.length > 0 && password !== confirm;

  useEffect(() => {
    Animated.spring(strengthAnim, { toValue: strength.pct, tension: 60, friction: 10, useNativeDriver: false }).start();
  }, [password]);

  return (
    <>
      <InputRow icon="person-outline" placeholder={t('register', 'usernamePlaceholder')} value={username}
        onChange={onUsernameChange} fieldId="username" isFocused={focusedField === 'username'}
        onFocus={() => onFocus('username')} onBlur={onBlur} />
      <InputRow icon="mail-outline" placeholder={t('register', 'emailPlaceholder')} value={email}
        onChange={onEmailChange} fieldId="email" isFocused={focusedField === 'email'}
        onFocus={() => onFocus('email')} onBlur={onBlur} keyboard="email-address" />
      <InputRow icon="lock-closed-outline" placeholder={t('register', 'passwordPlaceholder')} value={password}
        onChange={onPasswordChange} fieldId="password" isFocused={focusedField === 'password'}
        onFocus={() => onFocus('password')} onBlur={onBlur} secure showPass={showPass} onToggleShowPass={onToggleShowPass} />
      <InputRow icon="shield-checkmark-outline" placeholder={t('register', 'confirmPlaceholder')} value={confirm}
        onChange={onConfirmChange} fieldId="confirm" isFocused={focusedField === 'confirm'}
        onFocus={() => onFocus('confirm')} onBlur={onBlur} secure showPass={false} />

      {password.length > 0 && (
        <View style={s.strengthRow}>
          <View style={s.strengthTrack}>
            <Animated.View style={[s.strengthFill, {
              width: strengthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
              backgroundColor: strength.color,
            }]} />
          </View>
          <Text style={[s.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
        </View>
      )}

      {(passwordsMatch || passwordsMismatch) && (
        <View style={s.matchRow}>
          <Text style={[s.matchText, { color: passwordsMatch ? colors.success : colors.error }]}>
            {passwordsMatch ? t('register', 'passwordsMatch') : t('register', 'errPasswordMatch')}
          </Text>
        </View>
      )}
    </>
  );
}
