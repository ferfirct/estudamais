import { Router, type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { userDb } from '../services/database.js';
import { HttpError } from '../middleware/errorHandler.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'] }
  );
}

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);
    if (userDb.findByEmail(email)) {
      throw new HttpError(409, 'Este email já está cadastrado.');
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = userDb.create(name, email, hashed);
    const token = signToken(user.id);
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = userDb.findByEmail(email);
    if (!user) throw new HttpError(401, 'Email ou senha incorretos.');
    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new HttpError(401, 'Email ou senha incorretos.');
    const token = signToken(user.id);
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    next(err);
  }
});

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new HttpError(401, 'Sem token.');
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
    const user = userDb.findById(payload.sub);
    if (!user) throw new HttpError(404, 'Usuário não encontrado.');
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    next(err);
  }
});

export default router;
