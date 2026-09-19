'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { flatmatesApi, type FlatmateMatch } from '@/lib/api';
import styles from './page.module.css';

const SCORE_FILTERS = [
  { label: 'All Matches', min: undefined },
  { label: '70%+ Match',  min: 70 },
  { label: '80%+ Match',  min: 80 },
  { label: '90%+ Match',  min: 90 },
];

export default function FlatmateMatchesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [matches,       setMatches]       = useState<FlatmateMatch[]>([]);
  const [totalEligible, setTotalEligible] = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [needsProfile,  setNeedsProfile]  = useState(false);
  const [minScore,      setMinScore]      = useState<number | undefined>(undefined);

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
    if (user) loadMatches();
  }, [user, authLoading, router, loadMatches]);

  const getScoreClass = (score: number) => {
    if (score >= 80) return styles.scoreHigh;
    if (score >= 60) return styles.scoreMed;
    return styles.scoreLow;
  };

  if (authLoading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.pageHero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className="container">
          <span className={styles.heroEyebrow}>Flatmate Matching</span>
          <h1 className={styles.heroTitle}>
            Find Your{' '}
            <span className={styles.heroAccent}>Compatible Flatmates</span>
          </h1>
          <p className={styles.heroSub}>
            Ranked by shared living habits, sleep schedules, food preferences, guest frequency and overlapping budgets.
          </p>
        </div>
      </div>

      <div className="container">
        {/* Profile incomplete prompt */}
        {needsProfile && (
          <div className={styles.profilePromptBanner} role="alert">
            <div>
              <h2 className={styles.promptTitle}>Complete your Seeker Profile to see matches</h2>
              <p className={styles.promptDesc}>
                Our matching system uses your living preferences (diet, sleep schedule, cleanliness, budget) to find compatible flatmates.
              </p>
            </div>
            <Link href="/profile/seeker" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
              Set Up Profile →
            </Link>
          </div>
        )}

        {/* Toolbar */}
        {!needsProfile && (
          <div className={styles.toolbar}>
            <div className={styles.scoreFilterRow}>
              <span className={styles.filterLabel}>Filter:</span>
              {SCORE_FILTERS.map(f => (
                <button
                  key={f.label}
                  type="button"
                  className={`${styles.filterChip} ${minScore === f.min ? styles.filterChipActive : ''}`}
                  onClick={() => setMinScore(f.min)}
                  aria-pressed={minScore === f.min}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <Link href="/profile/seeker" className={styles.editPrefBtn}>
              ⚙️ Adjust Preferences
            </Link>
          </div>
        )}

        {/* Matches */}
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Finding compatible flatmates…</p>
          </div>
        ) : matches.length === 0 && !needsProfile ? (
          <div className={styles.emptyContainer}>
            <div className={styles.emptyIconWrap} aria-hidden="true">👥</div>
            <h2>No compatible flatmates found</h2>
            <p>Try lowering your score filter, widening your budget range, or adjusting your preferences.</p>
            <Link href="/profile/seeker" className="btn btn-outline" style={{ marginTop: 16 }}>
              Edit Preferences
            </Link>
          </div>
        ) : (
          <div className={styles.matchesGrid}>
            {matches.map(m => (
              <div key={m.id} className={styles.matchCard}>
                <div>
                  <div className={styles.cardHeader}>
                    <span className={`${styles.scoreBadge} ${getScoreClass(m.compatibility_score)}`}>
                      ✨ {m.compatibility_score}% Match
                    </span>
                    <span className={styles.distancePill}>
                      📍 {m.dist_m > 1000
                        ? `${(m.dist_m / 1000).toFixed(1)} km`
                        : `${m.dist_m} m`} away
                    </span>
                  </div>

                  <h3 className={styles.cardTitle}>{m.title}</h3>
                  <p className={styles.cardLocation}>
                    <span aria-hidden="true">📍</span>
                    {[m.address, m.city].filter(Boolean).join(', ')}
                  </p>

                  <div className={styles.rentRow}>
                    <span className={styles.rentValue}>₹{m.rent.toLocaleString()}</span>
                    <span className={styles.rentPeriod}>/month</span>
                    {m.deposit ? (
                      <span className={styles.depositValue}>Dep: ₹{m.deposit.toLocaleString()}</span>
                    ) : null}
                  </div>

                  {/* Compatibility factors */}
                  {(m.top_matching_factors?.length > 0 || m.clashing_factors?.length > 0) && (
                    <div className={styles.factorsBlock}>
                      {m.top_matching_factors?.length > 0 && (
                        <div className={styles.factorList}>
                          {m.top_matching_factors.map((f, i) => (
                            <span key={i} className={styles.matchFactor}>
                              <span aria-hidden="true">✓</span> {f}
                            </span>
                          ))}
                        </div>
                      )}
                      {m.clashing_factors?.length > 0 && (
                        <div className={styles.factorList}>
                          {m.clashing_factors.map((c, i) => (
                            <span key={i} className={styles.clashFactor}>
                              <span aria-hidden="true">⚠</span> {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Owner footer */}
                <div className={styles.ownerFooter}>
                  <div className={styles.ownerMeta}>
                    <div className={styles.ownerAvatar} aria-hidden="true">
                      {(m.owner?.name || 'O')[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className={styles.ownerName}>{m.owner?.name ?? 'Property Owner'}</p>
                      {m.owner?.verified && (
                        <span className={styles.verifiedBadge}>✓ Verified</span>
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
