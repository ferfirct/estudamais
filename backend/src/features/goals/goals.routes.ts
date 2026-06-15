import { Router, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { goalRepository } from './goals.repository.js';
import { UpsertGoalUseCase, ListGoalsUseCase, DeleteGoalUseCase } from './goals.service.js';
import { requireAuth, type AuthRequest } from '../../shared/middleware/auth.js';

const router = Router();

const upsertGoal = new UpsertGoalUseCase(goalRepository);
const listGoals = new ListGoalsUseCase(goalRepository);
const deleteGoal = new DeleteGoalUseCase(goalRepository);

const upsertSchema = z.object({ targetScore: z.number().min(0).max(10) });

router.get('/', requireAuth, (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json(listGoals.execute(req.userId!));
  } catch (err) {
    next(err);
  }
});

router.put('/:theme', requireAuth, (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { targetScore } = upsertSchema.parse(req.body);
    const theme = decodeURIComponent(req.params.theme);
    res.json(upsertGoal.execute(req.userId!, theme, targetScore));
  } catch (err) {
    next(err);
  }
});

router.delete('/:theme', requireAuth, (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const theme = decodeURIComponent(req.params.theme);
    deleteGoal.execute(req.userId!, theme);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
