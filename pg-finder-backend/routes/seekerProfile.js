// routes/seekerProfile.js
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getMyProfile,
  upsertMyProfile,
} from '../controllers/seekerProfileController.js';

const router = Router();

router.get('/me', requireAuth, getMyProfile);
router.put('/me', requireAuth, upsertMyProfile);

export default router;
