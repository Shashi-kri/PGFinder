import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.logo}>
            🏠 PG<span className={styles.logoDot}>Finder</span>
          </div>
          <p className={styles.tagline}>
            Find PGs, flats, flatmates and mess services near you.
            Connect directly with owners. No brokerage, no hassle.
          </p>
          <div className={styles.brandDivider} />
          <p className={styles.madeWith}>Made with ❤️ for Indian renters</p>
        </div>

        {/* Find a Home */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Find a Home</h4>
          <Link href="/listings?type=pg" className={styles.colLink}>PG Accommodation</Link>
          <Link href="/listings?type=flat" className={styles.colLink}>Flats &amp; Apartments</Link>
          <Link href="/listings?type=flatmate" className={styles.colLink}>Flatmates</Link>
          <Link href="/listings?type=mess" className={styles.colLink}>Mess &amp; Tiffin</Link>
          <Link href="/matches" className={styles.colLink}>Find Your Match ✨</Link>
        </div>

        {/* For Owners */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>For Owners</h4>
          <Link href="/dashboard/new" className={styles.colLink}>List Property</Link>
          <Link href="/dashboard" className={styles.colLink}>Manage Listings</Link>
          <Link href="/auth/register" className={styles.colLink}>Create Account</Link>
        </div>

        {/* Company */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Company</h4>
          <Link href="/listings" className={styles.colLink}>Browse All</Link>
          <Link href="/auth/login" className={styles.colLink}>Sign In</Link>
          <Link href="/auth/register" className={styles.colLink}>Register</Link>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className="container">
          <span className={styles.copy}>
            © 2025 <span className={styles.copyAccent}>PGFinder</span>. All rights reserved.
          </span>
          <span className={styles.copy}>Zero brokerage. Direct contact.</span>
        </div>
      </div>
    </footer>
  );
}
