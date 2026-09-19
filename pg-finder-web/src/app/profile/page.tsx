'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { authApi, mediaApi } from '@/lib/api';
import styles from './page.module.css';

export default function ProfilePage() {
  const { user, loading, logout, refreshUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  useEffect(() => {
    if (!loading && !user) { router.push('/auth/login'); return; }
    if (user) {
      setName(user.name ?? '');
      setPhone(user.phone ?? '');
      setPhotoUrl(user.photo_url ?? null);
    }
  }, [user, loading, router]);

  const handleLogout = () => { logout(); router.push('/'); };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!currentPassword || !newPassword) {
      setPwdError('Please enter both current and new passwords.');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPwdSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdSuccess(''), 4000);
    } catch (err: any) {
      setPwdError(err?.message ?? 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  /** Upload a new avatar photo directly via Cloudinary sign → upload */
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const signData = await mediaApi.signUpload(`avatars/${user?.id}`);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', signData.api_key);
      fd.append('timestamp', String(signData.timestamp));
      fd.append('signature', signData.signature);
      if (signData.folder) fd.append('folder', signData.folder);
      const uploadUrl = signData.upload_url || `https://api.cloudinary.com/v1_1/${signData.cloud_name}/auto/upload`;
      const res = await fetch(uploadUrl, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const newUrl: string = data.secure_url;
      setPhotoUrl(newUrl);
      // Also save immediately
      await authApi.updateMe({ photo_url: newUrl });
      refreshUser?.();
      setSuccess('Profile photo updated!');
    } catch (err: any) {
      setError(err.message ?? 'Photo upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      await authApi.updateMe({
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        photo_url: photoUrl || undefined,
      });
      refreshUser?.();
      setSuccess('Profile updated successfully!');
    } catch (e: any) {
      setError(e.message ?? 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>Loading...</div>
  );

  return (
    <div className={styles.page}>
      {/* Page Hero */}
      <div className={styles.pageHero}>
        <div className="container">
          <span className={styles.heroEyebrow}>Account</span>
          <h1 className={styles.heroTitle}>My Profile</h1>
          <p className={styles.heroSub}>Manage your account details and preferences</p>
        </div>
      </div>

      <div className={`container ${styles.inner}`}>
        <div style={{ marginTop: 32 }}>
          <Link href="/dashboard" className={styles.back}>← Dashboard</Link>
        </div>

        {/* Avatar Card — single photo with camera overlay */}
        <div className={styles.avatarCard}>
          <div className={styles.avatarWrap}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={handleAvatarChange}
            />

            {/* Avatar image or initial */}
            {photoUrl ? (
              <img src={photoUrl} alt="Profile photo" className={styles.avatarPhoto} />
            ) : (
              <div className={styles.avatarCircle}>
                {user?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}

            {/* Camera overlay button */}
            <button
              type="button"
              className={styles.cameraBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Change profile photo"
            >
              {uploading ? (
                <span className={styles.uploadingSpinner} />
              ) : (
                <span className={styles.cameraIcon}>📷</span>
              )}
            </button>
          </div>

          <div className={styles.avatarInfo}>
            <p className={styles.avatarName}>{user?.name}</p>
            <p className={styles.avatarEmail}>{user?.email}</p>
            <span className="badge badge-purple">{user?.role}</span>
            <button
              type="button"
              className={styles.changePhotoBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : '📷 Change Photo'}
            </button>
          </div>
        </div>

        {/* Info form */}
        <div className={styles.form}>
          <h2 className={styles.sectionTitle}>Account Information</h2>

          {success && <div className={styles.success}>{success}</div>}
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.label}>Full Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email Address</label>
            <input className="input" value={user?.email ?? ''} disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            <p className={styles.hint}>Email cannot be changed</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Phone Number</label>
            <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
          </div>

          <div className={styles.actions}>
            <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Change Password Form */}
        <div className={styles.form} style={{ marginTop: '1.5rem' }}>
          <h2 className={styles.sectionTitle}>Security & Password</h2>
          {pwdSuccess && <div className={styles.success}>{pwdSuccess}</div>}
          {pwdError && <div className={styles.error}>{pwdError}</div>}

          <form onSubmit={handleChangePassword}>
            <div className={styles.field}>
              <label className={styles.label}>Current Password</label>
              <input
                type="password"
                className="input"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>New Password</label>
              <input
                type="password"
                className="input"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Confirm New Password</label>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
            </div>

            <div className={styles.actions}>
              <button
                type="submit"
                className="btn btn-outline"
                disabled={changingPassword || !currentPassword || !newPassword}
              >
                {changingPassword ? 'Updating...' : '🔒 Change Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Quick links */}
        <div className={styles.quickLinks}>
          <Link href="/profile/seeker" className={styles.quickLink}>
            <div className={styles.quickLinkIcon}>🤝</div>
            Seeker Profile
          </Link>
          <Link href="/matches" className={styles.quickLink}>
            <div className={styles.quickLinkIcon}>✨</div>
            Flatmate Matches
          </Link>
          <Link href="/dashboard" className={styles.quickLink}>
            <div className={styles.quickLinkIcon}>🏠</div>
            My Listings
          </Link>
          <Link href="/saved" className={styles.quickLink}>
            <div className={styles.quickLinkIcon}>❤️</div>
            Saved Places
          </Link>
        </div>

        {/* Danger zone */}
        <div className={styles.dangerZone}>
          <h3 className={styles.dangerTitle}>Sign Out</h3>
          <p className={styles.dangerDesc}>You will be logged out of your account on this device.</p>
          <button className="btn btn-outline" onClick={handleLogout} style={{ color: 'var(--red)', borderColor: 'var(--red)' }}>
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
