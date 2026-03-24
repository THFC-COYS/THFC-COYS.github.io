import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSAGEStore } from '@/lib/store';
import { getProgress, getInsights } from '@/lib/api';
import { colors, typography, spacing, radius } from '@/constants/theme';
import { SUBJECTS } from '@/constants/subjects';
import type { ProgressEntry, ProgressInsights } from '@/lib/types';

function MasteryBar({ value, color }: { value: number; color: string }) {
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${Math.round(value * 100)}%` as any, backgroundColor: color }]} />
    </View>
  );
}

export default function ProgressScreen() {
  const user = useSAGEStore((s) => s.user);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [insights, setInsights] = useState<ProgressInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!user) return;
    try {
      const [prog, ins] = await Promise.all([
        getProgress(user.id),
        getInsights(user.id),
      ]);
      setProgress(prog.progress);
      setInsights(ins);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  const bySubject = SUBJECTS.reduce<Record<string, ProgressEntry[]>>((acc, s) => {
    const entries = progress.filter((p) => p.subject.toLowerCase().includes(s.name.toLowerCase().split(' ')[0]));
    if (entries.length) acc[s.name] = entries;
    return acc;
  }, {});

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
    >
      <Text style={styles.title}>Your Progress</Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <>
          {/* Summary */}
          <View style={styles.summaryCard}>
            <Feather name="cpu" size={16} color={colors.accent} />
            <Text style={styles.summaryText}>{insights?.summary ?? 'Start a session to see your progress!'}</Text>
          </View>

          {/* Strengths / Growth */}
          {(insights?.strengths.length || 0) > 0 && (
            <View style={styles.row}>
              <View style={[styles.halfCard, { borderColor: colors.success + '40' }]}>
                <Text style={[styles.cardLabel, { color: colors.success }]}>💪 Strengths</Text>
                {insights!.strengths.map((s, i) => (
                  <Text key={i} style={styles.bulletText}>• {s}</Text>
                ))}
              </View>
              <View style={[styles.halfCard, { borderColor: colors.warning + '40' }]}>
                <Text style={[styles.cardLabel, { color: colors.warning }]}>📈 Growing</Text>
                {insights!.growth_areas.map((s, i) => (
                  <Text key={i} style={styles.bulletText}>• {s}</Text>
                ))}
              </View>
            </View>
          )}

          {/* Per-subject progress */}
          {progress.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📊</Text>
              <Text style={styles.emptyTitle}>No progress yet</Text>
              <Text style={styles.emptyDesc}>Complete a tutoring session or quiz to start tracking your progress.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Mastery by Topic</Text>
              {progress.map((p) => {
                const subject = SUBJECTS.find((s) => s.name.toLowerCase().includes(p.subject.toLowerCase().split(' ')[0]));
                const color = subject?.color ?? colors.primary;
                return (
                  <View key={p.id} style={styles.topicCard}>
                    <View style={styles.topicHeader}>
                      <View>
                        <Text style={styles.topicName}>{p.topic}</Text>
                        <Text style={[styles.topicSubject, { color }]}>{p.subject}</Text>
                      </View>
                      <Text style={[styles.masteryPct, { color }]}>
                        {Math.round(p.mastery_level * 100)}%
                      </Text>
                    </View>
                    <MasteryBar value={p.mastery_level} color={color} />
                    <View style={styles.topicStats}>
                      <Text style={styles.topicStat}>{p.sessions_count} sessions</Text>
                      <Text style={styles.topicStat}>{p.quizzes_count} quizzes</Text>
                      {p.avg_quiz_score != null && (
                        <Text style={styles.topicStat}>avg {Math.round(p.avg_quiz_score * 100)}%</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </>
          )}

          {/* Recommended */}
          {(insights?.recommended_topics.length ?? 0) > 0 && (
            <>
              <Text style={styles.sectionTitle}>Recommended Next</Text>
              {insights!.recommended_topics.map((r, i) => (
                <View key={i} style={styles.recCard}>
                  <View style={styles.recDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recTopic}>{r.topic}</Text>
                    <Text style={styles.recSubject}>{r.subject}</Text>
                    <Text style={styles.recReason}>{r.reason}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  container: { paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: 48, gap: spacing.md },
  title: { ...typography.h1, color: colors.text },
  summaryCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: colors.accentDim,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  summaryText: { ...typography.body, color: colors.text, flex: 1, lineHeight: 22 },
  row: { flexDirection: 'row', gap: spacing.sm },
  halfCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
    borderWidth: 1,
  },
  cardLabel: { ...typography.label, letterSpacing: 0.5, marginBottom: 4 },
  bulletText: { ...typography.bodySmall, color: colors.textMuted, lineHeight: 18 },
  sectionTitle: { ...typography.h4, color: colors.text, marginTop: spacing.sm },
  topicCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topicHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  topicName: { ...typography.h4, color: colors.text },
  topicSubject: { ...typography.caption, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  masteryPct: { ...typography.h3, fontWeight: '700' },
  barTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  topicStats: { flexDirection: 'row', gap: spacing.md },
  topicStat: { ...typography.caption, color: colors.textDim },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { ...typography.h3, color: colors.text },
  emptyDesc: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  recCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
  recTopic: { ...typography.h4, color: colors.text },
  recSubject: { ...typography.caption, color: colors.primary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  recReason: { ...typography.bodySmall, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
});
