import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as notificationController from '../controllers/notificationController.js';

const router = Router();

// All notification subscription endpoints require authenticated session
router.use(requireAuth);

router.get('/vapid-key', notificationController.getVapidPublicKey);
router.post('/subscribe', notificationController.subscribe);
router.post('/unsubscribe', notificationController.unsubscribe);
router.get('/status', notificationController.getStatus);

export default router;
