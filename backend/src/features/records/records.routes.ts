import { Router, type Response } from 'express';
import { requireAuth, type AuthRequest } from '../../shared/middleware/auth.js';
import { sessionRepository } from '../session/session.repository.js';
import { buildAllRecords, buildThemeRecordDetail } from './records.service.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req: AuthRequest, res: Response) => {
  res.json(buildAllRecords(sessionRepository.list(req.userId!)));
});

router.get('/:theme', (req: AuthRequest, res: Response) => {
  const sessions = sessionRepository.list(req.userId!);
  const theme = decodeURIComponent(req.params.theme);
  const record = buildThemeRecordDetail(sessions, theme);

  if (!record) {
    res.status(404).json({ error: 'Tema não encontrado' });
    return;
  }
  res.json(record);
});

export default router;
