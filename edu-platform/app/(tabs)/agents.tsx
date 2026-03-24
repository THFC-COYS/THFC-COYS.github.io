/**
 * Agents hub — launch AI Tutor, Quiz, or Curriculum Builder.
 */

import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSAGEStore } from '@/lib/store';
import { startSession, createQuiz } from '@/lib/api';
import { colors, typography, spacing, radius } from '@/constants/theme';
import { SUBJECTS, AGENT_TYPES } from '@/constants/subjects';

type AgentId = 'tutor' | 'quiz' | 'curriculum' | 'progress';

export default function AgentsScreen() {
  const user = useSAGEStore((s) => s.user);
  const addSession = useSAGEStore((s) => s.addSession);

  const [selectedAgent, setSelectedAgent] = useState<AgentId | null>(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);

  const userSubjects = SUBJECTS.filter((s) => user?.subjects.includes(s.id));

  const handleLaunch = async () => {
    if (!user || !selectedSubject) return;
    setLoading(true);

    try {
      if (selectedAgent === 'tutor') {
        const session = await startSession({
          user_id: user.id,
          subject: selectedSubject,
          grade_level: user.grade_level,
          topic: topic || undefined,
        });
        addSession(session);
        setSelectedAgent(null);
        router.push({ pathname: '/tutor/[sessionId]', params: { sessionId: session.id } });

      } else if (selectedAgent === 'quiz') {
        const quiz = await createQuiz({
          user_id: user.id,
          subject: selectedSubject,
          topic: topic || selectedSubject,
          grade_level: user.grade_level,
          num_questions: 5,
        });
        setSelectedAgent(null);
        router.push({ pathname: '/quiz/[quizId]', params: { quizId: quiz.id } });

      } else if (selectedAgent === 'curriculum') {
        if (user.role !== 'educator') {
          Alert.alert('Educator Access', 'The Curriculum Builder is for educators. Update your role in Profile settings.');
          setSelectedAgent(null);
          return;
        }
        router.push('/(tabs)/profile');
        setSelectedAgent(null);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>AI Agents</Text>
        <Text style={styles.subtitle}>
          SAGE deploys specialized AI agents to help you learn, practice, and create.
        </Text>

        {/* Agent cards */}
        {AGENT_TYPES.map((agent) => (
          <TouchableOpacity
            key={agent.id}
            style={[styles.agentCard, selectedAgent === agent.id && styles.agentCardSelected]}
            onPress={() => setSelectedAgent(agent.id as AgentId)}
            activeOpacity={0.8}
          >
            <View style={styles.agentIconWrap}>
              <Feather name={agent.icon as any} size={28} color={colors.primaryLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.agentName}>{agent.name}</Text>
              <Text style={styles.agentDesc}>{agent.description}</Text>
              {agent.id === 'curriculum' && user?.role !== 'educator' && (
                <View style={styles.educatorBadge}>
                  <Text style={styles.educatorBadgeText}>EDUCATOR ONLY</Text>
                </View>
              )}
            </View>
            <Feather
              name={selectedAgent === agent.id ? 'check-circle' : 'arrow-right'}
              size={20}
              color={selectedAgent === agent.id ? colors.success : colors.textDim}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom sheet for subject / topic selection */}
      <Modal
        visible={selectedAgent === 'tutor' || selectedAgent === 'quiz' || selectedAgent === 'curriculum'}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedAgent(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setSelectedAgent(null)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>
            {selectedAgent === 'tutor' ? '🤖 Start AI Tutor Session'
              : selectedAgent === 'quiz' ? '📝 Generate a Quiz'
              : '🏗️ Build Curriculum'}
          </Text>

          <Text style={styles.sheetLabel}>Subject</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectScroll}>
            <View style={styles.subjectRow}>
              {userSubjects.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.subjectChip,
                    selectedSubject === s.name && { backgroundColor: s.color + '30', borderColor: s.color }]}
                  onPress={() => setSelectedSubject(s.name)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.subjectChipText,
                    selectedSubject === s.name && { color: s.color }]}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.sheetLabel}>Topic (optional)</Text>
          <TextInput
            style={styles.topicInput}
            placeholder={selectedSubject
              ? `e.g. ${SUBJECTS.find(s => s.name === selectedSubject)?.topics[0] ?? 'Topic'}`
              : 'Select a subject first'}
            placeholderTextColor={colors.textDim}
            value={topic}
            onChangeText={setTopic}
          />

          <TouchableOpacity
            style={[styles.launchBtn, (!selectedSubject || loading) && styles.launchBtnDisabled]}
            onPress={handleLaunch}
            disabled={!selectedSubject || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.launchBtnText}>
                  {selectedAgent === 'tutor' ? 'Launch Tutor →'
                    : selectedAgent === 'quiz' ? 'Generate Quiz →'
                    : 'Build Curriculum →'}
                </Text>}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: 48, gap: spacing.md },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, lineHeight: 22 },
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  agentCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  agentIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentName: { ...typography.h4, color: colors.text },
  agentDesc: { ...typography.bodySmall, color: colors.textMuted, marginTop: 2 },
  educatorBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.warning + '20',
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  educatorBadgeText: { ...typography.caption, color: colors.warning, letterSpacing: 1 },
  modalBackdrop: { flex: 1, backgroundColor: '#000000A0' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  sheetTitle: { ...typography.h3, color: colors.text },
  sheetLabel: { ...typography.label, color: colors.textMuted, letterSpacing: 1 },
  subjectScroll: { marginHorizontal: -spacing.lg },
  subjectRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  subjectChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subjectChipText: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },
  topicInput: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    padding: spacing.md,
    fontSize: 15,
  },
  launchBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  launchBtnDisabled: { opacity: 0.4 },
  launchBtnText: { ...typography.h4, color: '#fff' },
});
