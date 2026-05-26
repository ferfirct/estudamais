import { z } from 'zod';

const summationItemSchema = z.object({
  value: z.number(),
  statement: z.string(),
});

export const questionSchema = z.object({
  id: z.string(),
  type: z.enum(['multiple_choice', 'summation', 'open_ended']),
  question: z.string(),
  options: z.array(z.string()).optional(),
  summationItems: z.array(summationItemSchema).optional(),
  correctAnswer: z.string().optional(),
  hint: z.string().optional(),
  learningHint: z.string().optional(),
  explanation: z.string().optional(),
});

export const questionDistributionSchema = z.object({
  multipleChoice: z.number().min(0),
  summation: z.number().min(0),
  discursive: z.number().min(0),
});

export const generateQuizSchema = z.object({
  sessionId: z.string().min(1),
  theme: z.string().min(1),
  durationMinutes: z.number().nonnegative(),
  previousScores: z.array(z.number()).optional(),
  questionCount: z.number().min(1).max(20).default(5),
  questionDistribution: questionDistributionSchema.optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  learningMode: z.boolean().default(false),
  quizType: z.enum(['free', 'civil_service', 'vestibular']).default('free'),
});

export const evaluateQuizSchema = z.object({
  sessionId: z.string().min(1),
  questions: z.array(questionSchema).min(1),
  userAnswers: z.record(z.string()),
});

export const explainQuestionSchema = z.object({
  theme: z.string().min(1),
  question: questionSchema,
  userAnswer: z.string(),
  quizType: z.enum(['free', 'civil_service', 'vestibular']).default('free'),
});

export const doubtSchema = z.object({
  theme: z.string().min(1),
  question: questionSchema,
  correctAnswer: z.string().optional(),
  userAnswer: z.string(),
  explanation: z.string(),
  doubt: z.string().min(1),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
    .default([]),
});
