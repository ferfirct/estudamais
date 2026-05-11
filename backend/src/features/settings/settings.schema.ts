import { z } from 'zod';

export const updateSettingsSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']).optional(),
  dailyGoal: z.number().int().min(5).max(720).optional(),
  language: z.string().optional(),
  notifications: z.boolean().optional(),
});
