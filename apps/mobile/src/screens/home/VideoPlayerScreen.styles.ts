// WeWatch — VideoPlayerScreen styles (themed)
import { Platform, Dimensions } from 'react-native';
import { createThemedStyles } from '@theme/index';

const { width: SW } = Dimensions.get('window');

export const useVideoPlayerStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.black },
  fill: { flex: 1 },

  // ─── Loading overlay ───────────────────────────────────────────────────────
  loadingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  ytLogoWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,0,0,0.08)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
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
    color: colors.white,
    fontSize: 17,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    paddingHorizontal: 40,
    marginBottom: 4,
  },
  loadingHint: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 8,
  },

  // ─── YouTube back pill ─────────────────────────────────────────────────────
  ytBackWrap: {
    position: 'absolute' as const,
    left: 14,
    zIndex: 20,
    borderRadius: 22,
    overflow: 'hidden' as const,
    maxWidth: SW * 0.65,
  },
  ytBackBlur: { borderRadius: 22, overflow: 'hidden' as const },
  ytBackBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  ytBackText: { color: colors.white, fontSize: 13, fontWeight: '600' as const },

  // ─── Top bar ───────────────────────────────────────────────────────────────
  topGrad: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    paddingHorizontal: 14,
    paddingBottom: 48,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' as const },
  backBtnBlur: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
  },
  titleWrap: { flex: 1, alignItems: 'center' as const, paddingHorizontal: 8, marginTop: 4 },
  topTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
    letterSpacing: 0.3,
  },
  topSubtitle: { color: colors.textDim, fontSize: 11, marginTop: 2 },

  // ─── Center controls ─────────────────────────────────────────────────────
  centerWrap: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  centerRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 44 },
  skipButton: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: 1,
  },
  skipText: { color: colors.textSecondary, fontSize: 10, fontWeight: '700' as const },
  playButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  // ─── Bottom bar ──────────────────────────────────────────────────────────
  botGrad: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingTop: 56,
  },
  seekArea: { height: 36, justifyContent: 'center' as const },
  seekTrack: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
  },
  seekFilled: { height: 4, borderRadius: 2, overflow: 'hidden' as const },
  seekThumb: {
    position: 'absolute' as const,
    width: 16,
    height: 16,
    borderRadius: 8,
    top: 10,
    borderWidth: 2.5,
    borderColor: colors.white,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: { elevation: 6 },
    }),
  },
  timeRow: { flexDirection: 'row' as const, alignItems: 'center' as const, marginTop: 4 },
  timeCurrent: { color: colors.white, fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.5 },
  timeSpacer: { flex: 1 },
  timeDuration: { color: colors.textDim, fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.5 },

  // ─── Double-tap overlay ──────────────────────────────────────────────────
  dtOverlay: {
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    width: SW * 0.4,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  dtLeft: { left: 0 },
  dtRight: { right: 0 },
  dtBubble: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 4,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dtText: { color: colors.white, fontSize: 11, fontWeight: '700' as const },

  // ─── Error screen ────────────────────────────────────────────────────────
  errorRoot: { alignItems: 'center' as const, justifyContent: 'center' as const },
  errorIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  errorTitle: { color: colors.white, fontSize: 22, fontWeight: '800' as const, marginBottom: 8, letterSpacing: 0.3 },
  errorMsg: { fontSize: 14, textAlign: 'center' as const, lineHeight: 22, paddingHorizontal: 48, marginBottom: 28 },
  errorBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
  },
  errorBtnText: { color: colors.white, fontWeight: '700' as const, fontSize: 15 },
}));
