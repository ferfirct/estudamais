import { Router, type Response } from 'express';
import { requireAuth, type AuthRequest } from '../../shared/middleware/auth.js';
import { sessionRepository } from '../session/session.repository.js';
import { streakRepository } from './streak.repository.js';
import { calculateStreakInfo, activateFreeze } from './streak.service.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req: AuthRequest, res: Response) => {
  const sessions = sessionRepository.list(req.userId!);
  const freeze = streakRepository.getFreezeState(req.userId!);
  res.json(calculateStreakInfo(sessions, freeze));
});

router.patch('/freeze', (req: AuthRequest, res: Response) => {
  const freeze = streakRepository.getFreezeState(req.userId!);
  const result = activateFreeze(freeze);

  if (!result.ok) {
    res.status(409).json({ error: result.error });
    return;
  }

  streakRepository.saveFreezeState(req.userId!, result.updated);
  res.json({ success: true, message: 'Freeze ativado! Seu streak está protegido por 1 dia.' });
});

export default router;
