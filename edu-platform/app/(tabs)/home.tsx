import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSAGEStore } from '@/lib/store';
import { getInsights, getProgress } from '@/lib/api';
import { colors, typography, spacing, radius } from '@/constants/theme';
import { SUBJECTS } from '@/constants/subjects';
import type { ProgressInsights } from '@/lib/types';

export default function HomeScreen() {
  const user = useSAGEStore((s) => s.user);
  const setProgress = useSAGEStore((s) => s.setProgress);

  const [insights, setInsights] = useState<ProgressInsights | null>(null);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const [avgMastery, setAvgMastery] = useState(0);
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
      setTotalSubjects(prog.total_subjects);
      setAvgMastery(prog.avg_mastery);
      setInsights(ins);
    } catch {
      /* ignore network errors in demo */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  const userSubjects = SUBJECTS.filter((s) => user?.subjects.includes(s.id));

  const getHour = () => new Date().getHours();
  const greeting = getHour() < 12 ? 'Good morning' : getHour() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting} 👋</Text>
          <Text style={styles.userName}>{user?.name ?? 'Learner'}</Text>
        </View>
        <View style={styles.xpBadge}>
          <Feather name="zap" size={14} color={colors.coral} />
          <Text style={styles.xpText}>{user?.xp ?? 0} XP</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalSubjects}</Text>
          <Text style={styles.statLabel}>Subjects</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{Math.round(avgMastery * 100)}%</Text>
          <Text style={styles.statLabel}>Avg Mastery</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{user?.streak_days ?? 0}</Text>
          <Text style={styles.statLabel}>Day Streak 🔥</Text>
        </View>
      </View>

      {/* AI Insight */}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
      ) : insights && (
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Feather name="cpu" size={16} color={colors.accent} />
            <Text style={styles.insightLabel}>SAGE AI INSIGHT</Text>
          </View>
          <Text style={styles.insightText}>{insights.encouragement}</Text>
          {insights.weekly_goal ? (
            <View style={styles.goalRow}>
              <Feather name="target" size={14} color={colors.warning} />
              <Text style={styles.goalText}>This week: {insights.weekly_goal}</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>AI Agents</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[styles.actionCard, { borderColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/agents')}
          activeOpacity={0.8}
        >
          <Feather name="cpu" size={24} color={colors.primaryLight} />
          <Text style={styles.actionTitle}>AI Tutor</Text>
          <Text style={styles.actionDesc}>Start a session</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionCard, { borderColor: colors.accent }]}
          onPress={() => router.push('/(tabs)/explore')}
          activeOpacity={0.8}
        >
          <Feather name="help-circle" size={24} color={colors.accent} />
          <Text style={styles.actionTitle}>Take a Quiz</Text>
          <Text style={styles.actionDesc}>Test your knowledge</Text>
        </TouchableOpacity>
      </View>

      {/* Your Subjects */}
      <Text style={styles.sectionTitle}>Your Subjects</Text>
      <View style={styles.subjectList}>
        {userSubjects.length === 0 ? (
          <Text style={styles.emptyText}>Add subjects in your profile.</Text>
        ) : (
          userSubjects.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.subjectRow}
              onPress={() => router.push({ pathname: '/(tabs)/agents', params: { subject: s.id } })}
              activeOpacity={0.8}
            >
              <View style={[styles.subjectDot, { backgroundColor: s.color }]} />
              <Text style={styles.subjectName}>{s.name}</Text>
              <Feather name="chevron-right" size={16} color={colors.textDim} />
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Recommended */}
      {insights?.recommended_topics && insights.recommended_topics.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recommended for You</Text>
          {insights.recommended_topics.slice(0, 3).map((r, i) => (
            <View key={i} style={styles.recommendCard}>
              <View>
                <Text style={styles.recommendTopic}>{r.topic}</Text>
                <Text style={styles.recommendSubject}>{r.subject}</Text>
              </View>
              <Text style={styles.recommendReason}>{r.reason}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  container: { paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: 48, gap: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { ...typography.bodySmall, color: colors.textMuted },
  userName: { ...typography.h2, color: colors.text },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.coral + '40',
  },
  xpText: { ...typography.label, color: colors.coral },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { ...typography.h2, color: colors.text },
  statLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  insightCard: {
    backgroundColor: colors.accentDim,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent + '40',
    gap: spacing.sm,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  insightLabel: { ...typography.label, color: colors.accent, letterSpacing: 1.5 },
  insightText: { ...typography.body, color: colors.text, lineHeight: 22 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 4 },
  goalText: { ...typography.bodySmall, color: colors.warning, fontWeight: '600' },
  sectionTitle: { ...typography.h4, color: colors.text },
  actionsGrid: { flexDirection: 'row', gap: spacing.sm },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 8,
    borderWidth: 1,
  },
  actionTitle: { ...typography.h4, color: colors.text },
  actionDesc: { ...typography.bodySmall, color: colors.textMuted },
  subjectList: { gap: spacing.xs },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subjectDot: { width: 10, height: 10, borderRadius: 5 },
  subjectName: { ...typography.body, color: colors.text, flex: 1, fontWeight: '500' },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  recommendCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recommendTopic: { ...typography.h4, color: colors.text },
  recommendSubject: { ...typography.caption, color: colors.primary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  recommendReason: { ...typography.bodySmall, color: colors.textMuted, marginTop: 4 },
});
