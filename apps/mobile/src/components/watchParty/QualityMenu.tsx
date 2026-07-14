// WeWatch Mobile — QualityMenu (E68-1)
// Bottom sheet modal — video sifat tanlash
import React from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  Dimensions,
  SafeAreaView,
  ListRenderItemInfo,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { useTheme, spacing, borderRadius, typography } from '@theme/index';
import { useT } from '@i18n/index';

export interface QualityOption {
  label: string;
  url: string;
}

interface Props {
  visible: boolean;
  qualities: QualityOption[];
  currentUrl: string;
  onSelect: (option: QualityOption) => void;
  onClose: () => void;
}

const SCREEN_H = Dimensions.get('window').height;

export function QualityMenu({ visible, qualities, currentUrl, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useT();

  const renderItem = ({ item }: ListRenderItemInfo<QualityOption>) => {
    const isActive = item.url === currentUrl;
    return (
      <TrackedTouchable
        trackId="quality_menu:select_quality"
        style={[styles.item, isActive && { backgroundColor: `${colors.primary}18` }]}
        onPress={() => { onSelect(item); onClose(); }}
        activeOpacity={0.7}
      >
        <Text style={[styles.itemLabel, { color: isActive ? colors.primary : colors.textSecondary },
          isActive && styles.itemLabelActive]}>
          {item.label}
        </Text>
        {isActive && <Ionicons name="checkmark" size={18} color={colors.primary} />}
      </TrackedTouchable>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TrackedTouchable trackId="quality_menu:backdrop_close" style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <SafeAreaView style={[styles.sheet, { backgroundColor: colors.bgElevated }]} pointerEvents="box-none">
        <View style={[styles.handle, { backgroundColor: colors.bgMuted }]} />
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t('watchParty', 'quality')}</Text>
          <TrackedTouchable trackId="quality_menu:close" onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TrackedTouchable>
        </View>
        <FlatList
          data={qualities}
          keyExtractor={(item) => item.url}
          renderItem={renderItem}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    maxHeight: SCREEN_H * 0.5,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    borderBottomWidth: 0.5,
  },
  title: { ...typography.h3 },
  list: { marginTop: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  itemLabel: { ...typography.body, fontSize: 15 },
  itemLabelActive: { fontWeight: '600' },
});
