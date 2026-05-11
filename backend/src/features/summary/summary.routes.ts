import { Router, type Response } from 'express';
import { requireAuth, type AuthRequest } from '../../shared/middleware/auth.js';
import { sessionRepository } from '../session/session.repository.js';
import { buildWeeklySummary } from './summary.service.js';

const router = Router();
router.use(requireAuth);

router.get('/weekly', (req: AuthRequest, res: Response) => {
  res.json(buildWeeklySummary(sessionRepository.list(req.userId!)));
});

export default router;
