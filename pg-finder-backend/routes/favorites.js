// routes/favorites.js
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../config/db.js';

const router = Router();

// GET /api/favorites - Get user's favorited listings
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `
      SELECT
        l.id, l.owner_id, l.type, l.title, l.description, l.rent, l.deposit,
        l.food_type, l.address, l.city, l.amenities, l.verified, l.status,
        ST_Y(l.geom::geometry) AS latitude,
        ST_X(l.geom::geometry) AS longitude,
        f.created_at AS favorited_at
      FROM user_favorites f
      JOIN listings l ON l.id = f.listing_id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
      `,
      [req.user.id]
    );

    return res.json({ favorites: rows });
  } catch (err) {
    return next(err);
  }
});

// POST /api/favorites/:id - Add listing to favorites
router.post('/:id', requireAuth, async (req, res, next) => {
  try {
    const listingId = req.params.id;
    await query(
      `
      INSERT INTO user_favorites (user_id, listing_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, listing_id) DO NOTHING
      `,
      [req.user.id, listingId]
    );
    return res.status(201).json({ success: true, listing_id: listingId });
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/favorites/:id - Remove listing from favorites
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const listingId = req.params.id;
    await query(
      `
      DELETE FROM user_favorites
      WHERE user_id = $1 AND listing_id = $2
      `,
      [req.user.id, listingId]
    );
    return res.json({ success: true, listing_id: listingId });
  } catch (err) {
    return next(err);
  }
});

export default router;
