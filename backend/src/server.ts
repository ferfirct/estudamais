import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './shared/middleware/errorHandler.js';
import authRouter from './features/auth/auth.routes.js';
import settingsRouter from './features/settings/settings.routes.js';
import sessionRouter from './features/session/session.routes.js';
import quizRouter from './features/quiz/quiz.routes.js';
import dashboardRouter from './features/dashboard/dashboard.routes.js';
import streakRouter from './features/streak/streak.routes.js';
import recordsRouter from './features/records/records.routes.js';
import reviewsRouter from './features/reviews/reviews.routes.js';
import summaryRouter from './features/summary/summary.routes.js';
import notesRouter from './features/notes/notes.routes.js';
import flashcardsRouter from './features/flashcards/flashcards.routes.js';
import goalsRouter from './features/goals/goals.routes.js';

const app = express();
const port = Number(process.env.PORT ?? 3333);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';

app.use(cors({ origin: frontendOrigin }));
app.use(express.json({ limit: '1mb' }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const quizLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Muitas requisições. Aguarde um momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'estudamais-backend' });
});

app.use('/api/auth', authRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/quiz/generate', quizLimiter);
app.use('/api/quiz', quizRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/streak', streakRouter);
app.use('/api/records', recordsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/summary', summaryRouter);
app.use('/api/notes', notesRouter);
app.use('/api/flashcards/generate', quizLimiter);
app.use('/api/flashcards', flashcardsRouter);
app.use('/api/goals', goalsRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`[server] Estuda+ backend rodando em http://localhost:${port}`);
});
