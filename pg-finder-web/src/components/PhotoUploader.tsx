'use client';
import { useState, useRef, useCallback } from 'react';
import { mediaApi, type SignUploadResponse } from '@/lib/api';
import styles from './PhotoUploader.module.css';

export interface UploadedPhoto {
  url: string;
  publicId: string;
}

interface Props {
  /** Folder path inside Cloudinary (e.g. "listings/abc" or "avatars/xyz") */
  folder: string;
  /** Maximum number of photos allowed */
  maxPhotos?: number;
  /** Already-uploaded photos to show initially */
  initialPhotos?: UploadedPhoto[];
  onChange?: (photos: UploadedPhoto[]) => void;
  /** If true, only allow 1 image (for profile avatars) */
  singlePhoto?: boolean;
  label?: string;
}

async function uploadToCloudinary(file: File, signData: SignUploadResponse): Promise<UploadedPhoto> {
  if (!signData.cloud_name || !signData.api_key) {
    throw new Error('Cloudinary credentials are not configured in backend .env');
  }

  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', signData.api_key);
  fd.append('timestamp', String(signData.timestamp));
  fd.append('signature', signData.signature);
  if (signData.folder) {
    fd.append('folder', signData.folder);
  }

  const uploadUrl = signData.upload_url || `https://api.cloudinary.com/v1_1/${signData.cloud_name}/auto/upload`;
  const res = await fetch(uploadUrl, { method: 'POST', body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `Upload to Cloudinary failed (${res.status})`);
  }
  const data = await res.json();
  return { url: data.secure_url, publicId: data.public_id };
}


export default function PhotoUploader({
  folder,
  maxPhotos = 8,
  initialPhotos = [],
  onChange,
  singlePhoto = false,
  label = 'Add Photos',
}: Props) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>(initialPhotos);
  const [uploading, setUploading] = useState<string[]>([]); // filenames being uploaded
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const limit = singlePhoto ? 1 : maxPhotos;

  const processFiles = useCallback(async (files: File[]) => {
    const allowed = files.filter(f => f.type.startsWith('image/'));
    if (allowed.length === 0) return;

    const slotsLeft = limit - photos.length;
    const toUpload = allowed.slice(0, slotsLeft);
    if (toUpload.length === 0) return;

    setErrors([]);
    setUploading(toUpload.map(f => f.name));

    try {
      const signData = await mediaApi.signUpload(folder);

      const results = await Promise.allSettled(
        toUpload.map(f => uploadToCloudinary(f, signData))
      );

      const newPhotos: UploadedPhoto[] = [];
      const newErrors: string[] = [];

      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          if (singlePhoto) {
            newPhotos.splice(0, newPhotos.length, r.value);
          } else {
            newPhotos.push(r.value);
          }
        } else {
          newErrors.push(`${toUpload[i].name}: ${r.reason?.message ?? 'Upload failed'}`);
        }
      });

      const updated = singlePhoto ? newPhotos : [...photos, ...newPhotos];
      setPhotos(updated);
      onChange?.(updated);
      if (newErrors.length) setErrors(newErrors);
    } catch (e: any) {
      setErrors([e.message ?? 'Upload failed']);
    } finally {
      setUploading([]);
    }
  }, [photos, folder, limit, singlePhoto, onChange]);

  const removePhoto = (idx: number) => {
    const updated = photos.filter((_, i) => i !== idx);
    setPhotos(updated);
    onChange?.(updated);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    processFiles(files);
    e.target.value = ''; // reset so same file can be re-selected
  };

  const canAdd = photos.length < limit && uploading.length === 0;

  return (
    <div className={styles.root}>
      {/* Photo grid */}
      {photos.length > 0 && (
        <div className={`${styles.grid} ${singlePhoto ? styles.gridSingle : ''}`}>
          {photos.map((p, i) => (
            <div key={p.publicId || i} className={styles.thumb}>
              <img src={p.url} alt={`Photo ${i + 1}`} className={styles.thumbImg} />
              {i === 0 && !singlePhoto && (
                <span className={styles.coverBadge}>Cover</span>
              )}
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removePhoto(i)}
                title="Remove photo"
              >
                ✕
              </button>
            </div>
          ))}

          {/* Uploading placeholders */}
          {uploading.map((name) => (
            <div key={name} className={`${styles.thumb} ${styles.thumbUploading}`}>
              <div className={styles.uploadSpinner} />
              <span className={styles.uploadingName}>{name.substring(0, 12)}…</span>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone — only shown when more photos can be added */}
      {canAdd && (
        <div
          className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <span className={styles.dropIcon}>📸</span>
          <p className={styles.dropLabel}>{label}</p>
          <p className={styles.dropSub}>
            {singlePhoto
              ? 'Click or drag to upload an image'
              : `Click or drag to upload · Up to ${limit} photos`}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={!singlePhoto}
            className={styles.hiddenInput}
            onChange={onFileChange}
          />
        </div>
      )}

      {/* Upload in-progress (no grid yet) */}
      {photos.length === 0 && uploading.length > 0 && (
        <div className={`${styles.dropzone} ${styles.uploading}`}>
          <div className={styles.uploadSpinner} />
          <p className={styles.dropLabel}>Uploading {uploading.length} photo{uploading.length > 1 ? 's' : ''}…</p>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className={styles.errorBox}>
          {errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}

      {/* Helper text */}
      {!singlePhoto && photos.length > 0 && (
        <p className={styles.helperText}>
          📌 First photo is the cover shown on listing cards.
          {photos.length < limit && ` ${limit - photos.length} more slot${limit - photos.length > 1 ? 's' : ''} remaining.`}
        </p>
      )}
    </div>
  );
}
