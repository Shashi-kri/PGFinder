'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { listingsApi, type Listing } from '@/lib/api';
import ListingCard from '@/components/ListingCard';
import styles from './page.module.css';

// ─── Type-specific page configs ─────────────────────────────────────────────
const TYPE_CONFIG: Record<string, {
  icon: string; title: string; sub: string; eyebrow: string; heroClass: string;
}> = {
  pg: {
    icon: '🏠',
    title: 'Find Your Perfect PG Room',
    sub: 'Verified paying-guest accommodations with meals & facilities included.',
    eyebrow: 'PG Rooms',
    heroClass: 'heroPg',
  },
  flat: {
    icon: '🏢',
    title: 'Flats & Apartments',
    sub: 'Entire flats for rent or shared apartments across the city.',
    eyebrow: 'Flats & Apartments',
    heroClass: 'heroFlat',
  },
  flatmate: {
    icon: '👥',
    title: 'Find Your Flatmate',
    sub: 'Find compatible roommates matched by lifestyle and preferences.',
    eyebrow: 'Flatmate Search',
    heroClass: 'heroFlatmate',
  },
  mess: {
    icon: '🍱',
    title: 'Mess & Tiffin Services',
    sub: 'Monthly meal subscriptions and tiffin services near you.',
    eyebrow: 'Mess & Tiffin',
    heroClass: 'heroMess',
  },
};

const BROWSE_CONFIG = {
  icon: '✨',
  title: 'Find Your Place',
  sub: 'Verified PGs, flats, flatmates and mess services near you.',
  eyebrow: 'Browse All Listings',
  heroClass: 'heroBrowse',
};

// ─── Filter constants ────────────────────────────────────────────────────────
const TYPES = [
  { value: '', label: 'All' },
  { value: 'pg', label: '🏠 PG' },
  { value: 'flat', label: '🏢 Flat' },
  { value: 'flatmate', label: '👥 Flatmate' },
  { value: 'mess', label: '🍱 Mess' },
];

const FOOD = [
  { value: '', label: 'Any Food' },
  { value: 'veg', label: '🥦 Veg' },
  { value: 'nonveg', label: '🍖 Non-veg' },
  { value: 'jain', label: '🌿 Jain' },
];

const BUDGETS = [
  { label: 'Any Budget', min: undefined, max: undefined },
  { label: 'Under ₹5k',  min: undefined, max: 5000 },
  { label: '₹5k–₹10k',  min: 5000,      max: 10000 },
  { label: '₹10k–₹20k', min: 10000,     max: 20000 },
  { label: '₹20k+',     min: 20000,     max: undefined },
];

const LIMIT = 12;

// ─── Main content (needs Suspense for useSearchParams) ───────────────────────
function ListingsContent() {
  const searchParams = useSearchParams();
  const router      = useRouter();
  const pathname    = usePathname();

  // ── All filter state lives in the URL ──────────────────────────────────────
  const urlType   = searchParams.get('type')   ?? '';
  const urlFood   = searchParams.get('food')   ?? '';
  const urlBudget = searchParams.get('budget') ?? '0';
  const urlPage   = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10));

  // When arriving via a navbar link (/listings?type=pg), the type is "locked":
  // we hide the type-tab row and show a contextual view instead.
  const isTypeLocked = !!urlType;

  const config     = isTypeLocked ? (TYPE_CONFIG[urlType] ?? BROWSE_CONFIG) : BROWSE_CONFIG;
  const budgetIdx  = Math.min(Math.max(0, parseInt(urlBudget, 10)), BUDGETS.length - 1);
  const budget     = BUDGETS[budgetIdx];
  const offset     = urlPage * LIMIT;

  const [listings, setListings] = useState<Listing[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);

  // ── Push filter changes to URL (all filters become shareable links) ─────────
  const updateURL = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (!val || val === '0') params.delete(key);
      else params.set(key, val);
    });
    // Reset pagination whenever a non-page filter changes
    if (!('page' in updates)) params.delete('page');
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, router, pathname]);

  // ── Fetch whenever URL-driven params change ──────────────────────────────────
  useEffect(() => {
    setLoading(true);
    listingsApi.search({
      type:       urlType   || undefined,
      food_type:  urlFood   || undefined,
      min_rent:   budget.min,
      max_rent:   budget.max,
      limit:      LIMIT,
      offset,
    })
      .then(res => { setListings(res.listings); setTotal(res.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [urlType, urlFood, urlBudget, urlPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const showFoodFilter    = !urlType || urlType === 'pg' || urlType === 'mess';
  const showFlatFilters   = urlType === 'flat';
  const showFlatmateExtra = urlType === 'flatmate';

  return (
    <div>

      {/* ══════════ HERO ══════════ */}
      <div className={`${styles.pageHero} ${config.heroClass ? styles[config.heroClass as keyof typeof styles] : ''}`}>
        {/* Animated floating orbs */}
        <div className={styles.heroOrb1} aria-hidden="true" />
        <div className={styles.heroOrb2} aria-hidden="true" />
        {/* Subtle dot-grid overlay */}
        <div className={styles.heroDotGrid} aria-hidden="true" />
        <div className="container">
          <span className={styles.heroEyebrow}>
            {config.icon}&nbsp; {config.eyebrow}
          </span>
          <h1 className={styles.heroTitle}>{config.title}</h1>
          <p className={styles.heroSub}>{config.sub}</p>
          {total > 0 && (
            <span className={styles.resultCount}>✨ {total} listings found</span>
          )}
        </div>
      </div>

      {/* ══════════ CONTENT ══════════ */}
      <div className={styles.page}>
        <div className="container">

          {/* ── Filters panel ── */}
          <div className={styles.filters}>

            {/* Browse mode: show type tabs */}
            {!isTypeLocked && (
              <>
                <div className={styles.filterGroup}>
                  {TYPES.map(t => (
                    <button
                      key={t.value}
                      className={`${styles.pill} ${urlType === t.value ? styles.pillActive : ''}`}
                      onClick={() => updateURL({ type: t.value })}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className={styles.filterDivider} />
              </>
            )}

            {/* Type-locked mode: show context breadcrumb with "back" link */}
            {isTypeLocked && (
              <div className={styles.contextRow}>
                <span className={`${styles.contextBadge} ${styles[`badge_${urlType}` as keyof typeof styles] ?? ''}`}>
                  {config.icon}&nbsp;{config.eyebrow}
                </span>
                <button className={styles.clearType} onClick={() => router.push('/listings')}>
                  ← Browse all types
                </button>
              </div>
            )}

            {/* ── Common + type-specific filter dropdowns ── */}
            <div className={styles.filterRow}>

              {/* Food — PG & Mess only */}
              {showFoodFilter && (
                <select
                  className={`input ${styles.select}`}
                  value={urlFood}
                  onChange={e => updateURL({ food: e.target.value })}
                >
                  {FOOD.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              )}

              {/* Budget — always visible */}
              <select
                className={`input ${styles.select}`}
                value={budgetIdx}
                onChange={e => updateURL({ budget: e.target.value })}
              >
                {BUDGETS.map((b, i) => <option key={i} value={i}>{b.label}</option>)}
              </select>

              {/* Flat-specific: furnishing */}
              {showFlatFilters && (
                <select className={`input ${styles.select}`} defaultValue="">
                  <option value="">Any Furnishing</option>
                  <option value="furnished">✅ Fully Furnished</option>
                  <option value="semi">🛋️ Semi-Furnished</option>
                  <option value="unfurnished">🪑 Unfurnished</option>
                </select>
              )}

              {/* Flat-specific: BHK */}
              {showFlatFilters && (
                <select className={`input ${styles.select}`} defaultValue="">
                  <option value="">Any BHK</option>
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                  <option value="4+">4+ BHK</option>
                </select>
              )}

              {/* Flatmate-specific: gender preference */}
              {showFlatmateExtra && (
                <select className={`input ${styles.select}`} defaultValue="">
                  <option value="">Any Gender</option>
                  <option value="male">👨 Male</option>
                  <option value="female">👩 Female</option>
                </select>
              )}

              {/* Flatmate-specific: occupation */}
              {showFlatmateExtra && (
                <select className={`input ${styles.select}`} defaultValue="">
                  <option value="">Any Occupation</option>
                  <option value="student">🎓 Student</option>
                  <option value="working">💼 Working Professional</option>
                </select>
              )}
            </div>
          </div>

          {/* ── Results ── */}
          {loading ? (
            <div className={styles.grid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={`skeleton ${styles.skeletonPhoto}`} />
                  <div className={styles.skeletonBody}>
                    <div className={`skeleton ${styles.skeletonLine}`} style={{ width: '70%' }} />
                    <div className={`skeleton ${styles.skeletonLine}`} style={{ width: '50%' }} />
                    <div className={`skeleton ${styles.skeletonLine}`} style={{ width: '40%', height: 22, marginTop: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIconWrap}>{config.icon}</div>
              <h3>No {urlType ? config.eyebrow.toLowerCase() : 'listings'} found</h3>
              <p>Try adjusting your filters or search in a different area</p>
            </div>
          ) : (
            <>
              <div className={styles.grid}>
                {listings.map(l => <ListingCard key={l.id} listing={l} />)}
              </div>

              {/* Pagination */}
              {total > LIMIT && (
                <div className={styles.pagination}>
                  <button
                    className="btn btn-outline"
                    disabled={urlPage === 0}
                    onClick={() => updateURL({ page: String(urlPage - 1) })}
                  >← Prev</button>
                  <span className={styles.pageInfo}>
                    <span className={styles.pageDot}>●</span>
                    {urlPage + 1} of {Math.ceil(total / LIMIT)}
                  </span>
                  <button
                    className="btn btn-outline"
                    disabled={offset + LIMIT >= total}
                    onClick={() => updateURL({ page: String(urlPage + 1) })}
                  >Next →</button>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 80, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>}>
      <ListingsContent />
    </Suspense>
  );
}
