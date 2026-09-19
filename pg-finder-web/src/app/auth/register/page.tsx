'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from '../auth.module.css';

const FEATURES = [
  { icon: '₹0', title: 'Zero Brokerage', sub: 'Connect with owners directly. No commission.' },
  { icon: '🏠', title: 'Owner Profiles', sub: 'Contact property owners directly.' },
  { icon: '⚡', title: 'Go Live Quickly', sub: 'List your property and start receiving inquiries.' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirm: '', role: 'seeker',
  });
  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error,  setError]  = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await register(
        form.name.trim(),
        form.email.trim(),
        form.password,
        form.phone.trim() || undefined,
        form.role,
      );
      router.push('/');
    } catch (err: any) {
      setError(err.message ?? 'Registration failed. Please try again.');
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
            Find your perfect<br />
            <span className={styles.leftAccent}>home today.</span>
          </h2>
          <p className={styles.leftSub}>
            Free to use. No brokerage. Browse PGs, flats and flatmates, and connect directly with owners.
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
            <h1 className={styles.title}>Create your account</h1>
            <p className={styles.sub}>Free to join. No hidden charges.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {error && (
              <div className={styles.error} role="alert">
                <span aria-hidden="true">⚠️</span> {error}
              </div>
            )}

            <div className={styles.field}>
              <label htmlFor="reg-name" className={styles.label}>Full Name</label>
              <input
                id="reg-name"
                type="text"
                className="input"
                placeholder="Rahul Sharma"
                value={form.name}
                onChange={set('name')}
                autoComplete="name"
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="reg-email" className={styles.label}>Email Address</label>
              <input
                id="reg-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="reg-phone" className={styles.label}>
                Phone Number <span className={styles.optional}>(optional)</span>
              </label>
              <input
                id="reg-phone"
                type="tel"
                className="input"
                placeholder="9876543210"
                value={form.phone}
                onChange={set('phone')}
                autoComplete="tel"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="reg-role" className={styles.label}>I am a</label>
              <select id="reg-role" className="input" value={form.role} onChange={set('role')}>
                <option value="seeker">🔍 Seeker — looking for a PG or flat</option>
                <option value="owner">🏠 Owner — listing my property</option>
              </select>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="reg-pwd" className={styles.label}>Password</label>
                <div className={styles.inputWrap}>
                  <input
                    id="reg-pwd"
                    type={showPwd ? 'text' : 'password'}
                    className="input"
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={set('password')}
                    autoComplete="new-password"
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
              <div className={styles.field}>
                <label htmlFor="reg-confirm" className={styles.label}>Confirm Password</label>
                <div className={styles.inputWrap}>
                  <input
                    id="reg-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    className="input"
                    placeholder="••••••••"
                    value={form.confirm}
                    onChange={set('confirm')}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowConfirm(v => !v)}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              id="register-submit"
              className={`btn btn-primary ${styles.submitBtn}`}
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <p className={styles.switch}>
            Already have an account?{' '}
            <Link href="/auth/login" className={styles.switchLink}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
