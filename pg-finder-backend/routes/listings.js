// routes/listings.js
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createListing,
  updateListing,
  searchListings,
  getMyListings,
  signUpload,
  addMedia,
  getListingById,
  addReview,
  getReviews,
} from '../controllers/listingController.js';

const router = Router();

// Public: anyone can search.
router.get('/search', searchListings);

// Protected: authenticated owner's own listings (all statuses).
// IMPORTANT: keep '/mine' BEFORE '/:id' or Express matches "mine" as an id.
router.get('/mine', requireAuth, getMyListings);


// Protected: only authenticated users create listings.
router.post('/', requireAuth, createListing);

// Protected: listing owner attaches uploaded Cloudinary URLs.
router.post('/:id/media', requireAuth, addMedia);

// Public: get all reviews for a listing.
router.get('/:id/reviews', getReviews);

// Protected: submit review & rating for a listing.
router.post('/:id/reviews', requireAuth, addReview);

// Public: full listing detail (media + owner + rating aggregate).
router.get('/:id', getListingById);

// Protected: owner can update their own listing.
router.patch('/:id', requireAuth, updateListing);

// Protected: owner can delete their own listing.
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { query } = await import('../config/db.js');
    const { rows } = await query('SELECT owner_id FROM listings WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Listing not found' });
    if (rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await query('DELETE FROM listings WHERE id = $1', [req.params.id]);
    return res.json({ success: true });
  } catch (err) { return next(err); }
});


// Media signing lives under /api/media in server.js, but the handler is
// exported here for cohesion. See server.js for its mount point.
export { signUpload };
export default router;
