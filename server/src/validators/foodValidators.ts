import { z } from 'zod';

export const createFoodSchema = z.object({
  name: z.string().min(2, 'Food name must be at least 2 characters').max(100),
  description: z.string().max(300).optional().default(''),
  imageUrl: z.string().url('A valid image URL is required').or(z.string().min(1)),
  imageFileId: z.string().optional().default(''),
  category: z.string().max(50).optional().default('Lunch'),
  active: z.boolean().optional().default(true)
});

export const updateFoodSchema = createFoodSchema.partial();
