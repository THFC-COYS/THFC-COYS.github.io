import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { colors, typography, spacing, radius } from '@/constants/theme';

const FEATURES = [
  { icon: '🤖', title: 'AI Tutor', desc: 'Personal tutor adapts to your learning style and grade level' },
  { icon: '📝', title: 'Smart Quizzes', desc: 'AI-generated quizzes calibrated exactly to your level' },
  { icon: '📊', title: 'Progress Insights', desc: 'Know exactly what to study next with AI-powered analytics' },
  { icon: '🏗️', title: 'Curriculum Builder', desc: 'Educators: build AI-enhanced lesson plans in minutes' },
];

export default function WelcomeScreen() {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>100% FREE · OPEN SOURCE</Text>
        </View>
        <View style={styles.logoRow}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoS}>S</Text>
          </View>
          <Text style={styles.title}>SAGE</Text>
        </View>
        <Text style={styles.subtitle}>
          The AI-powered education platform{'\n'}for every learner, K-12 to college.
        </Text>
      </View>

      {/* Feature cards */}
      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View key={f.title} style={styles.featureCard}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View style={styles.ctaSection}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/(onboarding)/setup')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Get Started Free →</Text>
        </TouchableOpacity>
        <Text style={styles.legal}>
          No account required · No ads · Open source on GitHub
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
    paddingBottom: 48,
    gap: spacing.xl,
  },
  hero: { alignItems: 'center', gap: spacing.md },
  badge: {
    backgroundColor: colors.primaryDim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  badgeText: { ...typography.label, color: colors.primaryLight, letterSpacing: 1.5 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  logoS: { fontSize: 30, fontWeight: '800', color: '#fff' },
  title: { fontSize: 48, fontWeight: '900', color: colors.text, letterSpacing: 4 },
  subtitle: {
    ...typography.h3,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '400',
  },
  features: { gap: spacing.sm },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: { fontSize: 28, marginTop: 2 },
  featureTitle: { ...typography.h4, color: colors.text, marginBottom: 2 },
  featureDesc: { ...typography.bodySmall, color: colors.textMuted, lineHeight: 18 },
  ctaSection: { alignItems: 'center', gap: spacing.md },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 18,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: { ...typography.h4, color: '#fff', letterSpacing: 0.3 },
  legal: { ...typography.caption, color: colors.textDim, textAlign: 'center', lineHeight: 16 },
});
