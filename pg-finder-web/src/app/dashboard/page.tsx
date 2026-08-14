'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { listingsApi, type Listing } from '@/lib/api';
import styles from './page.module.css';

const TYPE_LABELS: Record<string, string> = { pg: 'PG', flat: 'Flat', flatmate: 'Flatmate', mess: 'Mess' };

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push('/auth/login'); return; }
    if (user) {
      listingsApi.search({ limit: 50 })
        .then((r) => setListings(r.listings))
        .catch(console.error)
        .finally(() => setFetching(false));
    }
  }, [user, loading, router]);

  if (loading || fetching) return (
    <div className={styles.loading}><div className={styles.spinner} /><p>Loading your dashboard...</p></div>
  );

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>My Dashboard</h1>
            <p className={styles.sub}>Welcome back, {user?.name} 👋</p>
          </div>
          <Link href="/dashboard/new" className="btn btn-primary">+ Post New Listing</Link>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          {[
            { icon: '🏠', label: 'Total Listings', value: listings.length },
            { icon: '👁️', label: 'Total Views', value: '—' },
            { icon: '💬', label: 'Inquiries', value: '—' },
            { icon: '⭐', label: 'Avg Rating', value: '—' },
          ].map((s) => (
            <div key={s.label} className={styles.statCard}>
              <span className={styles.statIcon}>{s.icon}</span>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Listings table */}
        <div className={styles.tableSection}>
          <h2 className={styles.tableTitle}>Your Listings</h2>
          {listings.length === 0 ? (
            <div className={styles.empty}>
              <span>🏠</span>
              <h3>No listings yet</h3>
              <p>Post your first listing and start receiving inquiries</p>
              <Link href="/dashboard/new" className="btn btn-primary">Post a Listing</Link>
            </div>
          ) : (
            <div className={styles.table}>
              {listings.map((l) => (
                <div key={l.id} className={styles.tableRow}>
                  <div className={styles.rowLeft}>
                    <span className="badge badge-purple">{TYPE_LABELS[l.type]}</span>
                    <div>
                      <p className={styles.rowTitle}>{l.title}</p>
                      <p className={styles.rowAddr}>📍 {l.address ?? l.city ?? 'No address'}</p>
                    </div>
                  </div>
                  <div className={styles.rowRight}>
                    <span className={styles.rowRent}>₹{l.rent.toLocaleString()}/mo</span>
                    <Link href={`/listings/${l.id}`} className="btn btn-ghost" style={{ fontSize: 13 }}>View →</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
