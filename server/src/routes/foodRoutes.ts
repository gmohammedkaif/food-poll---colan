import { Router } from 'express';
import * as foodController from '../controllers/foodController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { createFoodSchema, updateFoodSchema } from '../validators/foodValidators.js';
import { uploadMiddleware } from '../services/imageService.js';

const router = Router();

router.get('/', requireAuth, foodController.getFoods);
router.post('/', requireAuth, requireAdmin, validateBody(createFoodSchema), foodController.createFood);
router.put('/:id', requireAuth, requireAdmin, validateBody(updateFoodSchema), foodController.updateFood);
router.delete('/:id', requireAuth, requireAdmin, foodController.deleteFood);
router.post('/upload', requireAuth, requireAdmin, uploadMiddleware.single('image'), foodController.uploadFoodImage);

export default router;
