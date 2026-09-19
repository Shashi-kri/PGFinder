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
    sub: 'Browse paying-guest accommodations with meals and facilities near you.',
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
    sub: 'Browse flatmate listings matched to your lifestyle and preferences.',
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
  sub: 'PGs, flats, flatmates and mess services near you. Connect directly with owners.',
  eyebrow: 'Browse Listings',
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
  { value: 'veg', label: '🥦 Veg Only' },
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

// ─── Skeleton card ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className={styles.skeletonCard} aria-hidden="true">
      <div className={`skeleton ${styles.skeletonPhoto}`} />
      <div className={styles.skeletonBody}>
        <div className={`skeleton ${styles.skeletonLine}`} style={{ width: '70%' }} />
        <div className={`skeleton ${styles.skeletonLine}`} style={{ width: '50%' }} />
        <div className={`skeleton ${styles.skeletonLine}`} style={{ width: '40%', height: 20, marginTop: 4 }} />
      </div>
    </div>
  );
}

// ─── Main content ────────────────────────────────────────────────────────────
function ListingsContent() {
  const searchParams = useSearchParams();
  const router      = useRouter();
  const pathname    = usePathname();

  const urlType   = searchParams.get('type')   ?? '';
  const urlFood   = searchParams.get('food')   ?? '';
  const urlBudget = searchParams.get('budget') ?? '0';
  const urlPage   = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10));
  const urlQ      = searchParams.get('q') ?? '';

  const isTypeLocked = !!urlType;
  const config     = isTypeLocked ? (TYPE_CONFIG[urlType] ?? BROWSE_CONFIG) : BROWSE_CONFIG;
  const budgetIdx  = Math.min(Math.max(0, parseInt(urlBudget, 10)), BUDGETS.length - 1);
  const budget     = BUDGETS[budgetIdx];
  const offset     = urlPage * LIMIT;

  const [listings, setListings] = useState<Listing[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);

  const updateURL = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (!val || val === '0') params.delete(key);
      else params.set(key, val);
    });
    if (!('page' in updates)) params.delete('page');
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, router, pathname]);

  useEffect(() => {
    setLoading(true);
    listingsApi.search({
      type:       urlType   || undefined,
      food_type:  urlFood   || undefined,
      min_rent:   budget.min,
      max_rent:   budget.max,
      q:          urlQ      || undefined,
      limit:      LIMIT,
      offset,
    } as any)
      .then(res => { setListings(res.listings); setTotal(res.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [urlType, urlFood, urlBudget, urlPage, urlQ]); // eslint-disable-line react-hooks/exhaustive-deps

  const showFoodFilter    = !urlType || urlType === 'pg' || urlType === 'mess';
  const showFlatFilters   = urlType === 'flat';
  const showFlatmateExtra = urlType === 'flatmate';
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      {/* ══════════ HERO ══════════ */}
      <div className={`${styles.pageHero} ${config.heroClass ? styles[config.heroClass as keyof typeof styles] : ''}`}>
        <div className={styles.heroOrb1} aria-hidden="true" />
        <div className={styles.heroOrb2} aria-hidden="true" />
        <div className={styles.heroDotGrid} aria-hidden="true" />
        <div className="container">
          <span className={styles.heroEyebrow}>
            {config.icon}&nbsp; {config.eyebrow}
          </span>
          <h1 className={styles.heroTitle}>{config.title}</h1>
          <p className={styles.heroSub}>{config.sub}</p>
          {total > 0 && !loading && (
            <span className={styles.resultCount}>{total} listings found</span>
          )}
        </div>
      </div>

      {/* ══════════ CONTENT ══════════ */}
      <div className={styles.page}>
        <div className="container">

          {/* ── Filters panel ── */}
          <div className={styles.filters} role="search" aria-label="Filter listings">

            {/* Browse mode: type tabs */}
            {!isTypeLocked && (
              <>
                <div className={styles.filterGroup} role="group" aria-label="Property type">
                  {TYPES.map(t => (
                    <button
                      key={t.value}
                      className={`${styles.pill} ${urlType === t.value ? styles.pillActive : ''}`}
                      onClick={() => updateURL({ type: t.value })}
                      aria-pressed={urlType === t.value}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className={styles.filterDivider} />
              </>
            )}

            {/* Type-locked: context breadcrumb */}
            {isTypeLocked && (
              <div className={styles.contextRow}>
                <span className={`${styles.contextBadge} ${styles[`badge_${urlType}` as keyof typeof styles] ?? ''}`}>
                  {config.icon}&nbsp;{config.eyebrow}
                </span>
                <button className={styles.clearType} onClick={() => router.push('/listings')}>
                  ← All types
                </button>
              </div>
            )}

            {/* Filter dropdowns */}
            <div className={styles.filterRow}>
              {showFoodFilter && (
                <select
                  className={`input ${styles.select}`}
                  value={urlFood}
                  onChange={e => updateURL({ food: e.target.value })}
                  aria-label="Food preference"
                >
                  {FOOD.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              )}

              <select
                className={`input ${styles.select}`}
                value={budgetIdx}
                onChange={e => updateURL({ budget: e.target.value })}
                aria-label="Budget range"
              >
                {BUDGETS.map((b, i) => <option key={i} value={i}>{b.label}</option>)}
              </select>

              {showFlatFilters && (
                <select className={`input ${styles.select}`} defaultValue="" aria-label="Furnishing">
                  <option value="">Any Furnishing</option>
                  <option value="furnished">Fully Furnished</option>
                  <option value="semi">Semi-Furnished</option>
                  <option value="unfurnished">Unfurnished</option>
                </select>
              )}

              {showFlatFilters && (
                <select className={`input ${styles.select}`} defaultValue="" aria-label="BHK type">
                  <option value="">Any BHK</option>
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                  <option value="4+">4+ BHK</option>
                </select>
              )}

              {showFlatmateExtra && (
                <select className={`input ${styles.select}`} defaultValue="" aria-label="Gender preference">
                  <option value="">Any Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              )}

              {showFlatmateExtra && (
                <select className={`input ${styles.select}`} defaultValue="" aria-label="Occupation">
                  <option value="">Any Occupation</option>
                  <option value="student">Student</option>
                  <option value="working">Working Professional</option>
                </select>
              )}
            </div>
          </div>

          {/* ── Results header ── */}
          {!loading && listings.length > 0 && (
            <div className={styles.resultsHeader}>
              <p className={styles.resultsLabel}>
                <span className={styles.resultsCount}>{total}</span> {total === 1 ? 'listing' : 'listings'} found
              </p>
            </div>
          )}

          {/* ── Results ── */}
          {loading ? (
            <div className={styles.grid}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : listings.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIconWrap}>{config.icon}</div>
              <h3>No {urlType ? config.eyebrow.toLowerCase() : 'listings'} found</h3>
              <p>Try adjusting your filters or search in a different area</p>
              {isTypeLocked && (
                <button className="btn btn-outline" onClick={() => router.push('/listings')}>
                  Browse all types
                </button>
              )}
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
                    aria-label="Previous page"
                  >
                    ← Prev
                  </button>
                  <span className={styles.pageInfo}>
                    {urlPage + 1} <span className={styles.pageInfoOf}>of</span> {totalPages}
                  </span>
                  <button
                    className="btn btn-outline"
                    disabled={offset + LIMIT >= total}
                    onClick={() => updateURL({ page: String(urlPage + 1) })}
                    aria-label="Next page"
                  >
                    Next →
                  </button>
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
    <Suspense fallback={
      <div style={{ padding: '120px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        Loading listings…
      </div>
    }>
      <ListingsContent />
    </Suspense>
  );
}
