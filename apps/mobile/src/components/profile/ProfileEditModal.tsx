// CineSync Mobile — Profile edit bottom sheet modal
import React from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';

interface ProfileEditModalProps {
  visible: boolean;
  username: string;
  bio: string;
  isPending: boolean;
  onChangeUsername: (v: string) => void;
  onChangeBio: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
  titleLabel: string;
  usernameLabel: string;
  bioLabel: string;
  cancelLabel: string;
  saveLabel: string;
}

export const ProfileEditModal = React.memo(function ProfileEditModal({
  visible,
  username,
  bio,
  isPending,
  onChangeUsername,
  onChangeBio,
  onSave,
  onClose,
  titleLabel,
  usernameLabel,
  bioLabel,
  cancelLabel,
  saveLabel,
}: ProfileEditModalProps) {
  const { colors } = useTheme();
  const s = useStyles();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.modalOverlay}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={s.modalSheet}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>{titleLabel}</Text>

          <Text style={s.inputLabel}>{usernameLabel}</Text>
          <TextInput
            style={s.modalInput}
            value={username}
            onChangeText={onChangeUsername}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />

          <Text style={s.inputLabel}>{bioLabel}</Text>
          <TextInput
            style={[s.modalInput, s.modalInputMulti]}
            value={bio}
            onChangeText={(txt) => onChangeBio(txt.slice(0, 200))}
            placeholderTextColor={colors.textMuted}
            placeholder="Write something about yourself..."
            multiline
            textAlignVertical="top"
          />
          <Text style={s.charCount}>{bio.length}/200</Text>

          <View style={s.modalActions}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={s.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.saveBtn, isPending && s.btnDisabled]}
              onPress={onSave}
              disabled={isPending}
              activeOpacity={0.8}
            >
              {isPending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={s.saveText}>{saveLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const useStyles = createThemedStyles((colors) => ({
  modalOverlay: { flex: 1, backgroundColor: colors.overlay },
  modalSheet: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: { ...typography.h2, color: colors.textPrimary },
  inputLabel: { ...typography.label, color: colors.textMuted, marginTop: spacing.xs },
  modalInput: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
  },
  modalInputMulti: { height: 90, textAlignVertical: 'top' },
  charCount: { ...typography.caption, color: colors.textDim, textAlign: 'right' },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { ...typography.body, color: colors.textSecondary, fontWeight: '600' },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  saveText: { color: colors.white, fontWeight: '700', fontSize: 15 },
}));
