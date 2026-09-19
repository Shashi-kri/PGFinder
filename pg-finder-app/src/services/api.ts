// src/services/api.ts
// Typed API client for the PG-Finder backend.
//
// Auth: the backend expects `Authorization: Bearer <firebase_id_token>`.
// We keep the current token in module state; call setAuthToken() after the
// user signs in (or when the Firebase token refreshes).

import axios, { AxiosError, AxiosInstance } from 'axios';
import { API_BASE_URL, DEFAULT_RADIUS_M } from '../config';
import type {
  SearchListing,
  SearchResponse,
  SearchFilters,
  ListingDetail,
  MatchesResponse,
  Media,
  MediaKind,
  SeekerProfile,
  SeekerProfileInput,
} from '../types';

let authToken: string | null = null;

/** Set (or clear) the bearer token used for authenticated requests. */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the token on every request if we have one.
client.interceptors.request.use((cfg) => {
  if (authToken) {
    cfg.headers.Authorization = `Bearer ${authToken}`;
  }
  return cfg;
});

/** Normalize errors into a predictable shape for the UI. */
export interface ApiError {
  status: number | null;
  message: string;
}

function toApiError(err: unknown): ApiError {
  const axErr = err as AxiosError<{ error?: string; errors?: string[] }>;
  if (axErr.isAxiosError) {
    const data = axErr.response?.data;
    const message =
      data?.error ??
      data?.errors?.join(', ') ??
      axErr.message ??
      'Network error';
    return { status: axErr.response?.status ?? null, message };
  }
  return { status: null, message: 'Unexpected error' };
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'seeker' | 'owner' | 'admin';
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function register(
  name: string,
  email: string,
  password: string,
  phone?: string
): Promise<AuthResponse> {
  try {
    const { data } = await client.post<AuthResponse>('/api/auth/register', {
      name, email, password, phone,
    });
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data } = await client.post<AuthResponse>('/api/auth/login', { email, password });
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function getMe(): Promise<AuthUser> {
  try {
    const { data } = await client.get<{ user: AuthUser }>('/api/auth/me');
    return data.user;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function forgotPassword(target: string): Promise<{ message: string; debug_code?: string }> {
  try {
    const { data } = await client.post<{ message: string; debug_code?: string }>('/api/auth/forgot-password', { target });
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function verifyOtp(target: string, code: string): Promise<{ valid: boolean; message: string }> {
  try {
    const { data } = await client.post<{ valid: boolean; message: string }>('/api/auth/verify-otp', { target, code });
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function resetPassword(target: string, code: string, newPassword: string): Promise<{ message: string }> {
  try {
    const { data } = await client.post<{ message: string }>('/api/auth/reset-password', {
      target,
      code,
      new_password: newPassword,
    });
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  try {
    const { data } = await client.post<{ message: string }>('/api/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

export interface SearchParams extends Partial<SearchFilters> {
  lat: number;
  lng: number;
  limit?: number;
  offset?: number;
}

/** GET /api/listings/search */
export async function searchListings(
  params: SearchParams
): Promise<SearchResponse> {
  try {
    const { data } = await client.get<SearchResponse>('/api/listings/search', {
      params: {
        lat: params.lat,
        lng: params.lng,
        radius_meters: params.radius_meters ?? DEFAULT_RADIUS_M,
        type: params.type,
        food_type: params.food_type,
        min_rent: params.min_rent,
        max_rent: params.max_rent,
        limit: params.limit,
        offset: params.offset,
      },
    });
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

/** GET /api/listings/:id */
export async function getListing(id: string): Promise<ListingDetail> {
  try {
    const { data } = await client.get<{ listing: ListingDetail }>(
      `/api/listings/${id}`
    );
    return data.listing;
  } catch (err) {
    throw toApiError(err);
  }
}

/** POST /api/listings (owner only) */
export interface CreateListingInput {
  type: 'pg' | 'flat' | 'flatmate' | 'mess';
  title: string;
  description?: string;
  rent: number;
  deposit?: number;
  food_type?: 'veg' | 'nonveg' | 'jain' | 'any' | 'none';
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  amenities?: Record<string, boolean>;
  rules?: Record<string, boolean>;
}

export async function createListing(input: CreateListingInput): Promise<ListingDetail> {
  try {
    const { data } = await client.post<{ listing: ListingDetail }>('/api/listings', input);
    return data.listing;
  } catch (err) {
    throw toApiError(err);
  }
}

/** POST /api/listings/:id/media  (owner only) */
export async function addMedia(
  listingId: string,
  media: Array<{ url: string; kind?: MediaKind; position?: number }>
): Promise<Media[]> {
  try {
    const { data } = await client.post<{ media: Media[] }>(
      `/api/listings/${listingId}/media`,
      { media }
    );
    return data.media;
  } catch (err) {
    throw toApiError(err);
  }
}

/** POST /api/listings/:id/reviews (auth required) */
export async function addReview(
  listingId: string,
  rating: number,
  comment?: string
): Promise<void> {
  try {
    await client.post(`/api/listings/${listingId}/reviews`, { rating, comment });
  } catch (err) {
    throw toApiError(err);
  }
}

export interface ReviewItem {
  id: string;
  listing_id: string;
  author_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  author_name: string;
  author_photo?: string | null;
}

/** GET /api/listings/:id/reviews (public) */
export async function getReviews(listingId: string): Promise<ReviewItem[]> {
  try {
    const { data } = await client.get<{ reviews: ReviewItem[]; count: number }>(
      `/api/listings/${listingId}/reviews`
    );
    return data.reviews ?? [];
  } catch (err) {
    throw toApiError(err);
  }
}

// ---------------------------------------------------------------------------
// Flatmate matching
// ---------------------------------------------------------------------------

export interface MatchParams {
  lat: number;
  lng: number;
  radius_meters?: number;
  min_score?: number;
  limit?: number;
  offset?: number;
}

/** GET /api/flatmates/matches  (auth required) */
export async function getFlatmateMatches(
  params: MatchParams
): Promise<MatchesResponse> {
  try {
    const { data } = await client.get<MatchesResponse>(
      '/api/flatmates/matches',
      {
        params: {
          lat: params.lat,
          lng: params.lng,
          radius_meters: params.radius_meters ?? DEFAULT_RADIUS_M,
          min_score: params.min_score,
          limit: params.limit,
          offset: params.offset,
        },
      }
    );
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

/** POST /api/media/sign-upload  (auth required) */
export interface CloudinarySignature {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  folder: string;
  signature: string;
  upload_preset?: string;
  upload_url: string;
}

export async function signUpload(): Promise<CloudinarySignature> {
  try {
    const { data } = await client.post<CloudinarySignature>(
      '/api/media/sign-upload'
    );
    return data;
  } catch (err) {
    throw toApiError(err);
  }
}

// ---------------------------------------------------------------------------
// Seeker profile
// ---------------------------------------------------------------------------

/**
 * GET /api/seeker-profile/me
 * Returns null when the user hasn't created a profile yet (backend 404),
 * so callers can render an empty form instead of treating it as an error.
 */
export async function getSeekerProfile(): Promise<SeekerProfile | null> {
  try {
    const { data } = await client.get<{ profile: SeekerProfile }>(
      '/api/seeker-profile/me'
    );
    return data.profile;
  } catch (err) {
    const apiErr = toApiError(err);
    if (apiErr.status === 404) return null;
    throw apiErr;
  }
}

/** PUT /api/seeker-profile/me — create or update. */
export async function updateSeekerProfile(
  input: SeekerProfileInput
): Promise<SeekerProfile> {
  try {
    const { data } = await client.put<{ profile: SeekerProfile }>(
      '/api/seeker-profile/me',
      input
    );
    return data.profile;
  } catch (err) {
    throw toApiError(err);
  }
}

// ---------------------------------------------------------------------------
// Favorites / Shortlisted Places
// ---------------------------------------------------------------------------

/** GET /api/favorites */
export async function getFavorites(): Promise<SearchListing[]> {
  try {
    const { data } = await client.get<{ favorites: SearchListing[] }>('/api/favorites');
    return data.favorites;
  } catch (err) {
    throw toApiError(err);
  }
}

/** POST /api/favorites/:id */
export async function addFavorite(listingId: string): Promise<void> {
  try {
    await client.post(`/api/favorites/${listingId}`);
  } catch (err) {
    throw toApiError(err);
  }
}

/** DELETE /api/favorites/:id */
export async function removeFavorite(listingId: string): Promise<void> {
  try {
    await client.delete(`/api/favorites/${listingId}`);
  } catch (err) {
    throw toApiError(err);
  }
}

export default client;
