'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './HeroSearch.module.css';

const TYPES = [
  { value: '', label: 'All Types' },
  { value: 'pg', label: 'PG' },
  { value: 'flat', label: 'Flat' },
  { value: 'flatmate', label: 'Flatmate' },
  { value: 'mess', label: 'Mess' },
];

export default function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (type) params.set('type', type);
    router.push(`/listings?${params.toString()}`);
  };

  return (
    <form className={styles.searchBox} onSubmit={handleSearch}>
      <div className={styles.inputGroup}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search by area, landmark or city..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <select
        className={styles.typeSelect}
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        {TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      <button type="submit" className={styles.searchBtn}>
        Find Now
      </button>
    </form>
  );
}
