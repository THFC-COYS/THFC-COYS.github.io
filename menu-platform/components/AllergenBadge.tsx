import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { ALLERGENS } from '@/constants/dietary';
import { Allergen } from '@/lib/types';

interface Props {
  allergens: Allergen[];
  /** When true, shows a red-tinted warning style */
  warn?: boolean;
}

export function AllergenBadge({ allergens, warn }: Props) {
  if (!allergens.length) return null;

  return (
    <View style={styles.row}>
      {allergens.map((id) => {
        const def = ALLERGENS.find((a) => a.id === id);
        return (
          <View key={id} style={[styles.badge, warn && styles.badgeWarn]}>
            <Text style={styles.emoji}>{def?.emoji ?? '⚠️'}</Text>
            <Text style={[styles.label, warn && styles.labelWarn]}>{def?.label ?? id}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.cardBorder,
  },
  badgeWarn: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  emoji: { fontSize: 11 },
  label: { ...Typography.caption, color: Colors.textDim },
  labelWarn: { color: Colors.error },
});
