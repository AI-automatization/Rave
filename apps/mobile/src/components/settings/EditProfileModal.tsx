// CineSync Mobile — Edit Profile Modal
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { useT } from '@i18n/index';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  username: string;
  onUsernameChange: (v: string) => void;
  bio: string;
  onBioChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}

export function EditProfileModal({
  visible,
  onClose,
  username,
  onUsernameChange,
  bio,
  onBioChange,
  onSave,
  saving,
}: EditProfileModalProps) {
  const { t } = useT();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t('settings', 'editProfile')}</Text>

          <Text style={styles.inputLabel}>{t('profile', 'username')}</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={onUsernameChange}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>{t('profile', 'bio')}</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={bio}
            onChangeText={(txt: string) => onBioChange(txt.slice(0, 200))}
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>{t('common', 'cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.btnDisabled]}
              onPress={onSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color={colors.textPrimary} />
                : <Text style={styles.saveText}>{t('common', 'save')}</Text>}
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
  inputMulti: { height: 80, textAlignVertical: 'top' },
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
