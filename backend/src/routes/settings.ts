import { Router, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { settingsDb } from '../services/database.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';

const router = Router();
router.use(requireAuth);

const updateSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']).optional(),
  dailyGoal: z.number().int().min(5).max(720).optional(),
  language: z.string().optional(),
  notifications: z.boolean().optional(),
});

router.get('/', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const settings = settingsDb.get(req.userId!);
    if (!settings) throw new HttpError(404, 'Configurações não encontradas.');
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

router.patch('/', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patch = updateSchema.parse(req.body);
    const updated = settingsDb.update(req.userId!, patch);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
