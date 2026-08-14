import { notFound } from 'next/navigation';
import { listingsApi, type Listing } from '@/lib/api';
import ContactBar from './ContactBar';
import styles from './page.module.css';

const TYPE_LABELS: Record<string, string> = { pg: 'PG', flat: 'Flat', flatmate: 'Flatmate', mess: 'Mess' };
const FOOD_LABELS: Record<string, string> = { veg: '🥦 Veg', nonveg: '🍖 Non-veg', jain: '🌿 Jain', any: '🍽️ Any', none: '' };

async function getListing(id: string): Promise<Listing | null> {
  try {
    const { listing } = await listingsApi.getById(id);
    return listing;
  } catch { return null; }
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) return notFound();

  const photos = listing.photos ?? [];
  const amenities = listing.amenities ? Object.entries(listing.amenities).filter(([, v]) => v) : [];

  return (
    <div className={styles.page}>
      <div className="container">

        {/* Photo gallery */}
        <div className={styles.gallery}>
          {photos.length > 0 ? (
            <>
              <div className={styles.mainPhoto}>
                <img src={photos[0].url} alt={listing.title} className={styles.mainImg} />
              </div>
              {photos.length > 1 && (
                <div className={styles.thumbs}>
                  {photos.slice(1, 5).map((p, i) => (
                    <div key={i} className={styles.thumb}>
                      <img src={p.url} alt={`Photo ${i + 2}`} className={styles.thumbImg} />
                      {i === 3 && photos.length > 5 && (
                        <div className={styles.thumbMore}>+{photos.length - 5}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className={styles.noPhoto}>🏠</div>
          )}
        </div>

        <div className={styles.layout}>
          {/* Main content */}
          <div className={styles.main}>
            {/* Header */}
            <div className={styles.listingHeader}>
              <div className={styles.badges}>
                <span className="badge badge-purple">{TYPE_LABELS[listing.type]}</span>
                {listing.food_type && listing.food_type !== 'none' && (
                  <span className="badge badge-green">{FOOD_LABELS[listing.food_type]}</span>
                )}
                {listing.avg_rating && (
                  <span className="badge badge-amber">⭐ {Number(listing.avg_rating).toFixed(1)} ({listing.review_count} reviews)</span>
                )}
              </div>
              <h1 className={styles.title}>{listing.title}</h1>
              <p className={styles.address}>
                📍 {[listing.address, listing.city].filter(Boolean).join(', ')}
              </p>
            </div>

            {/* Rent */}
            <div className={styles.rentCard}>
              <div>
                <span className={styles.rent}>₹{listing.rent.toLocaleString()}</span>
                <span className={styles.rentPer}>/month</span>
              </div>
              {listing.deposit && (
                <div className={styles.deposit}>Deposit: ₹{listing.deposit.toLocaleString()}</div>
              )}
            </div>

            {/* Description */}
            {listing.description && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>About this place</h2>
                <p className={styles.description}>{listing.description}</p>
              </div>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Amenities</h2>
                <div className={styles.amenitiesGrid}>
                  {amenities.map(([key]) => (
                    <div key={key} className={styles.amenityItem}>
                      <span className={styles.amenityCheck}>✓</span>
                      <span className={styles.amenityLabel}>{key.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map placeholder */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Location</h2>
              <div className={styles.mapPlaceholder}>
                <span>🗺️</span>
                <p>
                  {listing.address ?? listing.city}<br />
                  <small style={{ color: 'var(--text-faint)' }}>
                    {listing.latitude.toFixed(4)}, {listing.longitude.toFixed(4)}
                  </small>
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.hostCard}>
              <div className={styles.hostAvatar}>{listing.owner_name?.[0] ?? '👤'}</div>
              <div>
                <p className={styles.hostLabel}>Posted by</p>
                <p className={styles.hostName}>{listing.owner_name ?? 'Property Owner'}</p>
              </div>
            </div>
            <ContactBar listing={listing} />
          </div>
        </div>
      </div>
    </div>
  );
}
