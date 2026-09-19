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
  owner_id?: string;
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
  rules?: Record<string, boolean>;
  availability?: 'available' | 'filled' | 'paused' | 'unavailable' | string;
  owner?: {
    id: string;
    name?: string;
    phone?: string;
    verified?: boolean;
    verification_type?: string;
  };
  owner_name?: string;
  owner_phone?: string;
  photos?: { url: string; kind: string }[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photo_url?: string;
  role: 'seeker' | 'owner' | 'admin';
}

export interface AuthResponse { token: string; user: AuthUser; }

// ---- Auth ----
export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string, phone?: string, role?: string) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST', body: JSON.stringify({ name, email, password, phone, role }),
    }),

  me: () => request<{ user: AuthUser }>('/api/auth/me'),

  updateMe: (data: { name?: string; phone?: string; photo_url?: string }) =>
    request<{ user: AuthUser }>('/api/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),

  forgotPassword: (identifier: string) =>
    request<{ success: boolean; message: string; target: string; debug_code?: string }>('/api/auth/forgot-password', {
      method: 'POST', body: JSON.stringify({ identifier }),
    }),

  verifyOtp: (identifier: string, code: string) =>
    request<{ valid: boolean }>('/api/auth/verify-otp', {
      method: 'POST', body: JSON.stringify({ identifier, code }),
    }),

  resetPassword: (identifier: string, code: string, newPassword: string) =>
    request<{ success: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST', body: JSON.stringify({ identifier, code, newPassword }),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST', body: JSON.stringify({ currentPassword, newPassword }),
    }),
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

  getMine: () =>
    request<{ listings: Listing[]; total: number }>('/api/listings/mine'),

  getById: (id: string) =>
    request<{ listing: Listing }>(`/api/listings/${id}`),

  create: (data: Partial<Listing>) =>
    request<{ listing: Listing }>('/api/listings', { method: 'POST', body: JSON.stringify(data) }),

  addMedia: (listingId: string, media: { url: string; kind?: string }[]) =>
    request<{ media: { id: string; url: string; kind: string }[] }>(`/api/listings/${listingId}/media`, {
      method: 'POST', body: JSON.stringify({ media }),
    }),

  update: (id: string, data: Partial<Listing>) =>
    request<{ listing: Listing }>(`/api/listings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request(`/api/listings/${id}`, { method: 'DELETE' }),
};


// ---- Favorites ----
export const favoritesApi = {
  get: () => request<{ favorites: Listing[] }>('/api/favorites'),
  add: (id: string) => request(`/api/favorites/${id}`, { method: 'POST' }),
  remove: (id: string) => request(`/api/favorites/${id}`, { method: 'DELETE' }),
};

// ---- Media ----
export interface SignUploadResponse {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
  folder?: string;
  upload_url: string;
  upload_preset?: string;
}

export const mediaApi = {
  signUpload: (folder: string) =>
    request<SignUploadResponse>('/api/media/sign-upload', {
      method: 'POST',
      body: JSON.stringify({ folder }),
    }),
};

// ---- Reviews ----
export interface Review {
  id: string;
  listing_id: string;
  author_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  author_name?: string;
  author_photo?: string;
}

export const reviewsApi = {
  getForListing: (listingId: string) =>
    request<{ reviews: Review[]; count: number }>(`/api/listings/${listingId}/reviews`),
  add: (listingId: string, rating: number, comment?: string) =>
    request<{ review: Review }>(`/api/listings/${listingId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    }),
};

// ---- Seeker Profile ----
export interface SeekerProfile {
  user_id?: string;
  food_pref: 'veg' | 'nonveg' | 'jain' | 'any';
  sleep_schedule: 'early' | 'late' | 'flexible';
  cleanliness: number;
  smoking: boolean;
  drinking: boolean;
  guests_freq: 'rare' | 'sometimes' | 'often';
  gender_pref: 'male' | 'female' | 'any';
  budget_min: number;
  budget_max: number;
  occupation?: string | null;
  updated_at?: string;
}

export const seekerProfileApi = {
  get: async (): Promise<SeekerProfile | null> => {
    try {
      const res = await request<{ profile: SeekerProfile }>('/api/seeker-profile/me');
      return res.profile;
    } catch (err: any) {
      if (err?.message?.includes('404') || err?.message?.includes('not found') || err?.message?.includes('Not found')) {
        return null;
      }
      throw err;
    }
  },
  save: (data: SeekerProfile) =>
    request<{ profile: SeekerProfile }>('/api/seeker-profile/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ---- Flatmate Matches ----
export interface FlatmateMatch {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  rent: number;
  deposit?: number;
  food_type?: string;
  address?: string;
  city?: string;
  latitude: number;
  longitude: number;
  dist_m: number;
  owner: {
    id: string;
    name: string;
    phone?: string;
    verified: boolean;
    verification_type: string;
  };
  compatibility_score: number;
  top_matching_factors: string[];
  clashing_factors: string[];
}

export const flatmatesApi = {
  getMatches: (params: { lat?: number; lng?: number; radius_meters?: number; min_score?: number } = {}) => {
    const q = new URLSearchParams();
    q.set('lat', String(params.lat ?? 28.6315));
    q.set('lng', String(params.lng ?? 77.2167));
    q.set('radius_meters', String(params.radius_meters ?? 50000));
    if (params.min_score !== undefined) q.set('min_score', String(params.min_score));
    return request<{ count: number; total_eligible: number; results: FlatmateMatch[] }>(`/api/flatmates/matches?${q}`);
  },
};

