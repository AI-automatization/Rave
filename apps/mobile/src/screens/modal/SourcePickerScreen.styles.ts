// CineSync — SourcePickerScreen styles
import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@theme/index';

export const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0F' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  title: { ...typography.h3, color: '#fff', fontWeight: '700' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md, height: 44,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, color: '#fff', fontSize: 15 },
  grid: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxxl },
  urlSection: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  urlLabel: { ...typography.caption, color: '#6B7280', marginBottom: spacing.xs },
  urlRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  urlInput: {
    flex: 1, height: 44,
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md, color: '#fff', fontSize: 14,
  },
  urlBtn: {
    width: 44, height: 44, backgroundColor: colors.primary,
    borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center',
  },
  urlBtnDisabled: { opacity: 0.4 },
  urlErrorText: { ...typography.caption, color: colors.error, marginTop: spacing.xs },
  createRoomBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginTop: spacing.xl, marginHorizontal: spacing.sm / 2,
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg, borderWidth: 1,
    borderColor: 'rgba(229,9,20,0.3)', backgroundColor: 'rgba(229,9,20,0.06)',
  },
  createRoomText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  empty: {
    alignItems: 'center', justifyContent: 'center',
    paddingTop: spacing.xxxl * 2, gap: spacing.md,
  },
  emptyText: { ...typography.body, color: '#4B5563' },
});
