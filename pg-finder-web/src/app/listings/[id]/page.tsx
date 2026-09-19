import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listingsApi, type Listing } from '@/lib/api';
import ContactBar from './ContactBar';
import MapEmbed from '@/components/MapEmbed';
import ListingGallery from './ListingGallery';
import ReviewsSection from '@/components/ReviewsSection';
import styles from './page.module.css';

const TYPE_LABELS: Record<string, string> = { pg: 'PG', flat: 'Flat', flatmate: 'Flatmate', mess: 'Mess' };
const FOOD_LABELS: Record<string, string>  = { veg: '🥦 Veg', nonveg: '🍖 Non-veg', jain: '🌿 Jain', any: '🍽️ Any', none: '' };

// Convert snake_case amenity key → Title Case label
function amenityLabel(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

const AMENITY_ICONS: Record<string, string> = {
  wifi: '📶',
  ac: '❄️',
  tv: '📺',
  washing_machine: '🧺',
  parking: '🚗',
  gym: '🏋️',
  power_backup: '🔋',
  security: '🔒',
  lift: '🛗',
  food: '🍽️',
  kitchen: '🍳',
  hot_water: '🚿',
  balcony: '🌅',
  cctv: '📷',
};

async function getListing(id: string): Promise<Listing | null> {
  try {
    const { listing } = await listingsApi.getById(id);
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

  const typeHref = `/listings?type=${listing.type}`;

  return (
    <div className={styles.page}>
      <div className="container">

        {/* ── Breadcrumb ── */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/" className={styles.breadcrumbLink}>Home</Link>
          <span className={styles.breadcrumbSep} aria-hidden="true">/</span>
          <Link href="/listings" className={styles.breadcrumbLink}>Listings</Link>
          <span className={styles.breadcrumbSep} aria-hidden="true">/</span>
          <Link href={typeHref} className={styles.breadcrumbLink}>{TYPE_LABELS[listing.type] ?? listing.type}</Link>
          <span className={styles.breadcrumbSep} aria-hidden="true">/</span>
          <span className={styles.breadcrumbCurrent}>{listing.title}</span>
        </nav>

        {/* ── Gallery ── */}
        <ListingGallery listing={listing} />

        <div className={styles.layout}>
          {/* ── Main content ── */}
          <main className={styles.main}>

            {/* Header */}
            <div className={styles.listingHeader}>
              <div className={styles.badges}>
                <span className="badge badge-purple">{TYPE_LABELS[listing.type]}</span>
                {listing.food_type && listing.food_type !== 'none' && (
                  <span className="badge badge-green">{FOOD_LABELS[listing.food_type]}</span>
                )}
                {listing.avg_rating && Number(listing.avg_rating) > 0 && (
                  <span className="badge badge-amber">
                    ⭐ {Number(listing.avg_rating).toFixed(1)}
                    {listing.review_count ? ` (${listing.review_count} reviews)` : ''}
                  </span>
                )}
              </div>
              <h1 className={styles.title}>{listing.title}</h1>
              <p className={styles.address}>
                <span aria-hidden="true">📍</span>
                {[listing.address, listing.city].filter(Boolean).join(', ')}
              </p>
            </div>

            {/* Rent card */}
            <div className={styles.rentCard}>
              <div className={styles.rentLeft}>
                <span className={styles.rent}>₹{listing.rent.toLocaleString()}</span>
                <span className={styles.rentPer}>/month</span>
              </div>
              {listing.deposit ? (
                <div className={styles.deposit}>
                  <span className={styles.depositLabel}>Security Deposit</span>
                  <span className={styles.depositAmount}>₹{listing.deposit.toLocaleString()}</span>
                </div>
              ) : null}
            </div>

            {/* Description */}
            {listing.description && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>About this place</h2>
                <p className={styles.description}>{listing.description}</p>
              </section>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>What's included</h2>
                <div className={styles.amenitiesGrid}>
                  {amenities.map(([key]) => (
                    <div key={key} className={styles.amenityItem}>
                      <span className={styles.amenityIcon} aria-hidden="true">
                        {AMENITY_ICONS[key] ?? '✓'}
                      </span>
                      <span className={styles.amenityLabel}>{amenityLabel(key)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Map */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Location</h2>
              <p className={styles.address} style={{ marginBottom: 14 }}>
                <span aria-hidden="true">📍</span>
                {[listing.address, listing.city].filter(Boolean).join(', ')}
              </p>
              <MapEmbed
                lat={listing.latitude}
                lng={listing.longitude}
                title={listing.title}
              />
            </section>

            {/* Reviews */}
            <ReviewsSection
              listingId={listing.id}
              avgRating={listing.avg_rating}
              reviewCount={listing.review_count}
            />
          </main>

          {/* ── Sidebar ── */}
          <aside className={styles.sidebar}>
            {/* Owner card */}
            <div className={styles.hostCard}>
              <div className={styles.hostAvatar} aria-hidden="true">
                {ownerName[0]?.toUpperCase() ?? '?'}
              </div>
              <div className={styles.hostInfo}>
                <p className={styles.hostLabel}>Listed by</p>
                <p className={styles.hostName}>{ownerName}</p>
              </div>
            </div>

            {/* Contact section */}
            <div className={styles.contactSection}>
              <p className={styles.contactHeading}>Get in touch</p>
              <ContactBar listing={listing} />
            </div>

            {/* Quick facts */}
            <div className={styles.quickFacts}>
              <div className={styles.factRow}>
                <span className={styles.factLabel}>Type</span>
                <span className={styles.factValue}>{TYPE_LABELS[listing.type]}</span>
              </div>
              <div className={styles.factRow}>
                <span className={styles.factLabel}>Rent</span>
                <span className={styles.factValue}>₹{listing.rent.toLocaleString()}/mo</span>
              </div>
              {listing.deposit && (
                <div className={styles.factRow}>
                  <span className={styles.factLabel}>Deposit</span>
                  <span className={styles.factValue}>₹{listing.deposit.toLocaleString()}</span>
                </div>
              )}
              {listing.food_type && listing.food_type !== 'none' && (
                <div className={styles.factRow}>
                  <span className={styles.factLabel}>Food</span>
                  <span className={styles.factValue}>{FOOD_LABELS[listing.food_type]}</span>
                </div>
              )}
              {listing.city && (
                <div className={styles.factRow}>
                  <span className={styles.factLabel}>City</span>
                  <span className={styles.factValue}>{listing.city}</span>
                </div>
              )}
            </div>

            {/* Back link */}
            <Link href="/listings" className={styles.backLink}>
              ← Back to all listings
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
