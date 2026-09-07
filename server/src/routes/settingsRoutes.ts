import { Router } from 'express';
import * as settingsController from '../controllers/settingsController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { updateSettingsSchema } from '../validators/settingsValidators.js';

const router = Router();

router.get('/branding', settingsController.getBranding);
router.get('/', requireAuth, settingsController.getSettings);
router.put('/', requireAuth, requireAdmin, validateBody(updateSettingsSchema), settingsController.updateSettings);

export default router;
