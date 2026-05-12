import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';

interface Props {
  protein: number;
  carbs: number;
  fat: number;
}

export function MacroBar({ protein, carbs, fat }: Props) {
  const total = protein + carbs + fat || 1;
  const pPct = (protein / total) * 100;
  const cPct = (carbs / total) * 100;
  const fPct = (fat / total) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View style={[styles.segment, { width: `${pPct}%`, backgroundColor: Colors.protein }]} />
        <View style={[styles.segment, { width: `${cPct}%`, backgroundColor: Colors.carbs }]} />
        <View style={[styles.segment, { width: `${fPct}%`, backgroundColor: Colors.fat }]} />
      </View>
      <View style={styles.legend}>
        <MacroLegendItem color={Colors.protein} label="P" value={protein} />
        <MacroLegendItem color={Colors.carbs} label="C" value={carbs} />
        <MacroLegendItem color={Colors.fat} label="F" value={fat} />
      </View>
    </View>
  );
}

function MacroLegendItem({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendValue}>{value}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.xs },
  track: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: Colors.cardBorder,
  },
  segment: { height: '100%' },
  legend: { flexDirection: 'row', gap: Spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  legendLabel: { ...Typography.caption, color: Colors.textDim },
  legendValue: { ...Typography.caption, color: Colors.textMuted },
});
