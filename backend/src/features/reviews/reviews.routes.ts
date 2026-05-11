import { Router, type Response } from 'express';
import { requireAuth, type AuthRequest } from '../../shared/middleware/auth.js';
import { sessionRepository } from '../session/session.repository.js';
import { buildDueReviews, buildReviewSchedule } from './reviews.service.js';

const router = Router();
router.use(requireAuth);

router.get('/due', (req: AuthRequest, res: Response) => {
  res.json(buildDueReviews(sessionRepository.list(req.userId!)));
});

router.get('/schedule', (req: AuthRequest, res: Response) => {
  res.json(buildReviewSchedule(sessionRepository.list(req.userId!)));
});

export default router;
