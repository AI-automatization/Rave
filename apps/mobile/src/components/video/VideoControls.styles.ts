// CineSync — VideoControls styles
import { StyleSheet } from 'react-native';
import { spacing, typography, borderRadius } from '@theme/index';

export const s = StyleSheet.create({
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  titleText: { flex: 1, ...typography.h3, textAlign: 'center', color: '#fff' },
  centerControls: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 48,
  },
  skipBtn: { alignItems: 'center', gap: 2 },
  skipLabel: { ...typography.caption, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  playBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 40, width: 72, height: 72,
    alignItems: 'center', justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.lg, paddingTop: spacing.xxl, gap: spacing.sm,
  },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { ...typography.caption, color: '#fff', fontWeight: '600' },
  timeDuration: { ...typography.caption, color: 'rgba(255,255,255,0.6)' },
  seekBarTrack: { height: 24, justifyContent: 'center' },
  seekBarBg: {
    position: 'absolute', left: 0, right: 0,
    height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2,
  },
  seekBarFill: { height: 4, borderRadius: 2 },
  seekThumb: {
    position: 'absolute', width: 14, height: 14, borderRadius: 7, top: 5,
    borderWidth: 2, borderColor: '#fff',
  },
});
