// src/hooks/useLocation.ts
// Requests foreground location once and returns coords, with a graceful
// fallback so the app still works if permission is denied.

import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { FALLBACK_COORDS } from '../config';

export interface Coords {
  latitude: number;
  longitude: number;
}

interface State {
  coords: Coords;
  loading: boolean;
  /** true when we fell back because permission was denied or lookup failed. */
  isFallback: boolean;
  error: string | null;
}

export function useLocation(): State {
  const [state, setState] = useState<State>({
    coords: FALLBACK_COORDS,
    loading: true,
    isFallback: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled)
            setState({
              coords: FALLBACK_COORDS,
              loading: false,
              isFallback: true,
              error: 'Location permission denied',
            });
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled)
          setState({
            coords: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            },
            loading: false,
            isFallback: false,
            error: null,
          });
      } catch (e) {
        if (!cancelled)
          setState({
            coords: FALLBACK_COORDS,
            loading: false,
            isFallback: true,
            error: 'Could not get location',
          });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
