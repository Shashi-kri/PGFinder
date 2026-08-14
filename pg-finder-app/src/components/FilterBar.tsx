// src/components/FilterBar.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { colors, radius, font, spacing } from '../theme';
import type { ListingType, FoodType, SearchFilters } from '../types';

interface Props {
  filters: SearchFilters;
  onChange: (next: SearchFilters) => void;
}

const CATEGORIES: { label: string; value: ListingType | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'PG', value: 'pg' },
  { label: 'Flat', value: 'flat' },
  { label: 'Flatmate', value: 'flatmate' },
  { label: 'Mess', value: 'mess' },
];

const FOODS: { label: string; value: FoodType | undefined }[] = [
  { label: 'Any food', value: undefined },
  { label: 'Veg', value: 'veg' },
  { label: 'Non-veg', value: 'nonveg' },
  { label: 'Jain', value: 'jain' },
];

// Preset budget ceilings (₹/month). Tapping cycles the max_rent filter.
const BUDGETS: { label: string; value: number | undefined }[] = [
  { label: 'Any budget', value: undefined },
  { label: '≤ ₹8k', value: 8000 },
  { label: '≤ ₹12k', value: 12000 },
  { label: '≤ ₹20k', value: 20000 },
];

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function FilterBar({ filters, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      {/* Category row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {CATEGORIES.map((c) => (
          <Chip
            key={c.label}
            label={c.label}
            active={filters.type === c.value}
            onPress={() => onChange({ ...filters, type: c.value })}
          />
        ))}
      </ScrollView>

      {/* Food + budget row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {FOODS.map((f) => (
          <Chip
            key={f.label}
            label={f.label}
            active={filters.food_type === f.value}
            onPress={() => onChange({ ...filters, food_type: f.value })}
          />
        ))}
        <View style={styles.divider} />
        {BUDGETS.map((b) => (
          <Chip
            key={b.label}
            label={b.label}
            active={filters.max_rent === b.value}
            onPress={() => onChange({ ...filters, max_rent: b.value })}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  row: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: font.base, color: colors.text, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
});
