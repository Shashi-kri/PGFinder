// src/components/FlatmateMatchCard.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, font, spacing } from '../theme';
import { ScoreBadge, FoodBadge, VerifiedBadge } from './Badge';
import { formatDistance, formatRent } from '../utils/format';
import type { FlatmateMatch } from '../types';

interface Props {
  match: FlatmateMatch;
  onPress?: (match: FlatmateMatch) => void;
}

function FlatmateMatchCardBase({ match, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => onPress?.(match)}
      accessibilityRole="button"
      accessibilityLabel={`${match.title}, ${match.compatibility_score} percent match`}
    >
      {/* Header: score badge + rent */}
      <View style={styles.header}>
        <ScoreBadge score={match.compatibility_score} />
        <Text style={styles.rent}>
          {formatRent(match.rent)}
          <Text style={styles.perMonth}> / mo</Text>
        </Text>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>
          {match.title}
        </Text>
        <VerifiedBadge verified={match.owner.verified} />
      </View>

      <Text style={styles.location} numberOfLines={1}>
        {match.owner.name ? `${match.owner.name} · ` : ''}
        {match.city ?? 'Unknown'} · {formatDistance(match.dist_m)} away
      </Text>

      {/* Top matching factors as check tags (show up to 2 per spec). */}
      {match.top_matching_factors.length > 0 && (
        <View style={styles.tagRow}>
          {match.top_matching_factors.slice(0, 2).map((f) => (
            <View key={f} style={styles.matchTag}>
              <Text style={styles.matchTagText}>✓ {f}</Text>
            </View>
          ))}
        </View>
      )}

      {/* One clashing factor as a subtle heads-up, if any. */}
      {match.clashing_factors.length > 0 && (
        <Text style={styles.clash} numberOfLines={1}>
          ⚠ {match.clashing_factors[0]}
        </Text>
      )}

      <View style={styles.footer}>
        <FoodBadge food={match.food_type} />
      </View>
    </Pressable>
  );
}

export const FlatmateMatchCard = React.memo(FlatmateMatchCardBase);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  pressed: { opacity: 0.9 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rent: { fontSize: font.lg, fontWeight: '800', color: colors.text },
  perMonth: { fontSize: font.sm, fontWeight: '500', color: colors.textMuted },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { flex: 1, fontSize: font.md, fontWeight: '700', color: colors.text },
  location: { fontSize: font.base, color: colors.textMuted },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 2 },
  matchTag: {
    backgroundColor: colors.successBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  matchTagText: { color: colors.success, fontSize: font.sm, fontWeight: '700' },
  clash: { fontSize: font.sm, color: colors.warning, marginTop: 2 },
  footer: { flexDirection: 'row', marginTop: 4 },
});
