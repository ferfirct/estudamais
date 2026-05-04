import { Router, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { sessionDb } from '../services/database.js';
import { HttpError } from '../middleware/errorHandler.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  theme: z.string().min(1),
  startTime: z.string().datetime().optional(),
});

const updateSchema = z.object({
  endTime: z.string().datetime().optional(),
  durationMinutes: z.number().nonnegative().optional(),
  score: z.number().min(0).max(10).nullable().optional(),
  quizCompleted: z.boolean().optional(),
});

router.post('/', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = createSchema.parse(req.body);
    const session = sessionDb.create(req.userId!, {
      theme: body.theme,
      startTime: body.startTime ?? new Date().toISOString(),
    });
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = updateSchema.parse(req.body);
    const current = sessionDb.get(req.params.id, req.userId!);
    if (!current) throw new HttpError(404, 'Sessão não encontrada');

    const nextScore = body.score ?? current.score;
    const nextDuration = body.durationMinutes ?? current.durationMinutes;
    const efficiencyIndex =
      nextScore !== null && nextDuration > 0
        ? Number((nextScore / (nextDuration / 60)).toFixed(2))
        : undefined;

    const updated = sessionDb.update(req.params.id, req.userId!, {
      ...body,
      ...(efficiencyIndex !== undefined ? { efficiencyIndex } : {}),
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.get('/', (req: AuthRequest, res: Response) => {
  const needsReview = req.query.needsReview === 'true';
  res.json(sessionDb.list(req.userId!, needsReview));
});

router.get('/:id', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const session = sessionDb.get(req.params.id, req.userId!);
    if (!session) throw new HttpError(404, 'Sessão não encontrada');
    res.json(session);
  } catch (err) {
    next(err);
  }
});

export default router;
