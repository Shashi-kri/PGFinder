// src/screens/EditProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SegmentedControl } from '../components/SegmentedControl';
import { getSeekerProfile, updateSeekerProfile, ApiError } from '../services/api';
import { colors, radius, font, spacing } from '../theme';
import { formatRent } from '../utils/format';
import type {
  SeekerProfileInput,
  FoodPref,
  SleepSchedule,
  GuestFrequency,
  GenderPref,
} from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

// Sensible defaults for a first-time profile.
const DEFAULTS: SeekerProfileInput = {
  food_pref: 'any',
  sleep_schedule: 'flexible',
  cleanliness: 3,
  smoking: false,
  drinking: false,
  guests_freq: 'sometimes',
  gender_pref: 'any',
  budget_min: 5000,
  budget_max: 15000,
  occupation: '',
};

const FOOD_OPTS: { label: string; value: FoodPref }[] = [
  { label: 'Veg', value: 'veg' },
  { label: 'Non-veg', value: 'nonveg' },
  { label: 'Jain', value: 'jain' },
  { label: 'Any', value: 'any' },
];
const SLEEP_OPTS: { label: string; value: SleepSchedule }[] = [
  { label: 'Early bird', value: 'early' },
  { label: 'Night owl', value: 'late' },
  { label: 'Flexible', value: 'flexible' },
];
const GUEST_OPTS: { label: string; value: GuestFrequency }[] = [
  { label: 'Rarely', value: 'rare' },
  { label: 'Sometimes', value: 'sometimes' },
  { label: 'Often', value: 'often' },
];
const GENDER_OPTS: { label: string; value: GenderPref }[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Any', value: 'any' },
];

// Budget adjusts in ₹1,000 steps.
const BUDGET_STEP = 1000;
const BUDGET_FLOOR = 0;
const BUDGET_CEIL = 100000;

export default function EditProfileScreen({ navigation }: Props) {
  const [form, setForm] = useState<SeekerProfileInput>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load existing profile on mount (null => first-time, keep defaults).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing = await getSeekerProfile();
        if (!cancelled && existing) {
          setForm({
            food_pref: existing.food_pref,
            sleep_schedule: existing.sleep_schedule,
            cleanliness: existing.cleanliness,
            smoking: existing.smoking,
            drinking: existing.drinking,
            guests_freq: existing.guests_freq,
            gender_pref: existing.gender_pref,
            budget_min: existing.budget_min,
            budget_max: existing.budget_max,
            occupation: existing.occupation ?? '',
          });
        }
      } catch (e) {
        if (!cancelled) setLoadError((e as ApiError).message ?? 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = <K extends keyof SeekerProfileInput>(
    key: K,
    value: SeekerProfileInput[K]
  ) => setForm((f) => ({ ...f, [key]: value }));

  const adjustBudget = (key: 'budget_min' | 'budget_max', delta: number) => {
    setForm((f) => {
      let next = Math.max(BUDGET_FLOOR, Math.min(BUDGET_CEIL, f[key] + delta));
      // Keep min <= max.
      if (key === 'budget_min' && next > f.budget_max) next = f.budget_max;
      if (key === 'budget_max' && next < f.budget_min) next = f.budget_min;
      return { ...f, [key]: next };
    });
  };

  const onSave = async () => {
    // Client-side guard mirrors the backend rule.
    if (form.budget_max < form.budget_min) {
      Alert.alert('Check budget', 'Maximum budget must be at least the minimum.');
      return;
    }
    setSaving(true);
    try {
      await updateSeekerProfile({
        ...form,
        occupation: form.occupation?.trim() ? form.occupation.trim() : null,
      });
      // Go to Matches so the user immediately sees the effect.
      navigation.navigate('Tabs', { screen: 'Matches' });
    } catch (e) {
      Alert.alert('Save failed', (e as ApiError).message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {loadError && <Text style={styles.loadError}>{loadError}</Text>}

        <Text style={styles.intro}>
          These preferences power your flatmate compatibility scores.
        </Text>

        {/* Food */}
        <Field label="Food preference">
          <SegmentedControl
            options={FOOD_OPTS}
            value={form.food_pref}
            onChange={(v) => set('food_pref', v)}
          />
        </Field>

        {/* Sleep */}
        <Field label="Sleep schedule">
          <SegmentedControl
            options={SLEEP_OPTS}
            value={form.sleep_schedule}
            onChange={(v) => set('sleep_schedule', v)}
          />
        </Field>

        {/* Cleanliness 1..5 */}
        <Field label={`Cleanliness — ${form.cleanliness}/5`}>
          <View style={styles.scaleRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                onPress={() => set('cleanliness', n)}
                style={[
                  styles.scaleDot,
                  n <= form.cleanliness && styles.scaleDotActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Cleanliness ${n}`}
              >
                <Text
                  style={[
                    styles.scaleText,
                    n <= form.cleanliness && styles.scaleTextActive,
                  ]}
                >
                  {n}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.hint}>1 = relaxed · 5 = spotless</Text>
        </Field>

        {/* Toggles */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Smoker</Text>
          <Switch
            value={form.smoking}
            onValueChange={(v) => set('smoking', v)}
            trackColor={{ true: colors.primary }}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Drinks alcohol</Text>
          <Switch
            value={form.drinking}
            onValueChange={(v) => set('drinking', v)}
            trackColor={{ true: colors.primary }}
          />
        </View>

        {/* Guests */}
        <Field label="How often you host guests">
          <SegmentedControl
            options={GUEST_OPTS}
            value={form.guests_freq}
            onChange={(v) => set('guests_freq', v)}
          />
        </Field>

        {/* Gender preference */}
        <Field label="Preferred flatmate gender">
          <SegmentedControl
            options={GENDER_OPTS}
            value={form.gender_pref}
            onChange={(v) => set('gender_pref', v)}
          />
        </Field>

        {/* Budget range via steppers */}
        <Field label="Monthly budget">
          <View style={styles.budgetRow}>
            <BudgetStepper
              caption="Min"
              value={form.budget_min}
              onDec={() => adjustBudget('budget_min', -BUDGET_STEP)}
              onInc={() => adjustBudget('budget_min', BUDGET_STEP)}
            />
            <BudgetStepper
              caption="Max"
              value={form.budget_max}
              onDec={() => adjustBudget('budget_max', -BUDGET_STEP)}
              onInc={() => adjustBudget('budget_max', BUDGET_STEP)}
            />
          </View>
        </Field>

        {/* Occupation */}
        <Field label="Occupation (optional)">
          <TextInput
            style={styles.input}
            value={form.occupation ?? ''}
            onChangeText={(t) => set('occupation', t)}
            placeholder="e.g. Student, Software Engineer"
            placeholderTextColor={colors.textMuted}
          />
        </Field>

        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={onSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>Save & see matches</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- small local components -------------------------------------------------

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function BudgetStepper({
  caption,
  value,
  onDec,
  onInc,
}: {
  caption: string;
  value: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperCaption}>{caption}</Text>
      <View style={styles.stepperControls}>
        <Pressable style={styles.stepBtn} onPress={onDec} accessibilityLabel={`Decrease ${caption}`}>
          <Text style={styles.stepBtnText}>−</Text>
        </Pressable>
        <Text style={styles.stepValue}>{formatRent(value)}</Text>
        <Pressable style={styles.stepBtn} onPress={onInc} accessibilityLabel={`Increase ${caption}`}>
          <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
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
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl * 2 },
  intro: { fontSize: font.base, color: colors.textMuted },
  loadError: { color: colors.danger, fontSize: font.base },
  field: { gap: spacing.sm },
  label: { fontSize: font.md, fontWeight: '700', color: colors.text },
  hint: { fontSize: font.sm, color: colors.textMuted },
  scaleRow: { flexDirection: 'row', gap: spacing.sm },
  scaleDot: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  scaleText: { fontSize: font.md, fontWeight: '700', color: colors.text },
  scaleTextActive: { color: '#fff' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  toggleLabel: { fontSize: font.md, color: colors.text, fontWeight: '600' },
  budgetRow: { flexDirection: 'row', gap: spacing.md },
  stepper: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  stepperCaption: { fontSize: font.sm, color: colors.textMuted, fontWeight: '600' },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBtnText: { fontSize: font.lg, fontWeight: '800', color: colors.primary },
  stepValue: { fontSize: font.base, fontWeight: '700', color: colors.text },
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
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontWeight: '800', fontSize: font.md },
});
