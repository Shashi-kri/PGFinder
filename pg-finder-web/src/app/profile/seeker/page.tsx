'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { seekerProfileApi, type SeekerProfile } from '@/lib/api';
import styles from './page.module.css';

const FOOD_OPTIONS = [
  { value: 'veg', label: '🥦 Pure Veg' },
  { value: 'nonveg', label: '🍖 Non-veg' },
  { value: 'jain', label: '🌿 Jain' },
  { value: 'any', label: '🍽️ Any / Flexible' },
] as const;

const SLEEP_OPTIONS = [
  { value: 'early', label: '🌅 Early Bird (10 PM - 6 AM)' },
  { value: 'late', label: '🌙 Night Owl (After midnight)' },
  { value: 'flexible', label: '⚖️ Flexible / Adaptable' },
] as const;

const GUEST_OPTIONS = [
  { value: 'rare', label: '🚫 Rarely' },
  { value: 'sometimes', label: '☕ Occasionally' },
  { value: 'often', label: '🎉 Frequently' },
] as const;

const GENDER_OPTIONS = [
  { value: 'male', label: '👨 Male Flatmate' },
  { value: 'female', label: '👩 Female Flatmate' },
  { value: 'any', label: '🤝 Any Gender' },
] as const;

export default function SeekerProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [foodPref, setFoodPref] = useState<'veg' | 'nonveg' | 'jain' | 'any'>('any');
  const [sleepSchedule, setSleepSchedule] = useState<'early' | 'late' | 'flexible'>('flexible');
  const [cleanliness, setCleanliness] = useState(3);
  const [smoking, setSmoking] = useState(false);
  const [drinking, setDrinking] = useState(false);
  const [guestsFreq, setGuestsFreq] = useState<'rare' | 'sometimes' | 'often'>('sometimes');
  const [genderPref, setGenderPref] = useState<'male' | 'female' | 'any'>('any');
  const [budgetMin, setBudgetMin] = useState(5000);
  const [budgetMax, setBudgetMax] = useState(20000);
  const [occupation, setOccupation] = useState('');

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/profile/seeker');
      return;
    }
    if (user) {
      seekerProfileApi.get()
        .then((profile) => {
          if (profile) {
            setFoodPref(profile.food_pref ?? 'any');
            setSleepSchedule(profile.sleep_schedule ?? 'flexible');
            setCleanliness(profile.cleanliness ?? 3);
            setSmoking(Boolean(profile.smoking));
            setDrinking(Boolean(profile.drinking));
            setGuestsFreq(profile.guests_freq ?? 'sometimes');
            setGenderPref(profile.gender_pref ?? 'any');
            setBudgetMin(profile.budget_min ?? 5000);
            setBudgetMax(profile.budget_max ?? 20000);
            setOccupation(profile.occupation ?? '');
          }
        })
        .catch(() => {})
        .finally(() => setFetching(false));
    }
  }, [user, loading, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (budgetMax < budgetMin) {
      setError('Maximum budget must be greater than or equal to minimum budget');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const payload: SeekerProfile = {
        food_pref: foodPref,
        sleep_schedule: sleepSchedule,
        cleanliness,
        smoking,
        drinking,
        guests_freq: guestsFreq,
        gender_pref: genderPref,
        budget_min: Number(budgetMin),
        budget_max: Number(budgetMax),
        occupation: occupation.trim() || null,
      };

      await seekerProfileApi.save(payload);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save seeker profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading || fetching) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)' }}>
        Loading your seeker preferences...
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHero}>
        <div className="container">
          <span className={styles.heroEyebrow}>Lifestyle & Habits</span>
          <h1 className={styles.heroTitle}>Flatmate Seeker Profile</h1>
          <p className={styles.heroSub}>
            Our AI compatibility algorithm uses these living preferences to match you with your ideal flatmates.
          </p>
        </div>
      </div>

      <div className={`container ${styles.inner}`} style={{ marginTop: 32 }}>
        <Link href="/profile" className={styles.back}>
          ← Back to Account Profile
        </Link>

        <form onSubmit={handleSave} className={styles.formCard}>
          {error && <div className={`${styles.alert} ${styles.alertError}`}>{error}</div>}
          {success && (
            <div className={`${styles.alert} ${styles.alertSuccess}`}>
              🎉 Preferences saved successfully! You can now explore your{' '}
              <Link href="/matches" style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                Flatmate Matches →
              </Link>
            </div>
          )}

          {/* Food Preference */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionHeading}>Dietary Habit</h3>
            <p className={styles.sectionDesc}>What are your food habits or preferences?</p>
            <div className={styles.chipRow}>
              {FOOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.chipBtn} ${foodPref === opt.value ? styles.chipActive : ''}`}
                  onClick={() => setFoodPref(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sleep Schedule */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionHeading}>Sleep Routine</h3>
            <p className={styles.sectionDesc}>When do you usually sleep and wake up?</p>
            <div className={styles.chipRow}>
              {SLEEP_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.chipBtn} ${sleepSchedule === opt.value ? styles.chipActive : ''}`}
                  onClick={() => setSleepSchedule(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cleanliness Slider */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionHeading}>Cleanliness Standards</h3>
            <p className={styles.sectionDesc}>1 = Very relaxed, 5 = Extremely neat & organized</p>
            <div className={styles.sliderContainer}>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={cleanliness}
                onChange={(e) => setCleanliness(Number(e.target.value))}
                className={styles.sliderInput}
              />
              <span className={styles.sliderValue}>{cleanliness} / 5</span>
            </div>
          </div>

          {/* Smoking & Drinking Toggles */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionHeading}>Habits & Lifestyle</h3>
            <div className={styles.toggleRow}>
              <div className={styles.toggleMeta}>
                <span className={styles.toggleLabel}>Smoking</span>
                <span className={styles.toggleSub}>Do you smoke inside or around the flat?</span>
              </div>
              <button
                type="button"
                className={`${styles.toggleBtn} ${smoking ? styles.toggleBtnActive : ''}`}
                onClick={() => setSmoking(!smoking)}
                aria-label="Toggle smoking"
              >
                <span className={`${styles.toggleThumb} ${smoking ? styles.toggleThumbActive : ''}`} />
              </button>
            </div>

            <div className={styles.toggleRow}>
              <div className={styles.toggleMeta}>
                <span className={styles.toggleLabel}>Drinking</span>
                <span className={styles.toggleSub}>Do you consume alcohol socially or regularly?</span>
              </div>
              <button
                type="button"
                className={`${styles.toggleBtn} ${drinking ? styles.toggleBtnActive : ''}`}
                onClick={() => setDrinking(!drinking)}
                aria-label="Toggle drinking"
              >
                <span className={`${styles.toggleThumb} ${drinking ? styles.toggleThumbActive : ''}`} />
              </button>
            </div>
          </div>

          {/* Guests Frequency */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionHeading}>Guests & Visitors</h3>
            <p className={styles.sectionDesc}>How frequently do friends or family visit?</p>
            <div className={styles.chipRow}>
              {GUEST_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.chipBtn} ${guestsFreq === opt.value ? styles.chipActive : ''}`}
                  onClick={() => setGuestsFreq(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gender Preference */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionHeading}>Flatmate Gender Preference</h3>
            <p className={styles.sectionDesc}>Who are you comfortable sharing a flat with?</p>
            <div className={styles.chipRow}>
              {GENDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.chipBtn} ${genderPref === opt.value ? styles.chipActive : ''}`}
                  onClick={() => setGenderPref(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Budget Range */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionHeading}>Monthly Rent Budget (₹)</h3>
            <div className={styles.budgetRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Min Budget (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  className={styles.textInput}
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(Number(e.target.value))}
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Max Budget (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  className={styles.textInput}
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(Number(e.target.value))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Occupation */}
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionHeading}>Occupation / Study</h3>
            <input
              type="text"
              placeholder="e.g. Software Engineer, Medical Student, Designer"
              className={styles.textInput}
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
            />
          </div>

          <div className={styles.formFooter}>
            <Link href="/matches" className={styles.matchLink}>
              🔍 Explore Flatmate Matches
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'Saving...' : 'Save Living Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
