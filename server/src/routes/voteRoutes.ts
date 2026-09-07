import { Router } from 'express';
import * as voteController from '../controllers/voteController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/history', requireAuth, voteController.getMyVoteHistory);

export default router;
