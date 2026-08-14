// controllers/seekerProfileController.js
// Read and upsert the authenticated user's seeker profile — the data the
// flatmate compatibility engine matches against.
//
// API field naming: the request/response uses `sleep_schedule`, while the DB
// column is `sleep`. We map between them here so the API stays consistent with
// the frontend and the spec.

import { query } from '../config/db.js';

const FOOD = new Set(['veg', 'nonveg', 'jain', 'any']);
const SLEEP = new Set(['early', 'late', 'flexible']);
const GUESTS = new Set(['rare', 'sometimes', 'often']);
const GENDER = new Set(['male', 'female', 'any']);

/** Shape the DB row into the API response (sleep -> sleep_schedule). */
function toApi(row) {
  return {
    user_id: row.user_id,
    food_pref: row.food_pref,
    sleep_schedule: row.sleep,
    cleanliness: row.cleanliness,
    smoking: row.smoking,
    drinking: row.drinking,
    guests_freq: row.guests_freq,
    gender_pref: row.gender_pref,
    budget_min: row.budget_min,
    budget_max: row.budget_max,
    occupation: row.occupation,
    updated_at: row.updated_at,
  };
}

// ---------- GET /api/seeker-profile/me -------------------------------------

/** Return the caller's profile, or 404 if they haven't created one. */
export async function getMyProfile(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT user_id, food_pref, sleep, cleanliness, smoking, drinking,
              guests_freq, gender_pref, budget_min, budget_max, occupation,
              updated_at
       FROM seeker_profiles WHERE user_id = $1`,
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Seeker profile not found' });
    }
    return res.json({ profile: toApi(rows[0]) });
  } catch (err) {
    return next(err);
  }
}

// ---------- PUT /api/seeker-profile/me -------------------------------------

/**
 * Create or update the caller's profile (idempotent upsert).
 * Body accepts all profile fields; each is validated against its enum/range.
 */
export async function upsertMyProfile(req, res, next) {
  try {
    const {
      food_pref,
      sleep_schedule,
      cleanliness,
      smoking,
      drinking,
      guests_freq,
      gender_pref,
      budget_min,
      budget_max,
      occupation = null,
    } = req.body ?? {};

    // --- validation ---
    const errors = [];
    if (!FOOD.has(food_pref)) errors.push('food_pref must be veg|nonveg|jain|any');
    if (!SLEEP.has(sleep_schedule)) errors.push('sleep_schedule must be early|late|flexible');
    if (!GUESTS.has(guests_freq)) errors.push('guests_freq must be rare|sometimes|often');
    if (!GENDER.has(gender_pref)) errors.push('gender_pref must be male|female|any');

    const clean = Number(cleanliness);
    if (!Number.isInteger(clean) || clean < 1 || clean > 5) {
      errors.push('cleanliness must be an integer 1-5');
    }
    if (typeof smoking !== 'boolean') errors.push('smoking must be a boolean');
    if (typeof drinking !== 'boolean') errors.push('drinking must be a boolean');

    const bMin = Number(budget_min);
    const bMax = Number(budget_max);
    if (!Number.isInteger(bMin) || bMin < 0) errors.push('budget_min must be a non-negative integer');
    if (!Number.isInteger(bMax) || bMax < 0) errors.push('budget_max must be a non-negative integer');
    if (Number.isInteger(bMin) && Number.isInteger(bMax) && bMax < bMin) {
      errors.push('budget_max must be >= budget_min');
    }
    if (occupation !== null && typeof occupation !== 'string') {
      errors.push('occupation must be a string');
    }

    if (errors.length) return res.status(400).json({ errors });

    // Upsert keyed on user_id (PK). First save inserts; later saves update.
    const { rows } = await query(
      `
      INSERT INTO seeker_profiles
        (user_id, food_pref, sleep, cleanliness, smoking, drinking,
         guests_freq, gender_pref, budget_min, budget_max, occupation)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (user_id) DO UPDATE SET
        food_pref   = EXCLUDED.food_pref,
        sleep       = EXCLUDED.sleep,
        cleanliness = EXCLUDED.cleanliness,
        smoking     = EXCLUDED.smoking,
        drinking    = EXCLUDED.drinking,
        guests_freq = EXCLUDED.guests_freq,
        gender_pref = EXCLUDED.gender_pref,
        budget_min  = EXCLUDED.budget_min,
        budget_max  = EXCLUDED.budget_max,
        occupation  = EXCLUDED.occupation
      RETURNING user_id, food_pref, sleep, cleanliness, smoking, drinking,
                guests_freq, gender_pref, budget_min, budget_max, occupation,
                updated_at
      `,
      [
        req.user.id, food_pref, sleep_schedule, clean, smoking, drinking,
        guests_freq, gender_pref, bMin, bMax, occupation,
      ]
    );

    return res.json({ profile: toApi(rows[0]) });
  } catch (err) {
    return next(err);
  }
}
