// WeWatch — ChatPanel styles
import { StyleSheet, Platform } from 'react-native';

const BUBBLE_RADIUS = 18;

export const chatStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#111120',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerTitle: { fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: 0.1 },
  msgCount: { fontSize: 11, color: 'rgba(255,255,255,0.28)' },

  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingBottom: 48,
  },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.22)' },
  emptySub: { fontSize: 12, color: 'rgba(255,255,255,0.14)' },

  list: { padding: 12, gap: 10 },

  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  messageRowMine: { flexDirection: 'row-reverse' },

  // Swipe-to-reply layers (ported from dm/MessageItem.tsx): the icon sits outside the row's
  // right edge and only becomes visible as the row is dragged over it.
  swipeWrap: { position: 'relative' },
  swipeReplyIcon: {
    position: 'absolute',
    top: 0, bottom: 0, right: -34,
    width: 26,
    alignItems: 'center', justifyContent: 'center',
  },

  avatar: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginBottom: 2,
  },
  avatarText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  // Same box as `avatar`, minus the generated background colour — the photo covers it anyway.
  avatarImage: { width: 30, height: 30, borderRadius: 15, flexShrink: 0, marginBottom: 2 },

  bubbleGroup: { maxWidth: '76%', gap: 3 },
  bubbleGroupMine: { alignItems: 'flex-end' },

  senderName: {
    fontSize: 11, fontWeight: '600',
    color: 'rgba(255,255,255,0.42)', paddingLeft: 4,
  },

  bubble: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: BUBBLE_RADIUS, gap: 3 },
  bubbleMine: { backgroundColor: '#7B72F8', borderBottomRightRadius: 5 },
  bubbleOther: {
    backgroundColor: '#1C1C2E', borderBottomLeftRadius: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },

  replyPreview: {
    flexDirection: 'row', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 10, padding: 7, marginBottom: 3,
  },
  replyPreviewMine: { backgroundColor: 'rgba(0,0,0,0.25)' },

  replyAccent: {
    width: 2.5, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.45)', flexShrink: 0,
  },
  replyAccentMine: { backgroundColor: 'rgba(255,255,255,0.65)' },

  replyContent: { flex: 1, minWidth: 0 },
  replyAuthor: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.65)', marginBottom: 1 },
  replyAuthorMine: { color: 'rgba(255,255,255,0.75)' },
  replyText: { fontSize: 11, color: 'rgba(255,255,255,0.42)', lineHeight: 14 },
  replyTextMine: { color: 'rgba(255,255,255,0.58)' },

  messageText: { fontSize: 14, color: 'rgba(255,255,255,0.88)', lineHeight: 20 },
  messageTextMine: { color: '#fff' },

  timeLabel: { fontSize: 9, color: 'rgba(255,255,255,0.28)', alignSelf: 'flex-end', marginTop: 1 },
  timeLabelMine: { color: 'rgba(255,255,255,0.48)' },

  // Reply bar
  replyBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 9,
    backgroundColor: '#111120',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  replyBarAccent: {
    width: 3, height: 30, borderRadius: 2,
    backgroundColor: '#7B72F8', flexShrink: 0,
  },
  replyBarContent: { flex: 1, minWidth: 0 },
  replyBarLabel: { fontSize: 11, fontWeight: '600', color: '#7B72F8', marginBottom: 1 },
  replyBarText: { fontSize: 11, color: 'rgba(255,255,255,0.38)' },

  // Input row
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
    backgroundColor: '#111120',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  input: {
    flex: 1, backgroundColor: '#1C1C2E',
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: '#fff',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#7B72F8',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7B72F8', shadowOpacity: 0.55,
    shadowOffset: { width: 0, height: 0 }, shadowRadius: 12,
    elevation: 8,
  },
  sendBtnOff: {
    backgroundColor: 'rgba(123,114,248,0.30)',
    shadowOpacity: 0, elevation: 0,
  },
});
