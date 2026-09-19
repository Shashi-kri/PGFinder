'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { listingsApi } from '@/lib/api';
import PhotoUploader, { type UploadedPhoto } from '@/components/PhotoUploader';
import styles from './page.module.css';

const TYPES = ['pg', 'flat', 'flatmate', 'mess'];
const FOOD_OPTIONS = ['veg', 'nonveg', 'jain', 'any', 'none'];
const AMENITIES = ['wifi', 'ac', 'parking', 'laundry', 'gym', 'security', 'power_backup', 'water_supply', 'meals_included', 'furnished'];
const TOTAL_STEPS = 4;
const STEP_LABELS = ['Basic Info', 'Location', 'Amenities', 'Photos'];

export default function NewListingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [form, setForm] = useState({
    type: 'pg', title: '', description: '',
    rent: '', deposit: '', food_type: 'any',
    address: '', city: 'New Delhi',
    latitude: '28.6315', longitude: '77.2167',
    amenities: {} as Record<string, boolean>,
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleAmenity = (a: string) =>
    setForm((f) => ({ ...f, amenities: { ...f.amenities, [a]: !f.amenities[a] } }));

  const handleSubmit = async () => {
    if (!user) { router.push('/auth/login'); return; }
    setSubmitting(true); setError('');
    try {
      // 1. Create the listing record
      const { listing } = await listingsApi.create({
        type: form.type as 'pg' | 'flat' | 'flatmate' | 'mess',
        title: form.title, description: form.description || undefined,
        rent: Number(form.rent), deposit: Number(form.deposit) || undefined,
        food_type: form.food_type as any,
        address: form.address, city: form.city,
        latitude: Number(form.latitude), longitude: Number(form.longitude),
        amenities: form.amenities,
      });

      // 2. Attach photos if any were uploaded
      if (photos.length > 0) {
        await listingsApi.addMedia(
          listing.id,
          photos.map((p, i) => ({ url: p.url, kind: 'photo', position: i }))
        );
      }

      router.push(`/listings/${listing.id}`);
    } catch (err: any) {
      setError(err.message ?? 'Failed to create listing');
      setSubmitting(false);
    }
  };

  if (!loading && !user) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <h2 style={{ fontSize: 24, color: 'var(--text)', marginBottom: 12 }}>Sign in required</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>You need an account to post a listing</p>
        <Link href="/auth/login" className="btn btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Page Hero */}
      <div className={styles.pageHero}>
        <div className="container">
          <span className={styles.heroEyebrow}>Post Listing</span>
          <h1 className={styles.heroTitle}>Post a New Listing</h1>
          <p className={styles.heroSub}>Step {step} of {TOTAL_STEPS} — {STEP_LABELS[step - 1]}</p>
        </div>
      </div>

      <div className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <Link href="/dashboard" className={styles.back}>← Back to Dashboard</Link>

        {/* Progress */}
        <div className={styles.progress}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div key={s} className={`${styles.step} ${step >= s ? styles.stepDone : ''}`}>
              <div className={styles.stepDot}>{step > s ? '✓' : s}</div>
              <span className={styles.stepLabel}>{STEP_LABELS[s - 1]}</span>
            </div>
          ))}
        </div>

        <div className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          {/* ── Step 1: Basic Info ── */}
          {step === 1 && (
            <div className={styles.fields}>
              <h2 className={styles.stepTitle}>Basic Information</h2>

              <div className={styles.field}>
                <label className={styles.label}>Property Type</label>
                <div className={styles.typeGrid}>
                  {TYPES.map((t) => (
                    <button key={t} type="button"
                      className={`${styles.typeBtn} ${form.type === t ? styles.typeBtnActive : ''}`}
                      onClick={() => setForm((f) => ({ ...f, type: t }))}>
                      {t === 'pg' ? '🏠' : t === 'flat' ? '🏢' : t === 'flatmate' ? '👥' : '🍱'} {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Listing Title</label>
                <input className="input" placeholder="e.g. Cozy PG near Metro Station"
                  value={form.title} onChange={set('title')} />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea className="input" rows={4} placeholder="Describe your property..."
                  value={form.description} onChange={set('description')} />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Monthly Rent (₹)</label>
                  <input className="input" type="number" placeholder="8000"
                    value={form.rent} onChange={set('rent')} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Security Deposit (₹)</label>
                  <input className="input" type="number" placeholder="16000"
                    value={form.deposit} onChange={set('deposit')} />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Food Option</label>
                <select className="input" value={form.food_type} onChange={set('food_type')}>
                  {FOOD_OPTIONS.map((f) => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                </select>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setStep(2)} disabled={!form.title || !form.rent}>
                Next: Location →
              </button>
            </div>
          )}

          {/* ── Step 2: Location ── */}
          {step === 2 && (
            <div className={styles.fields}>
              <h2 className={styles.stepTitle}>Location Details</h2>

              <div className={styles.field}>
                <label className={styles.label}>Full Address</label>
                <input className="input" placeholder="e.g. B-12, Karol Bagh"
                  value={form.address} onChange={set('address')} />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>City</label>
                <input className="input" placeholder="New Delhi"
                  value={form.city} onChange={set('city')} />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Latitude</label>
                  <input className="input" type="number" step="any" value={form.latitude} onChange={set('latitude')} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Longitude</label>
                  <input className="input" type="number" step="any" value={form.longitude} onChange={set('longitude')} />
                </div>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>
                💡 Tip: Search your address on Google Maps, right-click → copy coordinates
              </p>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-outline" onClick={() => setStep(1)} style={{ flex: 1, justifyContent: 'center' }}>← Back</button>
                <button className="btn btn-primary" onClick={() => setStep(3)}
                  style={{ flex: 1, justifyContent: 'center' }} disabled={!form.address || !form.city}>
                  Next: Amenities →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Amenities ── */}
          {step === 3 && (
            <div className={styles.fields}>
              <h2 className={styles.stepTitle}>Amenities</h2>
              <div className={styles.amenitiesGrid}>
                {AMENITIES.map((a) => (
                  <button key={a} type="button"
                    className={`${styles.amenityBtn} ${form.amenities[a] ? styles.amenityActive : ''}`}
                    onClick={() => toggleAmenity(a)}>
                    {form.amenities[a] ? '✓' : '+'} {a.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-outline" onClick={() => setStep(2)} style={{ flex: 1, justifyContent: 'center' }}>← Back</button>
                <button className="btn btn-primary" onClick={() => setStep(4)}
                  style={{ flex: 1, justifyContent: 'center' }}>
                  Next: Photos →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Photos ── */}
          {step === 4 && (
            <div className={styles.fields}>
              <h2 className={styles.stepTitle}>Add Photos</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: -8 }}>
                Great photos get 3× more inquiries. The first photo appears on the listing card.
              </p>

              <PhotoUploader
                folder={`listings/${user?.id}`}
                maxPhotos={8}
                initialPhotos={photos}
                onChange={setPhotos}
                label="Upload Listing Photos"
              />

              {/* Summary */}
              <div className={styles.preview}>
                <h3 className={styles.previewTitle}>📋 Listing Summary</h3>
                <p><strong>{form.title}</strong></p>
                <p>Type: {form.type} • Rent: ₹{Number(form.rent).toLocaleString()}/mo</p>
                <p>📍 {form.address}, {form.city}</p>
                <p>Amenities: {Object.keys(form.amenities).filter((k) => form.amenities[k]).join(', ') || 'None'}</p>
                <p>Photos: {photos.length > 0 ? `${photos.length} photo${photos.length > 1 ? 's' : ''} ready` : 'None (you can add later)'}</p>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-outline" onClick={() => setStep(3)} style={{ flex: 1, justifyContent: 'center' }}>← Back</button>
                <button className="btn btn-primary" onClick={handleSubmit}
                  style={{ flex: 1, justifyContent: 'center' }} disabled={submitting}>
                  {submitting ? 'Publishing...' : '🚀 Publish Listing'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
