import { Router, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthRequest } from '../../shared/middleware/auth.js';
import { sessionRepository } from '../session/session.repository.js';
import { GroqAiService } from './quiz.ai.js';
import {
  GenerateQuizUseCase,
  EvaluateQuizUseCase,
  ExplainQuestionUseCase,
  AnswerDoubtUseCase,
} from './quiz.service.js';
import {
  generateQuizSchema,
  evaluateQuizSchema,
  explainQuestionSchema,
  doubtSchema,
  questionSchema,
  questionDistributionSchema,
} from './quiz.schema.js';
import { wrongQuestionRepository } from './quiz.repository.js';

const router = Router();
router.use(requireAuth);

const aiService = new GroqAiService();
const generateQuiz = new GenerateQuizUseCase(sessionRepository, aiService);
const evaluateQuiz = new EvaluateQuizUseCase(sessionRepository, aiService);
const explainQuestion = new ExplainQuestionUseCase(aiService);
const answerDoubt = new AnswerDoubtUseCase(aiService);

router.post('/generate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      sessionId,
      theme,
      durationMinutes,
      previousScores,
      questionCount,
      questionDistribution,
      difficulty,
      learningMode,
      quizType,
      quizSubtype,
    } = generateQuizSchema.parse(req.body);
    res.json(
      await generateQuiz.execute(req.userId!, sessionId, theme, durationMinutes, previousScores, {
        questionCount,
        questionDistribution,
        difficulty,
        learningMode,
        quizType,
        quizSubtype,
      }),
    );
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

router.post('/explain-question', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { theme, question, userAnswer, quizType } = explainQuestionSchema.parse(req.body);
    res.json(await explainQuestion.execute(theme, question, userAnswer, quizType));
  } catch (err) {
    next(err);
  }
});

router.post('/doubt', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { theme, question, correctAnswer, userAnswer, explanation, doubt, history } =
      doubtSchema.parse(req.body);
    res.json(await answerDoubt.execute({ theme, question, correctAnswer, userAnswer, explanation, doubt, history }));
  } catch (err) {
    next(err);
  }
});

const saveWrongSchema = z.object({
  sessionId: z.string().min(1),
  theme: z.string().min(1),
  question: questionSchema,
  userAnswer: z.string(),
  quizType: z.enum(['free', 'civil_service', 'vestibular']).default('free'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});

router.post('/wrong-questions', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = saveWrongSchema.parse(req.body);
    const questionWithoutAnswer = {
      ...body.question,
      correctAnswer: undefined,
      explanation: undefined,
    };
    const saved = wrongQuestionRepository.save(req.userId!, {
      sessionId: body.sessionId,
      theme: body.theme,
      question: questionWithoutAnswer,
      userAnswer: body.userAnswer,
      quizType: body.quizType,
      difficulty: body.difficulty,
    });
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
});

router.get('/wrong-questions', (req: AuthRequest, res: Response) => {
  const pending = wrongQuestionRepository.list(req.userId!);
  res.json(pending);
});

router.patch('/wrong-questions/:id/retried', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    wrongQuestionRepository.markRetried(req.params.id, req.userId!);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/wrong-questions/:id', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    wrongQuestionRepository.delete(req.params.id, req.userId!);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get('/practiced-themes', (req: AuthRequest, res: Response) => {
  const sessions = sessionRepository.list(req.userId!);
  const themes = [...new Set(sessions.map(s => s.theme))];
  res.json({ themes });
});

const practiceSchema = z.object({
  theme: z.string().min(1),
  questionCount: z.number().min(1).max(20).default(5),
  questionDistribution: questionDistributionSchema.optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  learningMode: z.boolean().default(false),
  quizType: z.enum(['free', 'civil_service', 'vestibular']).default('free'),
  wrongQuestionIds: z.array(z.string()).optional(),
});

router.post('/practice', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = practiceSchema.parse(req.body);

    const session = sessionRepository.create(req.userId!, {
      theme: body.theme,
      startTime: new Date().toISOString(),
    });

    let questions;

    if (body.wrongQuestionIds && body.wrongQuestionIds.length > 0) {
      const allWrong = wrongQuestionRepository.list(req.userId!);
      const selected = allWrong.filter(w => body.wrongQuestionIds!.includes(w.id));
      questions = selected.map(w => ({ ...w.question }));
    } else {
      questions = await aiService.generateQuiz(body.theme, 0, undefined, {
        questionCount: body.questionCount,
        questionDistribution: body.questionDistribution,
        difficulty: body.difficulty,
        learningMode: body.learningMode,
        quizType: body.quizType,
      });
    }

    res.json({ sessionId: session.id, questions });
  } catch (err) {
    next(err);
  }
});

export default router;
