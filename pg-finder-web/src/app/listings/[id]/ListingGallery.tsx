'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { listingsApi, mediaApi, type Listing } from '@/lib/api';
import styles from './ListingGallery.module.css';

interface Props {
  listing: Listing;
}

async function uploadToCloudinary(file: File, signData: any) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', signData.api_key);
  fd.append('timestamp', String(signData.timestamp));
  fd.append('signature', signData.signature);
  if (signData.folder) fd.append('folder', signData.folder);
  const res = await fetch(signData.upload_url, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.secure_url as string;
}

export default function ListingGallery({ listing }: Props) {
  const { user } = useAuth();
  const isOwner = !!user && user.id === listing.owner_id;

  const [photos, setPhotos] = useState<string[]>(
    (listing.photos ?? []).map(p => p.url)
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [pendingUrls, setPendingUrls] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-cycle every 3.5s when multiple photos
  useEffect(() => {
    if (photos.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setActiveIdx(i => (i + 1) % photos.length);
    }, 3500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [photos.length]);

  const prev = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActiveIdx(i => (i - 1 + photos.length) % photos.length);
  };
  const next = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActiveIdx(i => (i + 1) % photos.length);
  };
  const goTo = (i: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActiveIdx(i);
  };

  const processFiles = useCallback(async (files: File[]) => {
    const images = files.filter(f => f.type.startsWith('image/'));
    if (!images.length) return;
    setUploading(true);
    setError('');
    setUploadProgress({ done: 0, total: images.length });

    try {
      const signData = await mediaApi.signUpload(`listings/${listing.id}`);
      const uploaded: string[] = [];

      for (let i = 0; i < images.length; i++) {
        const url = await uploadToCloudinary(images[i], signData);
        uploaded.push(url);
        setUploadProgress({ done: i + 1, total: images.length });
        // Show each photo as it arrives
        setPhotos(prev => {
          const next = [...prev, url];
          setActiveIdx(next.length - 1);
          return next;
        });
      }

      setPendingUrls(prev => [...prev, ...uploaded]);
    } catch (e: any) {
      setError(e.message ?? 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }, [listing.id]);

  const handleSave = async () => {
    if (!pendingUrls.length) return;
    try {
      await listingsApi.addMedia(listing.id, pendingUrls.map(url => ({ url, kind: 'photo' })));
      setPendingUrls([]);
      setSaved(true);
      setShowUploadPanel(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message ?? 'Failed to save');
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(Array.from(e.target.files ?? []));
    e.target.value = '';
  };

  // ── No photos + owner: show full upload zone ──
  if (photos.length === 0) {
    return (
      <div className={styles.galleryWrap}>
        {isOwner ? (
          <div
            className={`${styles.emptyUpload} ${dragging ? styles.dragging : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept="image/*" multiple className={styles.hiddenInput} onChange={onFileChange} />
            {uploading && uploadProgress ? (
              <>
                <div className={styles.spinner} />
                <p className={styles.uploadLabel}>Uploading {uploadProgress.done}/{uploadProgress.total}…</p>
              </>
            ) : (
              <>
                <span className={styles.uploadIcon}>📷</span>
                <p className={styles.uploadLabel}>Add photos to your listing</p>
                <p className={styles.uploadSub}>Click or drag & drop · Batch upload supported</p>
              </>
            )}
            {error && <p className={styles.errorMsg}>{error}</p>}
          </div>
        ) : (
          <div className={styles.noPhoto}>🏠</div>
        )}
      </div>
    );
  }

  // ── Has photos: full-width slideshow carousel ──
  return (
    <div className={styles.galleryWrap}>
      <div className={styles.carousel}>
        {/* Main slide */}
        <div className={styles.slideTrack}>
          {photos.map((url, i) => (
            <div
              key={url + i}
              className={`${styles.slide} ${i === activeIdx ? styles.slideActive : ''}`}
              aria-hidden={i !== activeIdx}
            >
              <img src={url} alt={`Photo ${i + 1}`} className={styles.slideImg} />
            </div>
          ))}
        </div>

        {/* Gradient overlays */}
        <div className={styles.gradLeft} />
        <div className={styles.gradRight} />

        {/* Arrows */}
        {photos.length > 1 && (
          <>
            <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={prev} aria-label="Previous photo">‹</button>
            <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={next} aria-label="Next photo">›</button>
          </>
        )}

        {/* Photo counter */}
        <div className={styles.counter}>{activeIdx + 1} / {photos.length}</div>

        {/* Owner: Add Photos button overlay */}
        {isOwner && (
          <button
            className={styles.addPhotoOverlay}
            onClick={() => setShowUploadPanel(v => !v)}
          >
            📷 {showUploadPanel ? 'Close' : 'Add Photos'}
          </button>
        )}

        {/* Dot indicators */}
        {photos.length > 1 && (
          <div className={styles.dots}>
            {photos.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === activeIdx ? styles.dotActive : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Saved toast */}
        {saved && <div className={styles.savedToast}>✅ Photos saved!</div>}
      </div>

      {/* Upload panel below carousel (owner only) */}
      {isOwner && showUploadPanel && (
        <div
          className={`${styles.uploadPanel} ${dragging ? styles.dragging : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input ref={fileInputRef} type="file" accept="image/*" multiple className={styles.hiddenInput} onChange={onFileChange} />

          {uploading && uploadProgress ? (
            <div className={styles.uploadingRow}>
              <div className={styles.spinner} />
              <span>Uploading {uploadProgress.done} of {uploadProgress.total} photos…</span>
            </div>
          ) : (
            <div className={styles.dropZone} onClick={() => fileInputRef.current?.click()}>
              <span className={styles.uploadIcon}>📸</span>
              <p className={styles.uploadLabel}>Click or drag & drop photos here</p>
              <p className={styles.uploadSub}>Batch upload supported · Up to 8 photos total</p>
            </div>
          )}

          {error && <p className={styles.errorMsg}>{error}</p>}

          {pendingUrls.length > 0 && (
            <div className={styles.pendingRow}>
              <span className={styles.pendingCount}>
                {pendingUrls.length} new photo{pendingUrls.length > 1 ? 's' : ''} ready to save
              </span>
              <button className="btn btn-primary" onClick={handleSave} style={{ fontSize: 13, padding: '8px 18px' }}>
                Save Photos →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
