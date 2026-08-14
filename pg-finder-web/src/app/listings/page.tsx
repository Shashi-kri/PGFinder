'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { listingsApi, type Listing } from '@/lib/api';
import ListingCard from '@/components/ListingCard';
import styles from './page.module.css';

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
  { label: 'Under ₹5k', min: undefined, max: 5000 },
  { label: '₹5k–₹10k', min: 5000, max: 10000 },
  { label: '₹10k–₹20k', min: 10000, max: 20000 },
  { label: '₹20k+', min: 20000, max: undefined },
];

function ListingsContent() {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState(searchParams.get('type') ?? '');
  const [food, setFood] = useState('');
  const [budgetIdx, setBudgetIdx] = useState(0);
  const [offset, setOffset] = useState(0);
  const LIMIT = 12;

  useEffect(() => {
    setLoading(true);
    const budget = BUDGETS[budgetIdx];
    listingsApi.search({
      type: type || undefined,
      food_type: food || undefined,
      min_rent: budget.min,
      max_rent: budget.max,
      limit: LIMIT,
      offset,
    }).then((res) => {
      setListings(res.listings);
      setTotal(res.total);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [type, food, budgetIdx, offset]);

  const handleFilter = () => setOffset(0);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Find Your Place</h1>
          <p className={styles.sub}>{total > 0 ? `${total} listings found` : 'Searching...'}</p>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          {/* Type pills */}
          <div className={styles.filterGroup}>
            {TYPES.map((t) => (
              <button key={t.value}
                className={`${styles.pill} ${type === t.value ? styles.pillActive : ''}`}
                onClick={() => { setType(t.value); handleFilter(); }}>
                {t.label}
              </button>
            ))}
          </div>

          <div className={styles.filterRow}>
            {/* Food */}
            <select className={`input ${styles.select}`} value={food}
              onChange={(e) => { setFood(e.target.value); handleFilter(); }}>
              {FOOD.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>

            {/* Budget */}
            <select className={`input ${styles.select}`} value={budgetIdx}
              onChange={(e) => { setBudgetIdx(Number(e.target.value)); handleFilter(); }}>
              {BUDGETS.map((b, i) => <option key={i} value={i}>{b.label}</option>)}
            </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeleton}>
                <div className={`skeleton ${styles.skeletonPhoto}`} />
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className={`skeleton ${styles.skeletonLine}`} style={{ width: '70%', height: 18 }} />
                  <div className={`skeleton ${styles.skeletonLine}`} style={{ width: '50%', height: 14 }} />
                  <div className={`skeleton ${styles.skeletonLine}`} style={{ width: '40%', height: 22, marginTop: 8 }} />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🏠</span>
            <h3>No listings found</h3>
            <p>Try adjusting your filters or search in a different area</p>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>

            {/* Pagination */}
            {total > LIMIT && (
              <div className={styles.pagination}>
                <button className="btn btn-outline" disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - LIMIT))}>← Prev</button>
                <span className={styles.pageInfo}>
                  {Math.floor(offset / LIMIT) + 1} / {Math.ceil(total / LIMIT)}
                </span>
                <button className="btn btn-outline" disabled={offset + LIMIT >= total}
                  onClick={() => setOffset(offset + LIMIT)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 80, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>}>
      <ListingsContent />
    </Suspense>
  );
}
