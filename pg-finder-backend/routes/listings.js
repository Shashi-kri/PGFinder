// routes/listings.js
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createListing,
  searchListings,
  signUpload,
  addMedia,
  getListingById,
  addReview,
} from '../controllers/listingController.js';

const router = Router();

// Public: anyone can search. Auth is optional here; add requireAuth if you
// want to gate search behind login.
// IMPORTANT: keep '/search' BEFORE '/:id' or Express matches "search" as an id.
router.get('/search', searchListings);

// Protected: only authenticated users create listings.
router.post('/', requireAuth, createListing);

// Protected: listing owner attaches uploaded Cloudinary URLs.
router.post('/:id/media', requireAuth, addMedia);

// Protected: submit review & rating for a listing.
router.post('/:id/reviews', requireAuth, addReview);

// Public: full listing detail (media + owner + rating aggregate).
router.get('/:id', getListingById);

// Media signing lives under /api/media in server.js, but the handler is
// exported here for cohesion. See server.js for its mount point.
export { signUpload };
export default router;
