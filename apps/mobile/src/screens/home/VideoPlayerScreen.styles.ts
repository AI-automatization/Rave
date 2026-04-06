// CineSync — VideoPlayerScreen styles (extracted from VideoPlayerScreen.tsx)
import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');

export const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  fill: { flex: 1 },

  // ─── Loading overlay ───────────────────────────────────────────────────────
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ytLogoWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,0,0,0.15)',
  },
  loadingRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    marginBottom: 20,
  },
  loadingTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 4,
  },
  loadingHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 8,
  },

  // ─── YouTube back pill ─────────────────────────────────────────────────────
  ytBackWrap: {
    position: 'absolute',
    left: 14,
    zIndex: 20,
    borderRadius: 22,
    overflow: 'hidden',
    maxWidth: SW * 0.65,
  },
  ytBackBlur: { borderRadius: 22, overflow: 'hidden' },
  ytBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  ytBackText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // ─── Top bar ───────────────────────────────────────────────────────────────
  topGrad: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingBottom: 48,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  backBtnBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
  },
  titleWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 8, marginTop: 4 },
  topTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  topSubtitle: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 },

  // ─── Center controls ───────────────────────────────────────────────────────
  centerWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerRow: { flexDirection: 'row', alignItems: 'center', gap: 44 },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: 1,
  },
  skipText: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700' },
  playButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  // ─── Bottom bar ────────────────────────────────────────────────────────────
  botGrad: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingTop: 56,
  },
  seekArea: { height: 36, justifyContent: 'center' },
  seekTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
  },
  seekFilled: { height: 4, borderRadius: 2, overflow: 'hidden' },
  seekThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    top: 10,
    borderWidth: 2.5,
    borderColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: { elevation: 6 },
    }),
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  timeCurrent: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  timeSpacer: { flex: 1 },
  timeDuration: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '500', letterSpacing: 0.5 },

  // ─── Double-tap overlay ────────────────────────────────────────────────────
  dtOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SW * 0.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dtLeft: { left: 0 },
  dtRight: { right: 0 },
  dtBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dtText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // ─── Error screen ──────────────────────────────────────────────────────────
  errorRoot: { alignItems: 'center', justifyContent: 'center' },
  errorIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8, letterSpacing: 0.3 },
  errorMsg: { fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 48, marginBottom: 28 },
  errorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
  },
  errorBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
