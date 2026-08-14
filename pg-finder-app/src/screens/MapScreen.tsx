// src/screens/MapScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocation } from '../hooks/useLocation';
import { searchListings, ApiError } from '../services/api';
import { DEFAULT_RADIUS_M } from '../config';
import { colors, radius, font, spacing } from '../theme';
import { formatDistance, formatRent } from '../utils/format';
import { FoodBadge, VerifiedBadge } from '../components/Badge';
import type { SearchListing } from '../types';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { RootTabParamList } from '../navigation/types';

type Props = BottomTabScreenProps<RootTabParamList, 'Map'>;

// Convert a radius in meters to a rough latitude/longitude delta for the
// initial map zoom (1 deg lat ~= 111km).
function radiusToDelta(radiusM: number): number {
  return (radiusM / 111000) * 2.5;
}

export default function MapScreen({ navigation }: Props) {
  const { coords, loading: locLoading } = useLocation();
  const mapRef = useRef<MapView>(null);
  const [listings, setListings] = useState<SearchListing[]>([]);
  const [selected, setSelected] = useState<SearchListing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialRegion: Region = {
    latitude: coords.latitude,
    longitude: coords.longitude,
    latitudeDelta: radiusToDelta(DEFAULT_RADIUS_M),
    longitudeDelta: radiusToDelta(DEFAULT_RADIUS_M),
  };

  const fetchListings = useCallback(async () => {
    if (locLoading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await searchListings({
        lat: coords.latitude,
        lng: coords.longitude,
        radius_meters: DEFAULT_RADIUS_M,
        limit: 50,
      });
      setListings(res.results);
    } catch (e) {
      setError((e as ApiError).message ?? 'Failed to load map listings');
    } finally {
      setLoading(false);
    }
  }, [coords.latitude, coords.longitude, locLoading]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        onPress={() => setSelected(null)}
      >
        {listings.map((l) => (
          <Marker
            key={l.id}
            coordinate={{ latitude: l.latitude, longitude: l.longitude }}
            pinColor={l.type === 'flatmate' ? colors.primary : colors.danger}
            onPress={(e) => {
              // Stop the map's onPress from immediately clearing selection.
              e.stopPropagation();
              setSelected(l);
            }}
          />
        ))}
      </MapView>

      {loading && (
        <View style={styles.loadingPill}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={styles.loadingText}>Loading nearby…</Text>
        </View>
      )}

      {error && (
        <View style={[styles.loadingPill, styles.errorPill]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Bottom sheet preview for the tapped pin */}
      {selected && (
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {selected.title}
            </Text>
            <VerifiedBadge verified={selected.verified} />
          </View>
          <Text style={styles.sheetRent}>
            {formatRent(selected.rent)}
            <Text style={styles.perMonth}> / month</Text>
          </Text>
          <Text style={styles.sheetLocation} numberOfLines={1}>
            {selected.city ?? 'Unknown'} · {formatDistance(selected.dist_m)} away
          </Text>
          <View style={styles.sheetBadges}>
            <FoodBadge food={selected.food_type} />
          </View>
          <Pressable
            style={styles.sheetBtn}
            onPress={() =>
              navigation.getParent()?.navigate('ListingDetail', { id: selected.id })
            }
          >
            <Text style={styles.sheetBtnText}>View details</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loadingPill: {
    position: 'absolute',
    top: spacing.lg,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadingText: { fontSize: font.base, color: colors.text },
  errorPill: { backgroundColor: '#FEE2E2' },
  errorText: { color: colors.danger, fontSize: font.base },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sheetTitle: { flex: 1, fontSize: font.lg, fontWeight: '800', color: colors.text },
  sheetRent: { fontSize: font.md, fontWeight: '800', color: colors.primary },
  perMonth: { fontSize: font.sm, fontWeight: '500', color: colors.textMuted },
  sheetLocation: { fontSize: font.base, color: colors.textMuted },
  sheetBadges: { flexDirection: 'row', gap: spacing.sm, marginTop: 2 },
  sheetBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  sheetBtnText: { color: '#fff', fontWeight: '700', fontSize: font.md },
});
