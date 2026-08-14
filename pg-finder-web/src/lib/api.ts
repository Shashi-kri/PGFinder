// src/lib/api.ts
// Shared API client for the PG-Finder backend.
// Works in both server components (SSR) and client components.

// On the server (SSR/RSC) we hit the backend directly.
// In the browser we go through the Next.js proxy rewrite (/api/... → backend)
// so there are no cross-origin or localhost connectivity issues.
const API_BASE =
  typeof window === 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001')
    : '';

let _token: string | null = null;
export function setToken(t: string | null) { _token = t; }

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ---- Types ----
export interface Listing {
  id: string;
  type: 'pg' | 'flat' | 'flatmate' | 'mess';
  title: string;
  description?: string;
  rent: number;
  deposit?: number;
  food_type?: string;
  address?: string;
  city?: string;
  latitude: number;
  longitude: number;
  distance_m?: number;
  avg_rating?: number;
  review_count?: number;
  amenities?: Record<string, boolean>;
  owner_name?: string;
  owner_phone?: string;
  photos?: { url: string; kind: string }[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'seeker' | 'owner' | 'admin';
}

export interface AuthResponse { token: string; user: AuthUser; }

// ---- Auth ----
export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string, phone?: string) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST', body: JSON.stringify({ name, email, password, phone }),
    }),

  me: () => request<{ user: AuthUser }>('/api/auth/me'),
};

// ---- Listings ----
export interface SearchParams {
  lat?: number; lng?: number;
  type?: string; food_type?: string;
  min_rent?: number; max_rent?: number;
  radius_meters?: number;
  limit?: number; offset?: number;
  city?: string;
}

export const listingsApi = {
  search: async (params: SearchParams = {}) => {
    const q = new URLSearchParams();
    // Default to New Delhi if no coords
    q.set('lat', String(params.lat ?? 28.6315));
    q.set('lng', String(params.lng ?? 77.2167));
    q.set('radius_meters', String(params.radius_meters ?? 50000));
    if (params.type) q.set('type', params.type);
    if (params.food_type) q.set('food_type', params.food_type);
    if (params.min_rent) q.set('min_rent', String(params.min_rent));
    if (params.max_rent) q.set('max_rent', String(params.max_rent));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.offset) q.set('offset', String(params.offset));
    const data = await request<{ results: Listing[]; count: number }>(`/api/listings/search?${q}`);
    // Normalise the backend shape { results, count } → { listings, total }
    return { listings: data.results ?? [], total: data.count ?? 0 };
  },

  getById: (id: string) =>
    request<{ listing: Listing }>(`/api/listings/${id}`),

  create: (data: Partial<Listing>) =>
    request<{ listing: Listing }>('/api/listings', { method: 'POST', body: JSON.stringify(data) }),
};

// ---- Favorites ----
export const favoritesApi = {
  get: () => request<{ favorites: Listing[] }>('/api/favorites'),
  add: (id: string) => request(`/api/favorites/${id}`, { method: 'POST' }),
  remove: (id: string) => request(`/api/favorites/${id}`, { method: 'DELETE' }),
};
