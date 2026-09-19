import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listingsApi, type Listing } from '@/lib/api';
import ContactBar from './ContactBar';
import MapEmbed from '@/components/MapEmbed';
import ListingGallery from './ListingGallery';
import ReviewsSection from '@/components/ReviewsSection';
import styles from './page.module.css';

const TYPE_LABELS: Record<string, string> = { pg: 'PG', flat: 'Flat', flatmate: 'Flatmate', mess: 'Mess' };
const FOOD_LABELS: Record<string, string> = { veg: '🥦 Veg', nonveg: '🍖 Non-veg', jain: '🌿 Jain', any: '🍽️ Any', none: '' };

async function getListing(id: string): Promise<Listing | null> {
  try {
    const { listing } = await listingsApi.getById(id);
    // Backend returns 'media' array; normalise to 'photos' for shared Listing type
    const raw = listing as any;
    if (!raw.photos && raw.media) raw.photos = raw.media;
    return raw as Listing;
  } catch { return null; }
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) return notFound();

  const amenities = listing.amenities
    ? Object.entries(listing.amenities).filter(([, v]) => v)
    : [];

  const ownerName =
    (listing as any).owner?.name ?? listing.owner_name ?? 'Property Owner';

  return (
    <div className={styles.page}>
      <div className="container">

        {/* ── Breadcrumb ── */}
        <div className={styles.breadcrumb}>
          <Link href="/" className={styles.breadcrumbLink}>🏠 Home</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <Link href="/listings" className={styles.breadcrumbLink}>Listings</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{listing.title}</span>
        </div>

        {/* ── Dynamic photo gallery + owner upload ── */}
        <ListingGallery listing={listing} />

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
                {listing.avg_rating && Number(listing.avg_rating) > 0 && (
                  <span className="badge badge-amber">
                    ⭐ {Number(listing.avg_rating).toFixed(1)} ({listing.review_count} reviews)
                  </span>
                )}
              </div>
              <h1 className={styles.title}>{listing.title}</h1>
              <p className={styles.address}>
                📍 {[listing.address, listing.city].filter(Boolean).join(', ')}
              </p>
            </div>

            {/* Rent */}
            <div className={styles.rentCard}>
              <div className={styles.rentLeft}>
                <span className={styles.rent}>₹{listing.rent.toLocaleString()}</span>
                <span className={styles.rentPer}>/month</span>
              </div>
              {listing.deposit ? (
                <div className={styles.deposit}>
                  Deposit: ₹{listing.deposit.toLocaleString()}
                </div>
              ) : null}
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
                      <div className={styles.amenityCheckWrap}>
                        <span className={styles.amenityCheck}>✓</span>
                      </div>
                      <span className={styles.amenityLabel}>{key.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Location</h2>
              <p className={styles.address} style={{ marginBottom: 12 }}>
                📍 {[listing.address, listing.city].filter(Boolean).join(', ')}
              </p>
              <MapEmbed
                lat={listing.latitude}
                lng={listing.longitude}
                title={listing.title}
              />
            </div>

            {/* Reviews Section */}
            <ReviewsSection
              listingId={listing.id}
              avgRating={listing.avg_rating}
              reviewCount={listing.review_count}
            />
          </div>

          {/* Sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.hostCard}>
              <div className={styles.hostAvatar}>
                {ownerName[0]?.toUpperCase() ?? '👤'}
              </div>
              <div>
                <p className={styles.hostLabel}>Posted by</p>
                <p className={styles.hostName}>{ownerName}</p>
              </div>
            </div>
            <ContactBar listing={listing} />
          </div>
        </div>
      </div>
    </div>
  );
}
