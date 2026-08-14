'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menus on route change
  useEffect(() => { setMenuOpen(false); setUserMenuOpen(false); }, [pathname]);

  const navLinks = [
    { href: '/listings', label: 'Browse' },
    { href: '/listings?type=pg', label: 'PGs' },
    { href: '/listings?type=flat', label: 'Flats' },
    { href: '/listings?type=flatmate', label: 'Flatmates' },
  ];

  const handleLogout = () => { logout(); router.push('/'); };

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🏠</span>
          <span className={styles.logoText}>PG<span className={styles.logoDot}>Finder</span></span>
        </Link>

        {/* Desktop links */}
        <div className={styles.links}>
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href}
              className={`${styles.link} ${pathname === l.href ? styles.active : ''}`}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div className={styles.actions}>
          <button className={styles.themeBtn} onClick={toggle} aria-label="Toggle theme" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link href="/dashboard/new" className={styles.postBtn}>+ Post Listing</Link>

          {user ? (
            <div className={styles.userMenu}>
              <button className={styles.avatarBtn} onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <span className={styles.avatarCircle}>{user.name[0].toUpperCase()}</span>
                <span className={styles.userName}>{user.name.split(' ')[0]}</span>
                <span className={styles.chevDown}>▾</span>
              </button>
              {userMenuOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <p className={styles.dropdownName}>{user.name}</p>
                    <p className={styles.dropdownEmail}>{user.email}</p>
                  </div>
                  <div className={styles.dropdownDivider} />
                  <Link href="/dashboard" className={styles.dropdownItem}>🏠 My Listings</Link>
                  <Link href="/saved" className={styles.dropdownItem}>❤️ Saved Places</Link>
                  <Link href="/profile" className={styles.dropdownItem}>👤 Profile</Link>
                  <div className={styles.dropdownDivider} />
                  <button className={`${styles.dropdownItem} ${styles.logoutItem}`} onClick={handleLogout}>
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 14 }}>Sign In</Link>
              <Link href="/auth/register" className="btn btn-primary" style={{ padding: '9px 20px', fontSize: 14 }}>Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <span className={`${styles.bar} ${menuOpen ? styles.bar1Open : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.bar2Open : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.bar3Open : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className={styles.mobileLink} onClick={() => setMenuOpen(false)}>{l.label}</Link>
          ))}
          <div className={styles.mobileDivider} />
          {user ? (
            <>
              <p className={styles.mobileUser}>👋 {user.name}</p>
              <Link href="/dashboard" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>🏠 My Listings</Link>
              <Link href="/saved" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>❤️ Saved Places</Link>
              <button className={`${styles.mobileLink} ${styles.logoutItem}`} onClick={handleLogout}>🚪 Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link href="/auth/register" className={`${styles.mobileLink} ${styles.mobilePrimary}`} onClick={() => setMenuOpen(false)}>Get Started</Link>
            </>
          )}
          <Link href="/dashboard/new" className={`${styles.mobileLink} ${styles.mobilePrimary}`} onClick={() => setMenuOpen(false)}>+ Post Listing</Link>
        </div>
      )}
    </nav>
  );
}
