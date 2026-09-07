import { Router } from 'express';
import * as auditController from '../controllers/auditController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/logs', requireAuth, requireAdmin, auditController.getAuditLogs);
router.delete('/logs', requireAuth, requireAdmin, auditController.clearAuditLogs);
router.delete('/logs/:id', requireAuth, requireAdmin, auditController.deleteAuditLog);

router.get('/alerts', requireAuth, requireAdmin, auditController.getSecurityAlerts);
router.post('/alerts/:id/resolve', requireAuth, requireAdmin, auditController.resolveSecurityAlert);
router.delete('/alerts', requireAuth, requireAdmin, auditController.clearSecurityAlerts);
router.delete('/alerts/:id', requireAuth, requireAdmin, auditController.deleteSecurityAlert);

router.get('/overview', requireAuth, requireAdmin, auditController.getSecurityOverview);

export default router;
