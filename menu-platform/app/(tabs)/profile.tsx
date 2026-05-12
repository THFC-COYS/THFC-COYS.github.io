import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { ALLERGENS, DIET_TYPES, GOALS } from '@/constants/dietary';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { Allergen, DietGoal, DietType } from '@/lib/types';

export default function ProfileScreen() {
  const { userId, profile, setProfile } = useStore();
  const [saving, setSaving] = useState(false);

  const [goal, setGoal] = useState<DietGoal>(profile.goal);
  const [dietType, setDietType] = useState<DietType>(profile.diet_type);
  const [allergens, setAllergens] = useState<Allergen[]>(profile.allergens);

  const isDirty =
    goal !== profile.goal ||
    dietType !== profile.diet_type ||
    JSON.stringify([...allergens].sort()) !== JSON.stringify([...profile.allergens].sort());

  const toggleAllergen = (id: Allergen) => {
    setAllergens((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const next = { goal, diet_type: dietType, allergens };
    try {
      await api.updateProfile(userId, next);
      setProfile(next);
      Alert.alert('Saved', 'Your dietary profile has been updated.');
    } catch {
      Alert.alert('Error', 'Could not save profile. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>My Goals</Text>
        {isDirty && (
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Diet goal */}
        <SectionHeader icon="fitness-outline" label="Fitness Goal" />
        <View style={styles.optionGrid}>
          {GOALS.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[styles.optionCard, goal === g.id && styles.optionCardActive]}
              onPress={() => setGoal(g.id)}
            >
              <Ionicons
                name={g.icon as any}
                size={22}
                color={goal === g.id ? Colors.primary : Colors.textDim}
              />
              <Text style={[styles.optionLabel, goal === g.id && styles.optionLabelActive]}>
                {g.label}
              </Text>
              <Text style={styles.optionDesc}>{g.description}</Text>
              {goal === g.id && (
                <View style={styles.checkMark}>
                  <Ionicons name="checkmark" size={12} color={Colors.background} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Diet type */}
        <SectionHeader icon="leaf-outline" label="Dietary Preference" />
        <View style={styles.dietRow}>
          {DIET_TYPES.map((d) => (
            <TouchableOpacity
              key={d.id}
              style={[styles.dietChip, dietType === d.id && styles.dietChipActive]}
              onPress={() => setDietType(d.id)}
            >
              <Ionicons
                name={d.icon as any}
                size={16}
                color={dietType === d.id ? Colors.primary : Colors.textDim}
              />
              <Text style={[styles.dietLabel, dietType === d.id && styles.dietLabelActive]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Allergens */}
        <SectionHeader icon="alert-circle-outline" label="Allergens to Avoid" />
        <Text style={styles.allergenNote}>
          Dishes containing these ingredients will be flagged and scored 0.
        </Text>
        <View style={styles.allergenGrid}>
          {ALLERGENS.map((a) => {
            const selected = allergens.includes(a.id);
            return (
              <TouchableOpacity
                key={a.id}
                style={[styles.allergenChip, selected && styles.allergenChipActive]}
                onPress={() => toggleAllergen(a.id)}
              >
                <Text style={styles.allergenEmoji}>{a.emoji}</Text>
                <Text style={[styles.allergenLabel, selected && styles.allergenLabelActive]}>
                  {a.label}
                </Text>
                {selected && (
                  <View style={styles.allergenCheck}>
                    <Ionicons name="close" size={10} color={Colors.error} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.textDim} />
          <Text style={styles.infoText}>
            Fit scores are calculated on-device using your goals and our AI nutrition estimates.
            Always verify allergen information with the restaurant.
          </Text>
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={18} color={Colors.primary} />
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  title: { ...Typography.h2, color: Colors.text },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    minWidth: 60,
    alignItems: 'center',
  },
  saveBtnText: { ...Typography.label, color: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.md },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  sectionTitle: { ...Typography.h4, color: Colors.text },

  optionGrid: { gap: Spacing.sm },
  optionCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    gap: 4,
    position: 'relative',
  },
  optionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFaint,
  },
  optionLabel: { ...Typography.h4, color: Colors.textMuted },
  optionLabelActive: { color: Colors.primary },
  optionDesc: { ...Typography.caption, color: Colors.textDim },
  checkMark: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dietRow: { flexDirection: 'row', gap: Spacing.sm },
  dietChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingVertical: Spacing.md,
  },
  dietChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryFaint },
  dietLabel: { ...Typography.label, color: Colors.textDim },
  dietLabelActive: { color: Colors.primary },

  allergenNote: { ...Typography.caption, color: Colors.textDim, lineHeight: 17 },
  allergenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  allergenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.card,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    position: 'relative',
  },
  allergenChipActive: {
    borderColor: Colors.error,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  allergenEmoji: { fontSize: 16 },
  allergenLabel: { ...Typography.label, color: Colors.textMuted },
  allergenLabelActive: { color: Colors.error },
  allergenCheck: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderWidth: 1,
    borderColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoCard: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  infoText: { ...Typography.caption, color: Colors.textDim, flex: 1, lineHeight: 17 },
});
