import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import sessionsRouter from './routes/sessions.js';
import quizRouter from './routes/quiz.js';
import dashboardRouter from './routes/dashboard.js';
import streakRouter from './routes/streak.js';
import recordsRouter from './routes/records.js';
import reviewsRouter from './routes/reviews.js';
import summaryRouter from './routes/summary.js';
import authRouter from './routes/auth.js';
import settingsRouter from './routes/settings.js';
import { errorHandler } from './middleware/errorHandler.js';

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
app.use('/api/sessions', sessionsRouter);
app.use('/api/quiz/generate', quizLimiter);
app.use('/api/quiz', quizRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/streak', streakRouter);
app.use('/api/records', recordsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/summary', summaryRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`[server] Estuda+ backend rodando em http://localhost:${port}`);
});
