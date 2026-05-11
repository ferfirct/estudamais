import { Router, type Response } from 'express';
import { requireAuth, type AuthRequest } from '../../shared/middleware/auth.js';
import { sessionRepository } from '../session/session.repository.js';
import { buildDashboardStats } from './dashboard.service.js';

const router = Router();
router.use(requireAuth);

router.get('/stats', (req: AuthRequest, res: Response) => {
  res.json(buildDashboardStats(sessionRepository.list(req.userId!)));
});

export default router;
