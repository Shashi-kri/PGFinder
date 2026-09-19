'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { flatmatesApi, type FlatmateMatch } from '@/lib/api';
import styles from './page.module.css';

const SCORE_FILTERS = [
  { label: 'All Matches', min: undefined },
  { label: '70%+ Match', min: 70 },
  { label: '80%+ Match', min: 80 },
  { label: '90%+ Match', min: 90 },
];

export default function FlatmateMatchesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [matches, setMatches] = useState<FlatmateMatch[]>([]);
  const [totalEligible, setTotalEligible] = useState(0);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [minScore, setMinScore] = useState<number | undefined>(undefined);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setNeedsProfile(false);
    try {
      const res = await flatmatesApi.getMatches({ min_score: minScore });
      setMatches(res.results ?? []);
      setTotalEligible(res.total_eligible ?? 0);
    } catch (err: any) {
      if (err?.message?.includes('Complete your seeker profile') || err?.message?.includes('409')) {
        setNeedsProfile(true);
      }
    } finally {
      setLoading(false);
    }
  }, [minScore]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/matches');
      return;
    }
    if (user) {
      loadMatches();
    }
  }, [user, authLoading, router, loadMatches]);

  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return styles.scoreHigh;
    if (score >= 60) return styles.scoreMed;
    return styles.scoreLow;
  };

  if (authLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.pageHero}>
        <div className={styles.heroGlow} />
        <div className="container">
          <span className={styles.heroEyebrow}>✨ AI Lifestyle Matching</span>
          <h1 className={styles.heroTitle}>
            Find Your <span className={styles.heroAccent}>Compatible Flatmates</span>
          </h1>
          <p className={styles.heroSub}>
            Ranked by shared living habits, sleep schedules, food preferences, guest frequency, and overlapping budgets.
          </p>
        </div>
      </div>

      <div className="container">
        {/* Profile Incomplete Prompt */}
        {needsProfile && (
          <div className={styles.profilePromptBanner}>
            <div>
              <h2 className={styles.promptTitle}>Complete your Seeker Profile to see matches</h2>
              <p className={styles.promptDesc}>
                Our matching algorithm needs your living preferences (diet, sleep routine, cleanliness, budget) to calculate compatibility scores.
              </p>
            </div>
            <Link href="/profile/seeker" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
              Setup Profile →
            </Link>
          </div>
        )}

        {/* Toolbar */}
        {!needsProfile && (
          <div className={styles.toolbar}>
            <div className={styles.scoreFilterRow}>
              <span className={styles.filterLabel}>Filter by:</span>
              {SCORE_FILTERS.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  className={`${styles.filterChip} ${minScore === f.min ? styles.filterChipActive : ''}`}
                  onClick={() => setMinScore(f.min)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <Link href="/profile/seeker" className={styles.editPrefBtn}>
              ⚙️ Adjust My Preferences
            </Link>
          </div>
        )}

        {/* Matches List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
            Calculating flatmate compatibility...
          </div>
        ) : matches.length === 0 && !needsProfile ? (
          <div className={styles.emptyContainer}>
            <div className={styles.emptyEmoji}>👥</div>
            <h3>No compatible flatmates found in this radius</h3>
            <p style={{ marginTop: 8 }}>
              Try lowering your score filter, widening your budget range, or adjusting your seeker preferences.
            </p>
            <Link href="/profile/seeker" className="btn btn-outline" style={{ marginTop: 16 }}>
              Edit Seeker Profile
            </Link>
          </div>
        ) : (
          <div className={styles.matchesGrid}>
            {matches.map((m) => (
              <div key={m.id} className={styles.matchCard}>
                <div>
                  <div className={styles.cardHeader}>
                    <span className={`${styles.scoreBadge} ${getScoreBadgeClass(m.compatibility_score)}`}>
                      ✨ {m.compatibility_score}% Match
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      📍 {m.dist_m > 1000 ? `${(m.dist_m / 1000).toFixed(1)} km away` : `${m.dist_m} m away`}
                    </span>
                  </div>

                  <h3 className={styles.cardTitle}>{m.title}</h3>
                  <p className={styles.cardLocation}>
                    📍 {[m.address, m.city].filter(Boolean).join(', ')}
                  </p>

                  <div className={styles.rentRow}>
                    <span className={styles.rentValue}>₹{m.rent.toLocaleString()}</span>
                    <span className={styles.rentPeriod}>/month</span>
                    {m.deposit ? (
                      <span className={styles.depositValue}>Dep: ₹{m.deposit.toLocaleString()}</span>
                    ) : null}
                  </div>

                  {/* Compatibility factors */}
                  <div className={styles.factorsBlock}>
                    {m.top_matching_factors?.length > 0 && (
                      <div className={styles.factorList}>
                        {m.top_matching_factors.map((f, i) => (
                          <span key={i} className={styles.matchFactor}>
                            ✓ {f}
                          </span>
                        ))}
                      </div>
                    )}
                    {m.clashing_factors?.length > 0 && (
                      <div className={styles.factorList}>
                        {m.clashing_factors.map((c, i) => (
                          <span key={i} className={styles.clashFactor}>
                            ⚠ {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Owner and CTA */}
                <div className={styles.ownerFooter}>
                  <div className={styles.ownerMeta}>
                    <div className={styles.ownerAvatar}>
                      {(m.owner?.name || 'O')[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className={styles.ownerName}>{m.owner?.name ?? 'Flatmate'}</p>
                      {m.owner?.verified && (
                        <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>✓ Verified</span>
                      )}
                    </div>
                  </div>

                  <Link href={`/listings/${m.id}`} className={styles.cardActionBtn}>
                    View Room →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
