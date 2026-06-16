import { Router, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthRequest } from '../../shared/middleware/auth.js';
import { noteRepository } from './notes.repository.js';
import { CreateNoteUseCase, ListNotesUseCase, UpdateNoteUseCase, DeleteNoteUseCase } from './notes.service.js';

const router = Router();
router.use(requireAuth);

const createNote = new CreateNoteUseCase(noteRepository);
const listNotes = new ListNotesUseCase(noteRepository);
const updateNote = new UpdateNoteUseCase(noteRepository);
const deleteNote = new DeleteNoteUseCase(noteRepository);

const createSchema = z.object({
  content: z.string().min(1),
  sessionId: z.string().optional(),
  questionId: z.string().optional(),
  theme: z.string().optional(),
});

const updateSchema = z.object({
  content: z.string().min(1),
});

router.get('/', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const theme = req.query.theme as string | undefined;
    const sessionId = req.query.sessionId as string | undefined;
    res.json(listNotes.execute(req.userId!, { theme, sessionId }));
  } catch (err) {
    next(err);
  }
});

router.post('/', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createSchema.parse(req.body);
    res.status(201).json(createNote.execute(req.userId!, data));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { content } = updateSchema.parse(req.body);
    res.json(updateNote.execute(req.params.id, req.userId!, content));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    deleteNote.execute(req.params.id, req.userId!);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
