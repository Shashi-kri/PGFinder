// routes/media.js
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { signUpload } from '../controllers/listingController.js';

const router = Router();

// Only authenticated users can request upload signatures (prevents anonymous
// abuse of your Cloudinary quota).
router.post('/sign-upload', requireAuth, signUpload);

export default router;
