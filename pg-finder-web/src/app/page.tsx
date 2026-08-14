import Link from 'next/link';
import { listingsApi } from '@/lib/api';
import ListingCard from '@/components/ListingCard';
import HeroSearch from '@/components/HeroSearch';
import WaveDivider from '@/components/WaveDivider';
import ServiceCard from '@/components/ServiceCard';
import CoverflowCarousel from '@/components/CoverflowCarousel';
import styles from './page.module.css';

async function getFeaturedListings() {
  try {
    const data = await listingsApi.search({ limit: 8 });
    return data.listings ?? [];
  } catch {
    return [];
  }
}

const STATS = [
  { value: '10,000+', label: 'Verified Listings' },
  { value: '50+', label: 'Cities Covered' },
  { value: '₹0', label: 'Brokerage Fees' },
  { value: '4.8★', label: 'App Rating' },
];

const SERVICES = [
  {
    type: 'pg', icon: '🏠', label: 'PG Rooms',
    desc: 'Paying guest accommodations with meals & facilities included.',
    imageSrc: '/images/service-pg.jpg',
  },
  {
    type: 'flat', icon: '🏢', label: 'Flats & Apartments',
    desc: 'Entire flats for rent or shared apartments across the city.',
    imageSrc: '/images/service-flat.jpg',
  },
  {
    type: 'flatmate', icon: '👥', label: 'Find Flatmates',
    desc: 'Compatible people to share your space based on lifestyle.',
    imageSrc: '/images/service-flatmate.png',
  },
  {
    type: 'mess', icon: '🍱', label: 'Mess & Tiffin',
    desc: 'Monthly meal subscriptions delivered near your location.',
    imageSrc: '/images/service-mess.jpg',
  },
];

const FEATURES = [
  { icon: '🔍', title: 'Smart Search', desc: 'Filter by type, food, budget, and distance.' },
  { icon: '✅', title: 'Verified Listings', desc: 'Real photos, no fakes. Every listing reviewed.' },
  { icon: '💬', title: 'Direct Contact', desc: 'Connect directly with owners. No middlemen.' },
  { icon: '🤝', title: 'Flatmate Matching', desc: 'Algorithm matches you with compatible flatmates.' },
  { icon: '🗺️', title: 'Map View', desc: 'See listings on a map. Know the location first.' },
  { icon: '📱', title: 'Mobile App', desc: 'Browse on Android & iOS. Get notified instantly.' },
];

const BENEFITS = [
  { icon: '💚', title: 'Zero Brokerage', desc: 'No hidden fees, ever.' },
  { icon: '🔒', title: 'Verified Owners', desc: 'All landlords ID-verified.' },
  { icon: '⚡', title: 'Go Live in Minutes', desc: 'List your property instantly.' },
];

export default async function HomePage() {
  const listings = await getFeaturedListings();

  return (
    <div className={styles.page}>

      {/* ══════════════════════════════════════════════════
          HERO — city background with motion + student cutout
      ══════════════════════════════════════════════════ */}
      <section className={styles.hero}>
        {/* Animated zooming city background */}
        <div className={styles.cityBgWrap}>
          <img
            src="/images/hero-city-bg.jpg"
            alt="City skyline background"
            className={styles.cityBgImg}
          />
          <div className={styles.heroOverlay} />
        </div>

        {/* Subtle radial glow */}
        <div className={styles.heroGlow} />

        <div className={`container ${styles.heroGrid}`}>
          {/* Left column */}
          <div className={styles.heroLeft}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot}>✨</span>
              Flatmate matching is now live!
            </div>

            <h1 className={styles.heroTitle}>
              Find your perfect<br />
              <span className={styles.heroAccent}>PG, Flat or Flatmate</span>
            </h1>

            <p className={styles.heroSub}>
              Discover verified PGs, flats, and flatmate rooms near you.
              Direct contact with owners. Zero brokerage. Zero hassle.
            </p>

            <HeroSearch />

            {/* Quick area tags */}
            <div className={styles.heroTags}>
              {['Connaught Place', 'Karol Bagh', 'Lajpat Nagar', 'Dwarka', 'Noida', 'Gurugram'].map((area) => (
                <Link
                  key={area}
                  href={`/listings?q=${encodeURIComponent(area)}`}
                  className={styles.heroTag}
                >
                  {area}
                </Link>
              ))}
            </div>
          </div>

          {/* Right column — half-body student cutout with floating vector badges */}
          <div className={styles.heroRight}>
            <div className={styles.girlBackdropGlow} />

            <div className={`${styles.heroFloatingBadge} ${styles.badgePg}`}>
              <span className={styles.badgeIcon}>🏠</span>
              <span className={styles.badgeText}>PG Rooms</span>
            </div>

            <div className={`${styles.heroFloatingBadge} ${styles.badgeFlat}`}>
              <span className={styles.badgeIcon}>🏢</span>
              <span className={styles.badgeText}>Flats</span>
            </div>

            <div className={`${styles.heroFloatingBadge} ${styles.badgeFlatmate}`}>
              <span className={styles.badgeIcon}>👥</span>
              <span className={styles.badgeText}>Flatmates</span>
            </div>

            <div className={`${styles.heroFloatingBadge} ${styles.badgeMess}`}>
              <span className={styles.badgeIcon}>🍱</span>
              <span className={styles.badgeText}>Mess & Meals</span>
            </div>

            <img
              src="/images/hero-girl-cutout-smooth.png"
              alt="Student exploring PGs, Flats, Mess and Flatmates"
              className={styles.girlCutoutImg}
            />
          </div>
        </div>

        {/* Stats strip */}
        <div className={styles.heroStats}>
          <div className={`container ${styles.heroStatsGrid}`}>
            {STATS.map(s => (
              <div key={s.label} className={styles.statItem}>
                <span className={styles.statValue}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wave transition hero → content */}
      <WaveDivider fill="var(--hero-bg)" background="var(--bg)" />

      {/* ══════════════════════════════════════════════════
          ABOUT — split layout with image + info card
      ══════════════════════════════════════════════════ */}
      <section className="section">
        <div className="container">
          <div className={styles.aboutGrid}>
            {/* Left — image with floating info card */}
            <div className={styles.aboutImageWrap}>
              <img
                src="/images/about-interior.jpg"
                alt="Modern apartment interior"
                className={styles.aboutImage}
              />
              <div className={styles.aboutFloatCard}>
                <span className={styles.aboutFloatIcon}>🏠</span>
                <div>
                  <p className={styles.aboutFloatValue}>10,000+</p>
                  <p className={styles.aboutFloatLabel}>Verified Properties</p>
                </div>
              </div>
            </div>

            {/* Right — content */}
            <div className={styles.aboutContent}>
              <span className={styles.aboutEyebrow}>ABOUT US</span>
              <h2 className={styles.aboutTitle}>
                We Can Help You Find<br />
                <span className="gradient-text">The Perfect Home!</span>
              </h2>
              <p className={styles.aboutBody}>
                PGFinder connects thousands of genuine seekers with verified property owners
                across India. No brokerage, no fake listings — just real homes and real people.
                Whether you&apos;re a student, a working professional, or relocating to a new
                city, we make finding your next home effortless.
              </p>

              <div className={styles.aboutCta}>
                <div className={styles.aboutCtaCard}>
                  <span className={styles.aboutCtaIcon}>🔍</span>
                  <div>
                    <p className={styles.aboutCtaTitle}>Browse Listings</p>
                    <p className={styles.aboutCtaSub}>Find verified PGs & flats near you</p>
                  </div>
                  <Link href="/listings" className={styles.aboutCtaBtn}>Browse →</Link>
                </div>
              </div>

              <div className={styles.aboutFeats}>
                {FEATURES.slice(0, 3).map(f => (
                  <div key={f.title} className={styles.aboutFeat}>
                    <span className={styles.aboutFeatIcon}>{f.icon}</span>
                    <div>
                      <p className={styles.aboutFeatTitle}>{f.title}</p>
                      <p className={styles.aboutFeatDesc}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SERVICES — image-bg type cards
      ══════════════════════════════════════════════════ */}
      <section className={`section ${styles.serviceSection}`}>
        <div className="container">
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.sectionEyebrow}>OUR SERVICES</p>
              <h2 className={styles.sectionTitle}>Best Accommodation Options</h2>
            </div>
            <p className={styles.sectionSub}>Choose your accommodation type to get started</p>
          </div>
          <div className={styles.servicesGrid}>
            {SERVICES.map(s => (
              <ServiceCard
                key={s.type}
                icon={s.icon}
                label={s.label}
                desc={s.desc}
                href={`/listings?type=${s.type}`}
                imageSrc={s.imageSrc}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FEATURED LISTINGS — coverflow carousel
      ══════════════════════════════════════════════════ */}
      {listings.length > 0 && (
        <section className="section" style={{ paddingBottom: 0 }}>
          <div className="container">
            <div className={styles.sectionHeadCenter}>
              <span className={styles.featuredBadge}>✨ Featured</span>
              <h2 className={styles.sectionTitle}>Featured Listings Near You</h2>
              <p className={styles.sectionSub}>Check out some of the best PGs and flats</p>
            </div>
          </div>
          <CoverflowCarousel listings={listings} />
          <div className={styles.browseAllWrap}>
            <Link href="/listings" className="btn btn-outline">
              Browse All Listings →
            </Link>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          MORE FEATURES grid
      ══════════════════════════════════════════════════ */}
      <section className="section">
        <div className="container">
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.sectionEyebrow}>OUR BENEFITS</p>
              <h2 className={styles.sectionTitle}>Why PGFinder?</h2>
            </div>
            <p className={styles.sectionSub}>Everything you need to find your next home</p>
          </div>
          <div className={styles.featuresGrid}>
            {FEATURES.map(f => (
              <div key={f.title} className={styles.featureCard}>
                <span className={styles.featureIconCircle}>{f.icon}</span>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA BANNER — dark teal, two column
      ══════════════════════════════════════════════════ */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaGlow} />
        <div className={`container ${styles.ctaGrid}`}>
          <div className={styles.ctaLeft}>
            <p className={styles.ctaEyebrow}>FOR PROPERTY OWNERS</p>
            <h2 className={styles.ctaTitle}>
              Comfort Are Perfectly<br />Combined Here!
            </h2>
            <p className={styles.ctaSub}>
              Reach thousands of genuine seekers. No commission, no brokerage.
              Your listing goes live in minutes.
            </p>
            <div className={styles.ctaActions}>
              <Link href="/dashboard/new" className="btn btn-primary">
                Post Your Listing →
              </Link>
              <Link href="/auth/register" className={styles.ctaSecondaryBtn}>
                Create Free Account
              </Link>
            </div>
          </div>

          <div className={styles.ctaBenefits}>
            {BENEFITS.map(b => (
              <div key={b.title} className={styles.benefitCard}>
                <span className={styles.benefitIcon}>{b.icon}</span>
                <div>
                  <p className={styles.benefitTitle}>{b.title}</p>
                  <p className={styles.benefitDesc}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
