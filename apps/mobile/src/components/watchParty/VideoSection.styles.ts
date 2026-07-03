// WeWatch — VideoSection styles
import { Dimensions, StyleSheet, Platform } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');
export const VIDEO_HEIGHT = Math.round(SCREEN_W * (9 / 16));

export const videoStyles = StyleSheet.create({
  container: {
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  containerFullscreen: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    height: undefined,
  },

  loadingBox: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  loadingText: { fontSize: 12, color: 'rgba(255,255,255,0.38)', letterSpacing: 0.5 },

  gradientTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 56, backgroundColor: 'rgba(0,0,0,0.48)',
  },
  gradientBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 56, backgroundColor: 'rgba(0,0,0,0.55)',
  },

  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 54,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingTop: Platform.OS === 'ios' ? 4 : 0,
  },
  topRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  topIconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.52)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },

  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.52)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)',
  },
  livePulse: {
    position: 'absolute', left: 7,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: 'rgba(74,222,128,0.25)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' },
  liveTxt: { fontSize: 10, fontWeight: '800', color: '#4ADE80', letterSpacing: 1.2 },

  syncBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.48)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(123,114,248,0.22)',
  },
  syncDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#7B72F8' },
  syncTxt: { fontSize: 10, fontWeight: '800', color: '#7B72F8', letterSpacing: 1.2 },

  centerControls: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 24,
  },

  playPauseBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#7B72F8',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7B72F8', shadowOpacity: 0.65, shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 }, elevation: 12,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
  },

  seekBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center', justifyContent: 'center', gap: 2,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  seekLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.62)', letterSpacing: 0.3 },

  viewerBadge: {
    position: 'absolute', bottom: 18, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
  },
  viewerTxt: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.38)' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingBottom: Platform.OS === 'ios' ? 6 : 4,
  },
});
