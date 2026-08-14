-- ============================================================================
-- PG / Flatmate / Mess Finder — Database Schema
-- PostgreSQL 14+ with PostGIS 3+
-- Run once against a fresh database:  psql "$DATABASE_URL" -f db/schema.sql
-- ============================================================================

-- --- Extensions -------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS postgis;      -- geospatial types & functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- --- Enums ------------------------------------------------------------------
-- Wrapped in DO blocks so re-running the script does not error on existing types.
DO $$ BEGIN
  CREATE TYPE user_role          AS ENUM ('seeker', 'owner', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE verification_kind  AS ENUM ('student', 'professional', 'none');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE listing_type       AS ENUM ('pg', 'flat', 'flatmate', 'mess');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE food_type          AS ENUM ('veg', 'nonveg', 'jain', 'any', 'none');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE availability_state AS ENUM ('available', 'filled', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE moderation_status  AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sleep_schedule     AS ENUM ('early', 'late', 'flexible');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE guest_frequency    AS ENUM ('rare', 'sometimes', 'often');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE gender_pref        AS ENUM ('male', 'female', 'any');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --- updated_at trigger helper ----------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- users
--   firebase_uid is the join key to Firebase Auth. It is UNIQUE and NOT NULL
--   because every app user authenticates through Firebase.
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid      TEXT        NOT NULL UNIQUE,
  role              user_role   NOT NULL DEFAULT 'seeker',
  name              TEXT,
  email             TEXT        UNIQUE,
  phone             TEXT        UNIQUE,
  photo_url         TEXT,
  verified          BOOLEAN     NOT NULL DEFAULT false,
  verification_type verification_kind NOT NULL DEFAULT 'none',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- seeker_profiles
--   One row per seeker. Feeds the flatmate compatibility algorithm.
-- ============================================================================
CREATE TABLE IF NOT EXISTS seeker_profiles (
  user_id        UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  food_pref      food_type       NOT NULL DEFAULT 'any',
  sleep          sleep_schedule  NOT NULL DEFAULT 'flexible',
  cleanliness    SMALLINT        NOT NULL DEFAULT 3
                   CHECK (cleanliness BETWEEN 1 AND 5),
  smoking        BOOLEAN         NOT NULL DEFAULT false,
  drinking       BOOLEAN         NOT NULL DEFAULT false,
  guests_freq    guest_frequency NOT NULL DEFAULT 'sometimes',
  gender_pref    gender_pref     NOT NULL DEFAULT 'any',
  budget_min     INTEGER         NOT NULL DEFAULT 0  CHECK (budget_min >= 0),
  budget_max     INTEGER         NOT NULL DEFAULT 0  CHECK (budget_max >= budget_min),
  occupation     TEXT,
  updated_at     TIMESTAMPTZ     NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_seeker_profiles_updated_at ON seeker_profiles;
CREATE TRIGGER trg_seeker_profiles_updated_at
  BEFORE UPDATE ON seeker_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- listings  (polymorphic: pg | flat | flatmate | mess)
--   geom is GEOGRAPHY(POINT,4326) so ST_DWithin / ST_Distance work in METERS
--   with no manual projection.
-- ============================================================================
CREATE TABLE IF NOT EXISTS listings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          listing_type NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  rent          INTEGER      NOT NULL DEFAULT 0 CHECK (rent >= 0),
  deposit       INTEGER      NOT NULL DEFAULT 0 CHECK (deposit >= 0),
  food_type     food_type    NOT NULL DEFAULT 'none',
  geom          GEOGRAPHY(POINT, 4326) NOT NULL,
  address       TEXT,
  city          TEXT,
  amenities     JSONB        NOT NULL DEFAULT '{}'::jsonb,  -- {"wifi":true,"ac":true}
  rules         JSONB        NOT NULL DEFAULT '{}'::jsonb,
  availability  availability_state NOT NULL DEFAULT 'available',
  verified      BOOLEAN      NOT NULL DEFAULT false,
  status        moderation_status  NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_listings_updated_at ON listings;
CREATE TRIGGER trg_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- --- Indexes ----------------------------------------------------------------
-- Spatial index: the single most important index for radius search.
CREATE INDEX IF NOT EXISTS idx_listings_geom
  ON listings USING GIST (geom);

-- Composite B-tree for the common filtered-search access pattern.
-- Order matters: equality columns first (type, city), then availability/status.
CREATE INDEX IF NOT EXISTS idx_listings_type_city_avail
  ON listings (type, city, availability, status);

-- Range scans on rent within a type.
CREATE INDEX IF NOT EXISTS idx_listings_type_rent
  ON listings (type, rent);

-- JSONB containment queries on amenities (amenities @> '{"wifi":true}').
CREATE INDEX IF NOT EXISTS idx_listings_amenities
  ON listings USING GIN (amenities);

-- Owner dashboard: "my listings".
CREATE INDEX IF NOT EXISTS idx_listings_owner
  ON listings (owner_id);

-- ============================================================================
-- media  (photos / videos / 360 tours for a listing)
--   Cloudinary URLs are persisted here AFTER the client uploads directly.
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE media_kind AS ENUM ('photo', 'video', 'tour360');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS media (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  kind        media_kind NOT NULL DEFAULT 'photo',
  position    INTEGER    NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fetch-by-listing ordered by position is the hot path.
CREATE INDEX IF NOT EXISTS idx_media_listing_position
  ON media (listing_id, position);

-- ============================================================================
-- reviews  (needed for avg rating / count on the detail page)
--   One review per (listing, author).
-- ============================================================================
CREATE TABLE IF NOT EXISTS reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  photos      JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, author_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_listing
  ON reviews (listing_id);

-- ============================================================================
-- user_favorites (shortlisted listings per user)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_favorites (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

