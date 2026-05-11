import { Router, type Response, type NextFunction } from 'express';
import { requireAuth, type AuthRequest } from '../../shared/middleware/auth.js';
import { HttpError } from '../../shared/middleware/errorHandler.js';
import { sessionRepository } from './session.repository.js';
import { CreateSessionUseCase, UpdateSessionUseCase } from './session.service.js';
import { createSessionSchema, updateSessionSchema } from './session.schema.js';

const router = Router();
router.use(requireAuth);

const createSession = new CreateSessionUseCase(sessionRepository);
const updateSession = new UpdateSessionUseCase(sessionRepository);

router.post('/', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { theme, startTime } = createSessionSchema.parse(req.body);
    res.status(201).json(createSession.execute(req.userId!, theme, startTime));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patch = updateSessionSchema.parse(req.body);
    res.json(updateSession.execute(req.params.id, req.userId!, patch));
  } catch (err) {
    next(err);
  }
});

router.get('/', (req: AuthRequest, res: Response) => {
  const needsReview = req.query.needsReview === 'true';
  res.json(sessionRepository.list(req.userId!, needsReview));
});

router.get('/:id', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const session = sessionRepository.findById(req.params.id, req.userId!);
    if (!session) throw new HttpError(404, 'Sessão não encontrada');
    res.json(session);
  } catch (err) {
    next(err);
  }
});

export default router;
