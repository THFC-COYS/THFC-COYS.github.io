/**
 * Explore — browse all subjects and topics, launch sessions from here.
 */

import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSAGEStore } from '@/lib/store';
import { startSession, createQuiz } from '@/lib/api';
import { colors, typography, spacing, radius } from '@/constants/theme';
import { SUBJECTS } from '@/constants/subjects';

export default function ExploreScreen() {
  const user = useSAGEStore((s) => s.user);
  const addSession = useSAGEStore((s) => s.addSession);

  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = SUBJECTS.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.topics.some((t) => t.toLowerCase().includes(search.toLowerCase())),
  );

  const handleTutorTopic = async (subjectName: string, topic: string) => {
    if (!user) return;
    try {
      const session = await startSession({
        user_id: user.id,
        subject: subjectName,
        grade_level: user.grade_level,
        topic,
      });
      addSession(session);
      router.push({ pathname: '/tutor/[sessionId]', params: { sessionId: session.id } });
    } catch {
      /* ignore */
    }
  };

  const handleQuizTopic = async (subjectName: string, topic: string) => {
    if (!user) return;
    try {
      const quiz = await createQuiz({
        user_id: user.id,
        subject: subjectName,
        topic,
        grade_level: user.grade_level,
        num_questions: 5,
      });
      router.push({ pathname: '/quiz/[quizId]', params: { quizId: quiz.id } });
    } catch {
      /* ignore */
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Explore</Text>
      <Text style={styles.subtitle}>Every subject. Every level. Powered by AI.</Text>

      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={colors.textDim} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search subjects or topics..."
          placeholderTextColor={colors.textDim}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={16} color={colors.textDim} />
          </TouchableOpacity>
        )}
      </View>

      {filtered.map((subject) => (
        <View key={subject.id} style={styles.subjectCard}>
          {/* Subject header */}
          <TouchableOpacity
            style={styles.subjectHeader}
            onPress={() => setExpanded(expanded === subject.id ? null : subject.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.subjectIconWrap, { backgroundColor: subject.color + '20' }]}>
              <Feather name={subject.icon as any} size={20} color={subject.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.subjectName}>{subject.name}</Text>
              <Text style={styles.subjectRange}>{subject.gradeRange}</Text>
            </View>
            <Feather
              name={expanded === subject.id ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textDim}
            />
          </TouchableOpacity>

          {/* Topics */}
          {expanded === subject.id && (
            <View style={styles.topicsList}>
              {subject.topics.map((topic) => (
                <View key={topic} style={styles.topicRow}>
                  <Text style={styles.topicName}>{topic}</Text>
                  <View style={styles.topicActions}>
                    <TouchableOpacity
                      style={[styles.topicBtn, { borderColor: subject.color }]}
                      onPress={() => handleTutorTopic(subject.name, topic)}
                      activeOpacity={0.8}
                    >
                      <Feather name="cpu" size={12} color={subject.color} />
                      <Text style={[styles.topicBtnText, { color: subject.color }]}>Tutor</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.topicBtn, { borderColor: colors.accent }]}
                      onPress={() => handleQuizTopic(subject.name, topic)}
                      activeOpacity={0.8}
                    >
                      <Feather name="help-circle" size={12} color={colors.accent} />
                      <Text style={[styles.topicBtnText, { color: colors.accent }]}>Quiz</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  container: { paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: 48, gap: spacing.md },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 15 },
  subjectCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  subjectIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectName: { ...typography.h4, color: colors.text },
  subjectRange: { ...typography.caption, color: colors.textDim, marginTop: 1 },
  topicsList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 0,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '60',
  },
  topicName: { ...typography.body, color: colors.textMuted, flex: 1 },
  topicActions: { flexDirection: 'row', gap: spacing.sm },
  topicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  topicBtnText: { ...typography.caption, fontWeight: '700' },
});
