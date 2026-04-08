import { Router, type Request, type Response, type NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db } from '../services/database.js';
import { HttpError } from '../middleware/errorHandler.js';
import type { StudySession } from '../types/index.js';

const router = Router();

const createSchema = z.object({
  theme: z.string().min(1),
  startTime: z.string().datetime().optional(),
});

const updateSchema = z.object({
  endTime: z.string().datetime().optional(),
  durationMinutes: z.number().nonnegative().optional(),
  score: z.number().min(0).max(10).nullable().optional(),
  quizCompleted: z.boolean().optional(),
});

router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createSchema.parse(req.body);
    const now = new Date().toISOString();
    const session: StudySession = {
      id: randomUUID(),
      theme: body.theme,
      startTime: body.startTime ?? now,
      endTime: '',
      durationMinutes: 0,
      score: null,
      efficiencyIndex: null,
      quizCompleted: false,
      createdAt: now,
    };
    db.createSession(session);
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = updateSchema.parse(req.body);
    const current = db.getSession(req.params.id);
    if (!current) throw new HttpError(404, 'Sessão não encontrada');

    const merged: Partial<StudySession> = { ...body };
    const nextScore = body.score ?? current.score;
    const nextDuration = body.durationMinutes ?? current.durationMinutes;
    if (nextScore !== null && nextDuration > 0) {
      merged.efficiencyIndex = Number((nextScore / (nextDuration / 60)).toFixed(2));
    }
    const updated = db.updateSession(req.params.id, merged);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.get('/', (req: Request, res: Response) => {
  const needsReview = req.query.needsReview === 'true';
  let sessions = db.listSessions();
  if (needsReview) {
    sessions = sessions.filter((s) => s.score !== null && s.score < 6);
  }
  res.json(sessions);
});

router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = db.getSession(req.params.id);
    if (!session) throw new HttpError(404, 'Sessão não encontrada');
    res.json(session);
  } catch (err) {
    next(err);
  }
});

export default router;
