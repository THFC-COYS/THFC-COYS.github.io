import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSAGEStore } from '@/lib/store';
import { colors, typography, spacing, radius } from '@/constants/theme';
import { GRADE_LEVELS, SUBJECTS } from '@/constants/subjects';

export default function ProfileScreen() {
  const user = useSAGEStore((s) => s.user);
  const clearUser = useSAGEStore((s) => s.clearUser);

  const gradeInfo = GRADE_LEVELS.find((g) => g.id === user?.grade_level);
  const userSubjects = SUBJECTS.filter((s) => user?.subjects.includes(s.id));

  const handleReset = () => {
    Alert.alert(
      'Reset SAGE',
      'This will clear all your data and return to onboarding. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: clearUser },
      ],
    );
  };

  if (!user) return null;

  const xpLevel = Math.floor(user.xp / 100) + 1;
  const xpProgress = (user.xp % 100) / 100;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar + name */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user.role === 'educator' ? '👩‍🏫 Educator' : '🧑‍🎓 Student'}
          </Text>
        </View>
      </View>

      {/* XP / Level */}
      <View style={styles.xpCard}>
        <View style={styles.xpRow}>
          <View>
            <Text style={styles.xpLevel}>Level {xpLevel}</Text>
            <Text style={styles.xpTotal}>{user.xp} XP total</Text>
          </View>
          <View style={styles.streakBox}>
            <Text style={styles.streakNum}>{user.streak_days}</Text>
            <Text style={styles.streakLabel}>Day Streak 🔥</Text>
          </View>
        </View>
        <View style={styles.xpBarTrack}>
          <View style={[styles.xpBarFill, { width: `${xpProgress * 100}%` as any }]} />
        </View>
        <Text style={styles.xpNext}>{100 - (user.xp % 100)} XP to Level {xpLevel + 1}</Text>
      </View>

      {/* Info rows */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Learning Profile</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Feather name="book" size={16} color={colors.textDim} />
            <Text style={styles.infoLabel}>Grade Level</Text>
            <Text style={styles.infoValue}>{gradeInfo?.label ?? user.grade_level}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Feather name="mail" size={16} color={colors.textDim} />
            <Text style={styles.infoLabel}>User ID</Text>
            <Text style={[styles.infoValue, { fontSize: 11 }]}>{user.id.slice(0, 12)}…</Text>
          </View>
        </View>
      </View>

      {/* Subjects */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Subjects</Text>
        <View style={styles.subjectsWrap}>
          {userSubjects.map((s) => (
            <View key={s.id} style={[styles.subjectChip, { borderColor: s.color }]}>
              <Text style={[styles.subjectChipText, { color: s.color }]}>{s.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Open Source badge */}
      <View style={styles.openSourceCard}>
        <Feather name="github" size={20} color={colors.text} />
        <View style={{ flex: 1 }}>
          <Text style={styles.osTitle}>SAGE is Open Source</Text>
          <Text style={styles.osDesc}>
            Built with Claude AI. Free forever. Contribute on GitHub.
          </Text>
        </View>
        <Feather name="external-link" size={16} color={colors.textDim} />
      </View>

      {/* Reset */}
      <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
        <Feather name="trash-2" size={16} color={colors.error} />
        <Text style={styles.resetText}>Reset App Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  container: { paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: 48, gap: spacing.lg },
  hero: { alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarText: { fontSize: 40, fontWeight: '800', color: '#fff' },
  name: { ...typography.h2, color: colors.text },
  roleBadge: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleText: { ...typography.bodySmall, color: colors.textMuted, fontWeight: '600' },
  xpCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  xpLevel: { ...typography.h3, color: colors.primaryLight },
  xpTotal: { ...typography.bodySmall, color: colors.textMuted },
  streakBox: { alignItems: 'center' },
  streakNum: { ...typography.h2, color: colors.coral },
  streakLabel: { ...typography.caption, color: colors.textMuted },
  xpBarTrack: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  xpBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  xpNext: { ...typography.caption, color: colors.textDim },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.h4, color: colors.text },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  infoLabel: { ...typography.body, color: colors.textMuted, flex: 1 },
  infoValue: { ...typography.body, color: colors.text, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border },
  subjectsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  subjectChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  subjectChipText: { ...typography.bodySmall, fontWeight: '700' },
  openSourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  osTitle: { ...typography.h4, color: colors.text },
  osDesc: { ...typography.bodySmall, color: colors.textMuted, marginTop: 2, lineHeight: 16 },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  resetText: { ...typography.body, color: colors.error, fontWeight: '600' },
});
