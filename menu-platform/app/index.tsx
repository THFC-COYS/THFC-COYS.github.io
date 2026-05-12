import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useStore } from '@/lib/store';

export default function Splash() {
  const router = useRouter();
  const userId = useStore((s) => s.userId);

  useEffect(() => {
    if (userId) {
      router.replace('/(tabs)/camera');
    }
  }, [userId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Ionicons name="restaurant" size={64} color={Colors.primary} />
          <View style={styles.aiDot}>
            <Ionicons name="sparkles" size={18} color={Colors.accent} />
          </View>
        </View>

        <Text style={styles.title}>MenuLens</Text>
        <Text style={styles.tagline}>Point. Scan. Eat smart.</Text>
        <Text style={styles.description}>
          AI-powered menu analyzer that tells you exactly what's in every dish — calories, macros,
          allergens, and how well it fits your goals.
        </Text>

        <View style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f.text} style={styles.feature}>
              <Ionicons name={f.icon as any} size={18} color={Colors.primary} />
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity style={styles.cta} onPress={() => router.replace('/(tabs)/camera')}>
          <Ionicons name="camera" size={20} color={Colors.background} />
          <Text style={styles.ctaText}>Start Scanning</Text>
        </TouchableOpacity>
        <Text style={styles.disclaimer}>No account needed · Works offline after first scan</Text>
      </View>
    </SafeAreaView>
  );
}

const FEATURES = [
  { icon: 'nutrition-outline', text: 'Instant calorie & macro estimates' },
  { icon: 'alert-circle-outline', text: 'Allergen detection for 7 major allergens' },
  { icon: 'fitness-outline', text: 'Personalised fit scores for your goal' },
  { icon: 'time-outline', text: 'Scan history saved locally' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxxl, gap: Spacing.lg },
  logoContainer: { width: 96, height: 96, alignSelf: 'center', position: 'relative', marginBottom: Spacing.md },
  aiDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderRadius: Radius.full,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  title: { ...Typography.h1, color: Colors.text, textAlign: 'center' },
  tagline: { ...Typography.h3, color: Colors.primary, textAlign: 'center' },
  description: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  featureList: { gap: Spacing.md, marginTop: Spacing.md },
  feature: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureText: { ...Typography.body, color: Colors.textMuted },
  bottom: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, gap: Spacing.md },
  cta: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  ctaText: { ...Typography.h4, color: Colors.background },
  disclaimer: { ...Typography.caption, color: Colors.textDim, textAlign: 'center' },
});
