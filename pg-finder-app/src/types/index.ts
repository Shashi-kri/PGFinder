// src/types/index.ts
// These mirror the EXACT shapes our Express backend returns (verified against
// live PostGIS). Keep them in sync with the controllers.

export type ListingType = 'pg' | 'flat' | 'flatmate' | 'mess';
export type FoodType = 'veg' | 'nonveg' | 'jain' | 'any' | 'none';
export type MediaKind = 'photo' | 'video' | 'tour360';
export type VerificationType = 'student' | 'professional' | 'none';

/** Amenities is a free-form JSON object, e.g. { wifi: true, ac: true }. */
export type Amenities = Record<string, boolean>;

/** Row shape returned by GET /api/listings/search (each result). */
export interface SearchListing {
  id: string;
  owner_id: string;
  type: ListingType;
  title: string;
  description: string | null;
  rent: number;
  deposit: number;
  food_type: FoodType;
  latitude: number;
  longitude: number;
  address: string | null;
  city: string | null;
  amenities: Amenities;
  rules: Record<string, unknown>;
  availability: 'available' | 'filled' | 'paused';
  verified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  /** Rounded meters from the search origin. */
  dist_m: number;
}

export interface SearchResponse {
  count: number;
  radius_meters: number;
  results: SearchListing[];
}

/** Nested media object from GET /api/listings/:id. */
export interface Media {
  id: string;
  url: string;
  kind: MediaKind;
  position: number;
}

export interface OwnerSummary {
  id: string;
  name: string | null;
  phone?: string | null;
  verified: boolean;
  verification_type: VerificationType;
}

/** Full detail from GET /api/listings/:id. */
export interface ListingDetail extends Omit<SearchListing, 'dist_m'> {
  owner: OwnerSummary;
  media: Media[];
  avg_rating: number;
  review_count: number;
  updated_at: string;
}

/** A single result from GET /api/flatmates/matches. */
export interface FlatmateMatch {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  rent: number;
  deposit: number;
  food_type: FoodType;
  address: string | null;
  city: string | null;
  amenities: Amenities;
  latitude: number;
  longitude: number;
  dist_m: number;
  owner: OwnerSummary;
  compatibility_score: number;
  top_matching_factors: string[];
  clashing_factors: string[];
}

export interface MatchesResponse {
  count: number;
  total_eligible: number;
  results: FlatmateMatch[];
}

/** Search filter state shared between the Search and Map screens. */
export interface SearchFilters {
  type?: ListingType;
  food_type?: FoodType;
  min_rent?: number;
  max_rent?: number;
  radius_meters: number;
}

export type SleepSchedule = 'early' | 'late' | 'flexible';
export type GuestFrequency = 'rare' | 'sometimes' | 'often';
export type GenderPref = 'male' | 'female' | 'any';
export type FoodPref = 'veg' | 'nonveg' | 'jain' | 'any';

/** Payload for PUT /api/seeker-profile/me. */
export interface SeekerProfileInput {
  food_pref: FoodPref;
  sleep_schedule: SleepSchedule;
  cleanliness: number; // 1..5
  smoking: boolean;
  drinking: boolean;
  guests_freq: GuestFrequency;
  gender_pref: GenderPref;
  budget_min: number;
  budget_max: number;
  occupation: string | null;
}

/** Response from GET/PUT /api/seeker-profile/me. */
export interface SeekerProfile extends SeekerProfileInput {
  user_id: string;
  updated_at: string;
}
