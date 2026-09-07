import { Router } from 'express';
import * as employeeController from '../controllers/employeeController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { createEmployeeSchema, updateEmployeeSchema, resetPasswordSchema } from '../validators/employeeValidators.js';

const router = Router();

router.get('/', requireAuth, requireAdmin, employeeController.getEmployees);
router.post('/', requireAuth, requireAdmin, validateBody(createEmployeeSchema), employeeController.createEmployee);
router.put('/:id', requireAuth, requireAdmin, validateBody(updateEmployeeSchema), employeeController.updateEmployee);
router.delete('/:id', requireAuth, requireAdmin, employeeController.deleteEmployee);
router.post('/:id/reset-password', requireAuth, requireAdmin, validateBody(resetPasswordSchema), employeeController.resetPassword);
router.post('/:id/revoke-sessions', requireAuth, requireAdmin, employeeController.revokeSessions);
router.get('/:id/audit', requireAuth, requireAdmin, employeeController.getEmployeeAuditHistory);

export default router;
