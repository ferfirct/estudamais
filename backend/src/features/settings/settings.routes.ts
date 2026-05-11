import { Router, type Response, type NextFunction } from 'express';
import { requireAuth, type AuthRequest } from '../../shared/middleware/auth.js';
import { settingsRepository } from './settings.repository.js';
import { GetSettingsUseCase, UpdateSettingsUseCase } from './settings.service.js';
import { updateSettingsSchema } from './settings.schema.js';

const router = Router();
router.use(requireAuth);

const getSettings = new GetSettingsUseCase(settingsRepository);
const updateSettings = new UpdateSettingsUseCase(settingsRepository);

router.get('/', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json(getSettings.execute(req.userId!));
  } catch (err) {
    next(err);
  }
});

router.patch('/', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patch = updateSettingsSchema.parse(req.body);
    res.json(updateSettings.execute(req.userId!, patch));
  } catch (err) {
    next(err);
  }
});

export default router;
