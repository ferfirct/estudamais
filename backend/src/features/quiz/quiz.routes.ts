import { Router, type Response, type NextFunction } from 'express';
import { requireAuth, type AuthRequest } from '../../shared/middleware/auth.js';
import { sessionRepository } from '../session/session.repository.js';
import { GroqAiService } from './quiz.ai.js';
import { GenerateQuizUseCase, EvaluateQuizUseCase } from './quiz.service.js';
import { generateQuizSchema, evaluateQuizSchema } from './quiz.schema.js';

const router = Router();
router.use(requireAuth);

const aiService = new GroqAiService();
const generateQuiz = new GenerateQuizUseCase(sessionRepository, aiService);
const evaluateQuiz = new EvaluateQuizUseCase(sessionRepository, aiService);

router.post('/generate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId, theme, durationMinutes, previousScores } = generateQuizSchema.parse(req.body);
    res.json(await generateQuiz.execute(req.userId!, sessionId, theme, durationMinutes, previousScores));
  } catch (err) {
    next(err);
  }
});

router.post('/evaluate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId, questions, userAnswers } = evaluateQuizSchema.parse(req.body);
    res.json(await evaluateQuiz.execute(req.userId!, sessionId, questions, userAnswers));
  } catch (err) {
    next(err);
  }
});

export default router;
