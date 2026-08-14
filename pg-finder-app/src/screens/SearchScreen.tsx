// src/screens/SearchScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FilterBar } from '../components/FilterBar';
import { ListingCard } from '../components/ListingCard';
import { useLocation } from '../hooks/useLocation';
import { searchListings, ApiError } from '../services/api';
import { DEFAULT_RADIUS_M } from '../config';
import { colors, font, spacing } from '../theme';
import type { SearchListing, SearchFilters } from '../types';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { RootTabParamList } from '../navigation/types';

type Props = BottomTabScreenProps<RootTabParamList, 'Search'>;

export default function SearchScreen({ navigation }: Props) {
  const { coords, loading: locLoading } = useLocation();
  const [filters, setFilters] = useState<SearchFilters>({
    radius_meters: DEFAULT_RADIUS_M,
  });
  const [listings, setListings] = useState<SearchListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(
    async (isRefresh = false) => {
      if (locLoading) return;
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        const res = await searchListings({
          lat: coords.latitude,
          lng: coords.longitude,
          ...filters,
          limit: 30,
        });
        setListings(res.results);
      } catch (e) {
        setError((e as ApiError).message ?? 'Failed to load listings');
        setListings([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [coords.latitude, coords.longitude, filters, locLoading]
  );

  // Refetch when filters or location settle. Debounced so rapid chip taps
  // don't fire a request per tap.
  useEffect(() => {
    const t = setTimeout(() => fetchListings(), 300);
    return () => clearTimeout(t);
  }, [fetchListings]);

  const keyExtractor = useCallback((l: SearchListing) => l.id, []);

  const renderItem = useCallback(
    ({ item }: { item: SearchListing }) => (
      <ListingCard
        listing={item}
        onPress={(l) => navigation.getParent()?.navigate('ListingDetail', { id: l.id })}
      />
    ),
    [navigation]
  );

  const header = useMemo(
    () => <FilterBar filters={filters} onChange={setFilters} />,
    [filters]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={styles.h1}>Find your place</Text>
        <Text style={styles.sub}>
          {listings.length > 0
            ? `${listings.length} nearby`
            : 'Search PGs, flats, flatmates & mess'}
        </Text>
      </View>

      <FlatList
        data={listings}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={header}
        stickyHeaderIndices={[0]}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchListings(true)}
          />
        }
        ListEmptyComponent={
          loading || locLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.empty}>No listings match your filters.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  h1: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  sub: { fontSize: font.base, color: colors.textMuted, marginTop: 2 },
  listContent: { paddingBottom: spacing.xl },
  center: { padding: spacing.xl * 2, alignItems: 'center' },
  error: { color: colors.danger, fontSize: font.md },
  empty: { color: colors.textMuted, fontSize: font.md },
});
