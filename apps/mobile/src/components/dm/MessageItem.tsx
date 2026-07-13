// WeWatch Mobile — DM message bubble: reply quote, forward header, swipe-to-reply gesture.
// Extracted from DMChatScreen.tsx to keep that file under the project's 400-line limit.
import React, { useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { PanGestureHandler, State, type PanGestureHandlerStateChangeEvent, type PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useT } from '@i18n/index';
import type { IDMMessage } from '@app-types/index';
import { formatTime } from '@utils/dmFormat';

const BUBBLE_RADIUS = 20;
// Swipe right-to-left to reply (Telegram/WhatsApp-style, additive to the long-press action
// sheet which still has Reply/Forward/Copy untouched).
// TRIGGER = distance the bubble must travel before release counts as "reply".
// MAX = visual cap so the bubble never slides further than this, even mid-drag.
const SWIPE_REPLY_TRIGGER = 60;
const SWIPE_REPLY_MAX = 76;

export function MessageItem({
  item, currentUserId, onLongPress, onSwipeReply,
}: {
  item: IDMMessage;
  currentUserId: string;
  onLongPress: (m: IDMMessage) => void;
  onSwipeReply: (m: IDMMessage) => void;
}) {
  const isMine = item.senderId === currentUserId;
  const hasReply = !!item.replyToText;
  const isForward = !!item.forwardFrom;
  const { t } = useT();

  // Built-in Animated (no reanimated in this project, see babel.config.js) driven by
  // gesture-handler's PanGestureHandler.
  const translateX = useRef(new Animated.Value(0)).current;
  const hapticFiredRef = useRef(false);

  const onGestureEvent = useRef(
    Animated.event(
      [{ nativeEvent: { translationX: translateX } }],
      {
        useNativeDriver: true,
        listener: (e: PanGestureHandlerGestureEvent) => {
          const tx = e.nativeEvent.translationX;
          if (tx <= -SWIPE_REPLY_TRIGGER && !hapticFiredRef.current) {
            hapticFiredRef.current = true;
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          } else if (tx > -SWIPE_REPLY_TRIGGER && hapticFiredRef.current) {
            hapticFiredRef.current = false;
          }
        },
      },
    ),
  ).current;

  const onHandlerStateChange = (e: PanGestureHandlerStateChangeEvent) => {
    if (e.nativeEvent.oldState !== State.ACTIVE) return;
    const triggered = e.nativeEvent.translationX <= -SWIPE_REPLY_TRIGGER;
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 8 }).start();
    hapticFiredRef.current = false;
    if (triggered) onSwipeReply(item);
  };

  const bubbleX = translateX.interpolate({
    inputRange: [-SWIPE_REPLY_MAX, 0, 1],
    outputRange: [-SWIPE_REPLY_MAX, 0, 0],
    extrapolate: 'clamp',
  });
  const replyIconStyle = {
    opacity: translateX.interpolate({
      inputRange: [-SWIPE_REPLY_TRIGGER, -20, 0],
      outputRange: [1, 0.35, 0],
      extrapolate: 'clamp' as const,
    }),
    transform: [{
      scale: translateX.interpolate({
        inputRange: [-SWIPE_REPLY_TRIGGER, -20, 0],
        outputRange: [1, 0.7, 0.6],
        extrapolate: 'clamp' as const,
      }),
    }],
  };

  return (
    // PanGestureHandler wraps the FULL row (not just the bubble) — dragging from any
    // empty space on the horizontal band a message occupies replies to that message,
    // matching how Telegram/WhatsApp let you start the swipe anywhere in the row.
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      activeOffsetX={-10}
      failOffsetY={[-12, 12]}
    >
      <Animated.View style={[s.msgRow, isMine && s.msgRowMine]}>
        <View style={s.swipeWrap}>
          <Animated.View pointerEvents="none" style={[s.swipeReplyIcon, replyIconStyle]}>
            <Ionicons name="arrow-undo" size={17} color="#7B72F8" />
          </Animated.View>
          <Animated.View style={{ transform: [{ translateX: bubbleX }] }}>
            <Pressable onLongPress={() => onLongPress(item)} delayLongPress={220}>
              <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleOther]}>
                {isForward && (
                  <View style={s.fwdHeader}>
                    <Ionicons name="arrow-redo" size={12} color={isMine ? 'rgba(255,255,255,0.75)' : '#7B72F8'} />
                    <Text style={[s.fwdText, isMine && s.fwdTextMine]} numberOfLines={1}>
                      {t('dm', 'forwardedFrom')}: {item.forwardFrom}
                    </Text>
                  </View>
                )}
                {hasReply && (
                  <View style={[s.replyQuote, isMine && s.replyQuoteMine]}>
                    <Text style={[s.replyQuoteSender, isMine && s.replyQuoteSenderMine]} numberOfLines={1}>
                      {item.replyToSender || ''}
                    </Text>
                    <Text style={[s.replyQuoteText, isMine && s.replyQuoteTextMine]} numberOfLines={1}>
                      {item.replyToText}
                    </Text>
                  </View>
                )}
                <Text style={[s.msgText, isMine && s.msgTextMine]}>{item.text}</Text>
                <View style={s.metaRow}>
                  {item.pinned && (
                    <Ionicons name="pin" size={11} color={isMine ? 'rgba(255,255,255,0.6)' : 'rgba(123,114,248,0.7)'} style={s.pinIcon} />
                  )}
                  <Text style={[s.timeLabel, isMine && s.timeLabelMine]}>{formatTime(item.createdAt)}</Text>
                  {isMine && (
                    <Ionicons
                      name={item.read ? 'checkmark-done' : 'checkmark'}
                      size={14}
                      color={item.read ? '#9C93FF' : 'rgba(255,255,255,0.55)'}
                      style={s.tick}
                    />
                  )}
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
}

const s = StyleSheet.create({
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 1,
  },
  msgRowMine: {
    flexDirection: 'row-reverse',
  },
  swipeWrap: {
    position: 'relative',
    // Percentage maxWidth needs a definite-width ancestor to resolve against — msgRow
    // (a direct FlatList row, full list width) is that ancestor. The layers below this
    // (PanGestureHandler's Animated.View, Pressable, bubble) are intentionally width-less
    // wrappers, so the constraint has to live here, not on `bubble` — putting it there
    // instead made every intermediate wrapper resolve '80%' against an undefined parent
    // width and collapsed message bubbles down to a couple of pixels (text wrapping
    // letter-by-letter).
    maxWidth: '80%',
  },
  swipeReplyIcon: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: -34,
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: BUBBLE_RADIUS,
    gap: 3,
  },
  bubbleMine: {
    backgroundColor: '#7B72F8',
    borderBottomRightRadius: 6,
    shadowColor: '#7B72F8',
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  bubbleOther: {
    backgroundColor: '#1C1C2E',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  fwdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 1,
  },
  fwdText: {
    fontSize: 11,
    fontWeight: '600',
    fontStyle: 'italic',
    color: '#7B72F8',
    maxWidth: 180,
  },
  fwdTextMine: {
    color: 'rgba(255,255,255,0.8)',
  },
  replyQuote: {
    borderLeftWidth: 2.5,
    borderLeftColor: '#7B72F8',
    paddingLeft: 8,
    paddingVertical: 2,
    marginBottom: 3,
    backgroundColor: 'rgba(123,114,248,0.10)',
    borderRadius: 4,
  },
  replyQuoteMine: {
    borderLeftColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  replyQuoteSender: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#9C93FF',
  },
  replyQuoteSenderMine: {
    color: '#fff',
  },
  replyQuoteText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  replyQuoteTextMine: {
    color: 'rgba(255,255,255,0.75)',
  },
  msgText: {
    fontSize: 14.5,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 20,
  },
  msgTextMine: {
    color: '#fff',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 3,
  },
  timeLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.28)',
  },
  timeLabelMine: {
    color: 'rgba(255,255,255,0.55)',
  },
  tick: {
    marginLeft: 1,
  },
  pinIcon: {
    marginRight: 1,
  },
});
