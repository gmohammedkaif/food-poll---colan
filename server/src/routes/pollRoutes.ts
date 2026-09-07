import { Router } from 'express';
import * as pollController from '../controllers/pollController.js';
import * as voteController from '../controllers/voteController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { createPollSchema, updatePollSchema, voteSchema } from '../validators/pollValidators.js';

const router = Router();

// Public/Employee active poll
router.get('/active', requireAuth, pollController.getActivePoll);

// Poll list & detail
router.get('/', requireAuth, pollController.getAllPolls);
router.get('/:id', requireAuth, pollController.getPollById);

// Admin lifecycle endpoints
router.post('/', requireAuth, requireAdmin, validateBody(createPollSchema), pollController.createPoll);
router.put('/:id', requireAuth, requireAdmin, validateBody(updatePollSchema), pollController.updatePoll);
router.post('/:id/publish', requireAuth, requireAdmin, pollController.publishPoll);
router.post('/:id/close', requireAuth, requireAdmin, pollController.closePoll);
router.delete('/:id', requireAuth, requireAdmin, pollController.deletePoll);

// Results & Voters
router.get('/:id/results', requireAuth, pollController.getPollResults);
router.get('/:id/voters', requireAuth, pollController.getPollVoters);

// Voting on poll
router.post('/:id/vote', requireAuth, validateBody(voteSchema), voteController.submitVote);
router.get('/:id/my-vote', requireAuth, voteController.getMyVote);

export default router;
