/**
 * SAGE Quiz Screen — take an AI-generated quiz and see results.
 */

import { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, SafeAreaView, TextInput, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSAGEStore } from '@/lib/store';
import { getQuiz, submitQuiz } from '@/lib/api';
import { colors, typography, spacing, radius } from '@/constants/theme';
import type { Quiz, QuizQuestion, QuizResult } from '@/lib/types';

export default function QuizScreen() {
  const { quizId } = useLocalSearchParams<{ quizId: string }>();
  const user = useSAGEStore((s) => s.user);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (!quizId) return;
    getQuiz(quizId).then((q) => {
      setQuiz(q);
      setAnswers(new Array(q.total_questions).fill(''));
      setLoading(false);
    });
  }, [quizId]);

  const question: QuizQuestion | undefined = quiz?.questions[currentQ];
  const isLast = currentQ === (quiz?.total_questions ?? 0) - 1;

  const handleAnswer = (answer: string) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[currentQ] = answer;
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (!quiz || !user) return;
    const unanswered = answers.filter((a) => !a).length;
    if (unanswered > 0) {
      Alert.alert(
        'Unanswered questions',
        `You have ${unanswered} unanswered question(s). Submit anyway?`,
        [
          { text: 'Keep going', style: 'cancel' },
          { text: 'Submit', onPress: doSubmit },
        ],
      );
    } else {
      doSubmit();
    }
  };

  const doSubmit = async () => {
    if (!quiz || !user) return;
    setSubmitting(true);
    const timeTaken = Math.floor((Date.now() - startTime.current) / 1000);
    try {
      const res = await submitQuiz(quiz.id, { user_id: user.id, answers, time_taken_seconds: timeTaken });
      setResult(res);
    } catch (e: unknown) {
      Alert.alert('Error submitting quiz', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Generating your quiz with AI…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!quiz || !question) return null;

  // Results screen
  if (result) {
    const pct = result.score_percentage;
    const grade = pct >= 90 ? '🏆 Outstanding!' : pct >= 75 ? '⭐ Great job!' : pct >= 60 ? '👍 Good effort!' : '💪 Keep practicing!';
    const color = pct >= 75 ? colors.success : pct >= 60 ? colors.warning : colors.error;

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.resultsContainer}>
          <View style={styles.resultHero}>
            <Text style={styles.resultGrade}>{grade}</Text>
            <Text style={[styles.resultScore, { color }]}>{pct}%</Text>
            <Text style={styles.resultSubScore}>
              {result.total_score} / {result.total_possible} points
            </Text>
            <View style={styles.xpBadge}>
              <Feather name="zap" size={16} color={colors.coral} />
              <Text style={styles.xpText}>+{result.xp_earned} XP earned!</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Question Review</Text>
          {result.results.map((r, i) => (
            <View key={r.question_id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewQNum}>Q{i + 1}</Text>
                <View style={[styles.reviewBadge,
                  { backgroundColor: (r.is_correct || r.score === r.max_score) ? colors.success + '20' : colors.error + '20' }]}>
                  <Text style={[styles.reviewBadgeText,
                    { color: (r.is_correct || r.score === r.max_score) ? colors.success : colors.error }]}>
                    {r.score}/{r.max_score} pts
                  </Text>
                </View>
              </View>
              <Text style={styles.reviewQuestion}>{quiz.questions[i]?.question}</Text>
              <Text style={styles.reviewYour}>Your answer: <Text style={{ color: colors.text }}>{r.student_answer || '(no answer)'}</Text></Text>
              <Text style={styles.reviewCorrect}>Correct: <Text style={{ color: colors.success }}>{r.correct_answer}</Text></Text>
              {r.explanation && <Text style={styles.reviewExplain}>{r.explanation}</Text>}
              {r.feedback && <Text style={styles.reviewFeedback}>{r.feedback}</Text>}
            </View>
          ))}

          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>Back to Explore</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Quiz taking screen
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.quizHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="x" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((currentQ + 1) / quiz.total_questions) * 100}%` as any }]} />
          </View>
          <Text style={styles.progressText}>{currentQ + 1} / {quiz.total_questions}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.quizContainer} showsVerticalScrollIndicator={false}>
        {/* Topic badge */}
        <View style={styles.topicBadge}>
          <Text style={styles.topicBadgeText}>{quiz.subject} · {quiz.topic}</Text>
        </View>

        {/* Question */}
        <Text style={styles.questionText}>{question.question}</Text>

        {/* Answer options */}
        {question.type === 'multiple_choice' && question.options && (
          <View style={styles.options}>
            {question.options.map((opt, i) => {
              const letter = ['A', 'B', 'C', 'D'][i];
              const selected = answers[currentQ] === letter;
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => handleAnswer(letter)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.optionLetter, selected && styles.optionLetterSelected]}>
                    <Text style={[styles.optionLetterText, selected && { color: '#fff' }]}>{letter}</Text>
                  </View>
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {question.type === 'true_false' && (
          <View style={styles.tfRow}>
            {['True', 'False'].map((v) => (
              <TouchableOpacity
                key={v}
                style={[styles.tfBtn, answers[currentQ] === v && styles.tfBtnSelected]}
                onPress={() => handleAnswer(v)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tfText, answers[currentQ] === v && styles.tfTextSelected]}>
                  {v === 'True' ? '✓ True' : '✗ False'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {question.type === 'short_answer' && (
          <TextInput
            style={styles.shortAnswerInput}
            placeholder="Type your answer here…"
            placeholderTextColor={colors.textDim}
            value={answers[currentQ]}
            onChangeText={handleAnswer}
            multiline
            textAlignVertical="top"
          />
        )}

        {/* Nav */}
        <View style={styles.navRow}>
          {currentQ > 0 && (
            <TouchableOpacity style={styles.prevBtn} onPress={() => setCurrentQ((q) => q - 1)} activeOpacity={0.8}>
              <Feather name="arrow-left" size={18} color={colors.text} />
              <Text style={styles.prevBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          {!isLast ? (
            <TouchableOpacity
              style={[styles.nextBtn, !answers[currentQ] && styles.nextBtnDim]}
              onPress={() => setCurrentQ((q) => q + 1)}
              activeOpacity={0.8}
            >
              <Text style={styles.nextBtnText}>Next</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.nextBtnDim]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.submitBtnText}>Submit Quiz</Text>}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { ...typography.body, color: colors.textMuted },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  progressWrap: { flex: 1, gap: 4 },
  progressTrack: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  progressText: { ...typography.caption, color: colors.textDim, textAlign: 'right' },
  quizContainer: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 48 },
  topicBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryDim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  topicBadgeText: { ...typography.label, color: colors.primaryLight, letterSpacing: 1 },
  questionText: { ...typography.h3, color: colors.text, lineHeight: 28 },
  options: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionLetterSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionLetterText: { ...typography.label, color: colors.textMuted, fontWeight: '700' },
  optionText: { ...typography.body, color: colors.textMuted, flex: 1 },
  optionTextSelected: { color: colors.text },
  tfRow: { flexDirection: 'row', gap: spacing.md },
  tfBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  tfBtnSelected: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  tfText: { ...typography.h4, color: colors.textMuted },
  tfTextSelected: { color: colors.primaryLight },
  shortAnswerInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    padding: spacing.md,
    fontSize: 15,
    minHeight: 120,
    lineHeight: 22,
  },
  navRow: { flexDirection: 'row', alignItems: 'center' },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prevBtnText: { ...typography.body, color: colors.text, fontWeight: '600' },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  nextBtnText: { ...typography.body, color: '#fff', fontWeight: '700' },
  nextBtnDim: { opacity: 0.5 },
  submitBtn: {
    backgroundColor: colors.success,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnText: { ...typography.body, color: '#fff', fontWeight: '700' },
  // Results
  resultsContainer: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  resultHero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  resultGrade: { fontSize: 28, fontWeight: '800', color: colors.text },
  resultScore: { fontSize: 72, fontWeight: '900' },
  resultSubScore: { ...typography.h4, color: colors.textMuted },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.coral + '20',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.coral + '40',
    marginTop: spacing.sm,
  },
  xpText: { ...typography.body, color: colors.coral, fontWeight: '700' },
  sectionTitle: { ...typography.h4, color: colors.text },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewQNum: { ...typography.label, color: colors.textDim, letterSpacing: 1 },
  reviewBadge: { borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 2 },
  reviewBadgeText: { ...typography.label, fontWeight: '700' },
  reviewQuestion: { ...typography.body, color: colors.text, fontWeight: '600', lineHeight: 22 },
  reviewYour: { ...typography.bodySmall, color: colors.textMuted },
  reviewCorrect: { ...typography.bodySmall, color: colors.textMuted },
  reviewExplain: { ...typography.bodySmall, color: colors.textDim, fontStyle: 'italic', lineHeight: 18 },
  reviewFeedback: { ...typography.bodySmall, color: colors.accent, lineHeight: 18 },
  doneBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  doneBtnText: { ...typography.h4, color: '#fff' },
});
