/**
 * Onboarding setup — collect name, grade level, role, subjects.
 * Creates a local-first user (no account required).
 */

import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { createUser } from '@/lib/api';
import { useSAGEStore } from '@/lib/store';
import { colors, typography, spacing, radius } from '@/constants/theme';
import { GRADE_LEVELS, SUBJECTS } from '@/constants/subjects';

type Step = 'name' | 'grade' | 'role' | 'subjects';

export default function SetupScreen() {
  const setUser = useSAGEStore((s) => s.setUser);

  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [role, setRole] = useState<'student' | 'educator'>('student');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleFinish = async () => {
    if (selectedSubjects.length === 0) {
      Alert.alert('Pick at least one subject!');
      return;
    }
    setLoading(true);
    try {
      const user = await createUser({
        name: name.trim() || 'Learner',
        email: `user_${Date.now()}@sage.local`,
        grade_level: gradeLevel,
        role,
        subjects: selectedSubjects,
      });
      setUser(user);
      router.replace('/(tabs)/home');
    } catch {
      Alert.alert('Could not connect to SAGE server. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Progress dots */}
      <View style={styles.dots}>
        {(['name', 'grade', 'role', 'subjects'] as Step[]).map((s) => (
          <View
            key={s}
            style={[styles.dot, step === s && styles.dotActive,
              ['grade', 'role', 'subjects'].includes(step) && s === 'name' && styles.dotDone,
              ['role', 'subjects'].includes(step) && s === 'grade' && styles.dotDone,
              step === 'subjects' && s === 'role' && styles.dotDone,
            ]}
          />
        ))}
      </View>

      {/* Step: Name */}
      {step === 'name' && (
        <View style={styles.stepContainer}>
          <Text style={styles.emoji}>👋</Text>
          <Text style={styles.heading}>What's your name?</Text>
          <Text style={styles.subheading}>SAGE will use this to personalize your experience.</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={colors.textDim}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="next"
          />
          <TouchableOpacity
            style={[styles.nextBtn, !name.trim() && styles.nextBtnDisabled]}
            onPress={() => name.trim() && setStep('grade')}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>Continue →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step: Grade level */}
      {step === 'grade' && (
        <View style={styles.stepContainer}>
          <Text style={styles.emoji}>🎓</Text>
          <Text style={styles.heading}>What's your grade level?</Text>
          <Text style={styles.subheading}>SAGE adapts its AI tutor to your level.</Text>
          <View style={styles.optionsList}>
            {GRADE_LEVELS.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[styles.optionRow, gradeLevel === g.id && styles.optionRowSelected]}
                onPress={() => setGradeLevel(g.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.optionIcon}>{g.icon}</Text>
                <View>
                  <Text style={[styles.optionLabel, gradeLevel === g.id && styles.optionLabelSelected]}>
                    {g.label}
                  </Text>
                  <Text style={styles.optionSub}>{g.description}</Text>
                </View>
                {gradeLevel === g.id && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.nextBtn, !gradeLevel && styles.nextBtnDisabled]}
            onPress={() => gradeLevel && setStep('role')}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>Continue →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step: Role */}
      {step === 'role' && (
        <View style={styles.stepContainer}>
          <Text style={styles.emoji}>🧑‍💼</Text>
          <Text style={styles.heading}>Are you a student or educator?</Text>
          <Text style={styles.subheading}>Educators get access to the Curriculum Builder agent.</Text>
          <View style={styles.roleRow}>
            {(['student', 'educator'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.roleCard, role === r && styles.roleCardSelected]}
                onPress={() => setRole(r)}
                activeOpacity={0.8}
              >
                <Text style={styles.roleEmoji}>{r === 'student' ? '🧑‍🎓' : '👩‍🏫'}</Text>
                <Text style={[styles.roleLabel, role === r && styles.roleLabelSelected]}>
                  {r === 'student' ? 'Student' : 'Educator'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => setStep('subjects')}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>Continue →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step: Subjects */}
      {step === 'subjects' && (
        <View style={styles.stepContainer}>
          <Text style={styles.emoji}>📚</Text>
          <Text style={styles.heading}>Pick your subjects</Text>
          <Text style={styles.subheading}>Choose all that apply. You can change this later.</Text>
          <View style={styles.subjectGrid}>
            {SUBJECTS.map((s) => {
              const selected = selectedSubjects.includes(s.id);
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.subjectChip, selected && { backgroundColor: s.color + '30', borderColor: s.color }]}
                  onPress={() => toggleSubject(s.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.subjectChipText}>{s.name}</Text>
                  {selected && <Text style={{ color: s.color, fontWeight: '700' }}> ✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={[styles.nextBtn, loading && styles.nextBtnDisabled]}
            onPress={handleFinish}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.nextBtnText}>Start Learning 🚀</Text>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  container: { paddingHorizontal: spacing.lg, paddingTop: 64, paddingBottom: 48 },
  dots: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: spacing.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 24, backgroundColor: colors.primary },
  dotDone: { backgroundColor: colors.success },
  stepContainer: { gap: spacing.md },
  emoji: { fontSize: 48, textAlign: 'center' },
  heading: { ...typography.h2, color: colors.text, textAlign: 'center' },
  subheading: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    padding: spacing.md,
    fontSize: 17,
    marginTop: spacing.sm,
  },
  optionsList: { gap: spacing.sm },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionRowSelected: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  optionIcon: { fontSize: 24 },
  optionLabel: { ...typography.h4, color: colors.text },
  optionLabelSelected: { color: colors.primaryLight },
  optionSub: { ...typography.bodySmall, color: colors.textMuted },
  checkmark: { marginLeft: 'auto', color: colors.primary, fontSize: 18, fontWeight: '700' },
  roleRow: { flexDirection: 'row', gap: spacing.md },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  roleCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  roleEmoji: { fontSize: 40 },
  roleLabel: { ...typography.h4, color: colors.textMuted },
  roleLabelSelected: { color: colors.primaryLight },
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  subjectChip: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subjectChipText: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },
  nextBtn: {
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
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { ...typography.h4, color: '#fff' },
});
