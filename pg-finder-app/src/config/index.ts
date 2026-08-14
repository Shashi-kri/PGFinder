// src/config/index.ts
// Central config. In Expo, public runtime values come from app.config /
// EXPO_PUBLIC_* env vars. Fallback to localhost for dev.
//
// NOTE for physical devices: 'localhost' points at the phone, not your machine.
// Set EXPO_PUBLIC_API_URL to your LAN IP (e.g. http://192.168.1.5:3000).

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.5.178:3000';

// Default search radius (meters) when the user hasn't changed it.
export const DEFAULT_RADIUS_M = 5000;

// Fallback map center if we can't get the user's location (Bengaluru).
export const FALLBACK_COORDS = { latitude: 12.9716, longitude: 77.5946 };
