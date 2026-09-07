import { Router } from 'express';
import authRoutes from './authRoutes.js';
import pollRoutes from './pollRoutes.js';
import voteRoutes from './voteRoutes.js';
import foodRoutes from './foodRoutes.js';
import employeeRoutes from './employeeRoutes.js';
import auditRoutes from './auditRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import notificationRoutes from './notificationRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/polls', pollRoutes);
router.use('/votes', voteRoutes);
router.use('/foods', foodRoutes);
router.use('/employees', employeeRoutes);
router.use('/audit', auditRoutes);
router.use('/settings', settingsRoutes);
router.use('/notifications', notificationRoutes);

export default router;
