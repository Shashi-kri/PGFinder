import Link from 'next/link';
import type { Listing } from '@/lib/api';
import SaveButton from './SaveButton';
import styles from './ListingCard.module.css';

const TYPE_LABELS: Record<string, string> = {
  pg: 'PG', flat: 'Flat', flatmate: 'Flatmate', mess: 'Mess',
};

const FOOD_ICONS: Record<string, string> = {
  veg: '🥦', nonveg: '🍖', jain: '🌿', any: '🍽️', none: '',
};

function formatRent(rent: number) {
  if (rent >= 1000) return `₹${(rent / 1000).toFixed(rent % 1000 === 0 ? 0 : 1)}k`;
  return `₹${rent}`;
}

interface Props { listing: Listing; }

export default function ListingCard({ listing }: Props) {
  const photo = listing.photos?.[0]?.url;
  const rating = listing.avg_rating ? Number(listing.avg_rating).toFixed(1) : null;
  const distanceKm = listing.distance_m ? (listing.distance_m / 1000).toFixed(1) : null;

  return (
    <Link href={`/listings/${listing.id}`} className={styles.card}>
      {/* Photo area */}
      <div className={styles.photo}>
        {photo ? (
          <img src={photo} alt={listing.title} className={styles.img} loading="lazy" />
        ) : (
          <div className={styles.photoPlaceholder}>
            <span className={styles.placeholderIcon}>
              {listing.type === 'pg' ? '🏠' : listing.type === 'flat' ? '🏢' : listing.type === 'mess' ? '🍱' : '👥'}
            </span>
          </div>
        )}

        {/* Gradient overlay for bottom text contrast */}
        {photo && <div className={styles.photoGradient} />}

        {/* Type badge — top left */}
        <span className={styles.typeBadge}>{TYPE_LABELS[listing.type]}</span>

        {/* Save button — top right */}
        <div className={styles.saveWrap}>
          <SaveButton listingId={listing.id} />
        </div>

        {/* Price badge — bottom left */}
        <div className={styles.priceBadge}>
          <span className={styles.priceValue}>{formatRent(listing.rent)}</span>
          <span className={styles.priceUnit}>/mo</span>
        </div>
      </div>

      {/* Card body */}
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{listing.title}</h3>
          {rating && (
            <span className={styles.ratingBadge}>
              ⭐ {rating}
            </span>
          )}
        </div>

        <p className={styles.address}>
          <span aria-hidden="true">📍</span>
          {listing.address ?? listing.city ?? 'Location not specified'}
        </p>

        {/* Meta tags */}
        {(listing.food_type && listing.food_type !== 'none' || distanceKm) && (
          <div className={styles.meta}>
            {listing.food_type && listing.food_type !== 'none' && (
              <span className={styles.metaTag}>
                {FOOD_ICONS[listing.food_type]} {listing.food_type}
              </span>
            )}
            {distanceKm && (
              <span className={styles.metaTag}>📏 {distanceKm} km away</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.viewBtn}>View Details →</span>
          {listing.deposit && (
            <span className={styles.deposit}>Dep: {formatRent(listing.deposit)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
