import { z } from 'zod';

export const updateSettingsSchema = z.object({
  defaultStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM').optional(),
  defaultEndTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM').optional(),
  timezone: z.string().min(2).optional(),
  allowVoteChangeDefault: z.boolean().optional(),
  defaultResultVisibility: z.enum(['PUBLIC_RESULTS', 'VOTER_NAMES_VISIBLE', 'RESULTS_ONLY', 'ADMIN_ONLY']).optional(),
  maxActiveSessionsPerEmployee: z.number().min(1).max(10).optional(),
  autoFlagSuspiciousVotes: z.boolean().optional()
});
