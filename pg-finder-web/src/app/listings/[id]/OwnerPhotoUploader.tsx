'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { listingsApi, type Listing } from '@/lib/api';
import PhotoUploader, { type UploadedPhoto } from '@/components/PhotoUploader';
import styles from './OwnerPhotoUploader.module.css';

interface Props {
  listing: Listing;
}

export default function OwnerPhotoUploader({ listing }: Props) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Only show to the listing owner
  const ownerId = (listing as any).owner_id;
  if (!user || (ownerId && user.id !== ownerId)) return null;

  const existingCount = (listing.photos ?? []).length;
  const slotsLeft = Math.max(0, 8 - existingCount);

  const handleSave = async () => {
    if (!photos.length) return;
    setSaving(true);
    setError('');
    try {
      await listingsApi.addMedia(listing.id, photos.map(p => ({ url: p.url, kind: 'photo' })));
      setSaved(true);
      setPhotos([]);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message ?? 'Failed to save photos');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.ownerBadge}>👤 You own this listing</span>
        <h3 className={styles.title}>📷 Add Photos</h3>
        <p className={styles.sub}>
          {existingCount} photo{existingCount !== 1 ? 's' : ''} uploaded · {slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} remaining
        </p>
      </div>

      {saved && <p className={styles.success}>✅ Photos added to your listing!</p>}
      {error && <p className={styles.error}>{error}</p>}

      {slotsLeft > 0 ? (
        <>
          <PhotoUploader
            folder={`listings/${listing.id}`}
            initialPhotos={[]}
            onChange={setPhotos}
            label="Upload Photos"
            maxPhotos={slotsLeft}
          />
          {photos.length > 0 && (
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{ marginTop: 12 }}
            >
              {saving ? 'Saving...' : `Save ${photos.length} Photo${photos.length > 1 ? 's' : ''} →`}
            </button>
          )}
        </>
      ) : (
        <p className={styles.limitMsg}>Maximum 8 photos reached. Remove some to add more.</p>
      )}
    </div>
  );
}
