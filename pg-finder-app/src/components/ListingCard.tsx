// src/components/ListingCard.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';
import { colors, radius, font, spacing } from '../theme';
import { FoodBadge, VerifiedBadge } from './Badge';
import { formatDistance, formatRent } from '../utils/format';
import type { SearchListing } from '../types';

interface Props {
  listing: SearchListing;
  /** Optional hero image; search results don't include media, so callers may
   *  pass one fetched separately, otherwise a placeholder shows. */
  imageUrl?: string | null;
  onPress?: (listing: SearchListing) => void;
}

const TYPE_LABEL: Record<SearchListing['type'], string> = {
  pg: 'PG',
  flat: 'Flat',
  flatmate: 'Flatmate',
  mess: 'Mess',
};

function ListingCardBase({ listing, imageUrl, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => onPress?.(listing)}
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${formatRent(listing.rent)} per month`}
    >
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>
              {TYPE_LABEL[listing.type]}
            </Text>
          </View>
        )}
        <View style={styles.typeTag}>
          <Text style={styles.typeTagText}>{TYPE_LABEL[listing.type]}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {listing.title}
          </Text>
          <VerifiedBadge verified={listing.verified} />
        </View>

        <Text style={styles.rent}>
          {formatRent(listing.rent)}
          <Text style={styles.perMonth}> / month</Text>
        </Text>

        <Text style={styles.location} numberOfLines={1}>
          {listing.address ? `${listing.address}, ` : ''}
          {listing.city ?? 'Unknown'} · {formatDistance(listing.dist_m)} away
        </Text>

        <View style={styles.badgeRow}>
          <FoodBadge food={listing.food_type} />
          {listing.amenities?.wifi ? (
            <Text style={styles.amenity}>· Wi-Fi</Text>
          ) : null}
          {listing.amenities?.ac ? (
            <Text style={styles.amenity}>· AC</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

// Memoize: search lists can be long, and cards are pure w.r.t. their props.
export const ListingCard = React.memo(ListingCardBase);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.9 },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 170 },
  placeholder: {
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: font.lg,
  },
  typeTag: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(17,24,39,0.75)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  typeTagText: { color: '#fff', fontSize: font.sm, fontWeight: '700' },
  body: { padding: spacing.md, gap: 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { flex: 1, fontSize: font.md, fontWeight: '700', color: colors.text },
  rent: { fontSize: font.lg, fontWeight: '800', color: colors.primary },
  perMonth: { fontSize: font.sm, fontWeight: '500', color: colors.textMuted },
  location: { fontSize: font.base, color: colors.textMuted },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  amenity: { fontSize: font.sm, color: colors.textMuted },
});
