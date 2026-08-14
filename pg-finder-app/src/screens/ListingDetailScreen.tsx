// src/screens/ListingDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Pressable,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getListing, ApiError } from '../services/api';
import { colors, radius, font, spacing } from '../theme';
import { formatRent, FOOD_LABEL } from '../utils/format';
import { FoodBadge, VerifiedBadge } from '../components/Badge';
import type { ListingDetail } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ListingDetail'>;

const { width } = Dimensions.get('window');

export default function ListingDetailScreen({ route }: Props) {
  const { id } = route.params;
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getListing(id);
        if (!cancelled) setListing(data);
      } catch (e) {
        if (!cancelled) setError((e as ApiError).message ?? 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const onCallHost = () => {
    const phone = '+919876543210';
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Contact Host', `Call ${listing?.owner.name || 'Owner'} at ${phone}`);
    });
  };

  const onWhatsAppHost = () => {
    const phone = '919876543210';
    const text = encodeURIComponent(`Hi! I saw your listing "${listing?.title}" on PG-Finder and am interested in learning more.`);
    Linking.openURL(`https://wa.me/${phone}?text=${text}`).catch(() => {
      Alert.alert('Contact Host', `WhatsApp message: ${phone}`);
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }
  if (error || !listing) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>{error ?? 'Not found'}</Text>
      </SafeAreaView>
    );
  }

  const photos = listing.media.filter((m) => m.kind === 'photo');

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Photo carousel */}
        {photos.length > 0 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {photos.map((m) => (
              <Image key={m.id} source={{ uri: m.url }} style={styles.hero} />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.hero, styles.heroPlaceholder]}>
            <Text style={styles.heroPlaceholderText}>No photos yet</Text>
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{listing.title}</Text>
            <VerifiedBadge verified={listing.verified} />
          </View>

          <Text style={styles.rent}>
            {formatRent(listing.rent)}
            <Text style={styles.perMonth}> / month</Text>
          </Text>
          {listing.deposit > 0 && (
            <Text style={styles.deposit}>
              Deposit {formatRent(listing.deposit)}
            </Text>
          )}

          <Text style={styles.location}>
            {listing.address ? `${listing.address}, ` : ''}
            {listing.city ?? 'Unknown'}
          </Text>

          <View style={styles.badgeRow}>
            <FoodBadge food={listing.food_type} />
            {listing.review_count > 0 && (
              <Text style={styles.rating}>
                ★ {listing.avg_rating.toFixed(1)} ({listing.review_count} reviews)
              </Text>
            )}
          </View>

          {listing.description ? (
            <Text style={styles.desc}>{listing.description}</Text>
          ) : null}

          {/* Amenities */}
          {Object.keys(listing.amenities ?? {}).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenityWrap}>
                {Object.entries(listing.amenities)
                  .filter(([, v]) => v)
                  .map(([k]) => (
                    <View key={k} style={styles.amenityChip}>
                      <Text style={styles.amenityChipText}>{k}</Text>
                    </View>
                  ))}
              </View>
            </View>
          )}

          {/* Owner */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Posted by</Text>
            <View style={styles.ownerRow}>
              <Text style={styles.ownerName}>
                {listing.owner.name ?? 'Owner'}
              </Text>
              <VerifiedBadge verified={listing.owner.verified} />
              {listing.owner.verification_type !== 'none' && (
                <Text style={styles.ownerType}>
                  {listing.owner.verification_type}
                </Text>
              )}
            </View>
          </View>

          <Text style={styles.foodNote}>
            Food option: {FOOD_LABEL[listing.food_type]}
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Host Contact Bar */}
      <View style={styles.stickyBar}>
        <Pressable style={styles.callBtn} onPress={onCallHost}>
          <Text style={styles.callText}>📞 Call Host</Text>
        </Pressable>
        <Pressable style={styles.waBtn} onPress={onWhatsAppHost}>
          <Text style={styles.waText}>💬 WhatsApp</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  error: { color: colors.danger, fontSize: font.md },
  hero: { width, height: 260, backgroundColor: '#EEF2FF' },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  heroPlaceholderText: { color: colors.primary, fontWeight: '700' },
  body: { padding: spacing.lg, gap: 6 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { flex: 1, fontSize: font.xl, fontWeight: '800', color: colors.text },
  rent: { fontSize: font.xl, fontWeight: '800', color: colors.primary },
  perMonth: { fontSize: font.base, fontWeight: '500', color: colors.textMuted },
  deposit: { fontSize: font.base, color: colors.textMuted },
  location: { fontSize: font.md, color: colors.textMuted, marginTop: 2 },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  rating: { fontSize: font.base, color: colors.star, fontWeight: '700' },
  desc: {
    fontSize: font.md,
    color: colors.text,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  section: { marginTop: spacing.lg, gap: spacing.sm },
  sectionTitle: { fontSize: font.md, fontWeight: '800', color: colors.text },
  amenityWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  amenityChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  amenityChipText: {
    fontSize: font.base,
    color: colors.text,
    textTransform: 'capitalize',
  },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ownerName: { fontSize: font.md, fontWeight: '700', color: colors.text },
  ownerType: {
    fontSize: font.sm,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  foodNote: { marginTop: spacing.lg, fontSize: font.base, color: colors.textMuted },
  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
  },
  callBtn: {
    flex: 1,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  callText: { color: colors.primary, fontWeight: '800', fontSize: font.md },
  waBtn: {
    flex: 1,
    backgroundColor: '#25D366',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  waText: { color: '#fff', fontWeight: '800', fontSize: font.md },
});
