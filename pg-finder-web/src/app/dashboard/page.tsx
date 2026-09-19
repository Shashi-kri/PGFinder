'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { listingsApi, type Listing } from '@/lib/api';
import PhotoUploader, { type UploadedPhoto } from '@/components/PhotoUploader';
import styles from './page.module.css';

const TYPE_LABELS: Record<string, string>  = { pg: 'PG', flat: 'Flat', flatmate: 'Flatmate', mess: 'Mess' };
const STATUS_COLORS: Record<string, string> = { approved: 'badge-green', pending: 'badge-amber', rejected: 'badge-red' };

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [listings,  setListings]  = useState<Listing[]>([]);
  const [fetching,  setFetching]  = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingPhotos, setPendingPhotos] = useState<Record<string, UploadedPhoto[]>>({});
  const [savingId,  setSavingId]  = useState<string | null>(null);
  const [savedId,   setSavedId]   = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) { router.push('/auth/login'); return; }
    if (user) {
      listingsApi.getMine()
        .then(r => setListings(r.listings))
        .catch(console.error)
        .finally(() => setFetching(false));
    }
  }, [user, loading, router]);

  const handleSavePhotos = async (listingId: string) => {
    const photos = pendingPhotos[listingId];
    if (!photos?.length) return;
    setSavingId(listingId);
    try {
      await listingsApi.addMedia(listingId, photos.map(p => ({ url: p.url, kind: 'photo' })));
      setListings(prev => prev.map(l => {
        if (l.id !== listingId) return l;
        const existing = l.photos ?? [];
        const merged = [...existing, ...photos.map(p => ({ url: p.url, kind: 'photo' }))];
        return { ...l, photos: merged };
      }));
      setPendingPhotos(prev => { const c = { ...prev }; delete c[listingId]; return c; });
      setExpandedId(null);
      setSavedId(listingId);
      setTimeout(() => setSavedId(null), 2500);
    } catch (e: any) {
      alert('Failed to save photos: ' + (e.message ?? 'Unknown error'));
    } finally {
      setSavingId(null);
    }
  };

  if (loading || fetching) return (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      <p>Loading your dashboard…</p>
    </div>
  );

  const approved = listings.filter(l => (l as any).status === 'approved').length;
  const pending  = listings.filter(l => (l as any).status === 'pending').length;
  const avgRating = listings.length
    ? (listings.reduce((s, l) => s + Number(l.avg_rating ?? 0), 0) / listings.length).toFixed(1)
    : '—';

  const heroSub = listings.length === 0
    ? 'Post your first listing to start receiving inquiries from renters.'
    : `You have ${listings.length} listing${listings.length > 1 ? 's' : ''} — ${approved} approved, ${pending} pending.`;

  return (
    <div>
      {/* ── Page hero ── */}
      <div className={styles.pageHero}>
        <div className="container">
          <div className={styles.heroInner}>
            <div>
              <span className={styles.heroEyebrow}>My Dashboard</span>
              <h1 className={styles.heroTitle}>
                Welcome back, {user?.name?.split(' ')[0]} 👋
              </h1>
              <p className={styles.heroSub}>{heroSub}</p>
            </div>
            <Link href="/dashboard/new" className="btn btn-primary">
              + New Listing
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.page}>
        <div className="container">

          {/* ── Stats ── */}
          <div className={styles.statsGrid}>
            {[
              { icon: '🏠', label: 'Total Listings',  value: listings.length },
              { icon: '✅', label: 'Approved',        value: approved },
              { icon: '⏳', label: 'Pending Review',  value: pending },
              { icon: '⭐', label: 'Avg Rating',      value: avgRating },
            ].map(s => (
              <div key={s.label} className={styles.statCard}>
                <div className={styles.statIconWrap} aria-hidden="true">{s.icon}</div>
                <span className={styles.statValue}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* ── Listings table ── */}
          <div className={styles.tableSection}>
            <div className={styles.tableTitleBar}>
              <h2 className={styles.tableTitle}>Your Listings</h2>
              <span className={styles.tableCount}>{listings.length} total</span>
            </div>

            {listings.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIconWrap} aria-hidden="true">🏠</div>
                <h3>No listings yet</h3>
                <p>Post your first listing and start receiving inquiries from renters.</p>
                <Link href="/dashboard/new" className="btn btn-primary">
                  + Create Listing
                </Link>
              </div>
            ) : (
              <div className={styles.table} role="list">
                {listings.map(l => {
                  const status     = (l as any).status ?? 'pending';
                  const isExpanded = expandedId === l.id;
                  const photoCount = (l.photos ?? []).length;
                  const hasPending = !!(pendingPhotos[l.id]?.length);

                  return (
                    <div key={l.id} className={styles.tableRow} role="listitem">
                      <div className={styles.rowLeft}>
                        <span className="badge badge-purple">{TYPE_LABELS[l.type]}</span>
                        <span className={`badge ${STATUS_COLORS[status] ?? 'badge-amber'}`}>
                          {status}
                        </span>
                        <div>
                          <p className={styles.rowTitle}>{l.title}</p>
                          <p className={styles.rowAddr}>
                            <span aria-hidden="true">📍</span>
                            {l.address ?? l.city ?? 'No address set'}
                          </p>
                        </div>
                      </div>

                      <div className={styles.rowRight}>
                        <span className={styles.rowRent}>₹{l.rent.toLocaleString()}/mo</span>

                        <span className={styles.photoChip}>
                          📷 {photoCount} photo{photoCount !== 1 ? 's' : ''}
                        </span>

                        <button
                          type="button"
                          className={`btn btn-ghost ${styles.addPhotosBtn}`}
                          onClick={() => setExpandedId(isExpanded ? null : l.id)}
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? 'Cancel' : '+ Photos'}
                        </button>

                        <Link
                          href={`/dashboard/edit/${l.id}`}
                          className="btn btn-ghost"
                          style={{ fontSize: 13 }}
                        >
                          ✏️ Edit
                        </Link>

                        <Link
                          href={`/listings/${l.id}`}
                          className="btn btn-ghost"
                          style={{ fontSize: 13 }}
                        >
                          View →
                        </Link>
                      </div>

                      {/* Inline photo uploader */}
                      {isExpanded && (
                        <div className={styles.photoUploaderRow}>
                          {savedId === l.id && (
                            <p className={styles.savedMsg} role="status">
                              ✅ Photos saved successfully!
                            </p>
                          )}
                          <PhotoUploader
                            folder={`listings/${l.id}`}
                            initialPhotos={[]}
                            onChange={photos =>
                              setPendingPhotos(prev => ({ ...prev, [l.id]: photos }))
                            }
                            label="Upload Photos"
                            maxPhotos={8 - photoCount}
                          />
                          {hasPending && (
                            <button
                              className="btn btn-primary"
                              onClick={() => handleSavePhotos(l.id)}
                              disabled={savingId === l.id}
                              style={{ marginTop: 12 }}
                            >
                              {savingId === l.id
                                ? 'Saving…'
                                : `Save ${pendingPhotos[l.id].length} Photo${pendingPhotos[l.id].length > 1 ? 's' : ''} →`}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
