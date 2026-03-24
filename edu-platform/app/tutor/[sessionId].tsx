/**
 * SAGE AI Tutor — real-time streaming chat screen.
 * Uses WebSocket for streaming token-by-token responses.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSAGEStore } from '@/lib/store';
import { getSession, sendMessage, createTutorSocket } from '@/lib/api';
import { colors, typography, spacing, radius } from '@/constants/theme';
import type { Message, TutoringSession } from '@/lib/types';

type DisplayMessage = Message & { id: string; streaming?: boolean };

export default function TutorScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const user = useSAGEStore((s) => s.user);

  const [session, setSession] = useState<TutoringSession | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingId] = useState(() => 'stream_' + Date.now());

  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<ReturnType<typeof createTutorSocket> | null>(null);

  // Load session
  useEffect(() => {
    if (!sessionId) return;
    getSession(sessionId).then((s) => {
      setSession(s);
      setMessages(
        s.messages.map((m, i) => ({ ...m, id: `msg_${i}` })),
      );
    });
  }, [sessionId]);

  // Set up WebSocket
  useEffect(() => {
    if (!sessionId || !user) return;

    const ws = createTutorSocket(
      sessionId,
      (msg) => {
        if (msg.type === 'token') {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.id === streamingId) {
              return [...prev.slice(0, -1), { ...last, content: last.content + msg.content }];
            }
            return [...prev, { id: streamingId, role: 'assistant', content: msg.content, streaming: true }];
          });
        } else if (msg.type === 'done') {
          setMessages((prev) =>
            prev.map((m) => m.id === streamingId ? { ...m, streaming: false } : m),
          );
          setStreaming(false);
          setSending(false);
        } else if (msg.type === 'error') {
          setStreaming(false);
          setSending(false);
        }
      },
    );

    socketRef.current = ws;
    return () => { ws.close(); };
  }, [sessionId, user]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim() || sending || !user || !sessionId) return;

    const userMsg: DisplayMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);
    setStreaming(true);

    // Try WebSocket first, fall back to REST
    if (socketRef.current) {
      socketRef.current.send(userMsg.content, user.id);
    } else {
      try {
        const res = await sendMessage(sessionId, { content: userMsg.content, user_id: user.id });
        setMessages((prev) => [...prev, {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: res.message.content,
        }]);
      } catch {
        /* ignore */
      } finally {
        setSending(false);
        setStreaming(false);
      }
    }
  };

  const renderMessage = ({ item }: { item: DisplayMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={styles.agentAvatar}>
            <Feather name="cpu" size={14} color={colors.primaryLight} />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAgent]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {item.content}
          </Text>
          {item.streaming && (
            <View style={styles.streamingDot} />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{session?.subject ?? 'AI Tutor'}</Text>
            {session?.topic && <Text style={styles.headerSub}>{session.topic}</Text>}
          </View>
          <View style={[styles.agentStatus, streaming && styles.agentStatusActive]}>
            <Feather name="cpu" size={14} color={streaming ? colors.success : colors.textDim} />
            <Text style={[styles.agentStatusText, streaming && { color: colors.success }]}>
              {streaming ? 'Thinking…' : 'SAGE AI'}
            </Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.emptyText}>Starting your session…</Text>
            </View>
          }
        />

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ask anything…"
            placeholderTextColor={colors.textDim}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
            activeOpacity={0.8}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Feather name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  headerInfo: { flex: 1 },
  headerTitle: { ...typography.h4, color: colors.text },
  headerSub: { ...typography.caption, color: colors.textMuted },
  agentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  agentStatusActive: { backgroundColor: colors.success + '20' },
  agentStatusText: { ...typography.caption, color: colors.textDim, fontWeight: '600' },
  messageList: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.lg },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.sm },
  msgRowUser: { flexDirection: 'row-reverse' },
  agentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '40',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  bubbleAgent: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  bubbleText: { ...typography.body, color: colors.text, lineHeight: 22 },
  bubbleTextUser: { color: '#fff' },
  streamingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  emptyText: { ...typography.body, color: colors.textMuted },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    maxHeight: 120,
    lineHeight: 22,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  sendBtnDisabled: { opacity: 0.4 },
});
