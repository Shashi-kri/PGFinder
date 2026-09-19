// controllers/listingController.js
// Business logic for creating listings, geo-spatial search, and issuing
// Cloudinary signed-upload parameters.

import { query, getClient } from '../config/db.js';
import cloudinary from '../config/cloudinary.js';

// Allowed enum values — validate against these so a bad value returns 400
// instead of a Postgres 22P02 (invalid enum) 500.
const LISTING_TYPES = new Set(['pg', 'flat', 'flatmate', 'mess']);
const FOOD_TYPES = new Set(['veg', 'nonveg', 'jain', 'any', 'none']);
const MEDIA_KINDS = new Set(['photo', 'video', 'tour360']);

// ---------- helpers ---------------------------------------------------------

/** Coerce to a finite number or return null. */
const num = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const isValidLat = (n) => n !== null && n >= -90 && n <= 90;
const isValidLng = (n) => n !== null && n >= -180 && n <= 180;

// ---------- POST /api/listings ---------------------------------------------

/**
 * Create a listing. Requires auth (req.user set by requireAuth).
 * Body: { type, title, description?, rent, deposit?, food_type?,
 *         latitude, longitude, address?, city?, amenities?, rules? }
 */
export async function createListing(req, res, next) {
  try {
    const {
      type,
      title,
      description = null,
      rent = 0,
      deposit = 0,
      food_type = 'none',
      latitude,
      longitude,
      address = null,
      city = null,
      amenities = {},
      rules = {},
    } = req.body ?? {};

    // --- validation ---
    const errors = [];
    if (!LISTING_TYPES.has(type)) errors.push('type must be one of pg|flat|flatmate|mess');
    if (!title || typeof title !== 'string') errors.push('title is required');
    if (!FOOD_TYPES.has(food_type)) errors.push('food_type is invalid');

    const lat = num(latitude);
    const lng = num(longitude);
    if (!isValidLat(lat)) errors.push('latitude is required and must be between -90 and 90');
    if (!isValidLng(lng)) errors.push('longitude is required and must be between -180 and 180');

    const rentN = num(rent) ?? 0;
    const depositN = num(deposit) ?? 0;
    if (rentN < 0) errors.push('rent must be >= 0');
    if (depositN < 0) errors.push('deposit must be >= 0');

    if (errors.length) return res.status(400).json({ errors });

    // NOTE the argument order in ST_MakePoint: (longitude, latitude).
    // amenities/rules are passed as JS objects; pg serializes them to jsonb.
    const { rows } = await query(
      `
      INSERT INTO listings
        (owner_id, type, title, description, rent, deposit, food_type,
         geom, address, city, amenities, rules, status)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7,
         ST_SetSRID(ST_MakePoint($8, $9), 4326)::geography,
         $10, $11, $12, $13, 'approved')
      RETURNING
        id, owner_id, type, title, description, rent, deposit, food_type,
        ST_Y(geom::geometry) AS latitude,
        ST_X(geom::geometry) AS longitude,
        address, city, amenities, rules,
        availability, verified, status, created_at
      `,
      [
        req.user.id, type, title, description, rentN, depositN, food_type,
        lng, lat,                     // $8 = longitude, $9 = latitude
        address, city,
        JSON.stringify(amenities), JSON.stringify(rules),
      ]
    );

    return res.status(201).json({ listing: rows[0] });
  } catch (err) {
    return next(err);
  }
}

// ---------- GET /api/listings/search ---------------------------------------

/**
 * Radius search with optional filters, ordered by distance.
 * Query params:
 *   lat, lng            (required)
 *   radius_meters       (default 5000)
 *   type                (optional: pg|flat|flatmate|mess)
 *   min_rent, max_rent  (optional)
 *   food_type           (optional)
 *   limit  (default 20, max 50)
 *   offset (default 0)
 */
export async function searchListings(req, res, next) {
  try {
    const lat = num(req.query.lat);
    const lng = num(req.query.lng);
    if (!isValidLat(lat) || !isValidLng(lng)) {
      return res
        .status(400)
        .json({ error: 'valid lat and lng query params are required' });
    }

    const radius = num(req.query.radius_meters) ?? 5000;
    const type = req.query.type;
    if (type !== undefined && !LISTING_TYPES.has(type)) {
      return res.status(400).json({ error: 'invalid type filter' });
    }
    const foodType = req.query.food_type;
    if (foodType !== undefined && !FOOD_TYPES.has(foodType)) {
      return res.status(400).json({ error: 'invalid food_type filter' });
    }

    const minRent = num(req.query.min_rent);
    const maxRent = num(req.query.max_rent);

    const limit = Math.min(num(req.query.limit) ?? 20, 50);
    const offset = Math.max(num(req.query.offset) ?? 0, 0);

    // Build the WHERE clause dynamically but keep every value parameterized.
    // $1 = lng, $2 = lat, $3 = radius are always present.
    const params = [lng, lat, radius];
    const where = [
      `ST_DWithin(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)`,
      `status = 'approved'`,
      `availability = 'available'`,
    ];

    if (type) {
      params.push(type);
      where.push(`type = $${params.length}`);
    }
    if (foodType) {
      params.push(foodType);
      where.push(`food_type = $${params.length}`);
    }
    if (minRent !== null) {
      params.push(minRent);
      where.push(`rent >= $${params.length}`);
    }
    if (maxRent !== null) {
      params.push(maxRent);
      where.push(`rent <= $${params.length}`);
    }

    // limit & offset are the last two params.
    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const sql = `
      SELECT
        l.id, l.owner_id, l.type, l.title, l.description, l.rent, l.deposit, l.food_type,
        ST_Y(l.geom::geometry) AS latitude,
        ST_X(l.geom::geometry) AS longitude,
        l.address, l.city, l.amenities, l.rules, l.availability, l.verified, l.status,
        l.created_at,
        ST_Distance(
          l.geom,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) AS dist_m,
        COALESCE(
          (SELECT json_agg(json_build_object('url', m.url, 'kind', m.kind) ORDER BY m.position)
           FROM media m WHERE m.listing_id = l.id),
          '[]'::json
        ) AS photos,
        COALESCE(r.avg_rating, 0)   AS avg_rating,
        COALESCE(r.review_count, 0) AS review_count
      FROM listings l
      LEFT JOIN (
        SELECT listing_id,
               ROUND(AVG(rating)::numeric, 2) AS avg_rating,
               COUNT(*) AS review_count
        FROM reviews GROUP BY listing_id
      ) r ON r.listing_id = l.id
      WHERE ${where.map(w => w.replace(/^(\w+)/, 'l.$1').replace(/l.ST_DWithin/, 'ST_DWithin')).join('\n        AND ')}
      ORDER BY dist_m ASC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const { rows } = await query(sql, params);

    return res.json({
      count: rows.length,
      radius_meters: radius,
      results: rows.map((r) => ({ ...r, dist_m: Math.round(r.dist_m) })),
    });
  } catch (err) {
    return next(err);
  }
}

// ---------- POST /api/media/sign-upload ------------------------------------

/**
 * Return signed params so the mobile client can upload DIRECTLY to Cloudinary.
 * The client sends: file, api_key, timestamp, signature, folder (and any
 * other signed fields) as multipart/form-data to
 *   https://api.cloudinary.com/v1_1/<cloud_name>/auto/upload
 *
 * We sign only server-controlled params. Never sign client-supplied values
 * you don't want them to tamper with.
 */
export async function signUpload(req, res, next) {
  try {
    const timestamp = Math.round(Date.now() / 1000);

    // Accept an optional folder from the client (e.g. "avatars/<uid>").
    // Whitelist allowed prefixes to prevent abuse.
    const requestedFolder = req.body?.folder ?? '';
    const allowedPrefixes = ['listings/', 'avatars/'];
    const isAllowed = allowedPrefixes.some(p => requestedFolder.startsWith(p));
    const folder = isAllowed ? requestedFolder : `listings/${req.user.id}`;

    // Every param included here must also be sent by the client, verbatim.
    const paramsToSign = {
      timestamp,
      folder,
      // Optional: restrict to an upload preset if you configured one.
      ...(process.env.CLOUDINARY_UPLOAD_PRESET
        ? { upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET }
        : {}),
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    return res.json({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      timestamp,
      folder,
      signature,
      ...(process.env.CLOUDINARY_UPLOAD_PRESET
        ? { upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET }
        : {}),
      // Convenience: the exact endpoint the client should POST to.
      upload_url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
    });
  } catch (err) {
    return next(err);
  }
}

// ---------- POST /api/listings/:id/media -----------------------------------

/**
 * Attach one or more uploaded Cloudinary URLs to a listing.
 * Only the listing's owner may do this (403 otherwise; 404 if no such listing).
 *
 * Body: { media: [ { url, kind?, position? }, ... ] }
 *   url      required, string
 *   kind     optional, one of photo|video|tour360 (default 'photo')
 *   position optional, integer for ordering (default: appended after current max)
 *
 * Inserted in a single transaction; returns the created media rows.
 */
export async function addMedia(req, res, next) {
  const client = await getClient();
  try {
    const listingId = req.params.id;
    const items = req.body?.media;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'media must be a non-empty array' });
    }
    if (items.length > 50) {
      return res.status(400).json({ error: 'too many media items (max 50 per request)' });
    }

    // --- validate every item before touching the DB ---
    const errors = [];
    items.forEach((m, i) => {
      if (!m || typeof m.url !== 'string' || !m.url.trim()) {
        errors.push(`media[${i}].url is required`);
      }
      if (m?.kind !== undefined && !MEDIA_KINDS.has(m.kind)) {
        errors.push(`media[${i}].kind must be photo|video|tour360`);
      }
      if (m?.position !== undefined && !Number.isInteger(Number(m.position))) {
        errors.push(`media[${i}].position must be an integer`);
      }
    });
    if (errors.length) return res.status(400).json({ errors });

    await client.query('BEGIN');

    // Ownership check with a row lock so a concurrent delete can't race us.
    const owner = await client.query(
      `SELECT owner_id FROM listings WHERE id = $1 FOR UPDATE`,
      [listingId]
    );
    if (owner.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (owner.rows[0].owner_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'You do not own this listing' });
    }

    // Default position: continue after the current max for this listing.
    const posRes = await client.query(
      `SELECT COALESCE(MAX(position), -1) AS maxpos FROM media WHERE listing_id = $1`,
      [listingId]
    );
    let nextPos = posRes.rows[0].maxpos + 1;

    // Bulk insert via UNNEST — one round-trip regardless of item count.
    const urls = [];
    const kinds = [];
    const positions = [];
    for (const m of items) {
      urls.push(m.url.trim());
      kinds.push(m.kind ?? 'photo');
      positions.push(
        m.position !== undefined ? Number(m.position) : nextPos++
      );
    }

    const { rows } = await client.query(
      `
      INSERT INTO media (listing_id, url, kind, position)
      SELECT $1, u.url, u.kind::media_kind, u.position
      FROM UNNEST($2::text[], $3::text[], $4::int[]) AS u(url, kind, position)
      RETURNING id, listing_id, url, kind, position, created_at
      `,
      [listingId, urls, kinds, positions]
    );

    await client.query('COMMIT');
    return res.status(201).json({ media: rows });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    return next(err);
  } finally {
    client.release();
  }
}

// ---------- GET /api/listings/:id ------------------------------------------

/**
 * Full listing detail: listing fields + coordinates + ordered media array +
 * owner summary + aggregate rating/review count. Single query, no N+1.
 * 404 if the listing does not exist.
 */
export async function getListingById(req, res, next) {
  try {
    const listingId = req.params.id;

    const { rows } = await query(
      `
      SELECT
        l.id, l.owner_id, l.type, l.title, l.description,
        l.rent, l.deposit, l.food_type,
        ST_Y(l.geom::geometry) AS latitude,
        ST_X(l.geom::geometry) AS longitude,
        l.address, l.city, l.amenities, l.rules,
        l.availability, l.verified, l.status,
        l.created_at, l.updated_at,

        -- Owner summary as a nested object.
        json_build_object(
          'id', o.id,
          'name', o.name,
          'phone', o.phone,
          'verified', o.verified,
          'verification_type', o.verification_type
        ) AS owner,

        -- Media ordered by position. COALESCE -> [] when there is none.
        COALESCE(
          (
            SELECT json_agg(
                     json_build_object(
                       'id', m.id,
                       'url', m.url,
                       'kind', m.kind,
                       'position', m.position
                     ) ORDER BY m.position, m.created_at
                   )
            FROM media m
            WHERE m.listing_id = l.id
          ),
          '[]'::json
        ) AS media,

        -- Aggregate rating. Defaults to 0 when there are no reviews.
        COALESCE(r.avg_rating, 0)   AS avg_rating,
        COALESCE(r.review_count, 0) AS review_count

      FROM listings l
      JOIN users o ON o.id = l.owner_id
      LEFT JOIN (
        SELECT listing_id,
               ROUND(AVG(rating)::numeric, 2) AS avg_rating,
               COUNT(*)                        AS review_count
        FROM reviews
        GROUP BY listing_id
      ) r ON r.listing_id = l.id
      WHERE l.id = $1
      `,
      [listingId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // avg_rating comes back as a string (numeric); coerce to number for JSON.
    const listing = rows[0];
    listing.avg_rating = Number(listing.avg_rating);
    listing.review_count = Number(listing.review_count);

    return res.json({ listing });
  } catch (err) {
    return next(err);
  }
}

// ---------- GET /api/listings/mine -----------------------------------------

/**
 * Return the authenticated user's own listings (all statuses).
 * Includes media, rating, and distance from New Delhi as a default.
 */
export async function getMyListings(req, res, next) {
  try {
    const { rows } = await query(
      `
      SELECT
        l.id, l.owner_id, l.type, l.title, l.description,
        l.rent, l.deposit, l.food_type,
        ST_Y(l.geom::geometry) AS latitude,
        ST_X(l.geom::geometry) AS longitude,
        l.address, l.city, l.amenities, l.availability, l.verified, l.status,
        l.created_at, l.updated_at,
        COALESCE(
          (SELECT json_agg(json_build_object('url', m.url, 'kind', m.kind) ORDER BY m.position)
           FROM media m WHERE m.listing_id = l.id),
          '[]'::json
        ) AS photos,
        COALESCE(r.avg_rating, 0)   AS avg_rating,
        COALESCE(r.review_count, 0) AS review_count
      FROM listings l
      LEFT JOIN (
        SELECT listing_id,
               ROUND(AVG(rating)::numeric, 2) AS avg_rating,
               COUNT(*) AS review_count
        FROM reviews GROUP BY listing_id
      ) r ON r.listing_id = l.id
      WHERE l.owner_id = $1
      ORDER BY l.created_at DESC
      `,
      [req.user.id]
    );

    return res.json({ listings: rows, total: rows.length });
  } catch (err) {
    return next(err);
  }
}

// ---------- PATCH /api/listings/:id ----------------------------------------

/**
 * Partially update a listing. Only the listing's owner may edit (403 otherwise).
 * Body can include any subset of: type, title, description, rent, deposit,
 * food_type, latitude, longitude, address, city, amenities, availability.
 */
export async function updateListing(req, res, next) {
  try {
    const listingId = req.params.id;

    // Ownership check
    const check = await query('SELECT owner_id FROM listings WHERE id = $1', [listingId]);
    if (check.rowCount === 0) return res.status(404).json({ error: 'Listing not found' });
    if (check.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const body = req.body ?? {};
    const setClauses = [];
    const params = [];

    const push = (val) => { params.push(val); return `$${params.length}`; };

    if (body.title       !== undefined) setClauses.push(`title = ${push(String(body.title).trim())}`);
    if (body.description !== undefined) setClauses.push(`description = ${push(body.description ?? null)}`);
    if (body.rent        !== undefined) {
      const r = num(body.rent);
      if (r === null || r < 0) return res.status(400).json({ error: 'rent must be a non-negative number' });
      setClauses.push(`rent = ${push(r)}`);
    }
    if (body.deposit !== undefined) {
      const d = num(body.deposit);
      setClauses.push(`deposit = ${push(d ?? 0)}`);
    }
    if (body.food_type !== undefined) {
      if (!FOOD_TYPES.has(body.food_type)) return res.status(400).json({ error: 'invalid food_type' });
      setClauses.push(`food_type = ${push(body.food_type)}`);
    }
    if (body.type !== undefined) {
      if (!LISTING_TYPES.has(body.type)) return res.status(400).json({ error: 'invalid type' });
      setClauses.push(`type = ${push(body.type)}`);
    }
    if (body.address      !== undefined) setClauses.push(`address = ${push(body.address ?? null)}`);
    if (body.city         !== undefined) setClauses.push(`city = ${push(body.city ?? null)}`);
    if (body.amenities    !== undefined) setClauses.push(`amenities = ${push(JSON.stringify(body.amenities))}`);
    if (body.availability !== undefined) setClauses.push(`availability = ${push(body.availability)}`);

    // Coordinates — update geom only when both are provided together
    if (body.latitude !== undefined && body.longitude !== undefined) {
      const lat = num(body.latitude);
      const lng = num(body.longitude);
      if (!isValidLat(lat) || !isValidLng(lng)) return res.status(400).json({ error: 'invalid coordinates' });
      setClauses.push(`geom = ST_SetSRID(ST_MakePoint(${push(lng)}, ${push(lat)}), 4326)::geography`);
    }

    if (setClauses.length === 0) return res.status(400).json({ error: 'No fields to update' });

    setClauses.push(`updated_at = now()`);
    params.push(listingId);

    const { rows } = await query(
      `UPDATE listings SET ${setClauses.join(', ')}
       WHERE id = $${params.length}
       RETURNING id, owner_id, type, title, description, rent, deposit, food_type,
         ST_Y(geom::geometry) AS latitude, ST_X(geom::geometry) AS longitude,
         address, city, amenities, availability, status, updated_at`,
      params
    );

    return res.json({ listing: rows[0] });
  } catch (err) {
    return next(err);
  }
}

// ---------- POST /api/listings/:id/reviews --------------------------------
/** Add or update a review for a listing (auth required). */
export async function addReview(req, res, next) {
  try {
    const listingId = req.params.id;
    const { rating, comment } = req.body ?? {};

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
    }

    const { rows } = await query(
      `
      INSERT INTO reviews (listing_id, author_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (listing_id, author_id) DO UPDATE SET
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment
      RETURNING id, listing_id, author_id, rating, comment, created_at
      `,
      [listingId, req.user.id, ratingNum, comment ?? null]
    );

    return res.status(201).json({ review: rows[0] });
  } catch (err) {
    return next(err);
  }
}

// ---------- GET /api/listings/:id/reviews ---------------------------------
/** Get all reviews for a listing with author details (public). */
export async function getReviews(req, res, next) {
  try {
    const listingId = req.params.id;
    const { rows } = await query(
      `
      SELECT
        r.id, r.listing_id, r.author_id, r.rating, r.comment, r.created_at,
        u.name AS author_name, u.photo_url AS author_photo
      FROM reviews r
      JOIN users u ON u.id = r.author_id
      WHERE r.listing_id = $1
      ORDER BY r.created_at DESC
      `,
      [listingId]
    );

    return res.json({ reviews: rows, count: rows.length });
  } catch (err) {
    return next(err);
  }
}
