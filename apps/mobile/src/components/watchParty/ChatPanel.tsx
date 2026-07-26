// WeWatch Mobile — WatchParty ChatPanel
import React, { useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, Image, Animated,
  KeyboardAvoidingView, Platform, ListRenderItemInfo,
} from 'react-native';
import {
  PanGestureHandler, State,
  type PanGestureHandlerStateChangeEvent, type PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { useT } from '@i18n/index';
import type { ChatMessage, ReplyTo } from '@store/watchParty.store';
import { chatStyles as s } from './ChatPanel.styles';

// Owned by the store (single definition, see watchParty.store.ts) — re-exported here because
// WatchPartyScreen and friends have always imported these two names from this file.
export type { ChatMessage, ReplyTo };

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSend: (text: string, replyTo?: ReplyTo) => void;
  /** Wired by T-S163's UserProfileSheet. Absent → avatar/name render but don't respond to taps. */
  onOpenProfile?: (userId: string) => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

const SWIPE_REPLY_TRIGGER = 60;
const SWIPE_REPLY_MAX = 76;

function memberColor(userId: string): string {
  const palette = ['#7B72F8', '#F87171', '#34D399', '#FBBF24', '#60A5FA', '#F472B6', '#A78BFA'];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function MessageItem({
  item, currentUserId, onReply, onOpenProfile,
}: {
  item: ChatMessage; currentUserId: string;
  onReply: (msg: ChatMessage) => void;
  onOpenProfile?: (userId: string) => void;
}) {
  const isMine = item.userId === currentUserId;
  const avatarColor = memberColor(item.userId);
  const openProfile = onOpenProfile ? () => onOpenProfile(item.userId) : undefined;

  // Swipe-to-reply, ported 1:1 from dm/MessageItem.tsx — same trigger distance, same haptic,
  // same built-in Animated driver (this project has no reanimated, see babel.config.js).
  // Long-press to reply stays as it was; the two just become alternative ways in.
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
    if (triggered) onReply(item);
  };

  const rowX = translateX.interpolate({
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
    // The handler wraps the FULL row, so the swipe can start anywhere on the message's
    // horizontal band — same reasoning as the DM list.
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      activeOffsetX={-10}
      failOffsetY={[-12, 12]}
    >
      <Animated.View style={s.swipeWrap}>
        <Animated.View pointerEvents="none" style={[s.swipeReplyIcon, replyIconStyle]}>
          <Ionicons name="arrow-undo" size={17} color="#7B72F8" />
        </Animated.View>
        <Animated.View style={{ transform: [{ translateX: rowX }] }}>
          <TrackedTouchable trackId="chat:message" onLongPress={() => onReply(item)} activeOpacity={0.85} delayLongPress={400}>
            <View style={[s.messageRow, isMine && s.messageRowMine]}>
              {!isMine && (
                <TrackedTouchable
                  trackId="chat:open_profile"
                  onPress={openProfile}
                  disabled={!openProfile}
                  activeOpacity={0.7}
                >
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={s.avatarImage} />
                  ) : (
                    <View style={[s.avatar, { backgroundColor: avatarColor }]}>
                      <Text style={s.avatarText}>{item.username[0]?.toUpperCase()}</Text>
                    </View>
                  )}
                </TrackedTouchable>
              )}
              <View style={[s.bubbleGroup, isMine && s.bubbleGroupMine]}>
                {!isMine && (
                  <TrackedTouchable
                    trackId="chat:open_profile_name"
                    onPress={openProfile}
                    disabled={!openProfile}
                    activeOpacity={0.7}
                  >
                    <Text style={s.senderName}>{item.username}</Text>
                  </TrackedTouchable>
                )}
                <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleOther]}>
                  {item.replyTo && (
                    <View style={[s.replyPreview, isMine && s.replyPreviewMine]}>
                      <View style={[s.replyAccent, isMine && s.replyAccentMine]} />
                      <View style={s.replyContent}>
                        <Text style={[s.replyAuthor, isMine && s.replyAuthorMine]}>
                          {item.replyTo.senderName}
                        </Text>
                        <Text style={[s.replyText, isMine && s.replyTextMine]} numberOfLines={1}>
                          {item.replyTo.text}
                        </Text>
                      </View>
                    </View>
                  )}
                  <Text style={[s.messageText, isMine && s.messageTextMine]}>{item.text}</Text>
                  <Text style={[s.timeLabel, isMine && s.timeLabelMine]}>{formatTime(item.timestamp)}</Text>
                </View>
              </View>
            </View>
          </TrackedTouchable>
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
  );
}

export function ChatPanel({ messages, currentUserId, onSend, onOpenProfile }: ChatPanelProps) {
  const { t } = useT();
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const handleReply = (msg: ChatMessage) => {
    setReplyTo({ messageId: msg.id, senderName: msg.username, text: msg.text });
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed, replyTo ?? undefined);
    setInput('');
    setReplyTo(null);
  };

  const renderItem = ({ item }: ListRenderItemInfo<ChatMessage>) => (
    <MessageItem item={item} currentUserId={currentUserId} onReply={handleReply} onOpenProfile={onOpenProfile} />
  );

  const canSend = input.trim().length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={s.container}
    >
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Ionicons name="chatbubbles" size={14} color="#7B72F8" />
          <Text style={s.headerTitle}>{t('watchParty', 'roomChat')}</Text>
        </View>
        <Text style={s.msgCount}>{messages.length}</Text>
      </View>

      {/* Messages / empty state */}
      {messages.length === 0 ? (
        <View style={s.emptyState}>
          <Ionicons name="chatbubble-outline" size={36} color="rgba(255,255,255,0.08)" />
          <Text style={s.emptyTitle}>{t('watchParty', 'noMessages')}</Text>
          <Text style={s.emptySub}>{t('watchParty', 'noMessagesHint')}</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
        />
      )}

      {/* Reply preview */}
      {replyTo && (
        <View style={s.replyBar}>
          <View style={s.replyBarAccent} />
          <View style={s.replyBarContent}>
            <Text style={s.replyBarLabel}>{replyTo.senderName}ga javob</Text>
            <Text style={s.replyBarText} numberOfLines={1}>{replyTo.text}</Text>
          </View>
          <TrackedTouchable
            trackId="chat:cancel_reply"
            onPress={() => setReplyTo(null)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.35)" />
          </TrackedTouchable>
        </View>
      )}

      {/* Input */}
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder={t('watchParty', 'chatPlaceholder')}
          placeholderTextColor="rgba(255,255,255,0.28)"
          onSubmitEditing={handleSend}
          returnKeyType="send"
          maxLength={200}
          multiline={false}
        />
        <TrackedTouchable
          trackId="chat:send"
          style={[s.sendBtn, !canSend && s.sendBtnOff]}
          onPress={handleSend}
          activeOpacity={0.8}
          disabled={!canSend}
        >
          <Ionicons name="send" size={15} color="#fff" style={{ marginLeft: 2 }} />
        </TrackedTouchable>
      </View>
    </KeyboardAvoidingView>
  );
}

