// src/screens/SavedListingsScreen.tsx
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
import { ListingCard } from '../components/ListingCard';
import { getFavorites, ApiError } from '../services/api';
import { colors, font, spacing } from '../theme';
import type { SearchListing } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SavedListings'>;

export default function SavedListingsScreen({ navigation }: Props) {
  const [listings, setListings] = useState<SearchListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSaved = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const data = await getFavorites();
      setListings(data);
    } catch (e) {
      setError((e as ApiError).message ?? 'Failed to load saved listings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const renderItem = useCallback(
    ({ item }: { item: SearchListing }) => (
      <ListingCard
        listing={item}
        onPress={(l) => navigation.navigate('ListingDetail', { id: l.id })}
      />
    ),
    [navigation]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={listings}
        keyExtractor={(l) => l.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchSaved(true)} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.empty}>You have not saved any places yet.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  listContent: { paddingVertical: spacing.md },
  center: { padding: spacing.xl * 2, alignItems: 'center' },
  error: { color: colors.danger, fontSize: font.md },
  empty: { color: colors.textMuted, fontSize: font.md },
});
