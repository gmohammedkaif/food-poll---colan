import { z } from 'zod';

export const loginSchema = z.object({
  employeeId: z.string().min(2, 'Employee ID must be at least 2 characters').max(30),
  password: z.string().min(1, 'Password is required')
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional()
});
