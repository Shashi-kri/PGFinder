// src/screens/CreateListingScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SegmentedControl } from '../components/SegmentedControl';
import { createListing, addMedia, ApiError } from '../services/api';
import { useLocation } from '../hooks/useLocation';
import { colors, radius, font, spacing } from '../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateListing'>;

type ListingType = 'pg' | 'flat' | 'flatmate' | 'mess';
type FoodType = 'veg' | 'nonveg' | 'jain' | 'any' | 'none';

const TYPE_OPTS: { label: string; value: ListingType }[] = [
  { label: 'PG', value: 'pg' },
  { label: 'Flat', value: 'flat' },
  { label: 'Flatmate', value: 'flatmate' },
  { label: 'Mess', value: 'mess' },
];

const FOOD_OPTS: { label: string; value: FoodType }[] = [
  { label: 'Veg', value: 'veg' },
  { label: 'Non-veg', value: 'nonveg' },
  { label: 'Jain', value: 'jain' },
  { label: 'Any', value: 'any' },
  { label: 'None', value: 'none' },
];

const SAMPLE_PHOTOS: Record<ListingType, string> = {
  pg: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
  flat: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
  flatmate: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
  mess: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
};

export default function CreateListingScreen({ navigation }: Props) {
  const { coords } = useLocation();

  const [type, setType] = useState<ListingType>('pg');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rent, setRent] = useState('12000');
  const [deposit, setDeposit] = useState('12000');
  const [foodType, setFoodType] = useState<FoodType>('veg');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('New Delhi');

  // Amenities state
  const [amenities, setAmenities] = useState<Record<string, boolean>>({
    wifi: true,
    ac: true,
    housekeeping: false,
    laundry: false,
    powerBackup: false,
  });

  const [submitting, setSubmitting] = useState(false);

  const toggleAmenity = (key: string) => {
    setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const onSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Required field', 'Please enter a title for your listing.');
      return;
    }
    const rentNum = Number(rent);
    if (isNaN(rentNum) || rentNum < 0) {
      Alert.alert('Invalid rent', 'Please enter a valid monthly rent amount.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create listing row
      const newListing = await createListing({
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        rent: rentNum,
        deposit: Number(deposit) || 0,
        food_type: foodType,
        latitude: coords.latitude,
        longitude: coords.longitude,
        address: address.trim() || 'Central Locality',
        city: city.trim() || 'New Delhi',
        amenities,
      });

      // 2. Attach default cover photo
      await addMedia(newListing.id, [
        { url: SAMPLE_PHOTOS[type], kind: 'photo', position: 0 },
      ]);

      Alert.alert('Success!', 'Your listing has been posted successfully.', [
        {
          text: 'View Listing',
          onPress: () => navigation.replace('ListingDetail', { id: newListing.id }),
        },
      ]);
    } catch (e) {
      Alert.alert('Error', (e as ApiError).message ?? 'Could not create listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.h1}>Post a Place</Text>
        <Text style={styles.sub}>Fill in details to list your property or flatmate room</Text>

        {/* Listing Type */}
        <View style={styles.field}>
          <Text style={styles.label}>Listing Type</Text>
          <SegmentedControl options={TYPE_OPTS} value={type} onChange={setType} />
        </View>

        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Spacious AC Room in Connaught Place"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Describe room features, surroundings, metro distance..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Rent & Deposit */}
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Monthly Rent (₹)</Text>
            <TextInput
              style={styles.input}
              value={rent}
              onChangeText={setRent}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Deposit (₹)</Text>
            <TextInput
              style={styles.input}
              value={deposit}
              onChangeText={setDeposit}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Food Preference */}
        <View style={styles.field}>
          <Text style={styles.label}>Food Option</Text>
          <SegmentedControl options={FOOD_OPTS} value={foodType} onChange={setFoodType} />
        </View>

        {/* Address & City */}
        <View style={styles.field}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Street address or locality"
            value={address}
            onChangeText={setAddress}
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            placeholder="City"
            value={city}
            onChangeText={setCity}
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Amenities Toggles */}
        <View style={styles.field}>
          <Text style={styles.label}>Amenities Included</Text>
          <View style={styles.amenityWrap}>
            {Object.keys(amenities).map((key) => (
              <Pressable
                key={key}
                style={[styles.chip, amenities[key] && styles.chipActive]}
                onPress={() => toggleAmenity(key)}
              >
                <Text style={[styles.chipText, amenities[key] && styles.chipTextActive]}>
                  {amenities[key] ? '✓ ' : ''}{key}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Submit */}
        <Pressable
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={onSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Publish Listing</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl * 2 },
  h1: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  sub: { fontSize: font.base, color: colors.textMuted, marginTop: -spacing.xs },
  field: { gap: spacing.xs },
  label: { fontSize: font.md, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', gap: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: font.md,
    color: colors.text,
  },
  multiline: { height: 80, textAlignVertical: 'top' },
  amenityWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: font.base, color: colors.text, textTransform: 'capitalize' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: font.md },
});
