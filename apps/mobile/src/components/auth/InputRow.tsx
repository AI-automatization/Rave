// CineSync — Reusable form input row with icon + optional password toggle
import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles } from '@theme/index';

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

const useStyles = createThemedStyles((colors) => ({
  inputOuter: {
    flexDirection: 'row', alignItems: 'center', height: 54, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 18,
    gap: 12, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  inputOuterFocused: { borderColor: 'rgba(124,58,237,0.45)', backgroundColor: 'rgba(124,58,237,0.05)' },
  input: { flex: 1, color: colors.textPrimary, fontSize: 15 },
}));

export function InputRow({
  icon, placeholder, value, onChange, isFocused, onFocus, onBlur,
  secure, showPass, onToggleShowPass, keyboard = 'default',
}: InputRowProps) {
  const { colors } = useTheme();
  const s = useStyles();
  return (
    <View style={[s.inputOuter, isFocused && s.inputOuterFocused]}>
      <Ionicons name={icon} size={17} color={isFocused ? colors.primary : colors.textDim} />
      <TextInput style={s.input} placeholder={placeholder} placeholderTextColor={colors.textDim}
        value={value} onChangeText={onChange} onFocus={onFocus} onBlur={onBlur}
        keyboardType={keyboard} secureTextEntry={secure && !showPass}
        autoCapitalize="none" autoCorrect={false} />
      {onToggleShowPass && (
        <TouchableOpacity onPress={onToggleShowPass} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={17} color={colors.textDim} />
        </TouchableOpacity>
      )}
    </View>
  );
}
