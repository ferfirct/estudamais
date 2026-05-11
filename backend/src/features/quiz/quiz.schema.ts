import { z } from 'zod';

export const generateQuizSchema = z.object({
  sessionId: z.string().min(1),
  theme: z.string().min(1),
  durationMinutes: z.number().nonnegative(),
  previousScores: z.array(z.number()).optional(),
});

const questionSchema = z.object({
  id: z.string(),
  type: z.enum(['multiple_choice', 'open_ended']),
  question: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
});

export const evaluateQuizSchema = z.object({
  sessionId: z.string().min(1),
  questions: z.array(questionSchema).min(1),
  userAnswers: z.record(z.string()),
});
