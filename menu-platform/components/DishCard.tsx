import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { MenuItem } from '@/lib/types';
import { AllergenBadge } from './AllergenBadge';
import { MacroBar } from './MacroBar';

interface Props {
  item: MenuItem;
  blockedAllergens?: string[];
}

function fitColor(score: number) {
  if (score === 0) return Colors.fitBlocked;
  if (score >= 80) return Colors.fitGreat;
  if (score >= 65) return Colors.fitGood;
  if (score >= 40) return Colors.fitMod;
  return Colors.fitPoor;
}

export function DishCard({ item, blockedAllergens = [] }: Props) {
  const [expanded, setExpanded] = useState(false);
  const score = item.fit_score ?? 70;
  const scoreColor = fitColor(score);
  const isBlocked = score === 0;

  return (
    <TouchableOpacity
      style={[styles.card, isBlocked && styles.cardBlocked]}
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.75}
    >
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.nameLine}>
            <Text style={[styles.name, isBlocked && styles.nameBlocked]} numberOfLines={expanded ? 0 : 1}>
              {item.name}
            </Text>
            {item.is_spicy && <Text style={styles.spicy}>🌶</Text>}
          </View>
          <Text style={styles.section}>{item.section}</Text>
        </View>

        <View style={styles.headerRight}>
          {/* Fit score circle */}
          <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
            <Text style={[styles.scoreText, { color: scoreColor }]}>
              {isBlocked ? '✕' : score}
            </Text>
          </View>
        </View>
      </View>

      {/* Calories + price row */}
      <View style={styles.metaRow}>
        <View style={styles.calBadge}>
          <Text style={styles.calText}>{item.calories} cal</Text>
        </View>
        {item.price != null && (
          <Text style={styles.price}>${item.price.toFixed(2)}</Text>
        )}
        {item.fit_reason && (
          <Text style={[styles.fitReason, { color: scoreColor }]} numberOfLines={1}>
            {item.fit_reason}
          </Text>
        )}
      </View>

      {/* Description */}
      {item.description ? (
        <Text style={styles.description} numberOfLines={expanded ? 0 : 2}>
          {item.description}
        </Text>
      ) : null}

      {/* Macro bar */}
      <MacroBar protein={item.protein_g} carbs={item.carbs_g} fat={item.fat_g} />

      {/* Allergens */}
      {item.allergens.length > 0 && (
        <AllergenBadge
          allergens={item.allergens}
          warn={item.allergens.some((a) => blockedAllergens.includes(a))}
        />
      )}

      {/* Expanded detail */}
      {expanded && (
        <View style={styles.expandedSection}>
          <View style={styles.detailGrid}>
            <DetailRow label="Protein" value={`${item.protein_g}g`} color={Colors.protein} />
            <DetailRow label="Carbs" value={`${item.carbs_g}g`} color={Colors.carbs} />
            <DetailRow label="Fat" value={`${item.fat_g}g`} color={Colors.fat} />
            <DetailRow label="Fiber" value={`${item.fiber_g}g`} color={Colors.fiber} />
          </View>
          {item.dietary_tags.length > 0 && (
            <View style={styles.tagRow}>
              {item.dietary_tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={styles.confidence}>
            Confidence: {item.confidence}
          </Text>
        </View>
      )}

      {/* Expand chevron */}
      <View style={styles.chevron}>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={Colors.textDim}
        />
      </View>
    </TouchableOpacity>
  );
}

function DetailRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  cardBlocked: {
    opacity: 0.55,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  headerLeft: { flex: 1, gap: 2 },
  headerRight: { alignItems: 'flex-end' },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flex: 1 },
  name: { ...Typography.h4, color: Colors.text, flex: 1 },
  nameBlocked: { color: Colors.textDim },
  spicy: { fontSize: 14 },
  section: { ...Typography.caption, color: Colors.textDim, textTransform: 'uppercase', letterSpacing: 0.8 },
  scoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: { ...Typography.h4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  calBadge: {
    backgroundColor: Colors.primaryFaint,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  calText: { ...Typography.bodySmall, color: Colors.primaryLight, fontWeight: '600' },
  price: { ...Typography.bodySmall, color: Colors.accent },
  fitReason: { ...Typography.caption, flex: 1 },
  description: { ...Typography.bodySmall, color: Colors.textMuted, lineHeight: 19 },
  expandedSection: { gap: Spacing.sm, paddingTop: Spacing.xs },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  detailRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  detailLabel: { ...Typography.caption, color: Colors.textDim },
  detailValue: { ...Typography.caption, fontWeight: '700' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryFaint,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
  },
  tagText: { ...Typography.caption, color: Colors.primaryLight },
  confidence: { ...Typography.caption, color: Colors.textDim },
  chevron: { alignItems: 'center', paddingTop: 2 },
});
