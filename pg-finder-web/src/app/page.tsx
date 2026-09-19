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

const SERVICES = [
  {
    type: 'pg', label: 'PG Rooms',
    desc: 'Find single and shared rooms near your college or workplace.',
    cta: 'Explore PGs',
    imageSrc: '/images/service-pg.jpg',
  },
  {
    type: 'flat', label: 'Flats & Apartments',
    desc: 'Find entire or shared flats that fit your budget.',
    cta: 'Explore Flats',
    imageSrc: '/images/service-flat.jpg',
  },
  {
    type: 'flatmate', label: 'Find Flatmates',
    desc: 'Find people with compatible budgets and lifestyles.',
    cta: 'Find Flatmates',
    imageSrc: '/images/service-flatmate.png',
  },
  {
    type: 'mess', label: 'Mess & Tiffin',
    desc: 'Discover affordable meal services near your location.',
    cta: 'Find Food',
    imageSrc: '/images/service-mess.jpg',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Search',
    desc: 'Tell us where you want to live — by area, landmark or city.',
  },
  {
    step: '02',
    title: 'Compare',
    desc: 'Explore PGs, flats and flatmates that fit your needs and budget.',
  },
  {
    step: '03',
    title: 'Connect',
    desc: 'Contact property owners directly. No middlemen, no brokerage.',
  },
  {
    step: '04',
    title: 'Move In',
    desc: 'Visit in person, verify the property, and make your decision.',
  },
];

const WHY_PGFINDER = [
  {
    icon: '📞',
    title: 'Direct Owner Contact',
    desc: 'Connect directly with property owners. No agents, no commission.',
  },
  {
    icon: '🔍',
    title: 'Smart Search & Filters',
    desc: 'Filter by location, budget, type, food, and more to find your match.',
  },
  {
    icon: '📋',
    title: 'Detailed Listings',
    desc: 'See photos, amenities, location and pricing all in one place.',
  },
  {
    icon: '🤝',
    title: 'Built for Renters',
    desc: 'Designed around the needs of students and working professionals.',
  },
];

const SAFETY_TIPS = [
  {
    icon: '🔎',
    title: 'Verify before paying',
    desc: "Never send money before properly verifying the property and owner in person.",
  },
  {
    icon: '🏠',
    title: 'Visit before booking',
    desc: 'Always inspect the accommodation where possible before committing.',
  },
  {
    icon: '🚩',
    title: 'Report suspicious listings',
    desc: 'Something feel wrong? Report the listing and help keep the platform safe.',
  },
];

const OWNER_BENEFITS = [
  {
    icon: '₹0',
    title: 'Zero Brokerage',
    desc: 'No hidden fees or unnecessary commission.',
  },
  {
    icon: '📝',
    title: 'Easy Listing',
    desc: 'Create and publish your listing in minutes.',
  },
  {
    icon: '📡',
    title: 'Reach Renters Directly',
    desc: 'Connect with genuine seekers looking in your area.',
  },
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
            alt=""
            aria-hidden="true"
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
              Flatmate matching is now live
            </div>

            <h1 className={styles.heroTitle}>
              Find a place you'll actually<br />
              <span className={styles.heroAccent}>love coming home to.</span>
            </h1>

            <p className={styles.heroTypes}>PGs &bull; Flats &bull; Flatmates &bull; Mess</p>

            <p className={styles.heroSub}>
              Find accommodation and compatible flatmates near your college, workplace, or preferred area.
              Connect directly with owners. No brokerage.
            </p>

            <HeroSearch />

            {/* Quick area tags */}
            <div className={styles.heroTagsWrap}>
              <span className={styles.heroTagsLabel}>Popular:</span>
              <div className={styles.heroTags}>
                {['Connaught Place', 'Karol Bagh', 'Dwarka', 'Noida', 'Gurugram'].map((area) => (
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

            <img
              src="/images/hero-girl-cutout-smooth.png"
              alt="Student exploring PGs, Flats and Flatmates"
              className={styles.girlCutoutImg}
            />
          </div>
        </div>

        {/* Trust strip — only factual product benefits */}
        <div className={styles.heroStats}>
          <div className={`container ${styles.heroStatsGrid}`}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>₹0</span>
              <span className={styles.statLabel}>Brokerage Fees</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>Direct</span>
              <span className={styles.statLabel}>Owner Contact</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>4 Types</span>
              <span className={styles.statLabel}>PG · Flat · Flatmate · Mess</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>Free</span>
              <span className={styles.statLabel}>To Browse & Connect</span>
            </div>
          </div>
        </div>
      </section>

      {/* Wave transition hero → content */}
      <WaveDivider fill="var(--hero-bg)" background="var(--bg)" />

      {/* ══════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════ */}
      <section className={`section ${styles.howSection}`}>
        <div className="container">
          <div className={styles.sectionHeadCenter}>
            <span className={styles.sectionEyebrow}>HOW IT WORKS</span>
            <h2 className={styles.sectionTitle}>Finding your next home is simple.</h2>
            <p className={styles.sectionSub}>Search, compare and connect without the usual rental hassle.</p>
          </div>

          <div className={styles.howGrid}>
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className={styles.howCard}>
                <div className={styles.howStep}>{item.step}</div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className={styles.howConnector} aria-hidden="true" />
                )}
                <h3 className={styles.howTitle}>{item.title}</h3>
                <p className={styles.howDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          ABOUT — split layout with image + info card
      ══════════════════════════════════════════════════ */}
      <section className="section">
        <div className="container">
          <div className={styles.aboutGrid}>
            {/* Left — image */}
            <div className={styles.aboutImageWrap}>
              <img
                src="/images/about-interior.jpg"
                alt="Modern, comfortable apartment interior"
                className={styles.aboutImage}
              />
              <div className={styles.aboutFloatCard}>
                <span className={styles.aboutFloatIcon}>🏠</span>
                <div>
                  <p className={styles.aboutFloatValue}>Direct</p>
                  <p className={styles.aboutFloatLabel}>Owner Contact</p>
                </div>
              </div>
            </div>

            {/* Right — content */}
            <div className={styles.aboutContent}>
              <span className={styles.aboutEyebrow}>ABOUT PGFINDER</span>
              <h2 className={styles.aboutTitle}>
                Find your next home<br />
                <span className="gradient-text">without the usual hassle.</span>
              </h2>
              <p className={styles.aboutBody}>
                PGFinder helps students and working professionals discover accommodation, compare options,
                and connect directly with property owners — without agents or brokerage fees.
                Whether you&apos;re looking for a PG, a flat, a flatmate, or a meal service near your
                college or workplace, we make the process straightforward.
              </p>

              <div className={styles.aboutFeats}>
                <div className={styles.aboutFeat}>
                  <span className={styles.aboutFeatIcon}>🔍</span>
                  <div>
                    <p className={styles.aboutFeatTitle}>Smart Search</p>
                    <p className={styles.aboutFeatDesc}>Filter by location, type, budget and more to find what fits.</p>
                  </div>
                </div>
                <div className={styles.aboutFeat}>
                  <span className={styles.aboutFeatIcon}>📋</span>
                  <div>
                    <p className={styles.aboutFeatTitle}>Detailed Listings</p>
                    <p className={styles.aboutFeatDesc}>Photos, amenities, pricing — see everything before reaching out.</p>
                  </div>
                </div>
                <div className={styles.aboutFeat}>
                  <span className={styles.aboutFeatIcon}>💬</span>
                  <div>
                    <p className={styles.aboutFeatTitle}>Direct Contact</p>
                    <p className={styles.aboutFeatDesc}>Connect with owners directly. No agents, no commission.</p>
                  </div>
                </div>
              </div>

              <Link href="/listings" className={`btn btn-primary ${styles.aboutCta}`}>
                Browse Listings →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SERVICES — image-bg type cards
      ══════════════════════════════════════════════════ */}
      <section className={`section ${styles.serviceSection}`}>
        <div className="container">
          <div className={styles.sectionHeadCenter}>
            <span className={styles.sectionEyebrow}>ACCOMMODATION TYPES</span>
            <h2 className={styles.sectionTitle}>What are you looking for?</h2>
            <p className={styles.sectionSub}>Choose your accommodation type to get started</p>
          </div>
          <div className={styles.servicesGrid}>
            {SERVICES.map(s => (
              <ServiceCard
                key={s.type}
                label={s.label}
                desc={s.desc}
                cta={s.cta}
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
              <h2 className={styles.sectionTitle}>Featured Listings</h2>
              <p className={styles.sectionSub}>Browse some of the latest PGs and flats on PGFinder</p>
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
          WHY PGFINDER
      ══════════════════════════════════════════════════ */}
      <section className="section">
        <div className="container">
          <div className={styles.sectionHeadCenter}>
            <span className={styles.sectionEyebrow}>WHY PGFINDER</span>
            <h2 className={styles.sectionTitle}>Why choose PGFinder?</h2>
            <p className={styles.sectionSub}>Everything you need to find your next home, in one place.</p>
          </div>
          <div className={styles.whyGrid}>
            {WHY_PGFINDER.map(w => (
              <div key={w.title} className={styles.whyCard}>
                <span className={styles.whyIcon}>{w.icon}</span>
                <h3 className={styles.whyTitle}>{w.title}</h3>
                <p className={styles.whyDesc}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SAFETY GUIDANCE
      ══════════════════════════════════════════════════ */}
      <section className={`section ${styles.safetySection}`}>
        <div className="container">
          <div className={styles.safetyInner}>
            <div className={styles.safetyHead}>
              <span className={styles.sectionEyebrow}>STAY INFORMED</span>
              <h2 className={styles.safetyTitle}>Find a place. Stay safe.</h2>
              <p className={styles.safetySub}>
                PGFinder connects you directly with owners. Here are a few things to keep in mind.
              </p>
            </div>
            <div className={styles.safetyCards}>
              {SAFETY_TIPS.map(tip => (
                <div key={tip.title} className={styles.safetyCard}>
                  <span className={styles.safetyIcon}>{tip.icon}</span>
                  <div>
                    <p className={styles.safetyCardTitle}>{tip.title}</p>
                    <p className={styles.safetyCardDesc}>{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA BANNER — for property owners
      ══════════════════════════════════════════════════ */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaGlow} />
        <div className={`container ${styles.ctaGrid}`}>
          <div className={styles.ctaLeft}>
            <p className={styles.ctaEyebrow}>FOR PROPERTY OWNERS</p>
            <h2 className={styles.ctaTitle}>
              List Your Property.<br />Find the Right Tenant.
            </h2>
            <p className={styles.ctaSub}>
              Reach genuine renters directly. Create your listing in minutes without unnecessary brokerage.
            </p>
            <div className={styles.ctaActions}>
              <Link href="/dashboard/new" className="btn btn-primary">
                List Your Property →
              </Link>
              <Link href="/auth/register" className={styles.ctaSecondaryBtn}>
                Create Free Account
              </Link>
            </div>
          </div>

          <div className={styles.ctaBenefits}>
            {OWNER_BENEFITS.map(b => (
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
