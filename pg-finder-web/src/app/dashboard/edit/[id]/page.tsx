'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { listingsApi, type Listing } from '@/lib/api';
import PhotoUploader, { type UploadedPhoto } from '@/components/PhotoUploader';
import styles from '../../new/page.module.css'; // reuse the same form styles

const TYPES = ['pg', 'flat', 'flatmate', 'mess'];
const FOOD_OPTIONS = ['veg', 'nonveg', 'jain', 'any', 'none'];
const AMENITIES = ['wifi', 'ac', 'parking', 'laundry', 'gym', 'security', 'power_backup', 'water_supply', 'meals_included', 'furnished'];
const TOTAL_STEPS = 3; // No photos step on edit (photos managed in dashboard)
const STEP_LABELS = ['Basic Info', 'Location', 'Amenities'];

interface Props { params: Promise<{ id: string }>; }

export default function EditListingPage({ params }: Props) {
  const { id } = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    type: 'pg', title: '', description: '',
    rent: '', deposit: '', food_type: 'any',
    address: '', city: '',
    latitude: '', longitude: '',
    amenities: {} as Record<string, boolean>,
    availability: 'available',
  });

  // Load existing listing
  useEffect(() => {
    if (!id) return;
    listingsApi.getById(id)
      .then(({ listing }) => {
        const raw = listing as any;
        // 403 guard — redirect if not owner
        if (user && raw.owner_id !== user.id && raw.owner?.id !== user.id) {
          router.push('/dashboard');
          return;
        }
        setForm({
          type:         raw.type       ?? 'pg',
          title:        raw.title      ?? '',
          description:  raw.description ?? '',
          rent:         String(raw.rent ?? ''),
          deposit:      String(raw.deposit ?? ''),
          food_type:    raw.food_type  ?? 'any',
          address:      raw.address    ?? '',
          city:         raw.city       ?? '',
          latitude:     String(raw.latitude  ?? ''),
          longitude:    String(raw.longitude ?? ''),
          amenities:    (raw.amenities ?? {}) as Record<string, boolean>,
          availability: raw.availability ?? 'available',
        });
      })
      .catch(() => router.push('/dashboard'))
      .finally(() => setFetching(false));
  }, [id, user, router]);

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const toggleAmenity = (a: string) =>
    setForm(f => ({ ...f, amenities: { ...f.amenities, [a]: !f.amenities[a] } }));

  const handleSubmit = async () => {
    if (!user) { router.push('/auth/login'); return; }
    setSubmitting(true); setError('');
    try {
      await listingsApi.update(id, {
        type:        form.type as any,
        title:       form.title,
        description: form.description || undefined,
        rent:        Number(form.rent),
        deposit:     Number(form.deposit) || undefined,
        food_type:   form.food_type as any,
        address:     form.address,
        city:        form.city,
        latitude:    Number(form.latitude),
        longitude:   Number(form.longitude),
        amenities:   form.amenities,
        availability: form.availability as any,
      });
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: any) {
      setError(err.message ?? 'Failed to update listing');
      setSubmitting(false);
    }
  };

  if (loading || fetching) return (
    <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 32 }}>⏳</div>
      <p style={{ marginTop: 12 }}>Loading listing…</p>
    </div>
  );

  if (!user) return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <h2 style={{ fontSize: 24, color: 'var(--text)', marginBottom: 12 }}>Sign in required</h2>
      <Link href="/auth/login" className="btn btn-primary">Sign In</Link>
    </div>
  );

  return (
    <div>
      {/* Page Hero */}
      <div className={styles.pageHero}>
        <div className="container">
          <span className={styles.heroEyebrow}>Edit Listing</span>
          <h1 className={styles.heroTitle}>Update Your Listing</h1>
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
            {error   && <div className={styles.error}>{error}</div>}
            {success && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 14 }}>
                ✅ Listing updated! Redirecting…
              </div>
            )}

            {/* ── Step 1: Basic Info ── */}
            {step === 1 && (
              <div className={styles.fields}>
                <h2 className={styles.stepTitle}>Basic Information</h2>

                <div className={styles.field}>
                  <label className={styles.label}>Property Type</label>
                  <div className={styles.typeGrid}>
                    {TYPES.map(t => (
                      <button key={t} type="button"
                        className={`${styles.typeBtn} ${form.type === t ? styles.typeBtnActive : ''}`}
                        onClick={() => setForm(f => ({ ...f, type: t }))}>
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
                  <textarea className="input" rows={4} placeholder="Describe your property…"
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
                    {FOOD_OPTIONS.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Availability</label>
                  <select className="input" value={form.availability} onChange={set('availability')}>
                    <option value="available">✅ Available</option>
                    <option value="unavailable">🚫 Unavailable / Occupied</option>
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

            {/* ── Step 3: Amenities + Save ── */}
            {step === 3 && (
              <div className={styles.fields}>
                <h2 className={styles.stepTitle}>Amenities</h2>
                <div className={styles.amenitiesGrid}>
                  {AMENITIES.map(a => (
                    <button key={a} type="button"
                      className={`${styles.amenityBtn} ${form.amenities[a] ? styles.amenityActive : ''}`}
                      onClick={() => toggleAmenity(a)}>
                      {form.amenities[a] ? '✓' : '+'} {a.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>

                {/* Summary */}
                <div className={styles.preview}>
                  <h3 className={styles.previewTitle}>📋 Updated Summary</h3>
                  <p><strong>{form.title}</strong></p>
                  <p>Type: {form.type} • Rent: ₹{Number(form.rent).toLocaleString()}/mo</p>
                  <p>📍 {form.address}, {form.city}</p>
                  <p>Amenities: {Object.keys(form.amenities).filter(k => form.amenities[k]).join(', ') || 'None'}</p>
                  <p>Status: {form.availability === 'available' ? '✅ Available' : '🚫 Unavailable'}</p>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-outline" onClick={() => setStep(2)} style={{ flex: 1, justifyContent: 'center' }}>← Back</button>
                  <button className="btn btn-primary" onClick={handleSubmit}
                    style={{ flex: 1, justifyContent: 'center' }} disabled={submitting || success}>
                    {submitting ? 'Saving…' : '💾 Save Changes'}
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
