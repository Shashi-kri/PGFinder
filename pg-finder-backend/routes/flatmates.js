// routes/flatmates.js
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getFlatmateMatches } from '../controllers/compatibilityController.js';

const router = Router();

// Protected: matching runs against the authenticated user's seeker profile.
router.get('/matches', requireAuth, getFlatmateMatches);

export default router;
