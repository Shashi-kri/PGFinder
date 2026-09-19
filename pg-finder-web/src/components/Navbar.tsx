'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Mark as mounted so theme-dependent UI renders correctly on client
  useEffect(() => { setMounted(true); }, []);

  // Close menus on route change
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setMenuOpen(false);
    setUserMenuOpen(false);
  }

  // Close user menu when clicking outside
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-user-menu]')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  const navLinks = [
    { href: '/listings', label: 'Browse', type: null },
    { href: '/listings?type=pg', label: 'PGs', type: 'pg' },
    { href: '/listings?type=flat', label: 'Flats', type: 'flat' },
    { href: '/listings?type=flatmate', label: 'Flatmates', type: 'flatmate' },
    { href: '/matches', label: 'Find Your Match ✨', type: 'matches' },
  ];

  const isLinkActive = (link: { href: string; type: string | null }) => {
    if (link.type === 'matches') return pathname === '/matches';
    if (pathname !== '/listings') return false;
    const currentType = searchParams.get('type');
    if (link.type === null) return !currentType;
    return currentType === link.type;
  };

  const handleLogout = () => { logout(); router.push('/'); };

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`} role="navigation" aria-label="Main navigation">
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo} aria-label="PGFinder home">
          <span className={styles.logoIcon}>🏠</span>
          <span className={styles.logoText}>PG<span className={styles.logoDot}>Finder</span></span>
        </Link>

        {/* Desktop links */}
        <div className={styles.links} role="list">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href}
              className={`${styles.link} ${isLinkActive(l) ? styles.active : ''}`}
              role="listitem"
              aria-current={isLinkActive(l) ? 'page' : undefined}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div className={styles.actions}>
          <button
            className={styles.themeBtn}
            onClick={toggle}
            aria-label={mounted ? (theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode') : 'Toggle theme'}
            title={mounted ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : 'Theme'}
            suppressHydrationWarning
          >
            {mounted ? (theme === 'dark' ? '☀️' : '🌙') : '🌙'}
          </button>
          <Link href="/dashboard/new" className={styles.postBtn}>
            + List Property
          </Link>

          {user ? (
            <div className={styles.userMenu} data-user-menu>
              <button
                className={styles.avatarBtn}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                aria-label="User menu"
              >
                {user.photo_url ? (
                  <img src={user.photo_url} alt={user.name} className={styles.avatarPhoto} />
                ) : (
                  <span className={styles.avatarCircle}>{user.name[0].toUpperCase()}</span>
                )}
                <span className={styles.userName}>{user.name.split(' ')[0]}</span>
                <span className={styles.chevDown} aria-hidden="true">▾</span>
              </button>
              {userMenuOpen && (
                <div className={styles.dropdown} role="menu">
                  <div className={styles.dropdownHeader}>
                    <p className={styles.dropdownName}>{user.name}</p>
                    <p className={styles.dropdownEmail}>{user.email}</p>
                  </div>
                  <div className={styles.dropdownDivider} />
                  <Link href="/matches" className={styles.dropdownItem} role="menuitem">✨ Find Your Match</Link>
                  <Link href="/profile/seeker" className={styles.dropdownItem} role="menuitem">🤝 Seeker Profile</Link>
                  <Link href="/dashboard" className={styles.dropdownItem} role="menuitem">🏠 My Listings</Link>
                  <Link href="/saved" className={styles.dropdownItem} role="menuitem">❤️ Saved Places</Link>
                  <Link href="/profile" className={styles.dropdownItem} role="menuitem">👤 Profile</Link>
                  <div className={styles.dropdownDivider} />
                  <button className={`${styles.dropdownItem} ${styles.logoutItem}`} onClick={handleLogout} role="menuitem">
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
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span className={`${styles.bar} ${menuOpen ? styles.bar1Open : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.bar2Open : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.bar3Open : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu} role="menu">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className={`${styles.mobileLink} ${isLinkActive(l) ? styles.mobileLinkActive : ''}`} onClick={() => setMenuOpen(false)} role="menuitem">{l.label}</Link>
          ))}
          <div className={styles.mobileDivider} />
          {user ? (
            <>
              <p className={styles.mobileUser}>👋 {user.name}</p>
              <Link href="/dashboard" className={styles.mobileLink} onClick={() => setMenuOpen(false)} role="menuitem">🏠 My Listings</Link>
              <Link href="/saved" className={styles.mobileLink} onClick={() => setMenuOpen(false)} role="menuitem">❤️ Saved Places</Link>
              <button className={`${styles.mobileLink} ${styles.logoutItem}`} onClick={handleLogout} role="menuitem">🚪 Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className={styles.mobileLink} onClick={() => setMenuOpen(false)} role="menuitem">Sign In</Link>
              <Link href="/auth/register" className={`${styles.mobileLink} ${styles.mobilePrimary}`} onClick={() => setMenuOpen(false)} role="menuitem">Get Started</Link>
            </>
          )}
          <Link href="/dashboard/new" className={`${styles.mobileLink} ${styles.mobilePostBtn}`} onClick={() => setMenuOpen(false)} role="menuitem">+ List Property</Link>
        </div>
      )}
    </nav>
  );
}
