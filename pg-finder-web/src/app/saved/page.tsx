'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { favoritesApi, type Listing } from '@/lib/api';
import ListingCard from '@/components/ListingCard';
import styles from './page.module.css';

export default function SavedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push('/auth/login'); return; }
    if (user) {
      favoritesApi.get()
        .then(r => setListings(r.favorites))
        .catch(console.error)
        .finally(() => setFetching(false));
    }
  }, [user, loading, router]);

  if (loading || fetching) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p>Loading your saved places…</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page hero */}
      <div className={styles.pageHero}>
        <div className="container">
          <span className={styles.heroEyebrow}>Shortlisted</span>
          <h1 className={styles.heroTitle}>
            <span className={styles.heroHeartIcon} aria-hidden="true">❤️</span>
            Saved Places
          </h1>
          <p className={styles.heroSub}>
            Your personally curated list of favourite properties.
          </p>
          {listings.length > 0 && (
            <span className={styles.heroCount}>
              {listings.length} shortlisted
            </span>
          )}
        </div>
      </div>

      <div className={styles.page}>
        <div className="container">
          {listings.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIconWrap} aria-hidden="true">🤍</div>
              <h2>Nothing saved yet</h2>
              <p>Browse listings and tap the ❤️ Save button to shortlist them here for easy comparison.</p>
              <Link href="/listings" className="btn btn-primary">
                Browse Listings
              </Link>
            </div>
          ) : (
            <>
              <div className={styles.resultsBar}>
                <p className={styles.resultsLabel}>
                  <span className={styles.resultsCount}>{listings.length}</span>{' '}
                  saved {listings.length === 1 ? 'property' : 'properties'}
                </p>
                <Link href="/listings" className={styles.browseMore}>
                  + Browse more →
                </Link>
              </div>
              <div className={styles.grid}>
                {listings.map(l => <ListingCard key={l.id} listing={l} />)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
