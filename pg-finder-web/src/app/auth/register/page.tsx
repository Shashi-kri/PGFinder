'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from '../auth.module.css';

const FEATURES = [
  { icon: '🏠', title: 'Zero Brokerage', sub: 'No hidden fees, ever' },
  { icon: '🔒', title: 'Verified Owners', sub: 'All landlords ID-verified' },
  { icon: '⚡', title: 'Go Live in Minutes', sub: 'List your property instantly' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', role: 'seeker' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password, form.phone.trim() || undefined, form.role);
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
          <div className={styles.leftLogo}>
            <span className={styles.leftLogoIcon}>🏠</span>
            <span className={styles.leftLogoText}>
              PGFinder<span className={styles.leftLogoDot}>.</span>
            </span>
          </div>
          <h2 className={styles.leftHeading}>
            Find your perfect<br />
            <span className={styles.leftAccent}>home today</span>
          </h2>
          <p className={styles.leftSub}>
            Free forever. No brokerage. No fake listings. Just real homes and real people.
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
            <p className={styles.sub}>Free forever. No hidden charges.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>⚠️ {error}</div>}

            <div className={styles.field}>
              <label className={styles.label}>Full Name</label>
              <input type="text" className="input" placeholder="Rahul Sharma"
                value={form.name} onChange={set('name')} required />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Email Address</label>
              <input type="email" className="input" placeholder="you@example.com"
                value={form.email} onChange={set('email')} required />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Phone Number <span className={styles.optional}>(optional)</span></label>
              <input type="tel" className="input" placeholder="9876543210"
                value={form.phone} onChange={set('phone')} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>I am a</label>
              <select className="input" value={form.role} onChange={set('role')}>
                <option value="seeker">🔍 Seeker — looking for a PG / flat</option>
                <option value="owner">🏠 Owner — listing my property</option>
              </select>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Password</label>
                <input type="password" className="input" placeholder="Min 6 characters"
                  value={form.password} onChange={set('password')} required />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Confirm Password</label>
                <input type="password" className="input" placeholder="••••••••"
                  value={form.confirm} onChange={set('confirm')} required />
              </div>
            </div>

            <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account →'}
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
