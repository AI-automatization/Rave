// WeWatch Mobile — WatchParty ChatPanel
import React, { useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ListRenderItemInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatStyles as s } from './ChatPanel.styles';

export interface ReplyTo {
  messageId: string;
  senderName: string;
  text: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar: string | null;
  text: string;
  timestamp: number;
  replyTo?: ReplyTo;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSend: (text: string, replyTo?: ReplyTo) => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function memberColor(userId: string): string {
  const palette = ['#7B72F8', '#F87171', '#34D399', '#FBBF24', '#60A5FA', '#F472B6', '#A78BFA'];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function MessageItem({
  item, currentUserId, onReply,
}: {
  item: ChatMessage; currentUserId: string; onReply: (msg: ChatMessage) => void;
}) {
  const isMine = item.userId === currentUserId;
  const avatarColor = memberColor(item.userId);

  return (
    <TouchableOpacity onLongPress={() => onReply(item)} activeOpacity={0.85} delayLongPress={400}>
      <View style={[s.messageRow, isMine && s.messageRowMine]}>
        {!isMine && (
          <View style={[s.avatar, { backgroundColor: avatarColor }]}>
            <Text style={s.avatarText}>{item.username[0]?.toUpperCase()}</Text>
          </View>
        )}
        <View style={[s.bubbleGroup, isMine && s.bubbleGroupMine]}>
          {!isMine && (
            <Text style={s.senderName}>{item.username}</Text>
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
    </TouchableOpacity>
  );
}

export function ChatPanel({ messages, currentUserId, onSend }: ChatPanelProps) {
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
    <MessageItem item={item} currentUserId={currentUserId} onReply={handleReply} />
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
          <Text style={s.headerTitle}>Xona chati</Text>
        </View>
        <Text style={s.msgCount}>{messages.length} xabar</Text>
      </View>

      {/* Messages / empty state */}
      {messages.length === 0 ? (
        <View style={s.emptyState}>
          <Ionicons name="chatbubble-outline" size={36} color="rgba(255,255,255,0.08)" />
          <Text style={s.emptyTitle}>Hali xabarlar yo&apos;q</Text>
          <Text style={s.emptySub}>Birinchi bo&apos;lib yozing!</Text>
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
          <TouchableOpacity
            onPress={() => setReplyTo(null)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.35)" />
          </TouchableOpacity>
        </View>
      )}

      {/* Input */}
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder="Xabar yozing..."
          placeholderTextColor="rgba(255,255,255,0.28)"
          onSubmitEditing={handleSend}
          returnKeyType="send"
          maxLength={200}
          multiline={false}
        />
        <TouchableOpacity
          style={[s.sendBtn, !canSend && s.sendBtnOff]}
          onPress={handleSend}
          activeOpacity={0.8}
          disabled={!canSend}
        >
          <Ionicons name="send" size={15} color="#fff" style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

