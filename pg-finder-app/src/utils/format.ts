// src/utils/format.ts
import type { FoodType } from '../types';

/** Meters -> "1.2 km" (or "800 m" under 1km). */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** 12000 -> "₹12,000". Uses Indian digit grouping. */
export function formatRent(rent: number): string {
  return `₹${rent.toLocaleString('en-IN')}`;
}

export const FOOD_LABEL: Record<FoodType, string> = {
  veg: 'Veg',
  nonveg: 'Non-veg',
  jain: 'Jain',
  any: 'Any',
  none: 'No mess',
};

/** Pick the first photo, else the first media of any kind, else null. */
export function heroImageUrl(
  media?: { url: string; kind: string }[]
): string | null {
  if (!media?.length) return null;
  const photo = media.find((m) => m.kind === 'photo');
  return (photo ?? media[0]).url;
}
