import { z } from 'zod';

export const createEmployeeSchema = z.object({
  employeeId: z
    .string()
    .min(2, 'Employee ID must be at least 2 characters')
    .max(20, 'Employee ID must not exceed 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Employee ID can only contain letters, numbers, hyphens, and underscores'),
  name: z.string().min(2, 'Employee name must be at least 2 characters').max(100),
  password: z.string().min(1, 'Password is required').max(100),
  department: z.string().max(80).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
  role: z.enum(['ADMIN', 'EMPLOYEE']).optional().default('EMPLOYEE')
});

export const updateEmployeeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  department: z.string().max(80).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  role: z.enum(['ADMIN', 'EMPLOYEE']).optional()
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(1, 'Password is required').max(100)
});
