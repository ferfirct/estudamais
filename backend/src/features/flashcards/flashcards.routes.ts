import { Router, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthRequest } from '../../shared/middleware/auth.js';
import { flashcardRepository } from './flashcards.repository.js';
import { generateFlashcards } from './flashcards.ai.js';
import { HttpError } from '../../shared/middleware/errorHandler.js';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  theme: z.string().min(1),
  front: z.string().min(1),
  back: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});

const generateSchema = z.object({
  theme: z.string().min(1),
  count: z.number().min(1).max(20).default(10),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});

const reviewSchema = z.object({
  remembered: z.boolean(),
});

router.get('/', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const theme = req.query.theme as string | undefined;
    const dueOnly = req.query.dueOnly === 'true';
    if (dueOnly) return void res.json(flashcardRepository.findDueForReview(req.userId!));
    if (theme) return void res.json(flashcardRepository.findByTheme(req.userId!, theme));
    res.json(flashcardRepository.findByUser(req.userId!));
  } catch (err) {
    next(err);
  }
});

router.post('/generate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { theme, count, difficulty } = generateSchema.parse(req.body);
    const cards = await generateFlashcards(theme, count, difficulty);
    if (!cards.length) throw new HttpError(502, 'IA não retornou flashcards.');
    const saved = flashcardRepository.createMany(req.userId!, cards.map(c => ({ ...c, theme, difficulty })));
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
});

router.post('/', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createSchema.parse(req.body);
    res.status(201).json(flashcardRepository.create(req.userId!, data));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/review', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { remembered } = reviewSchema.parse(req.body);
    const updated = flashcardRepository.updateReview(req.params.id, req.userId!, remembered);
    if (!updated) throw new HttpError(404, 'Flashcard não encontrado.');
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    flashcardRepository.deleteById(req.params.id, req.userId!);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
