-- Migration: Switch from Firebase-only auth to email/password auth
-- Run: psql "$DATABASE_URL" -f db/migrate_auth.sql

-- 1. Make firebase_uid nullable (was NOT NULL, but we no longer require Firebase)
ALTER TABLE users ALTER COLUMN firebase_uid DROP NOT NULL;

-- 2. Add password_hash column for email/password auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 3. Make phone NOT UNIQUE so duplicate nulls are allowed cleanly
-- (unique constraint on nullable column can cause issues)
-- Drop existing unique constraint on phone if it exists
DO $$ BEGIN
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_key;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
