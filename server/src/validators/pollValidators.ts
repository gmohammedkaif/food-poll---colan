import { z } from 'zod';

export const createPollSchema = z.object({
  title: z.string().min(3, 'Poll title must be at least 3 characters').max(120),
  description: z.string().max(300).optional(),
  pollDate: z.string().or(z.date()),
  startAt: z.string().or(z.date()),
  endAt: z.string().or(z.date()),
  status: z.enum(['DRAFT', 'SCHEDULED', 'OPEN', 'CLOSED', 'ARCHIVED']).optional(),
  initialStatus: z.enum(['DRAFT', 'SCHEDULED', 'OPEN', 'CLOSED', 'ARCHIVED']).optional(),
  allowVoteChange: z.boolean().optional(),
  resultsVisibility: z.enum(['PUBLIC_RESULTS', 'VOTER_NAMES_VISIBLE', 'RESULTS_ONLY', 'ADMIN_ONLY']).optional(),
  options: z.array(
    z.object({
      foodId: z.string().optional(),
      foodName: z.string().min(1, 'Food option name is required').max(100),
      foodImage: z.string().min(1, 'Food image is required'),
      description: z.string().max(250).optional()
    })
  ).min(2, 'At least 2 food options are required.')
});

export const updatePollSchema = createPollSchema.partial();

export const voteSchema = z.object({
  selectedOptionId: z.string().min(1, 'Option ID is required')
});
