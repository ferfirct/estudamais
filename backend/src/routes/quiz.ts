import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../services/database.js';
import { HttpError } from '../middleware/errorHandler.js';
import { generateQuiz, evaluateAnswers } from '../services/aiService.js';
import type { QuizResult } from '../types/index.js';

const router = Router();

const generateSchema = z.object({
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

const evaluateSchema = z.object({
  sessionId: z.string().min(1),
  questions: z.array(questionSchema).min(1),
  userAnswers: z.record(z.string()),
});

router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, theme, durationMinutes, previousScores } = generateSchema.parse(req.body);
    if (!db.getSession(sessionId)) {
      throw new HttpError(404, 'Sessão não encontrada');
    }
    // Gather historical scores from db if not provided by client
    let scores = previousScores;
    if (!scores || scores.length === 0) {
      const allSessions = db.listSessions();
      scores = allSessions
        .filter((s) => s.theme === theme && s.score !== null)
        .map((s) => s.score as number);
    }
    const questions = await generateQuiz(theme, durationMinutes, scores.length > 0 ? scores : undefined);
    res.json({ sessionId, questions });
  } catch (err) {
    next(err);
  }
});

router.post('/evaluate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, questions, userAnswers } = evaluateSchema.parse(req.body);
    const session = db.getSession(sessionId);
    if (!session) throw new HttpError(404, 'Sessão não encontrada');

    const { score, gapAnalysis } = await evaluateAnswers(
      session.theme,
      questions,
      userAnswers
    );

    const efficiencyIndex =
      session.durationMinutes > 0
        ? Number((score / (session.durationMinutes / 60)).toFixed(2))
        : null;

    db.updateSession(sessionId, { score, efficiencyIndex, quizCompleted: true });

    const result: QuizResult = {
      sessionId,
      questions,
      userAnswers,
      score,
      gapAnalysis,
      evaluatedAt: new Date().toISOString(),
    };
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
