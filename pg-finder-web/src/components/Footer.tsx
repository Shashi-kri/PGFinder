import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <span className={styles.logo}>🏠 PG<span>Finder</span></span>
          <p className={styles.tagline}>
            Find verified PGs, flats, flatmates & mess near you.
            Direct contact, zero brokerage.
          </p>
          <div className={styles.socials}>
            <a href="#" aria-label="Instagram" className={styles.social}>📷</a>
            <a href="#" aria-label="Twitter" className={styles.social}>🐦</a>
            <a href="#" aria-label="WhatsApp" className={styles.social}>💬</a>
          </div>
        </div>

        <div className={styles.col}>
          <h4 className={styles.colTitle}>Find Rooms</h4>
          <Link href="/listings?type=pg" className={styles.colLink}>PG Accommodation</Link>
          <Link href="/listings?type=flat" className={styles.colLink}>Flats & Apartments</Link>
          <Link href="/listings?type=flatmate" className={styles.colLink}>Flatmates</Link>
          <Link href="/listings?type=mess" className={styles.colLink}>Mess & Tiffin</Link>
        </div>

        <div className={styles.col}>
          <h4 className={styles.colTitle}>For Owners</h4>
          <Link href="/dashboard/new" className={styles.colLink}>Post a Listing</Link>
          <Link href="/dashboard" className={styles.colLink}>Manage Listings</Link>
          <Link href="/auth/register" className={styles.colLink}>Create Account</Link>
        </div>

        <div className={styles.col}>
          <h4 className={styles.colTitle}>Company</h4>
          <Link href="/about" className={styles.colLink}>About Us</Link>
          <Link href="/contact" className={styles.colLink}>Contact</Link>
          <Link href="/privacy" className={styles.colLink}>Privacy Policy</Link>
          <Link href="/terms" className={styles.colLink}>Terms of Service</Link>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className="container">
          <span className={styles.copy}>© 2025 PGFinder. All rights reserved.</span>
          <span className={styles.copy}>Made with ❤️ for Indian renters</span>
        </div>
      </div>
    </footer>
  );
}
