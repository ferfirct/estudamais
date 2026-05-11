import { z } from 'zod';

export const createSessionSchema = z.object({
  theme: z.string().min(1),
  startTime: z.string().datetime().optional(),
});

export const updateSessionSchema = z.object({
  endTime: z.string().datetime().optional(),
  durationMinutes: z.number().nonnegative().optional(),
  score: z.number().min(0).max(10).nullable().optional(),
  quizCompleted: z.boolean().optional(),
});
