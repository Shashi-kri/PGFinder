// controllers/compatibilityController.js
// Flatmate compatibility engine.
//
// A flatmate `listing` is posted by a user (its owner_id) who is looking for a
// flatmate. That owner's living preferences live in their own seeker_profiles
// row. So matching = compare the REQUESTING seeker's profile against each
// candidate LISTING OWNER's profile.
//
// The scoring function is pure and dependency-free so it can be unit-tested in
// isolation and reused elsewhere (e.g. a batch job or notifications).

import { query } from '../config/db.js';

// Ordinal rank for guest frequency, used for a graded (not binary) penalty.
const GUEST_RANK = { rare: 0, sometimes: 1, often: 2 };

// Human-readable food labels for the explanation strings.
const FOOD_LABEL = {
  veg: 'Veg',
  nonveg: 'Non-veg',
  jain: 'Jain',
  any: 'No preference',
  none: 'None',
};

/**
 * Do two [min,max] budget ranges overlap at all?
 * Overlap exists unless one range ends before the other begins.
 */
function budgetsOverlap(a, b) {
  return a.min <= b.max && b.min <= a.max;
}

/**
 * Score a seeker against a candidate (both are seeker_profiles-shaped objects).
 *
 * gender_pref is a HARD FILTER: if the two stated gender preferences are
 * incompatible, the pair is excluded (returns eligible:false). "any" on either
 * side is always compatible.
 *
 * @param {object} seeker    requesting user's profile
 * @param {object} candidate listing owner's profile
 * @returns {{
 *   eligible: boolean,
 *   compatibility_score: number,
 *   top_matching_factors: string[],
 *   clashing_factors: string[]
 * }}
 */
export function scoreCompatibility(seeker, candidate) {
  // --- Hard filter: gender preference -------------------------------------
  // Compatible only if either side is 'any', or both state the same.
  const genderOk =
    seeker.gender_pref === 'any' ||
    candidate.gender_pref === 'any' ||
    seeker.gender_pref === candidate.gender_pref;

  if (!genderOk) {
    return {
      eligible: false,
      compatibility_score: 0,
      top_matching_factors: [],
      clashing_factors: ['Incompatible gender preference'],
    };
  }

  let score = 100;
  const matches = [];
  const clashes = [];

  // --- food_pref: -25 on mismatch -----------------------------------------
  // 'any' on either side is treated as compatible (no penalty).
  const foodFlexible = seeker.food_pref === 'any' || candidate.food_pref === 'any';
  if (foodFlexible || seeker.food_pref === candidate.food_pref) {
    matches.push(
      foodFlexible
        ? 'Flexible food preferences'
        : `Same food preference (${FOOD_LABEL[seeker.food_pref] ?? seeker.food_pref})`
    );
  } else {
    score -= 25;
    clashes.push(
      `Different food preferences (${FOOD_LABEL[seeker.food_pref]} vs ${FOOD_LABEL[candidate.food_pref]})`
    );
  }

  // --- sleep_schedule: -15 on mismatch ------------------------------------
  // 'flexible' on either side matches anything.
  const sleepFlexible =
    seeker.sleep === 'flexible' || candidate.sleep === 'flexible';
  if (sleepFlexible || seeker.sleep === candidate.sleep) {
    matches.push('Matching sleep schedule');
  } else {
    score -= 15;
    clashes.push(`Different sleep schedules (${seeker.sleep} vs ${candidate.sleep})`);
  }

  // --- cleanliness: |diff| * 4, capped at 16 ------------------------------
  const cleanDiff = Math.abs(seeker.cleanliness - candidate.cleanliness);
  const cleanPenalty = Math.min(cleanDiff * 4, 16);
  score -= cleanPenalty;
  if (cleanDiff <= 1) {
    matches.push('Similar cleanliness standards');
  } else {
    clashes.push(`Different cleanliness standards (${cleanDiff}-point gap)`);
  }

  // --- smoking: -15 on mismatch -------------------------------------------
  if (seeker.smoking === candidate.smoking) {
    matches.push(seeker.smoking ? 'Both smokers' : 'Both non-smokers');
  } else {
    score -= 15;
    clashes.push('Different smoking habits');
  }

  // --- drinking: -10 on mismatch ------------------------------------------
  if (seeker.drinking === candidate.drinking) {
    matches.push(seeker.drinking ? 'Both drinkers' : 'Both non-drinkers');
  } else {
    score -= 10;
    clashes.push('Different drinking habits');
  }

  // --- guests_freq: rank difference * 5 -----------------------------------
  const guestDiff = Math.abs(
    (GUEST_RANK[seeker.guests_freq] ?? 1) - (GUEST_RANK[candidate.guests_freq] ?? 1)
  );
  score -= guestDiff * 5;
  if (guestDiff === 0) {
    matches.push('Similar guest habits');
  } else if (guestDiff >= 2) {
    clashes.push('Very different guest habits');
  }

  // --- budget: -15 if ranges do not overlap -------------------------------
  const overlap = budgetsOverlap(
    { min: seeker.budget_min, max: seeker.budget_max },
    { min: candidate.budget_min, max: candidate.budget_max }
  );
  if (overlap) {
    matches.push('Overlapping budgets');
  } else {
    score -= 15;
    clashes.push('Budgets do not overlap');
  }

  // Clamp to [0,100] and round.
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    eligible: true,
    compatibility_score: score,
    // Cap the surfaced factors so the UI card stays readable.
    top_matching_factors: matches.slice(0, 3),
    clashing_factors: clashes.slice(0, 3),
  };
}

// ---------- GET /api/flatmates/matches -------------------------------------

/**
 * Return flatmate listings near a point, scored against the requester's
 * profile, sorted by compatibility DESC. Requires auth.
 *
 * Query: lat, lng (required), radius_meters (default 5000),
 *        limit (default 20, max 50), offset (default 0),
 *        min_score (optional, filter out weak matches).
 */
export async function getFlatmateMatches(req, res, next) {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: 'valid lat and lng are required' });
    }
    const radius = Number(req.query.radius_meters) || 5000;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const minScore = req.query.min_score !== undefined ? Number(req.query.min_score) : null;

    // The requester must have a seeker profile to be matched.
    const me = await query(
      `SELECT food_pref, sleep, cleanliness, smoking, drinking,
              guests_freq, gender_pref, budget_min, budget_max
       FROM seeker_profiles WHERE user_id = $1`,
      [req.user.id]
    );
    if (me.rowCount === 0) {
      return res.status(409).json({
        error: 'Complete your seeker profile before matching',
      });
    }
    const seeker = me.rows[0];

    // Candidate flatmate listings near the point, joined to the owner's
    // profile. Exclude the requester's own listings. We fetch a generous
    // window (limit+offset+buffer) then score/sort in JS, because the score
    // isn't expressible as a cheap SQL ORDER BY.
    const { rows } = await query(
      `
      SELECT
        l.id, l.owner_id, l.title, l.description, l.rent, l.deposit,
        l.food_type, l.address, l.city, l.amenities,
        ST_Y(l.geom::geometry) AS latitude,
        ST_X(l.geom::geometry) AS longitude,
        ST_Distance(l.geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS dist_m,
        o.name AS owner_name, o.verified AS owner_verified,
        o.verification_type AS owner_verification_type,
        sp.food_pref, sp.sleep, sp.cleanliness, sp.smoking, sp.drinking,
        sp.guests_freq, sp.gender_pref, sp.budget_min, sp.budget_max
      FROM listings l
      JOIN users o          ON o.id = l.owner_id
      JOIN seeker_profiles sp ON sp.user_id = l.owner_id
      WHERE l.type = 'flatmate'
        AND l.status = 'approved'
        AND l.availability = 'available'
        AND l.owner_id <> $4
        AND ST_DWithin(l.geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      `,
      [lng, lat, radius, req.user.id]
    );

    // Score each candidate, drop gender-incompatible ones.
    const scored = [];
    for (const r of rows) {
      const result = scoreCompatibility(seeker, {
        food_pref: r.food_pref,
        sleep: r.sleep,
        cleanliness: r.cleanliness,
        smoking: r.smoking,
        drinking: r.drinking,
        guests_freq: r.guests_freq,
        gender_pref: r.gender_pref,
        budget_min: r.budget_min,
        budget_max: r.budget_max,
      });

      if (!result.eligible) continue;
      if (minScore !== null && result.compatibility_score < minScore) continue;

      scored.push({
        id: r.id,
        owner_id: r.owner_id,
        title: r.title,
        description: r.description,
        rent: r.rent,
        deposit: r.deposit,
        food_type: r.food_type,
        address: r.address,
        city: r.city,
        amenities: r.amenities,
        latitude: r.latitude,
        longitude: r.longitude,
        dist_m: Math.round(r.dist_m),
        owner: {
          id: r.owner_id,
          name: r.owner_name,
          verified: r.owner_verified,
          verification_type: r.owner_verification_type,
        },
        compatibility_score: result.compatibility_score,
        top_matching_factors: result.top_matching_factors,
        clashing_factors: result.clashing_factors,
      });
    }

    // Sort by score DESC, then nearest first as a tiebreaker.
    scored.sort(
      (a, b) =>
        b.compatibility_score - a.compatibility_score || a.dist_m - b.dist_m
    );

    const page = scored.slice(offset, offset + limit);

    return res.json({
      count: page.length,
      total_eligible: scored.length,
      results: page,
    });
  } catch (err) {
    return next(err);
  }
}
