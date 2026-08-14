// src/screens/MatchesScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatmateMatchCard } from '../components/FlatmateMatchCard';
import { useLocation } from '../hooks/useLocation';
import { getFlatmateMatches, ApiError } from '../services/api';
import { DEFAULT_RADIUS_M } from '../config';
import { colors, font, spacing } from '../theme';
import type { FlatmateMatch } from '../types';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { RootTabParamList } from '../navigation/types';

type Props = BottomTabScreenProps<RootTabParamList, 'Matches'>;

export default function MatchesScreen({ navigation }: Props) {
  const { coords, loading: locLoading } = useLocation();
  const [matches, setMatches] = useState<FlatmateMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The backend returns 409 if the user hasn't completed their seeker profile.
  const [needsProfile, setNeedsProfile] = useState(false);

  const fetchMatches = useCallback(
    async (isRefresh = false) => {
      if (locLoading) return;
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      setNeedsProfile(false);
      try {
        const res = await getFlatmateMatches({
          lat: coords.latitude,
          lng: coords.longitude,
          radius_meters: DEFAULT_RADIUS_M,
          limit: 30,
        });
        setMatches(res.results);
      } catch (e) {
        const err = e as ApiError;
        if (err.status === 409) {
          setNeedsProfile(true);
        } else {
          setError(err.message ?? 'Failed to load matches');
        }
        setMatches([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [coords.latitude, coords.longitude, locLoading]
  );

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const renderItem = useCallback(
    ({ item }: { item: FlatmateMatch }) => (
      <FlatmateMatchCard
        match={item}
        onPress={(m) => navigation.getParent()?.navigate('ListingDetail', { id: m.id })}
      />
    ),
    [navigation]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={styles.h1}>Flatmate matches</Text>
        <Text style={styles.sub}>Ranked by compatibility with your profile</Text>
      </View>

      <FlatList
        data={matches}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchMatches(true)}
          />
        }
        ListEmptyComponent={
          loading || locLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : needsProfile ? (
            <View style={styles.center}>
              <Text style={styles.empty}>
                Complete your seeker profile to see compatible flatmates.
              </Text>
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.empty}>
                No flatmate listings nearby yet. Try widening your radius.
              </Text>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  h1: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  sub: { fontSize: font.base, color: colors.textMuted, marginTop: 2 },
  listContent: { paddingVertical: spacing.sm, paddingBottom: spacing.xl },
  center: { padding: spacing.xl * 2, alignItems: 'center' },
  error: { color: colors.danger, fontSize: font.md, textAlign: 'center' },
  empty: { color: colors.textMuted, fontSize: font.md, textAlign: 'center' },
});
