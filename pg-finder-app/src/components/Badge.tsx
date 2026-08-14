// src/components/Badge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, font, spacing } from '../theme';
import { FOOD_LABEL } from '../utils/format';
import type { FoodType } from '../types';

/** Generic pill badge. */
export function Pill({
  label,
  color = colors.text,
  bg = colors.border,
}: {
  label: string;
  color?: string;
  bg?: string;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Colored food-type badge. Hidden for 'none'/'any'. */
export function FoodBadge({ food }: { food: FoodType }) {
  if (food === 'none' || food === 'any') return null;
  const map: Partial<Record<FoodType, string>> = {
    veg: colors.veg,
    nonveg: colors.nonveg,
    jain: colors.jain,
  };
  const c = map[food] ?? colors.textMuted;
  return (
    <View style={[styles.foodBadge, { borderColor: c }]}>
      <View style={[styles.dot, { backgroundColor: c }]} />
      <Text style={[styles.foodText, { color: c }]}>{FOOD_LABEL[food]}</Text>
    </View>
  );
}

/** Verified badge — only rendered when verified is true. */
export function VerifiedBadge({ verified }: { verified: boolean }) {
  if (!verified) return null;
  return (
    <View style={styles.verified}>
      <Text style={styles.verifiedText}>✓ Verified</Text>
    </View>
  );
}

/** Green compatibility pill, e.g. "85% Match". */
export function ScoreBadge({ score }: { score: number }) {
  // Shade by band so a weak match still reads as weak.
  const bg =
    score >= 75 ? colors.successBg : score >= 50 ? '#FEF9C3' : '#FEE2E2';
  const fg =
    score >= 75 ? colors.success : score >= 50 ? colors.warning : colors.danger;
  return (
    <View style={[styles.score, { backgroundColor: bg }]}>
      <Text style={[styles.scoreText, { color: fg }]}>{score}% Match</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  pillText: { fontSize: font.sm, fontWeight: '600' },
  foodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    gap: 4,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  foodText: { fontSize: font.sm, fontWeight: '700' },
  verified: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  verifiedText: { color: '#fff', fontSize: font.sm, fontWeight: '700' },
  score: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  scoreText: { fontSize: font.base, fontWeight: '800' },
});
