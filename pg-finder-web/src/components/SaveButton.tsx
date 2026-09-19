'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { favoritesApi } from '@/lib/api';
import styles from './SaveButton.module.css';

interface Props {
  listingId: string;
  initialSaved?: boolean;
}

export default function SaveButton({ listingId, initialSaved = false }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // prevent card link navigation
    e.stopPropagation();
    setLoading(true);
    try {
      if (saved) {
        await favoritesApi.remove(listingId);
        setSaved(false);
      } else {
        await favoritesApi.add(listingId);
        setSaved(true);
      }
    } catch (err: any) {
      if (err.message?.includes('Authentication') || err.message?.includes('401')) {
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`${styles.btn} ${saved ? styles.saved : ''}`}
      onClick={toggle}
      disabled={loading}
      title={saved ? 'Remove from saved' : 'Save listing'}
      aria-label={saved ? 'Remove from saved' : 'Save listing'}
    >
      {saved ? '❤️' : '🤍'}
    </button>
  );
}
