'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import styles from '../auth.module.css';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Wizard state: 1 = request code, 2 = verify & reset, 3 = success
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugCode, setDebugCode] = useState<string | null>(null);

  // Step 1: Send verification code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your email or registered phone number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(identifier.trim());
      if (res.debug_code) {
        setDebugCode(res.debug_code);
      }
      setStep(2);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to send verification code. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset password with code
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword(identifier.trim(), code.trim(), newPassword);
      setStep(3);
    } catch (err: any) {
      setError(err?.message ?? 'Verification failed. Code may be invalid or expired.');
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
            Recover your<br />
            <span className={styles.leftAccent}>account access</span>
          </h2>
          <p className={styles.leftSub}>
            We protect your accommodation search and property listings with secure verification codes sent to your email or phone.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className={styles.rightPanel}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Link href="/" className={styles.backLogo}>
              🏠 PGFinder<span className={styles.logoDot}>.</span>
            </Link>
            <h1 className={styles.title}>
              {step === 3 ? 'Password Reset!' : 'Reset Password'}
            </h1>
            <p className={styles.sub}>
              {step === 1 && 'Enter your registered email address or mobile number'}
              {step === 2 && `Enter the 6-digit code sent to ${identifier}`}
              {step === 3 && 'Your password has been updated successfully.'}
            </p>
          </div>

          {error && <div className={styles.error}>⚠️ {error}</div>}

          {debugCode && step === 2 && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#15803d',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}>
              🔑 <strong>Dev Test Code:</strong> {debugCode}
            </div>
          )}

          {/* STEP 1: Enter email or phone */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Email Address or Mobile Number</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. user@gmail.com or 9876543210"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                className={`btn btn-primary ${styles.submitBtn}`}
                disabled={loading}
              >
                {loading ? 'Sending Code...' : 'Send Verification Code →'}
              </button>

              <p className={styles.switch} style={{ marginTop: 20 }}>
                Remembered your password?{' '}
                <Link href="/auth/login" className={styles.switchLink}>Sign In</Link>
              </p>
            </form>
          )}

          {/* STEP 2: Enter code & new password */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>6-Digit Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  className="input"
                  placeholder="123456"
                  style={{ letterSpacing: '6px', fontSize: '1.2rem', textAlign: 'center', fontWeight: 'bold' }}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>New Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Confirm New Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className={`btn btn-primary ${styles.submitBtn}`}
                disabled={loading}
              >
                {loading ? 'Updating Password...' : 'Reset Password →'}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setError(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  marginTop: '12px',
                  textDecoration: 'underline',
                  textAlign: 'center',
                }}
              >
                ← Back to change email/phone
              </button>
            </form>
          )}

          {/* STEP 3: Success message */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px' }}>
                Your password has been changed successfully. You can now sign in to your account with your new credentials.
              </p>
              <Link href="/auth/login" className={`btn btn-primary ${styles.submitBtn}`}>
                Proceed to Sign In →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
