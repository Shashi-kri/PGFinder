'use client';
import { useState } from 'react';
import type { Listing } from '@/lib/api';
import { favoritesApi } from '@/lib/api';
import styles from './ContactBar.module.css';

export default function ContactBar({ listing }: { listing: Listing }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const rawPhone = listing.owner?.phone ?? listing.owner_phone;
  const digitsOnly = rawPhone ? rawPhone.replace(/\D/g, '') : null;
  const phone = rawPhone;
  const waPhone = digitsOnly ? (digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly) : null;
  const waLink = waPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(`Hi, I'm interested in your listing: ${listing.title}`)}` : null;

  const toggleSave = async () => {
    setSaving(true);
    try {
      if (saved) { await favoritesApi.remove(listing.id); setSaved(false); }
      else { await favoritesApi.add(listing.id); setSaved(true); }
    } catch { alert('Please sign in to save listings'); }
    finally { setSaving(false); }
  };

  return (
    <div className={styles.bar}>
      {phone && (
        <a href={`tel:${phone}`} className={`btn btn-primary ${styles.cta}`}>
          📞 Call Owner
        </a>
      )}
      {waLink && (
        <a href={waLink} target="_blank" rel="noreferrer" className={`btn ${styles.waBtn}`}>
          💬 WhatsApp
        </a>
      )}
      {!phone && (
        <div className={styles.noContact}>Contact details visible after sign in</div>
      )}
      <button onClick={toggleSave} disabled={saving} className={`btn btn-outline ${styles.saveBtn} ${saved ? styles.saved : ''}`}>
        {saved ? '❤️ Saved' : '🤍 Save'}
      </button>
      <p className={styles.note}>🔒 No brokerage. Direct contact with owner.</p>
    </div>
  );
}
