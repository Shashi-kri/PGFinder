'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import type { Listing } from '@/lib/api';
import styles from './CoverflowCarousel.module.css';

const TYPE_LABELS: Record<string, string> = {
  pg: 'PG', flat: 'Flat', flatmate: 'Flatmate', mess: 'Mess',
};

function formatRent(rent: number) {
  if (rent >= 1000) return `₹${(rent / 1000).toFixed(rent % 1000 === 0 ? 0 : 1)}k`;
  return `₹${rent}`;
}

interface Props { listings: Listing[]; }

export default function CoverflowCarousel({ listings }: Props) {
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  const touchStartX = useRef<number>(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const count = listings.length;

  const next = useCallback(() => setActive(i => (i + 1) % count), [count]);
  const prev = useCallback(() => setActive(i => (i - 1 + count) % count), [count]);

  // Auto-advance every 4s
  const startAuto = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(next, 4000);
  }, [next]);

  useEffect(() => {
    startAuto();
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [startAuto]);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { prev(); startAuto(); }
      if (e.key === 'ArrowRight') { next(); startAuto(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, startAuto]);

  // Swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 50) {
      dx > 0 ? next() : prev();
      startAuto();
    }
  };

  if (!count) return null;

  // Compute per-card visual params
  const getCardProps = (index: number) => {
    let diff = index - active;
    if (diff > count / 2)  diff -= count;
    if (diff < -count / 2) diff += count;
    const absDiff = Math.abs(diff);

    if (absDiff > 2) return null; // hidden

    const SCALES   = [1,    0.82, 0.64] as const;
    const BLURS    = [0,    4,    9]    as const;
    const OPACS    = [1,    0.70, 0.38] as const;
    const OFFSETS  = [0,    290,  530]  as const; // px from center

    const sign   = diff >= 0 ? 1 : -1;
    const offset = sign * OFFSETS[absDiff];

    return {
      style: {
        transform: `translateX(calc(-50% + ${offset}px)) scale(${SCALES[absDiff]})`,
        filter:    BLURS[absDiff] ? `blur(${BLURS[absDiff]}px)` : 'none',
        opacity:   OPACS[absDiff],
        zIndex:    10 - absDiff,
        cursor:    absDiff === 0 ? 'default' : 'pointer',
      } as React.CSSProperties,
      isActive: absDiff === 0,
    };
  };

  return (
    <div className={styles.section}
         onMouseEnter={() => { if (autoRef.current) clearInterval(autoRef.current); }}
         onMouseLeave={startAuto}
         onTouchStart={onTouchStart}
         onTouchEnd={onTouchEnd}
    >
      {/* Card track */}
      <div className={styles.track}>
        {listings.map((listing, i) => {
          const props = getCardProps(i);
          if (!props && mounted) return null;
          const { style, isActive } = props ?? { style: {}, isActive: false };

          const photo = listing.photos?.[0]?.url;
          const rating = listing.avg_rating ? Number(listing.avg_rating).toFixed(1) : null;

          return (
            <div
              key={listing.id}
              className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
              style={style}
              onClick={() => !isActive && setActive(i)}
              aria-hidden={!isActive}
            >
              {/* Photo */}
              <div className={styles.cardPhoto}>
                {photo ? (
                  <img src={photo} alt={listing.title} className={styles.cardImg} />
                ) : (
                  <div className={styles.cardPlaceholder}>
                    <span className={styles.cardPlaceholderIcon}>
                      {listing.type === 'pg' ? '🏠' : listing.type === 'flat' ? '🏢' : listing.type === 'mess' ? '🍱' : '👥'}
                    </span>
                  </div>
                )}

                {/* Location badge */}
                <div className={styles.cardLocBadge}>
                  <span>📍</span>
                  <span>{listing.city ?? listing.address?.split(',')[0] ?? 'India'}</span>
                </div>
              </div>

              {/* Bottom info overlay */}
              <div className={styles.cardOverlay}>
                <p className={styles.cardTitle}>{listing.title}</p>
                <div className={styles.cardRow}>
                  <span className={styles.cardPrice}>
                    {formatRent(listing.rent)}
                    <span className={styles.cardPer}>/mo</span>
                  </span>
                  <span className={styles.cardTypePill}>{TYPE_LABELS[listing.type]}</span>
                  {rating && <span className={styles.cardRating}>⭐ {rating}</span>}
                </div>

                {isActive && (
                  <Link href={`/listings/${listing.id}`} className={styles.cardCta}>
                    View Details →
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className={styles.navRow}>
        <button className={styles.navBtn} onClick={() => { prev(); startAuto(); }} aria-label="Previous listing">
          ←
        </button>
        <div className={styles.dots} role="tablist">
          {listings.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              className={`${styles.dot} ${i === active ? styles.dotActive : ''}`}
              onClick={() => { setActive(i); startAuto(); }}
              aria-label={`Listing ${i + 1}`}
            />
          ))}
        </div>
        <button className={styles.navBtn} onClick={() => { next(); startAuto(); }} aria-label="Next listing">
          →
        </button>
      </div>
    </div>
  );
}
