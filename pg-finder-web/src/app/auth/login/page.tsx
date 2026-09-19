'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from '../auth.module.css';

const FEATURES = [
  {
    icon: '🔍',
    title: 'Smart Search',
    sub: 'Filter by location, type, budget and food preference.',
  },
  {
    icon: '📋',
    title: 'Detailed Listings',
    sub: 'Photos, amenities and pricing — all in one place.',
  },
  {
    icon: '💬',
    title: 'Direct Contact',
    sub: 'Connect with property owners directly. No middlemen.',
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.push('/');
    } catch (err: any) {
      setError(err.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Left decorative panel */}
      <div className={styles.leftPanel}>
        <div className={styles.leftContent}>
          <Link href="/" className={styles.leftLogo}>
            <span className={styles.leftLogoIcon}>🏠</span>
            <span className={styles.leftLogoText}>
              PGFinder<span className={styles.leftLogoDot}>.</span>
            </span>
          </Link>
          <h2 className={styles.leftHeading}>
            Your next home is<br />
            <span className={styles.leftAccent}>one search away.</span>
          </h2>
          <p className={styles.leftSub}>
            Find PGs, flats and flatmates near your college or workplace. Connect directly with owners.
          </p>
          <div className={styles.leftFeatures}>
            {FEATURES.map(f => (
              <div key={f.title} className={styles.leftFeature}>
                <div className={styles.leftFeatureIcon}>{f.icon}</div>
                <div>
                  <p className={styles.leftFeatureTitle}>{f.title}</p>
                  <p className={styles.leftFeatureSub}>{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className={styles.rightPanel}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Link href="/" className={styles.backLogo}>
              🏠 PGFinder<span className={styles.logoDot}>.</span>
            </Link>
            <h1 className={styles.title}>Welcome back</h1>
            <p className={styles.sub}>Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {error && (
              <div className={styles.error} role="alert">
                <span aria-hidden="true">⚠️</span> {error}
              </div>
            )}

            <div className={styles.field}>
              <label htmlFor="login-email" className={styles.label}>Email address</label>
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label htmlFor="login-password" className={styles.label}>Password</label>
                <Link href="/auth/forgot-password" className={styles.forgotLink}>
                  Forgot password?
                </Link>
              </div>
              <div className={styles.inputWrap}>
                <input
                  id="login-password"
                  type={showPwd ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="login-submit"
              className={`btn btn-primary ${styles.submitBtn}`}
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <p className={styles.switch}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className={styles.switchLink}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
