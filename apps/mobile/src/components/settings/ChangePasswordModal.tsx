// CineSync Mobile — Change Password Modal
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { authApi } from '@api/auth.api';
import { useT } from '@i18n/index';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ visible, onClose }: ChangePasswordModalProps) {
  const { t } = useT();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setOldPassword('');
    setNewPassword('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!oldPassword || !newPassword) return;

    if (newPassword.length < 6) {
      Alert.alert(t('common', 'error'), t('settings', 'passwordTooShort'));
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword(oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      onClose();
      Alert.alert(t('settings', 'success'), t('settings', 'passwordChanged'));
    } catch {
      Alert.alert(t('common', 'error'), t('settings', 'oldPasswordError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t('settings', 'changePassword')}</Text>

          <Text style={styles.inputLabel}>{t('settings', 'currentPassword')}</Text>
          <TextInput
            style={styles.input}
            value={oldPassword}
            onChangeText={setOldPassword}
            secureTextEntry
            placeholderTextColor={colors.textMuted}
            placeholder="••••••••"
          />

          <Text style={styles.inputLabel}>{t('settings', 'newPassword')}</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholderTextColor={colors.textMuted}
            placeholder="••••••••"
          />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelText}>{t('common', 'cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator size="small" color={colors.textPrimary} />
                : <Text style={styles.saveText}>{t('settings', 'change')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  title: { ...typography.h2, color: colors.textPrimary },
  inputLabel: { ...typography.label, color: colors.textMuted },
  input: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
  },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { ...typography.body, color: colors.textSecondary },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  saveText: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
});
